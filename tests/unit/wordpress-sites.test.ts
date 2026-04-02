import { describe, expect, it } from "vitest";

import {
  getWordPressSiteDefinition,
  resolveWordPressSiteConfig,
  WORDPRESS_SITE_OPTIONS,
} from "@/lib/integrations/wordpress-sites";

describe("wordpress sites", () => {
  it("lists the supported publishing sites for the craft dropdown", () => {
    expect(WORDPRESS_SITE_OPTIONS).toEqual([
      {
        value: "cryptodailyalert",
        label: "cryptodailyalert.com",
      },
      {
        value: "trustscrypto",
        label: "trustscrypto.com",
      },
      {
        value: "coinwy",
        label: "coinwy.com",
      },
    ]);
  });

  it("returns the fixed CMC category ids for each supported site", () => {
    expect(getWordPressSiteDefinition("cryptodailyalert").cmcCategoryId).toBe(148);
    expect(getWordPressSiteDefinition("trustscrypto").cmcCategoryId).toBe(216);
    expect(getWordPressSiteDefinition("coinwy").cmcCategoryId).toBe(37);
  });

  it("resolves per-site env config", () => {
    const config = resolveWordPressSiteConfig("coinwy", {
      WORDPRESS_COINWY_BASE_URL: "https://coinwy.com",
      WORDPRESS_COINWY_USERNAME: "coinwy-admin",
      WORDPRESS_COINWY_APP_PASSWORD: "coinwy-password",
    });

    expect(config).toEqual({
      key: "coinwy",
      label: "coinwy.com",
      baseUrl: "https://coinwy.com",
      username: "coinwy-admin",
      appPassword: "coinwy-password",
      cmcCategoryId: 37,
    });
  });

  it("falls back to the legacy generic env names for cryptodailyalert", () => {
    const config = resolveWordPressSiteConfig("cryptodailyalert", {
      WORDPRESS_BASE_URL: "https://cryptodailyalert.com",
      WORDPRESS_USERNAME: "admin",
      WORDPRESS_APP_PASSWORD: "app-password",
    });

    expect(config).toEqual({
      key: "cryptodailyalert",
      label: "cryptodailyalert.com",
      baseUrl: "https://cryptodailyalert.com",
      username: "admin",
      appPassword: "app-password",
      cmcCategoryId: 148,
    });
  });
});
