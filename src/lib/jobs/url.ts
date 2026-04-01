import { z } from 'zod';

const COINMARKETCAP_HOSTS = new Set(['coinmarketcap.com', 'www.coinmarketcap.com']);
const COIN_PAGE_PATH_RE = /^\/currencies\/[a-z0-9-]+\/?$/i;

export function isCoinMarketCapCoinPageUrl(input: string): boolean {
  try {
    const url = new URL(input);

    if (url.protocol !== 'https:') return false;
    if (!COINMARKETCAP_HOSTS.has(url.hostname)) return false;
    if (url.search || url.hash) return false;

    return COIN_PAGE_PATH_RE.test(url.pathname);
  } catch {
    return false;
  }
}

export const coinMarketCapCoinPageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isCoinMarketCapCoinPageUrl, {
    message: 'Expected a CoinMarketCap coin page URL like https://coinmarketcap.com/currencies/xrp/',
  });

export function parseCoinMarketCapCoinPageUrl(input: string): string {
  return coinMarketCapCoinPageUrlSchema.parse(input);
}

export function getCoinSlugFromCoinMarketCapUrl(input: string): string {
  const parsed = parseCoinMarketCapCoinPageUrl(input);
  const url = new URL(parsed);
  const [, , coinSlug] = url.pathname.split("/");

  if (!coinSlug) {
    throw new Error("Unable to extract coin slug from CoinMarketCap URL.");
  }

  return coinSlug;
}
