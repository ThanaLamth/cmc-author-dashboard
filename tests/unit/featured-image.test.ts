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

  it("returns null in live mode when no Flow worker URL is configured", async () => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      FLOW_IMAGE_WORKER_URL: "",
    };

    await expect(
      generateFeaturedImage({
        title: "Solana Holds Key Support",
        thumbnailPrompt: null,
        coinSlug: "solana",
      }),
    ).resolves.toBeNull();
  });

  it("calls the configured worker and resolves the image payload", async () => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      FLOW_IMAGE_WORKER_URL: "https://worker.example.com/generate",
      FLOW_IMAGE_WORKER_TOKEN: "worker-secret",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mimeType: "image/png",
        filename: "xrp-thumbnail.png",
        imageBase64: Buffer.from("png-bytes").toString("base64"),
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await generateFeaturedImage({
      title: "XRP Eyes Breakout",
      thumbnailPrompt: null,
      coinSlug: "xrp",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://worker.example.com/generate");

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer worker-secret",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(String(request?.body));
    expect(body.coinSlug).toBe("xrp");
    expect(body.title).toBe("XRP Eyes Breakout");
    expect(body.prompt).toContain("XRP Eyes Breakout");

    expect(result).toEqual({
      mimeType: "image/png",
      filename: "xrp-thumbnail.png",
      buffer: Buffer.from("png-bytes"),
      source: "flow-worker",
      prompt: body.prompt,
    });
  });
});
