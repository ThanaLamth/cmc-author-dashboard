import { mkdir } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { chromium } from "@playwright/test";

import { getFlowWorkerConfig } from "@/lib/worker/flow-image-worker";

async function main() {
  const config = getFlowWorkerConfig();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(config.projectUrl, { waitUntil: "domcontentloaded" });

  const rl = readline.createInterface({ input, output });
  try {
    console.log("Log in to Google Flow in the opened browser window.");
    console.log(`When the project page is fully ready, press Enter to save session to ${config.storageStatePath}`);
    await rl.question("");

    const storageStatePath = config.storageStatePath;
    if (!storageStatePath) {
      throw new Error("FLOW_STORAGE_STATE_PATH is required to save browser session.");
    }

    await mkdir(path.dirname(storageStatePath), { recursive: true });
    await context.storageState({ path: storageStatePath, indexedDB: true });
    console.log(`Saved Flow storage state to ${storageStatePath}`);
  } finally {
    rl.close();
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("flow-save-session failed", error);
  process.exit(1);
});
