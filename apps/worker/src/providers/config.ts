export type HttpCapabilityConfig = {
  provider: string;
  baseUrl: string;
  token?: string;
  healthPath: string;
  timeoutMs: number;
};

export type Crawl4AIConfig = HttpCapabilityConfig & {
  acquirePath: string;
};

export type CapabilityConfig = {
  crawl4ai?: Crawl4AIConfig;
  directus?: HttpCapabilityConfig;
  meilisearch?: HttpCapabilityConfig;
  trigger?: HttpCapabilityConfig;
  langfuse?: HttpCapabilityConfig;
};

export function loadCapabilityConfig(environment: NodeJS.ProcessEnv): CapabilityConfig {
  return {
    crawl4ai: optionalConfig(environment, "CRAWL4AI", {
      healthPath: environment.CRAWL4AI_HEALTH_PATH ?? "/health",
      extra: { acquirePath: environment.CRAWL4AI_ACQUIRE_PATH ?? "/crawl" }
    }) as Crawl4AIConfig | undefined,
    directus: optionalConfig(environment, "DIRECTUS", {
      healthPath: "/server/health"
    }),
    meilisearch: optionalConfig(environment, "MEILISEARCH", {
      healthPath: "/health"
    }),
    trigger: optionalConfig(environment, "TRIGGER", {
      healthPath: environment.TRIGGER_HEALTH_PATH ?? "/api/v1/health"
    }),
    langfuse: optionalConfig(environment, "LANGFUSE", {
      healthPath: environment.LANGFUSE_HEALTH_PATH ?? "/api/public/health"
    })
  };
}

function optionalConfig(
  environment: NodeJS.ProcessEnv,
  prefix: string,
  options: { healthPath: string; extra?: Record<string, string> }
): HttpCapabilityConfig | undefined {
  const baseUrl = environment[`${prefix}_BASE_URL`]?.trim();
  if (!baseUrl) return undefined;

  const parsed = new URL(baseUrl);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(`${prefix}_BASE_URL must use http or https`);
  }

  const timeout = Number(environment[`${prefix}_TIMEOUT_MS`] ?? 15_000);
  if (!Number.isFinite(timeout) || timeout < 100 || timeout > 120_000) {
    throw new Error(`${prefix}_TIMEOUT_MS must be between 100 and 120000`);
  }

  return {
    provider: prefix.toLowerCase(),
    baseUrl: parsed.toString().replace(/\/$/, ""),
    token: environment[`${prefix}_TOKEN`] || environment[`${prefix}_API_KEY`] || undefined,
    healthPath: options.healthPath,
    timeoutMs: timeout,
    ...options.extra
  };
}
