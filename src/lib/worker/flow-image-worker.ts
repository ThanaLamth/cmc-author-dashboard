import { readFile } from "node:fs/promises";

import { chromium, type Page } from "@playwright/test";
import { z } from "zod";

const flowWorkerRequestSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  coinSlug: z.string().min(1).nullable().optional(),
});

const flowGenerateResponseSchema = z.object({
  media: z
    .array(
      z.object({
        image: z.object({
          generatedImage: z.object({
            fifeUrl: z.string().url().optional(),
          }),
        }),
      }),
    )
    .default([]),
});

export type FlowWorkerRequest = z.infer<typeof flowWorkerRequestSchema>;
export type FlowGenerateResponse = z.infer<typeof flowGenerateResponseSchema>;

export type FlowWorkerConfig = {
  bearerToken: string | null;
  browserChannel: string | null;
  browserCdpUrl: string | null;
  browserIgnoreDefaultArgs: string[];
  browserProfileDirectory: string | null;
  browserUserDataDir: string | null;
  createTimeoutMs: number;
  headless: boolean;
  navTimeoutMs: number;
  port: number;
  projectUrl: string;
  storageStatePath: string | null;
};

export type FlowImageResult = {
  filename: string;
  imageBase64: string;
  imageUrl: string;
  mimeType: string;
};

export function parseFlowWorkerRequest(input: unknown) {
  return flowWorkerRequestSchema.parse(input);
}

export function parseFlowGenerateResponse(input: unknown) {
  return flowGenerateResponseSchema.parse(input);
}

export function extractGeneratedImageUrl(payload: FlowGenerateResponse) {
  return (
    payload.media.find((item) => item.image.generatedImage.fifeUrl)?.image.generatedImage.fifeUrl ??
    null
  );
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  return value.trim().toLowerCase() !== "false";
}

function parseNumberFlag(value: string | undefined, defaultValue: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parseListFlag(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getFlowWorkerConfig(env: NodeJS.ProcessEnv = process.env): FlowWorkerConfig {
  const projectUrl = env.FLOW_PROJECT_URL?.trim();

  if (!projectUrl) {
    throw new Error("FLOW_PROJECT_URL is required.");
  }

  const storageStatePath = env.FLOW_STORAGE_STATE_PATH?.trim() || null;
  const browserCdpUrl = env.FLOW_BROWSER_CDP_URL?.trim() || null;
  const browserUserDataDir = env.FLOW_BROWSER_USER_DATA_DIR?.trim() || null;

  if (!storageStatePath && !browserUserDataDir && !browserCdpUrl) {
    throw new Error(
      "One of FLOW_STORAGE_STATE_PATH, FLOW_BROWSER_USER_DATA_DIR, or FLOW_BROWSER_CDP_URL is required.",
    );
  }

  return {
    projectUrl,
    storageStatePath,
    browserChannel: env.FLOW_BROWSER_CHANNEL?.trim() || null,
    browserCdpUrl,
    browserIgnoreDefaultArgs: parseListFlag(env.FLOW_BROWSER_IGNORE_DEFAULT_ARGS),
    browserUserDataDir,
    browserProfileDirectory: env.FLOW_BROWSER_PROFILE_DIRECTORY?.trim() || null,
    port: parseNumberFlag(env.FLOW_IMAGE_WORKER_PORT, 4319),
    headless: parseBooleanFlag(env.FLOW_HEADLESS, true),
    bearerToken: env.FLOW_IMAGE_WORKER_TOKEN?.trim() || null,
    createTimeoutMs: parseNumberFlag(env.FLOW_CREATE_TIMEOUT_MS, 180000),
    navTimeoutMs: parseNumberFlag(env.FLOW_NAV_TIMEOUT_MS, 30000),
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildOutputFilename(title: string, coinSlug: string | null | undefined) {
  const stem = slugify(coinSlug?.trim() || title) || "featured-image";
  return `${stem}.png`;
}

async function typePromptIntoFlow(page: Page, prompt: string) {
  const promptBox = page.locator('[role="textbox"]').last();
  await promptBox.waitFor({ state: "visible" });
  await promptBox.click();
  await page.keyboard.press("Meta+A").catch(async () => {
    await page.keyboard.press("Control+A");
  });
  await page.keyboard.press("Backspace");
  await page.keyboard.type(prompt, { delay: 5 });
}

function findCreateButton(page: Page) {
  return page.getByRole("button", { name: /Tạo/ }).last();
}

export async function generateImageViaFlow(
  config: FlowWorkerConfig,
  request: FlowWorkerRequest,
): Promise<FlowImageResult> {
  const launchOptions = {
    headless: config.headless,
    ...(config.browserChannel ? { channel: config.browserChannel as "chrome" } : {}),
    ...(config.browserIgnoreDefaultArgs.length
      ? { ignoreDefaultArgs: config.browserIgnoreDefaultArgs }
      : {}),
    ...(config.browserProfileDirectory
      ? { args: [`--profile-directory=${config.browserProfileDirectory}`] }
      : {}),
  };

  const browser = config.browserCdpUrl
    ? await chromium.connectOverCDP(config.browserCdpUrl)
    : config.browserUserDataDir
    ? null
    : await chromium.launch({ ...launchOptions });

  try {
    const context = config.browserCdpUrl
      ? (browser!.contexts()[0] ?? (await browser!.newContext()))
      : config.browserUserDataDir
        ? await chromium.launchPersistentContext(config.browserUserDataDir, launchOptions)
        : await browser!.newContext({
            storageState: JSON.parse(await readFile(config.storageStatePath!, "utf8")),
          });
    const page = context.pages()[0] ?? (await context.newPage());
    page.setDefaultNavigationTimeout(config.navTimeoutMs);
    page.setDefaultTimeout(config.createTimeoutMs);

    await page.goto(config.projectUrl, { waitUntil: "domcontentloaded" });
    await typePromptIntoFlow(page, request.prompt);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("flowMedia:batchGenerateImages"),
      { timeout: config.createTimeoutMs },
    );

    await findCreateButton(page).click();

    const response = await responsePromise;
    if (!response.ok()) {
      throw new Error(`Flow generation request failed with status ${response.status()}.`);
    }

    const payload = parseFlowGenerateResponse(await response.json());
    const imageUrl = extractGeneratedImageUrl(payload);

    if (!imageUrl) {
      throw new Error("Flow did not return a generated image URL.");
    }

    const download = await fetch(imageUrl);
    if (!download.ok) {
      throw new Error(`Flow image download failed with status ${download.status}.`);
    }

    const mimeType = download.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    const buffer = Buffer.from(await download.arrayBuffer());

    await context.close();

    return {
      filename: buildOutputFilename(request.title, request.coinSlug),
      imageBase64: buffer.toString("base64"),
      imageUrl,
      mimeType,
    };
  } finally {
    if (config.browserCdpUrl) {
      await browser?.close();
    } else {
      await browser?.close();
    }
  }
}
