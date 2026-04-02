import { describe, expect, it } from "vitest";

import { isActiveJobStatus, shouldPollJobs } from "@/lib/jobs/activity";

describe("activity helpers", () => {
  it("treats queued and running jobs as active", () => {
    expect(isActiveJobStatus("queued")).toBe(true);
    expect(isActiveJobStatus("running")).toBe(true);
  });

  it("treats terminal jobs as inactive", () => {
    expect(isActiveJobStatus("completed")).toBe(false);
    expect(isActiveJobStatus("failed")).toBe(false);
    expect(isActiveJobStatus("partial_failed")).toBe(false);
  });

  it("polls a jobs list only when at least one job is active", () => {
    expect(shouldPollJobs(["completed", "running", "failed"])).toBe(true);
    expect(shouldPollJobs(["completed", "failed", "partial_failed"])).toBe(false);
  });
});
