import { requireLiveEnv } from "@/lib/integrations/mode";

export const WORDPRESS_SITE_OPTIONS = [
  { value: "cryptodailyalert", label: "cryptodailyalert.com" },
  { value: "trustscrypto", label: "trustscrypto.com" },
  { value: "coinwy", label: "coinwy.com" },
] as const;

export type WordPressSiteKey = (typeof WORDPRESS_SITE_OPTIONS)[number]["value"];

type WordPressSiteDefinition = {
  key: WordPressSiteKey;
  label: string;
  cmcCategoryId: number;
  env: {
    baseUrl: string;
    username: string;
    appPassword: string;
  };
};

const WORDPRESS_SITES: Record<WordPressSiteKey, WordPressSiteDefinition> = {
  cryptodailyalert: {
    key: "cryptodailyalert",
    label: "cryptodailyalert.com",
    cmcCategoryId: 148,
    env: {
      baseUrl: "WORDPRESS_CRYPTODAILYALERT_BASE_URL",
      username: "WORDPRESS_CRYPTODAILYALERT_USERNAME",
      appPassword: "WORDPRESS_CRYPTODAILYALERT_APP_PASSWORD",
    },
  },
  trustscrypto: {
    key: "trustscrypto",
    label: "trustscrypto.com",
    cmcCategoryId: 216,
    env: {
      baseUrl: "WORDPRESS_TRUSTSCRYPTO_BASE_URL",
      username: "WORDPRESS_TRUSTSCRYPTO_USERNAME",
      appPassword: "WORDPRESS_TRUSTSCRYPTO_APP_PASSWORD",
    },
  },
  coinwy: {
    key: "coinwy",
    label: "coinwy.com",
    cmcCategoryId: 37,
    env: {
      baseUrl: "WORDPRESS_COINWY_BASE_URL",
      username: "WORDPRESS_COINWY_USERNAME",
      appPassword: "WORDPRESS_COINWY_APP_PASSWORD",
    },
  },
};

export function isWordPressSiteKey(value: string): value is WordPressSiteKey {
  return value in WORDPRESS_SITES;
}

export function getWordPressSiteDefinition(site: WordPressSiteKey) {
  return WORDPRESS_SITES[site];
}

export function resolveWordPressSiteConfig(
  site: WordPressSiteKey,
  env: NodeJS.ProcessEnv = process.env,
) {
  const definition = getWordPressSiteDefinition(site);

  const baseUrl =
    env[definition.env.baseUrl] ??
    (site === "cryptodailyalert" ? env.WORDPRESS_BASE_URL : undefined);
  const username =
    env[definition.env.username] ??
    (site === "cryptodailyalert" ? env.WORDPRESS_USERNAME : undefined);
  const appPassword =
    env[definition.env.appPassword] ??
    (site === "cryptodailyalert" ? env.WORDPRESS_APP_PASSWORD : undefined);

  return {
    key: definition.key,
    label: definition.label,
    baseUrl: requireLiveEnv(definition.env.baseUrl, baseUrl),
    username: requireLiveEnv(definition.env.username, username),
    appPassword: requireLiveEnv(definition.env.appPassword, appPassword),
    cmcCategoryId: definition.cmcCategoryId,
  };
}
