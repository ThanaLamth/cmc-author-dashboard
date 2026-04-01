import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWordPressPost } from "@/lib/integrations/wordpress";

describe("createWordPressPost", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      WORDPRESS_BASE_URL: "https://example.com",
      WORDPRESS_USERNAME: "admin",
      WORDPRESS_APP_PASSWORD: "app-password",
    };
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("publishes immediately when status is publish", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 123, link: "https://example.com/posts/123" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await createWordPressPost({
      title: "Immediate post",
      body: "<p>Hello</p>",
      metaDescription: "Meta",
      status: "publish",
      scheduledAt: null,
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.status).toBe("publish");
    expect(body.date_gmt).toBeUndefined();
  });

  it("schedules a future post with date_gmt when status is future", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 456, link: "https://example.com/posts/456" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await createWordPressPost({
      title: "Scheduled post",
      body: "<p>Hello later</p>",
      metaDescription: "Meta later",
      status: "future",
      scheduledAt: "2026-04-02T00:00:00Z",
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.status).toBe("future");
    expect(body.date_gmt).toBe("2026-04-02T00:00:00Z");
  });
});
