import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

import { getFlowWorkerConfig } from "@/lib/worker/flow-image-worker";

async function main() {
  const config = getFlowWorkerConfig();

  if (!config.browserCdpUrl) {
    throw new Error("FLOW_BROWSER_CDP_URL is required for flow-export-session.");
  }

  if (!config.storageStatePath) {
    throw new Error("FLOW_STORAGE_STATE_PATH is required for flow-export-session.");
  }

  const browser = await chromium.connectOverCDP(config.browserCdpUrl);

  try {
    const context = browser.contexts()[0];

    if (!context) {
      throw new Error("No browser context available over CDP.");
    }

    await mkdir(path.dirname(config.storageStatePath), { recursive: true });
    await context.storageState({ path: config.storageStatePath, indexedDB: true });
    console.log(`Saved Flow storage state to ${config.storageStatePath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("flow-export-session failed", error);
  process.exit(1);
});
