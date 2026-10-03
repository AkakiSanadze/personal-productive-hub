/** Persisted data schema (v1). Keys are stored with the `pph:v1:` prefix. */

export type Lang = 'ka' | 'en';
export type ThemeChoice = 'dark' | 'light' | 'system';
export type AccentChoice = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan';
export const ACCENTS: AccentChoice[] = ['indigo', 'emerald', 'rose', 'amber', 'cyan'];
export type PomodoroMode = 'pomodoro' | 'break' | 'deepwork';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Link {
  id: string;
  name: string;
  url: string;
}

export interface Settings {
  lang: Lang;
  theme: ThemeChoice;
  accent: AccentChoice;
  /** CoinGecko coin ids to show, in order. */
  coins: string[];
  currency: 'usd' | 'eur';
}

export interface PomodoroState {
  mode: PomodoroMode;
  /** Epoch ms when the running timer ends; null when paused/idle. */
  endTime: number | null;
  /** Remaining ms when paused. */
  remainingMs: number;
}

export interface Countdown {
  id: string;
  label: string;
  totalMs: number;
  endTime: number | null;
  remainingMs: number;
}

export const KEYS = {
  settings: 'settings',
  todos: 'todos',
  links: 'links',
  notes: 'notes',
  pomodoro: 'pomodoro',
  countdowns: 'countdowns',
  cryptoCache: 'cryptoCache',
  schemaVersion: 'schemaVersion',
} as const;

export const DEFAULT_COINS = [
  'bitcoin',
  'ethereum',
  'solana',
  'cardano',
  'sui',
  'cosmos',
  'venice-token',
  'diem',
];

export function defaultLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('ka') ? 'ka' : 'en';
}

export function defaultSettings(): Settings {
  return {
    lang: defaultLang(),
    theme: 'system',
    accent: 'indigo',
    coins: [...DEFAULT_COINS],
    currency: 'usd',
  };
}

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
