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
    });

    expect(config).toEqual({
      projectUrl: "https://labs.google/fx/vi/tools/flow/project/test",
      storageStatePath: "/tmp/flow-state.json",
      port: 4319,
      headless: false,
      bearerToken: "secret",
      createTimeoutMs: 180000,
      navTimeoutMs: 30000,
    });
  });

  it("throws when required worker config is missing", () => {
    expect(() => getFlowWorkerConfig({})).toThrow("FLOW_PROJECT_URL is required");
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
