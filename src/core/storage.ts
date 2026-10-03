/**
 * Storage layer.
 *
 * Widgets read synchronously from an in-memory cache (fast first paint) and
 * write through to a pluggable async backend. Today the backend is
 * localStorage (PWA / web); Phase 2 adds a chrome.storage backend for the
 * browser extension without touching widget code.
 */

export const PREFIX = 'pph:v1:';

export interface StorageBackend {
  /** Load every key owned by the app (keys without prefix). */
  loadAll(): Promise<Record<string, unknown>>;
  write(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  /** Fires when another tab/window changes a key. */
  onExternalChange(cb: (key: string, value: unknown) => void): () => void;
}

export class LocalStorageBackend implements StorageBackend {
  constructor(private readonly ls: globalThis.Storage = window.localStorage) {}

  async loadAll(): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    for (let i = 0; i < this.ls.length; i++) {
      const fullKey = this.ls.key(i);
      if (!fullKey?.startsWith(PREFIX)) continue;
      out[fullKey.slice(PREFIX.length)] = safeParse(this.ls.getItem(fullKey));
    }
    return out;
  }

  async write(key: string, value: unknown): Promise<void> {
    this.ls.setItem(PREFIX + key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.ls.removeItem(PREFIX + key);
  }

  onExternalChange(cb: (key: string, value: unknown) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (!e.key?.startsWith(PREFIX)) return;
      cb(e.key.slice(PREFIX.length), e.newValue === null ? undefined : safeParse(e.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

/** In-memory backend for tests. */
export class MemoryBackend implements StorageBackend {
  data: Record<string, unknown> = {};
  async loadAll() {
    return structuredClone(this.data);
  }
  async write(key: string, value: unknown) {
    this.data[key] = structuredClone(value);
  }
  async remove(key: string) {
    delete this.data[key];
  }
  onExternalChange() {
    return () => {};
  }
}

type Listener = (value: unknown) => void;

export class Store {
  private cache: Record<string, unknown> = {};
  private listeners = new Map<string, Set<Listener>>();

  constructor(private readonly backend: StorageBackend) {}

  async init(): Promise<void> {
    this.cache = await this.backend.loadAll();
    this.backend.onExternalChange((key, value) => {
      if (value === undefined) delete this.cache[key];
      else this.cache[key] = value;
      this.emit(key, value);
    });
  }

  get<T>(key: string, fallback: T): T {
    return key in this.cache ? (this.cache[key] as T) : fallback;
  }

  has(key: string): boolean {
    return key in this.cache;
  }

  set<T>(key: string, value: T): void {
    this.cache[key] = value;
    this.emit(key, value);
    void this.backend.write(key, value).catch((err) => console.error('[pph] storage write', err));
  }

  remove(key: string): void {
    delete this.cache[key];
    this.emit(key, undefined);
    void this.backend.remove(key);
  }

  /** Snapshot of all data (for backup/export). */
  dump(): Record<string, unknown> {
    return structuredClone(this.cache);
  }

  subscribe(key: string, cb: Listener): () => void {
    let set = this.listeners.get(key);
    if (!set) this.listeners.set(key, (set = new Set()));
    set.add(cb);
    return () => set.delete(cb);
  }

  private emit(key: string, value: unknown) {
    this.listeners.get(key)?.forEach((cb) => cb(value));
  }
}

function safeParse(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
