import type {
  NewsroomRepository,
  SearchIndex,
  SourceAcquisitionProvider,
  WorkflowDispatcher
} from "@deeptechly/kernel";
import { loadCapabilityConfig } from "./providers/config";
import { Crawl4AIAdapter } from "./providers/crawl4ai";
import { DirectusAdapter } from "./providers/directus";
import { MeilisearchAdapter } from "./providers/meilisearch";

export type WorkerRuntime = {
  workflows: WorkflowDispatcher;
  acquisition?: SourceAcquisitionProvider;
  newsroom?: NewsroomRepository;
  search?: SearchIndex;
};

export function createWorkerRuntime(
  workflows: WorkflowDispatcher,
  capabilities: Omit<WorkerRuntime, "workflows"> = {}
): WorkerRuntime {
  return { workflows, ...capabilities };
}

/** Creates only explicitly configured adapters; it never probes or starts services. */
export function createConfiguredCapabilities(
  environment: NodeJS.ProcessEnv = process.env,
  fetchImplementation: typeof fetch = fetch
): Omit<WorkerRuntime, "workflows"> {
  const config = loadCapabilityConfig(environment);
  return {
    acquisition: config.crawl4ai
      ? new Crawl4AIAdapter(config.crawl4ai, fetchImplementation)
      : undefined,
    newsroom: config.directus
      ? new DirectusAdapter(config.directus, fetchImplementation)
      : undefined,
    search: config.meilisearch
      ? new MeilisearchAdapter(config.meilisearch, fetchImplementation)
      : undefined
  };
}
