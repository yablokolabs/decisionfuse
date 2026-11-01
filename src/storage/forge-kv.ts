import { kvs } from '@forge/kvs';
import type { Kv } from './repository';

/** Forge-hosted key/value storage. No external database is used for the core. */
export const forgeKv: Kv = {
  async get(key) {
    return kvs.get(key);
  },
  async set(key, value) {
    await kvs.set(key, value);
  },
  async delete(key) {
    await kvs.delete(key);
  },
};
