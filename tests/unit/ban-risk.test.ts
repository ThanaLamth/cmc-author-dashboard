import { describe, expect, it } from "vitest";

import { summarizeBanRisk } from "@/lib/jobs/ban-risk";

describe("summarizeBanRisk", () => {
  it("returns a safe summary when no obvious risk is present", () => {
    const summary = summarizeBanRisk({
      title: "Measured project analysis",
      body: "This article separates facts from interpretation.",
      sourceCount: 2,
    });

    expect(summary.toLowerCase()).toContain("no obvious");
  });

  it("flags high-risk wording", () => {
    const summary = summarizeBanRisk({
      title: "This token is a scam",
      body: "Guaranteed collapse.",
      sourceCount: 0,
    });

    expect(summary.toLowerCase()).toContain("review before publishing");
  });
});
