import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

import { craftFromCoinPage } from "@/lib/integrations/top-cmc-writer";

describe("craftFromCoinPage", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      CRAFT_MODEL: "gpt-5.4-mini",
      CODEX_BIN: "codex",
    };
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
    execFileMock.mockReset();
  });

  it("calls codex exec with the top-cmc-writer skill prompt and parses WordPress-ready HTML output", async () => {
    execFileMock.mockImplementation(
      (
        _file: string,
        _args: string[],
        _options: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(
          null,
          JSON.stringify({
            variants: [
              {
                variant_no: 1,
                title: "Variant one",
                body_html: "<p>Body one</p>",
                meta_description: "Meta one",
                thumbnail_prompt: "Thumb one",
                source_count: 3,
              },
              {
                variant_no: 2,
                title: "Variant two",
                body_html: "<p>Body two</p>",
                meta_description: "Meta two",
                thumbnail_prompt: "Thumb two",
                source_count: 4,
              },
              {
                variant_no: 3,
                title: "Variant three",
                body_html: "<p>Body three</p>",
                meta_description: "Meta three",
                thumbnail_prompt: "Thumb three",
                source_count: 2,
              },
            ],
            selected_variant_no: 2,
            best_angle: "Utility with external proof",
            why_best: "Best fit for ranking and publish safety.",
            ban_risk_summary: "Low risk",
          }),
          "",
        );
      },
    );

    const result = await craftFromCoinPage(
      "https://coinmarketcap.com/currencies/anome/",
      "anome",
    );

    expect(execFileMock).toHaveBeenCalledTimes(1);
    expect(execFileMock).toHaveBeenCalledWith(
      "codex",
      expect.arrayContaining([
        "exec",
        "--skip-git-repo-check",
        "--output-last-message",
        expect.any(String),
        "--output-schema",
        expect.any(String),
      ]),
      expect.objectContaining({
        cwd: "/Users/thana/projects/cmc-author-dashboard",
        maxBuffer: expect.any(Number),
      }),
      expect.any(Function),
    );

    const args = execFileMock.mock.calls[0]?.[1];
    expect(args).toContain("--model");
    expect(args).toContain("gpt-5.4-mini");

    const argsAsText = JSON.stringify(args);
    expect(argsAsText).toContain("top-cmc-writer");
    expect(argsAsText).toContain("https://coinmarketcap.com/currencies/anome/");
    expect(argsAsText).toContain("body_html");

    expect(result).toEqual({
      variants: [
        {
          variantNo: 1,
          title: "Variant one",
          body: "<p>Body one</p>",
          metaDescription: "Meta one",
          thumbnailPrompt: "Thumb one",
          sourceCount: 3,
        },
        {
          variantNo: 2,
          title: "Variant two",
          body: "<p>Body two</p>",
          metaDescription: "Meta two",
          thumbnailPrompt: "Thumb two",
          sourceCount: 4,
        },
        {
          variantNo: 3,
          title: "Variant three",
          body: "<p>Body three</p>",
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
