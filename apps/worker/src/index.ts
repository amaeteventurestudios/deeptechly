import type {
  BillingMeter,
  CacheStore,
  NewsroomRepository,
  ObjectStore,
  PaymentCheckout,
  SearchIndex,
  SourceAcquisitionProvider,
  TraceSink,
  WorkflowDispatcher
} from "@deeptechly/kernel";
import { loadCapabilityConfig } from "./providers/config";
import { Crawl4AIAdapter } from "./providers/crawl4ai";
import { DirectusAdapter } from "./providers/directus";
import { MeilisearchAdapter } from "./providers/meilisearch";
import { LagoBillingAdapter } from "./providers/lago";
import { StripeCheckoutAdapter } from "./providers/stripe";
import { LangfuseTraceAdapter } from "./providers/langfuse";
import { ValkeyCacheAdapter } from "./providers/valkey";
import { S3ObjectStoreAdapter } from "./providers/s3";

export type WorkerRuntime = {
  workflows: WorkflowDispatcher;
  acquisition?: SourceAcquisitionProvider;
  newsroom?: NewsroomRepository;
  search?: SearchIndex;
  billing?: BillingMeter;
  checkout?: PaymentCheckout;
  tracing?: TraceSink;
  cache?: CacheStore;
  objects?: ObjectStore;
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
      : undefined,
    billing: config.lago ? new LagoBillingAdapter(config.lago, fetchImplementation) : undefined,
    checkout: config.stripe ? new StripeCheckoutAdapter(config.stripe, fetchImplementation) : undefined,
    tracing: config.langfuse ? new LangfuseTraceAdapter(config.langfuse, fetchImplementation) : undefined,
    cache: config.valkey ? new ValkeyCacheAdapter(config.valkey) : undefined,
    objects: config.s3 ? new S3ObjectStoreAdapter(config.s3) : undefined
  };
}
