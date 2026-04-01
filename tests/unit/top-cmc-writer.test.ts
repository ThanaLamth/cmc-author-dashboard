import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { craftFromCoinPage } from "@/lib/integrations/top-cmc-writer";

describe("craftFromCoinPage", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      OPENAI_API_KEY: "test-openai-key",
      CRAFT_MODEL: "gpt-5.4-mini",
    };
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("calls the OpenAI Responses API and returns the structured craft result in live mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  variants: [
                    {
                      variantNo: 1,
                      title: "Variant one",
                      body: "Body one",
                      metaDescription: "Meta one",
                      thumbnailPrompt: "Thumb one",
                      sourceCount: 3,
                    },
                    {
                      variantNo: 2,
                      title: "Variant two",
                      body: "Body two",
                      metaDescription: "Meta two",
                      thumbnailPrompt: "Thumb two",
                      sourceCount: 4,
                    },
                    {
                      variantNo: 3,
                      title: "Variant three",
                      body: "Body three",
                      metaDescription: "Meta three",
                      thumbnailPrompt: "Thumb three",
                      sourceCount: 2,
                    },
                  ],
                  selectedVariantNo: 2,
                  bestAngle: "Utility with external proof",
                  whyBest: "Best fit for ranking and publish safety.",
                  banRiskSummary: "Low risk",
                }),
              },
            ],
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await craftFromCoinPage(
      "https://coinmarketcap.com/currencies/anome/",
      "anome",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-openai-key",
          "Content-Type": "application/json",
        }),
      }),
    );

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.model).toBe("gpt-5.4-mini");
    expect(JSON.stringify(body)).toContain("https://coinmarketcap.com/currencies/anome/");
    expect(result).toEqual({
      variants: [
        {
          variantNo: 1,
          title: "Variant one",
          body: "Body one",
          metaDescription: "Meta one",
          thumbnailPrompt: "Thumb one",
          sourceCount: 3,
        },
        {
          variantNo: 2,
          title: "Variant two",
          body: "Body two",
          metaDescription: "Meta two",
          thumbnailPrompt: "Thumb two",
          sourceCount: 4,
        },
        {
          variantNo: 3,
          title: "Variant three",
          body: "Body three",
          metaDescription: "Meta three",
          thumbnailPrompt: "Thumb three",
          sourceCount: 2,
        },
      ],
      selectedVariantNo: 2,
      bestAngle: "Utility with external proof",
      whyBest: "Best fit for ranking and publish safety.",
      banRiskSummary: "Low risk",
    });
  });
});
