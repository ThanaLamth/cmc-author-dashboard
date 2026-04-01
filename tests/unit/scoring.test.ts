import { describe, expect, it } from "vitest";

import { pickBestVariant, scoreVariant } from "@/lib/jobs/scoring";

describe("scoreVariant", () => {
  it("assigns a positive score to a ready variant", () => {
    const score = scoreVariant({
      title: "Example title",
      body: "Example body ".repeat(40),
      metaDescription: "Meta",
      thumbnailPrompt: "Prompt",
      sourceCount: 2,
    });

    expect(score.total).toBeGreaterThan(0);
  });
});

describe("pickBestVariant", () => {
  it("returns the highest scoring variant", () => {
    const picked = pickBestVariant([
      { title: "Short", body: "Thin", metaDescription: null, thumbnailPrompt: null, sourceCount: 0 },
      {
        title: "A much stronger title with more context",
        body: "Body ".repeat(80),
        metaDescription: "Meta",
        thumbnailPrompt: "Thumb",
        sourceCount: 3,
      },
    ]);

    expect(picked?.index).toBe(1);
  });
});
