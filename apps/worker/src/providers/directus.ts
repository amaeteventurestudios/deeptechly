import type { CapabilityHealth, NewsroomRepository } from "@deeptechly/kernel";
import type { HttpCapabilityConfig } from "./config";
import { checkHttpHealth, requestJson } from "./http";

export class DirectusAdapter implements NewsroomRepository {
  constructor(
    private readonly config: HttpCapabilityConfig,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  health(): Promise<CapabilityHealth> {
    return checkHttpHealth(this.config, this.fetchImplementation);
  }

  async list<Item extends Record<string, unknown>>(
    collection: string,
    query: Readonly<Record<string, string>> = {}
  ) {
    const parameters = new URLSearchParams(query);
    const suffix = parameters.size ? `?${parameters}` : "";
    const response = await requestJson<{ data?: Item[] }>(
      this.config,
      this.fetchImplementation,
      `/items/${encodeURIComponent(collection)}${suffix}`
    );
    return response.data ?? [];
  }

  async read<Item extends Record<string, unknown>>(collection: string, id: string) {
    const response = await requestJson<{ data?: Item | null }>(
      this.config,
      this.fetchImplementation,
      `/items/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`
    );
    return response.data ?? null;
  }
}
