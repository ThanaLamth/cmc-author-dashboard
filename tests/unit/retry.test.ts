import { describe, expect, it } from "vitest";

import { getFirstFailedStage } from "@/lib/jobs/retry";

describe("getFirstFailedStage", () => {
  it("returns the first failed stage in pipeline order", () => {
    expect(
      getFirstFailedStage([
        { attempt: 1, stage: "telegram_notify", status: "failed" },
        { attempt: 1, stage: "wordpress_publish", status: "failed" },
      ]),
    ).toBe("wordpress_publish");
  });

  it("returns null when there is no failed stage", () => {
    expect(
      getFirstFailedStage([
        { attempt: 1, stage: "research", status: "completed" },
        { attempt: 1, stage: "draft_variants", status: "completed" },
      ]),
    ).toBeNull();
  });

  it("only considers the latest attempt when selecting a retry stage", () => {
    expect(
      getFirstFailedStage([
        { attempt: 1, stage: "wordpress_publish", status: "failed" },
        { attempt: 2, stage: "wordpress_publish", status: "completed" },
        { attempt: 2, stage: "telegram_notify", status: "failed" },
      ]),
    ).toBe("telegram_notify");
  });
});
