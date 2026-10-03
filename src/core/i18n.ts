import ka, { type MessageKey } from '../locales/ka';
import en from '../locales/en';
import type { Lang } from './types';

const dictionaries: Record<Lang, Record<MessageKey, string>> = { ka, en };

let current: Lang = 'ka';
const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
  applyTranslations();
  listeners.forEach((cb) => cb(lang));
}

export function onLangChange(cb: (lang: Lang) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  let msg = dictionaries[current][key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) msg = msg.replaceAll(`{${k}}`, String(v));
  }
  return msg;
}

/**
 * Translates static markup:
 *   data-i18n="key"              → textContent
 *   data-i18n-placeholder="key"  → placeholder
 *   data-i18n-title="key"        → title + aria-label
 */
export function applyTranslations(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as MessageKey);
  });
  root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder as MessageKey);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const label = t(el.dataset.i18nTitle as MessageKey);
    el.title = label;
    el.setAttribute('aria-label', label);
  });
}
