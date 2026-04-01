import { describe, expect, it } from 'vitest';

import {
  coinMarketCapCoinPageUrlSchema,
  getCoinSlugFromCoinMarketCapUrl,
  isCoinMarketCapCoinPageUrl,
  parseCoinMarketCapCoinPageUrl,
} from '../../src/lib/jobs/url';

describe('CoinMarketCap coin page url validation', () => {
  it('accepts a canonical coin page url', () => {
    const url = 'https://coinmarketcap.com/currencies/xrp/';

    expect(isCoinMarketCapCoinPageUrl(url)).toBe(true);
    expect(coinMarketCapCoinPageUrlSchema.safeParse(url).success).toBe(true);
    expect(parseCoinMarketCapCoinPageUrl(url)).toBe(url);
  });

  it('accepts a coin page url without a trailing slash', () => {
    expect(isCoinMarketCapCoinPageUrl('https://coinmarketcap.com/currencies/bitcoin')).toBe(true);
    expect(getCoinSlugFromCoinMarketCapUrl('https://coinmarketcap.com/currencies/bitcoin')).toBe(
      'bitcoin',
    );
  });

  it('rejects non-coin page urls', () => {
    const urls = [
      'https://coinmarketcap.com/',
      'https://coinmarketcap.com/currencies/',
      'https://coinmarketcap.com/currencies/xrp/markets/',
      'https://coinmarketcap.com/exchanges/binance/',
      'https://www.coinmarketcap.com/watchlist/',
      'http://coinmarketcap.com/currencies/xrp/',
      'https://example.com/currencies/xrp/',
      'not a url',
    ];

    for (const url of urls) {
      expect(isCoinMarketCapCoinPageUrl(url)).toBe(false);
      expect(coinMarketCapCoinPageUrlSchema.safeParse(url).success).toBe(false);
    }
  });
});
