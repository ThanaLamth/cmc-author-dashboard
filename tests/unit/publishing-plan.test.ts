import { describe, expect, it } from "vitest";

import {
  buildPublicationSchedule,
  buildPublishQueue,
} from "@/lib/jobs/publishing-plan";

describe("buildPublishQueue", () => {
  it("places the selected variant first and keeps the other variants after it", () => {
    const queue = buildPublishQueue(
      [
        { variantNo: 1, title: "One" },
        { variantNo: 2, title: "Two" },
        { variantNo: 3, title: "Three" },
        { variantNo: 4, title: "Four" },
      ],
      3,
    );

    expect(queue.map((item) => item.variantNo)).toEqual([3, 1, 2, 4]);
  });
});

describe("buildPublicationSchedule", () => {
  it("schedules all four articles at staggered future offsets", () => {
    const baseDate = new Date("2026-04-01T00:00:00.000Z");
    const schedule = buildPublicationSchedule(baseDate);

    expect(schedule).toEqual([
      { status: "future", scheduledAt: "2026-04-01T06:00:00Z" },
      { status: "future", scheduledAt: "2026-04-01T12:00:00Z" },
      { status: "future", scheduledAt: "2026-04-01T18:00:00Z" },
      { status: "future", scheduledAt: "2026-04-02T00:00:00Z" },
    ]);
  });
});
