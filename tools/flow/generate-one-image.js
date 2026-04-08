const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FLOW_PROJECT_URL =
  process.env.FLOW_PROJECT_URL ||
  "https://labs.google/fx/tools/flow/project/f7404778-0ddb-4514-86c3-1dc8c093c2ca";
const FLOW_PROMPT = process.env.FLOW_PROMPT || "eth coin";
const COOKIES_PATH = process.env.FLOW_COOKIES_PATH || "cookies.json";
const OUT_DIR = process.env.FLOW_OUTPUT_DIR || "generated-images";

async function dismissCookieBanner(page) {
  try {
    const button = page.locator("button").filter({ hasText: /hide|close|accept|reject/i }).first();
    if (await button.count()) {
      await button.click({ timeout: 5000 });
      await page.waitForTimeout(800);
    }
  } catch {}
}

async function enterEditorIfNeeded(page) {
  if (page.url().includes("/edit/")) return;
  for (const label of ["Create with Flow", "Create"]) {
    const button = page.locator("button").filter({ hasText: new RegExp(label, "i") }).first();
    if (await button.count()) {
      await button.click();
      await page.waitForTimeout(3000);
      return;
    }
  }
}

async function typePrompt(page, prompt) {
  const promptBox = page.locator('div[contenteditable="true"], [role="textbox"]').last();
  await promptBox.waitFor({ state: "visible", timeout: 15000 });
  await promptBox.click();
  await page.keyboard.press("Meta+A").catch(async () => {
    await page.keyboard.press("Control+A");
  });
  await page.keyboard.press("Backspace");
  await page.keyboard.type(prompt, { delay: 5 });
}

async function clickGenerate(page) {
  for (const key of ["generate", "create", "run", "submit", "start"]) {
    const button = page.locator("button").filter({ hasText: new RegExp(key, "i") }).first();
    if (await button.count()) {
      await button.click();
      return key;
    }
  }
  await page.keyboard.press("Enter");
  return "enter";
}

async function listLargeHttpImages(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => img.naturalWidth > 240 && img.naturalHeight > 240 && img.src.startsWith("http"))
      .map((img) => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
      })),
  );
}

async function fetchImageBytesInPage(page, imageUrl) {
  return page.evaluate(async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return { ok: false, status: response.status };
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return { ok: true, size: bytes.length, binary };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }, imageUrl);
}

function detectExt(url) {
  if (url.includes("webp")) return "webp";
  if (url.includes("png")) return "png";
  return "jpg";
}

async function main() {
  if (!fs.existsSync(COOKIES_PATH)) {
    throw new Error(`Missing cookies file: ${COOKIES_PATH}`);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({ storageState: COOKIES_PATH });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);

    await page.goto(FLOW_PROJECT_URL, { waitUntil: "networkidle", timeout: 60000 });
    await dismissCookieBanner(page);
    await enterEditorIfNeeded(page);
    await page.waitForTimeout(1200);

    const baseline = new Set((await listLargeHttpImages(page)).map((img) => img.src));
    await typePrompt(page, FLOW_PROMPT);
    const trigger = await clickGenerate(page);

    let savedPath = null;
    let savedMeta = null;

    for (let i = 0; i < 24 && !savedPath; i++) {
      await page.waitForTimeout(2500);
      const allImages = await listLargeHttpImages(page);
      const newlyAppeared = allImages.filter((img) => !baseline.has(img.src));
      if (!newlyAppeared.length) continue;

      const candidate = newlyAppeared[newlyAppeared.length - 1];
      baseline.add(candidate.src);
      const fetched = await fetchImageBytesInPage(page, candidate.src);
      if (!fetched.ok || !fetched.size || fetched.size < 20000) continue;

      const ext = detectExt(candidate.src);
      const filename = `one-output-${Date.now()}.${ext}`;
      savedPath = path.join(OUT_DIR, filename);
      fs.writeFileSync(savedPath, Buffer.from(fetched.binary, "binary"));
      savedMeta = { src: candidate.src, width: candidate.width, height: candidate.height, size: fetched.size };
    }

    if (!savedPath || !savedMeta) {
      console.log("SAVED_MODE none");
      return;
    }

    console.log("SAVED_MODE one_new_image");
    console.log(`TRIGGER ${trigger}`);
    console.log(`SAVED_FILE ${savedPath}`);
    console.log(`SAVED_SIZE ${savedMeta.size}`);
    console.log(`SAVED_DIM ${savedMeta.width}x${savedMeta.height}`);
    console.log(`SAVED_SRC ${savedMeta.src}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
