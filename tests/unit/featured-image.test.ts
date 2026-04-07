import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildFlowFeaturedImagePrompt,
  generateFeaturedImage,
} from "@/lib/integrations/featured-image";

describe("buildFlowFeaturedImagePrompt", () => {
  it("wraps the article title in the approved Flow thumbnail style template", () => {
    const prompt = buildFlowFeaturedImagePrompt("XRP Eyes Breakout", null);

    expect(prompt).toContain("XRP Eyes Breakout");
    expect(prompt).toContain("High-impact crypto thumbnail in bold comic / game-art style.");
    expect(prompt).toContain("Eye-catching, bold, high-volatility crypto news energy.");
  });

  it("prefers the existing thumbnail prompt when present", () => {
    const prompt = buildFlowFeaturedImagePrompt("Ignored", "Use this exact core prompt");

    expect(prompt).toContain("Use this exact core prompt");
    expect(prompt).not.toContain("Ignored");
  });
});

describe("generateFeaturedImage", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("returns null in live mode when no UseAPI token and no Flow worker URL are configured", async () => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      FLOW_IMAGE_WORKER_URL: "",
      USEAPI_TOKEN: "",
    };

    await expect(
      generateFeaturedImage({
        title: "Solana Holds Key Support",
        thumbnailPrompt: null,
        coinSlug: "solana",
      }),
    ).resolves.toBeNull();
  });

  it("calls UseAPI first and resolves the generated image", async () => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      USEAPI_TOKEN: "useapi-secret",
      USEAPI_GOOGLE_FLOW_URL: "https://api.useapi.net/v1/google-flow/images",
      USEAPI_GOOGLE_FLOW_MODEL: "imagen-4",
      USEAPI_GOOGLE_FLOW_ASPECT_RATIO: "16:9",
      USEAPI_GOOGLE_FLOW_COUNT: "1",
      FLOW_IMAGE_WORKER_URL: "https://worker.example.com/generate",
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: "job-1",
          media: [
            {
              image: {
                generatedImage: {
                  fifeUrl: "https://images.example.com/generated.png",
                },
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from(Buffer.from("png-bytes")).buffer,
      });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await generateFeaturedImage({
      title: "XRP Eyes Breakout",
      thumbnailPrompt: null,
      coinSlug: "xrp",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.useapi.net/v1/google-flow/images");

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer useapi-secret",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(String(request?.body));
    expect(body.prompt).toContain("XRP Eyes Breakout");
    expect(body.model).toBe("imagen-4");
    expect(body.aspectRatio).toBe("16:9");
    expect(body.count).toBe(1);

    expect(result).toEqual({
      mimeType: "image/png",
      filename: "xrp.png",
      buffer: Buffer.from("png-bytes"),
      source: "useapi-google-flow",
      prompt: body.prompt,
    });
  });

  it("falls back to Flow worker when UseAPI fails and worker URL is configured", async () => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      USEAPI_TOKEN: "useapi-secret",
      USEAPI_GOOGLE_FLOW_URL: "https://api.useapi.net/v1/google-flow/images",
      FLOW_IMAGE_WORKER_URL: "https://worker.example.com/generate",
      FLOW_IMAGE_WORKER_TOKEN: "worker-secret",
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "temporary overload",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mimeType: "image/png",
          filename: "xrp-thumbnail.png",
          imageBase64: Buffer.from("png-bytes").toString("base64"),
        }),
      });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const result = await generateFeaturedImage({
      title: "XRP Eyes Breakout",
      thumbnailPrompt: null,
      coinSlug: "xrp",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://worker.example.com/generate");

    expect(result).toEqual({
      mimeType: "image/png",
      filename: "xrp-thumbnail.png",
      buffer: Buffer.from("png-bytes"),
      source: "flow-worker",
      prompt: expect.stringContaining("XRP Eyes Breakout"),
    });
  });
});
