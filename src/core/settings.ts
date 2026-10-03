import type { Store } from './storage';
import type { ThemeChoice } from './types';
import { KEYS, defaultSettings, type Settings } from './types';

export function getSettings(store: Store): Settings {
  return { ...defaultSettings(), ...store.get<Partial<Settings>>(KEYS.settings, {}) };
}

export function updateSettings(store: Store, patch: Partial<Settings>): Settings {
  const next = { ...getSettings(store), ...patch };
  store.set(KEYS.settings, next);
  return next;
}

export function applyTheme(theme: ThemeChoice): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === theme));
  });
}
