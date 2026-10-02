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
  lago?: HttpCapabilityConfig;
  stripe?: HttpCapabilityConfig;
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
    }),
    lago: optionalConfig(environment, "LAGO", {
      healthPath: environment.LAGO_HEALTH_PATH ?? "/health"
    }),
    stripe: stripeConfig(environment)
  };
}

function stripeConfig(environment: NodeJS.ProcessEnv): HttpCapabilityConfig | undefined {
  const token = environment.STRIPE_SECRET_KEY?.trim();
  if (!token) return undefined;
  if (!token.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY must be a server-side secret key");
  const baseUrl = environment.STRIPE_BASE_URL?.trim() || "https://api.stripe.com";
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new Error("STRIPE_BASE_URL must use https outside local development");
  }
  return {
    provider: "stripe",
    baseUrl: parsed.toString().replace(/\/$/, ""),
    token,
    healthPath: "/v1/account",
    timeoutMs: boundedTimeout(environment.STRIPE_TIMEOUT_MS)
  };
}

function boundedTimeout(value?: string) {
  const timeout = Number(value ?? 15_000);
  if (!Number.isFinite(timeout) || timeout < 100 || timeout > 120_000) {
    throw new Error("STRIPE_TIMEOUT_MS must be between 100 and 120000");
  }
  return timeout;
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
