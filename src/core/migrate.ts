import type { Store } from './storage';
import { KEYS, defaultSettings, uid, type Link, type Settings, type Todo } from './types';

export const SCHEMA_VERSION = 1;

/**
 * One-time, non-destructive migration from the original single-file app,
 * which stored data under bare localStorage keys: `todos`, `links`,
 * `quickNotes`, `theme`. Old keys are left in place as a safety net.
 */
export function migrateLegacy(store: Store, ls: globalThis.Storage = window.localStorage): boolean {
  if (store.get<number>(KEYS.schemaVersion, 0) >= SCHEMA_VERSION) return false;

  const settings: Settings = {
    ...defaultSettings(),
    ...store.get<Partial<Settings>>(KEYS.settings, {}),
  };

  const legacyTodos = readJson<unknown[]>(ls, 'todos');
  if (Array.isArray(legacyTodos) && !store.has(KEYS.todos)) {
    const todos: Todo[] = legacyTodos
      .filter(
        (t): t is { text: string; completed?: boolean } => isObj(t) && typeof t.text === 'string',
      )
      .map((t) => ({ id: uid(), text: t.text, completed: !!t.completed, createdAt: Date.now() }));
    store.set(KEYS.todos, todos);
  }

  const legacyLinks = readJson<unknown[]>(ls, 'links');
  if (Array.isArray(legacyLinks) && !store.has(KEYS.links)) {
    const links: Link[] = legacyLinks
      .filter(
        (l): l is { name: string; url: string } =>
          isObj(l) && typeof l.name === 'string' && typeof l.url === 'string',
      )
      .map((l) => ({ id: uid(), name: l.name, url: l.url }));
    store.set(KEYS.links, links);
  }

  const legacyNotes = ls.getItem('quickNotes');
  if (legacyNotes && !store.has(KEYS.notes)) store.set(KEYS.notes, legacyNotes);

  const legacyTheme = ls.getItem('theme');
  if (legacyTheme === 'dark' || legacyTheme === 'light' || legacyTheme === 'system') {
    settings.theme = legacyTheme;
  }

  store.set(KEYS.settings, settings);
  store.set(KEYS.schemaVersion, SCHEMA_VERSION);
  return true;
}

function readJson<T>(ls: globalThis.Storage, key: string): T | null {
  try {
    const raw = ls.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
