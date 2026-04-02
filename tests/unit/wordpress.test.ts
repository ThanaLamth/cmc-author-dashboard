import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWordPressPost } from "@/lib/integrations/wordpress";

describe("createWordPressPost", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      WORDPRESS_TRUSTSCRYPTO_BASE_URL: "https://trustscrypto.com",
      WORDPRESS_TRUSTSCRYPTO_USERNAME: "trusts-admin",
      WORDPRESS_TRUSTSCRYPTO_APP_PASSWORD: "trusts-password",
      WORDPRESS_COINWY_BASE_URL: "https://coinwy.com",
      WORDPRESS_COINWY_USERNAME: "coinwy-admin",
      WORDPRESS_COINWY_APP_PASSWORD: "coinwy-password",
      WORDPRESS_BASE_URL: "https://cryptodailyalert.com",
      WORDPRESS_USERNAME: "admin",
      WORDPRESS_APP_PASSWORD: "app-password",
    };
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("publishes immediately with category 148 and then applies Rank Math noindex", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, link: "https://example.com/posts/123" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await createWordPressPost({
      title: "Immediate post",
      body: "<p>Hello</p>",
      metaDescription: "Meta",
      targetSite: "trustscrypto",
      status: "publish",
      scheduledAt: null,
    });

    const postBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(postBody.status).toBe("publish");
    expect(postBody.date_gmt).toBeUndefined();
    expect(postBody.categories).toEqual([216]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://trustscrypto.com/wp-json/wp/v2/posts");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://trustscrypto.com/wp-json/rankmath/v1/updateMeta");
    const noindexBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(noindexBody).toEqual({
      objectType: "post",
      objectID: 123,
      meta: {
        rank_math_robots: ["noindex"],
      },
    });
  });

  it("schedules a future post with date_gmt when status is future", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 456, link: "https://example.com/posts/456" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await createWordPressPost({
      title: "Scheduled post",
      body: "<p>Hello later</p>",
      metaDescription: "Meta later",
      targetSite: "coinwy",
      status: "future",
      scheduledAt: "2026-04-02T00:00:00Z",
    });

    const postBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(postBody.status).toBe("future");
    expect(postBody.date_gmt).toBe("2026-04-02T00:00:00Z");
    expect(postBody.categories).toEqual([37]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://coinwy.com/wp-json/wp/v2/posts");
  });

  it("fails if Rank Math noindex cannot be applied", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 789, link: "https://example.com/posts/789" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "failed" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createWordPressPost({
        title: "Noindex required",
        body: "<p>Hello</p>",
        metaDescription: "Meta",
        targetSite: "cryptodailyalert",
        status: "future",
        scheduledAt: "2026-04-02T06:00:00Z",
      }),
    ).rejects.toThrow("WordPress Rank Math noindex update failed with status 500.");
  });
});
