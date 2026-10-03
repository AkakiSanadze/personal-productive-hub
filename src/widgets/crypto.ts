import { $, h } from '../core/dom';
import { formatHM, formatPrice } from '../core/format';
import { onLangChange, t } from '../core/i18n';
import { getSettings } from '../core/settings';
import type { Store } from '../core/storage';
import { KEYS } from '../core/types';

export interface CoinMeta {
  symbol: string;
  name: string;
  gradient: string;
}

export const COIN_META: Record<string, CoinMeta> = {
  bitcoin: {
    symbol: 'BTC',
    name: 'Bitcoin',
    gradient: 'linear-gradient(135deg, #f7931a 0%, #ffb74d 100%)',
  },
  ethereum: {
    symbol: 'ETH',
    name: 'Ethereum',
    gradient: 'linear-gradient(135deg, #627eea 0%, #90a4ff 100%)',
  },
  solana: {
    symbol: 'SOL',
    name: 'Solana',
    gradient: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
  },
  cardano: {
    symbol: 'ADA',
    name: 'Cardano',
    gradient: 'linear-gradient(135deg, #0033ad 0%, #1a73e8 100%)',
  },
  sui: {
    symbol: 'SUI',
    name: 'Sui',
    gradient: 'linear-gradient(135deg, #4da2ff 0%, #7b61ff 100%)',
  },
  cosmos: {
    symbol: 'ATOM',
    name: 'Cosmos',
    gradient: 'linear-gradient(135deg, #2e3148 0%, #6f7590 100%)',
  },
  'venice-token': {
    symbol: 'VVV',
    name: 'Venice',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
  },
  diem: {
    symbol: 'DIEM',
    name: 'Diem',
    gradient: 'linear-gradient(135deg, #00d4aa 0%, #5a9fd4 100%)',
  },
};

export type PriceData = Record<string, Record<string, number | undefined> | undefined>;

export interface CryptoCache {
  fetchedAt: number;
  currency: string;
  ids: string;
  data: PriceData;
}

const API = 'https://api.coingecko.com/api/v3/simple/price';
const FRESH_MS = 60_000;
const REFRESH_MS = 120_000;
const MAX_BACKOFF_MS = 15 * 60_000;

export async function fetchPrices(
  ids: string[],
  currency: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PriceData> {
  const url = `${API}?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=${currency}&include_24hr_change=true`;
  const res = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as PriceData;
}

export function mountCrypto(store: Store): void {
  const list = $('#cryptoList');
  const lastUpdate = $('#cryptoLastUpdate');
  const refreshBtn = $<HTMLButtonElement>('#refreshCryptoBtn');

  let inFlight = false;
  let failures = 0;
  let lastError = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cache = () => store.get<CryptoCache | null>(KEYS.cryptoCache, null);

  const render = () => {
    const { coins, currency } = getSettings(store);
    const c = cache();
    const usable = c && c.currency === currency ? c : null;

    if (!usable) {
      list.replaceChildren(
        lastError && !inFlight
          ? h(
              'div',
              { class: 'crypto-error' },
              h('span', { text: t('crypto.error') }),
              h('span', { class: 'crypto-error-detail', text: lastError }),
            )
          : h(
              'div',
              { class: 'crypto-loading' },
              h('div', { class: 'loading-spinner' }),
              h('span', { text: t('crypto.loading') }),
            ),
      );
      lastUpdate.textContent = inFlight ? t('crypto.updating') : '';
      return;
    }

    list.replaceChildren(
      ...coins.map((id) => {
        const meta = COIN_META[id] ?? {
          symbol: id.slice(0, 4).toUpperCase(),
          name: id,
          gradient: 'var(--accent)',
        };
        const coin = usable.data[id];
        const price = coin?.[currency];
        const change = coin?.[`${currency}_24h_change`] ?? 0;
        const icon = h('div', {
          class: 'crypto-icon',
          'aria-hidden': 'true',
          text: meta.symbol.charAt(0),
        });
        icon.style.background = meta.gradient;
        const priceBlock =
          typeof price === 'number'
            ? h(
                'div',
                { class: 'crypto-price-block' },
                h('div', {
                  class: 'crypto-price',
                  text: formatPrice(price, currency as 'usd' | 'eur'),
                }),
                h('div', {
                  class: `crypto-change ${change >= 0 ? 'positive' : 'negative'}`,
                  text: `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}%`,
                }),
              )
            : h(
                'div',
                { class: 'crypto-price-block muted' },
                h('div', { class: 'crypto-price', text: '--' }),
                h('div', { class: 'crypto-change', text: t('crypto.notFound') }),
              );
        return h(
          'div',
          { class: 'crypto-item' },
          icon,
          h(
            'div',
            { class: 'crypto-info' },
            h('div', { class: 'crypto-symbol', text: meta.symbol }),
            h('div', { class: 'crypto-name', text: meta.name }),
          ),
          priceBlock,
        );
      }),
    );

    const stale = Date.now() - usable.fetchedAt > REFRESH_MS * 2;
    lastUpdate.textContent = inFlight
      ? t('crypto.updating')
      : t('crypto.lastUpdate', { time: formatHM(new Date(usable.fetchedAt)) }) +
        (stale || lastError ? ` · ${t('crypto.stale')}` : '');
  };

  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => void refresh(), ms);
  };

  async function refresh(force = false): Promise<void> {
    if (inFlight) return;
    const { coins, currency } = getSettings(store);
    const c = cache();
    if (
      !force &&
      c &&
      c.currency === currency &&
      c.ids === coins.join(',') &&
      Date.now() - c.fetchedAt < FRESH_MS
    ) {
      schedule(REFRESH_MS);
      return;
    }
    if (document.hidden && !force) {
      schedule(REFRESH_MS);
      return;
    }
    inFlight = true;
    render();
    try {
      const data = await fetchPrices(coins, currency);
      failures = 0;
      lastError = '';
      store.set<CryptoCache>(KEYS.cryptoCache, {
        fetchedAt: Date.now(),
        currency,
        ids: coins.join(','),
        data,
      });
      schedule(REFRESH_MS);
    } catch (err) {
      failures++;
      lastError = err instanceof Error ? err.message : String(err);
      schedule(Math.min(MAX_BACKOFF_MS, 60_000 * 2 ** (failures - 1)));
    } finally {
      inFlight = false;
      render();
    }
  }

  refreshBtn.addEventListener('click', () => void refresh(true));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void refresh();
  });
  store.subscribe(KEYS.cryptoCache, render);
  store.subscribe(KEYS.settings, () => void refresh());
  onLangChange(render);

  render();
  void refresh();
}
