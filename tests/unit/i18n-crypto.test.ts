import { describe, expect, it } from 'vitest';
import ka from '../../src/locales/ka';
import en from '../../src/locales/en';
import { setLang, t } from '../../src/core/i18n';
import { fetchPrices } from '../../src/widgets/crypto';

describe('i18n', () => {
  it('locales have identical keys and no empty strings', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ka).sort());
    for (const v of [...Object.values(ka), ...Object.values(en)]) expect(v.trim()).not.toBe('');
  });

  it('translates with params and switches language', () => {
    setLang('en');
    expect(t('crypto.lastUpdate', { time: '10:30' })).toBe('Last: 10:30');
    setLang('ka');
    expect(t('crypto.lastUpdate', { time: '10:30' })).toBe('ბოლო: 10:30');
    expect(document.documentElement.lang).toBe('ka');
  });
});

describe('fetchPrices', () => {
  it('calls CoinGecko directly (no third-party proxy)', async () => {
    let calledUrl = '';
    const fake = (async (url: string) => {
      calledUrl = url;
      return new Response(JSON.stringify({ bitcoin: { usd: 1 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const data = await fetchPrices(['bitcoin', 'ethereum'], 'usd', fake);
    expect(calledUrl.startsWith('https://api.coingecko.com/')).toBe(true);
    expect(calledUrl).toContain('ids=bitcoin%2Cethereum');
    expect(data.bitcoin?.usd).toBe(1);
  });

  it('throws on HTTP errors (e.g. rate limit)', async () => {
    const fake = (async () => new Response('', { status: 429 })) as unknown as typeof fetch;
    await expect(fetchPrices(['bitcoin'], 'usd', fake)).rejects.toThrow('HTTP 429');
  });
});
