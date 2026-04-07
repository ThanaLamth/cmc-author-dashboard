import { Buffer } from "node:buffer";

import { isMockMode } from "@/lib/integrations/mode";

const FLOW_THUMBNAIL_STYLE_TEMPLATE = `Style: High-impact crypto thumbnail in bold comic / game-art style.

Main object must:
- Have thick black outline
- Have thin white outer stroke around the black outline (sticker-style separation)
- Pop out clearly from background
- Use semi-3D cartoon shading
- Have strong contrast and glossy highlights

Lighting:
- Dramatic directional lighting
- Strong highlight and shadow contrast
- No soft painterly shading

Background:
- Slightly darker than foreground object
- Financial grid, chart lines, or thematic elements relevant to topic
- Lower contrast than main object
- No blur, but visually secondary

Color:
- High saturation
- Strong contrast
- Bold crypto energy
- No muted pastel palette

Texture:
- Clean edges
- No grain
- No glitch
- No realism

Mood:
Eye-catching, bold, high-volatility crypto news energy.`;

const DEFAULT_USEAPI_GOOGLE_FLOW_URL = "https://api.useapi.net/v1/google-flow/images";

export type GeneratedFeaturedImage = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  prompt: string;
  source: "flow-worker" | "useapi-google-flow";
};

type GenerateFeaturedImageInput = {
  title: string;
  thumbnailPrompt: string | null;
  coinSlug: string | null;
};

type FlowWorkerResponse = {
  filename?: string;
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
};

type UseApiImageResponse = {
  jobId?: string;
  media?: Array<{
    image?: {
      generatedImage?: {
        fifeUrl?: string;
      };
    };
  }>;
  error?: unknown;
};

function toSafeFilename(coinSlug: string | null | undefined) {
  return `${(coinSlug?.trim() || "featured-image")
    .replace(/[^a-z0-9-]+/gi, "-")
    .toLowerCase()}.png`;
}

export function buildFlowFeaturedImagePrompt(title: string, thumbnailPrompt: string | null) {
  const basePrompt = (thumbnailPrompt?.trim() || title.trim()).replace(/\s+/g, " ");

  return `${basePrompt}, ${FLOW_THUMBNAIL_STYLE_TEMPLATE}`;
}

async function resolveImageBuffer(payload: FlowWorkerResponse) {
  if (payload.imageBase64) {
    return Buffer.from(payload.imageBase64, "base64");
  }

  if (payload.imageUrl) {
    const response = await fetch(payload.imageUrl);

    if (!response.ok) {
      throw new Error(`Flow image download failed with status ${response.status}.`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("Flow worker response did not include imageBase64 or imageUrl.");
}

async function generateViaUseApi(
  input: GenerateFeaturedImageInput,
  prompt: string,
  useApiToken: string,
): Promise<GeneratedFeaturedImage> {
  const apiUrl = process.env.USEAPI_GOOGLE_FLOW_URL?.trim() || DEFAULT_USEAPI_GOOGLE_FLOW_URL;
  const email = process.env.USEAPI_GOOGLE_FLOW_EMAIL?.trim();
  const model = process.env.USEAPI_GOOGLE_FLOW_MODEL?.trim() || "imagen-4";
  const aspectRatio = process.env.USEAPI_GOOGLE_FLOW_ASPECT_RATIO?.trim() || "16:9";

  const countRaw = Number(process.env.USEAPI_GOOGLE_FLOW_COUNT);
  const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.min(Math.floor(countRaw), 4) : 1;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${useApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      model,
      aspectRatio,
      count,
      ...(email ? { email } : {}),
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(
      `UseAPI Google Flow request failed with status ${response.status}${bodyText ? `: ${bodyText}` : "."}`,
    );
  }

  const payload = (await response.json()) as UseApiImageResponse;
  const imageUrl = payload.media?.[0]?.image?.generatedImage?.fifeUrl?.trim();

  if (!imageUrl) {
    throw new Error("UseAPI Google Flow response did not include generated image URL.");
  }

  const buffer = await resolveImageBuffer({ imageUrl });

  return {
    buffer,
    filename: toSafeFilename(input.coinSlug),
    mimeType: "image/png",
    prompt,
    source: "useapi-google-flow",
  };
}

async function generateViaFlowWorker(
  input: GenerateFeaturedImageInput,
  prompt: string,
  workerUrl: string,
): Promise<GeneratedFeaturedImage> {
  const authToken = process.env.FLOW_IMAGE_WORKER_TOKEN?.trim();
  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      coinSlug: input.coinSlug,
      prompt,
      title: input.title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Flow worker request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as FlowWorkerResponse;
  const buffer = await resolveImageBuffer(payload);

  return {
    buffer,
    filename: payload.filename?.trim() || toSafeFilename(input.coinSlug),
    mimeType: payload.mimeType?.trim() || "image/png",
    prompt,
    source: "flow-worker",
  };
}

export async function generateFeaturedImage(
  input: GenerateFeaturedImageInput,
): Promise<GeneratedFeaturedImage | null> {
  if (isMockMode()) {
    return null;
  }

  const prompt = buildFlowFeaturedImagePrompt(input.title, input.thumbnailPrompt);
  const workerUrl = process.env.FLOW_IMAGE_WORKER_URL?.trim();
  const useApiToken = process.env.USEAPI_TOKEN?.trim();

  if (useApiToken) {
    try {
      return await generateViaUseApi(input, prompt, useApiToken);
    } catch (error) {
      if (!workerUrl) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.warn(`UseAPI Google Flow failed, falling back to FLOW_IMAGE_WORKER_URL: ${message}`);
    }
  }

  if (!workerUrl) {
    return null;
  }

  return generateViaFlowWorker(input, prompt, workerUrl);
}
