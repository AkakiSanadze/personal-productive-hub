import { beforeEach, describe, expect, it } from 'vitest';
import { migrateLegacy, SCHEMA_VERSION } from '../../src/core/migrate';
import { LocalStorageBackend, MemoryBackend, PREFIX, Store } from '../../src/core/storage';
import { KEYS, type Link, type Settings, type Todo } from '../../src/core/types';

describe('Store', () => {
  it('reads from cache, writes through and notifies', async () => {
    const backend = new MemoryBackend();
    backend.data.todos = [{ id: '1' }];
    const store = new Store(backend);
    await store.init();
    expect(store.get('todos', [])).toEqual([{ id: '1' }]);

    const seen: unknown[] = [];
    store.subscribe('notes', (v) => seen.push(v));
    store.set('notes', 'hi');
    expect(store.get('notes', '')).toBe('hi');
    expect(seen).toEqual(['hi']);
    await Promise.resolve();
    expect(backend.data.notes).toBe('hi');
  });

  it('localStorage backend only loads prefixed keys', async () => {
    localStorage.clear();
    localStorage.setItem(PREFIX + 'a', '1');
    localStorage.setItem('unrelated', '2');
    const all = await new LocalStorageBackend().loadAll();
    expect(all).toEqual({ a: 1 });
  });
});

describe('migrateLegacy', () => {
  beforeEach(() => localStorage.clear());

  it('imports the original app data once, without deleting it', async () => {
    localStorage.setItem(
      'todos',
      JSON.stringify([{ text: 'Buy milk', completed: true }, { bogus: 1 }]),
    );
    localStorage.setItem('links', JSON.stringify([{ name: 'GH', url: 'https://github.com' }]));
    localStorage.setItem('quickNotes', 'old note');
    localStorage.setItem('theme', 'light');

    const store = new Store(new MemoryBackend());
    await store.init();
    expect(migrateLegacy(store, localStorage)).toBe(true);

    const todos = store.get<Todo[]>(KEYS.todos, []);
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ text: 'Buy milk', completed: true });
    expect(todos[0]!.id).toBeTruthy();
    expect(store.get<Link[]>(KEYS.links, [])[0]).toMatchObject({
      name: 'GH',
      url: 'https://github.com',
    });
    expect(store.get(KEYS.notes, '')).toBe('old note');
    expect(store.get<Settings>(KEYS.settings, {} as Settings).theme).toBe('light');
    expect(store.get(KEYS.schemaVersion, 0)).toBe(SCHEMA_VERSION);

    expect(localStorage.getItem('todos')).not.toBeNull();
    expect(migrateLegacy(store, localStorage)).toBe(false);
  });

  it('works on a fresh install', async () => {
    const store = new Store(new MemoryBackend());
    await store.init();
    migrateLegacy(store, localStorage);
    expect(store.get(KEYS.todos, null)).toBeNull();
    expect(store.get<Settings>(KEYS.settings, {} as Settings).theme).toBe('system');
  });
});
