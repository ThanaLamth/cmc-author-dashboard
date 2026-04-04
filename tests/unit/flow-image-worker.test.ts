import { describe, expect, it } from "vitest";

import {
  extractGeneratedImageUrl,
  getFlowWorkerConfig,
  type FlowGenerateResponse,
} from "@/lib/worker/flow-image-worker";

describe("getFlowWorkerConfig", () => {
  it("reads required worker config from env", () => {
    const config = getFlowWorkerConfig({
      FLOW_PROJECT_URL: "https://labs.google/fx/vi/tools/flow/project/test",
      FLOW_STORAGE_STATE_PATH: "/tmp/flow-state.json",
      FLOW_IMAGE_WORKER_PORT: "4319",
      FLOW_HEADLESS: "false",
      FLOW_IMAGE_WORKER_TOKEN: "secret",
      FLOW_BROWSER_IGNORE_DEFAULT_ARGS: "--enable-automation,--disable-sync",
    });

    expect(config).toEqual({
      projectUrl: "https://labs.google/fx/vi/tools/flow/project/test",
      storageStatePath: "/tmp/flow-state.json",
      browserChannel: null,
      browserCdpUrl: null,
      browserIgnoreDefaultArgs: ["--enable-automation", "--disable-sync"],
      browserUserDataDir: null,
      browserProfileDirectory: null,
      port: 4319,
      headless: false,
      bearerToken: "secret",
      createTimeoutMs: 180000,
      navTimeoutMs: 30000,
    });
  });

  it("supports launching against a real Chrome profile without storage state", () => {
    const config = getFlowWorkerConfig({
      FLOW_PROJECT_URL: "https://labs.google/fx/vi/tools/flow/project/test",
      FLOW_BROWSER_CHANNEL: "chrome",
      FLOW_BROWSER_USER_DATA_DIR: "/Users/thana/Library/Application Support/Google/Chrome",
      FLOW_BROWSER_PROFILE_DIRECTORY: "Default",
      FLOW_HEADLESS: "false",
    });

    expect(config).toEqual({
      projectUrl: "https://labs.google/fx/vi/tools/flow/project/test",
      storageStatePath: null,
      browserChannel: "chrome",
      browserCdpUrl: null,
      browserIgnoreDefaultArgs: [],
      browserUserDataDir: "/Users/thana/Library/Application Support/Google/Chrome",
      browserProfileDirectory: "Default",
      port: 4319,
      headless: false,
      bearerToken: null,
      createTimeoutMs: 180000,
      navTimeoutMs: 30000,
    });
  });

  it("supports connecting to an already-open Chrome instance over CDP", () => {
    const config = getFlowWorkerConfig({
      FLOW_PROJECT_URL: "https://labs.google/fx/vi/tools/flow/project/test",
      FLOW_BROWSER_CDP_URL: "http://127.0.0.1:9222",
    });

    expect(config).toEqual({
      projectUrl: "https://labs.google/fx/vi/tools/flow/project/test",
      storageStatePath: null,
      browserChannel: null,
      browserCdpUrl: "http://127.0.0.1:9222",
      browserIgnoreDefaultArgs: [],
      browserUserDataDir: null,
      browserProfileDirectory: null,
      port: 4319,
      headless: true,
      bearerToken: null,
      createTimeoutMs: 180000,
      navTimeoutMs: 30000,
    });
  });

  it("throws when required worker config is missing", () => {
    expect(() => getFlowWorkerConfig({})).toThrow("FLOW_PROJECT_URL is required");
  });

  it("throws when neither storage state nor browser profile is configured", () => {
    expect(() =>
      getFlowWorkerConfig({
        FLOW_PROJECT_URL: "https://labs.google/fx/vi/tools/flow/project/test",
      }),
    ).toThrow(
      "One of FLOW_STORAGE_STATE_PATH, FLOW_BROWSER_USER_DATA_DIR, or FLOW_BROWSER_CDP_URL is required",
    );
  });
});

describe("extractGeneratedImageUrl", () => {
  it("pulls the signed image URL from the Flow response payload", () => {
    const payload = {
      media: [
        {
          image: {
            generatedImage: {
              fifeUrl: "https://storage.googleapis.com/example.png",
            },
          },
        },
      ],
    } satisfies FlowGenerateResponse;

    expect(extractGeneratedImageUrl(payload)).toBe(
      "https://storage.googleapis.com/example.png",
    );
  });

  it("returns null when Flow did not return any generated image URL", () => {
    const payload = {
      media: [
        {
          image: {
            generatedImage: {},
          },
        },
      ],
    } satisfies FlowGenerateResponse;

    expect(extractGeneratedImageUrl(payload)).toBeNull();
  });
});
