import type { Kv } from '../src/storage/repository';

/** In-memory KV for tests. Mirrors the Forge adapter's contract only. */
export class MemoryKv implements Kv {
  private store = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, structuredClone(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  keys(): string[] {
    return [...this.store.keys()];
  }
}

export function fixedClock(start = '2026-11-01T10:00:00.000Z') {
  let tick = 0;
  return () => new Date(Date.parse(start) + tick++ * 1000).toISOString();
}

export function idSequence(prefix = 'id') {
  let n = 0;
  return () => `${prefix}-${++n}`;
}
