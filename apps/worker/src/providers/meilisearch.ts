import type {
  CapabilityHealth,
  SearchDocument,
  SearchIndex,
  SearchRequest,
  SearchResponse
} from "@deeptechly/kernel";
import type { HttpCapabilityConfig } from "./config";
import { checkHttpHealth, requestJson } from "./http";

type MeiliTask = { taskUid?: number; uid?: number };

export class MeilisearchAdapter implements SearchIndex {
  constructor(
    private readonly config: HttpCapabilityConfig,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  health(): Promise<CapabilityHealth> {
    return checkHttpHealth(this.config, this.fetchImplementation);
  }

  async search<Document extends SearchDocument>(request: SearchRequest): Promise<SearchResponse<Document>> {
    const response = await requestJson<{
      hits?: Document[];
      estimatedTotalHits?: number;
      processingTimeMs?: number;
    }>(this.config, this.fetchImplementation, `/indexes/${encodeURIComponent(request.index)}/search`, {
      method: "POST",
      body: JSON.stringify({
        q: request.query,
        limit: Math.min(100, Math.max(1, request.limit ?? 20)),
        ...(request.filter ? { filter: request.filter } : {})
      })
    });
    return {
      hits: response.hits ?? [],
      estimatedTotalHits: response.estimatedTotalHits ?? response.hits?.length ?? 0,
      processingTimeMs: response.processingTimeMs
    };
  }

  async upsert(index: string, documents: readonly SearchDocument[]) {
    const task = await requestJson<MeiliTask>(
      this.config,
      this.fetchImplementation,
      `/indexes/${encodeURIComponent(index)}/documents?primaryKey=id`,
      { method: "POST", body: JSON.stringify(documents) }
    );
    return { taskId: String(task.taskUid ?? task.uid ?? "unknown") };
  }

  async remove(index: string, documentIds: readonly string[]) {
    const task = await requestJson<MeiliTask>(
      this.config,
      this.fetchImplementation,
      `/indexes/${encodeURIComponent(index)}/documents/delete-batch`,
      { method: "POST", body: JSON.stringify(documentIds) }
    );
    return { taskId: String(task.taskUid ?? task.uid ?? "unknown") };
  }
}
