import { createClient } from "redis";
import type { CacheStore, CapabilityHealth } from "@deeptechly/kernel";
import type { ValkeyConfig } from "./config";

type ValkeyClient = {
  isOpen: boolean;
  connect(): Promise<unknown>;
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<unknown>;
  del(key: string): Promise<number>;
};

export class ValkeyCacheAdapter implements CacheStore {
  private readonly client: ValkeyClient;

  constructor(private readonly config: ValkeyConfig, client?: ValkeyClient) {
    this.client = client ?? (createClient({ url: config.url }) as unknown as ValkeyClient);
  }

  async health(): Promise<CapabilityHealth> {
    try {
      await this.ready();
      const pong = await this.client.ping();
      return { provider: "valkey", status: pong === "PONG" ? "available" : "degraded", checkedAt: new Date().toISOString() };
    } catch {
      return { provider: "valkey", status: "unavailable", checkedAt: new Date().toISOString() };
    }
  }

  async get(key: string) {
    await this.ready();
    return this.client.get(this.key(key));
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await this.ready();
    if (ttlSeconds !== undefined && (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 2_592_000)) {
      throw new Error("Cache TTL must be between 1 and 2592000 seconds");
    }
    await this.client.set(this.key(key), value, ttlSeconds ? { EX: ttlSeconds } : undefined);
  }

  async delete(key: string) {
    await this.ready();
    await this.client.del(this.key(key));
  }

  private async ready() {
    if (!this.client.isOpen) await this.client.connect();
  }

  private key(value: string) {
    if (!value || value.length > 500 || /[\r\n\0]/.test(value)) throw new Error("Cache key is invalid");
    return `${this.config.keyPrefix}${value}`;
  }
}
