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

export type LangfuseConfig = Omit<HttpCapabilityConfig, "token"> & {
  publicKey: string;
  secretKey: string;
  captureContent: boolean;
};

export type ValkeyConfig = {
  provider: "valkey";
  url: string;
  keyPrefix: string;
};

export type S3Config = {
  provider: "s3";
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export type CapabilityConfig = {
  crawl4ai?: Crawl4AIConfig;
  directus?: HttpCapabilityConfig;
  meilisearch?: HttpCapabilityConfig;
  trigger?: HttpCapabilityConfig;
  langfuse?: LangfuseConfig;
  lago?: HttpCapabilityConfig;
  stripe?: HttpCapabilityConfig;
  valkey?: ValkeyConfig;
  s3?: S3Config;
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
    langfuse: langfuseConfig(environment),
    lago: optionalConfig(environment, "LAGO", {
      healthPath: environment.LAGO_HEALTH_PATH ?? "/health"
    }),
    stripe: stripeConfig(environment),
    valkey: valkeyConfig(environment),
    s3: s3Config(environment)
  };
}

function langfuseConfig(environment: NodeJS.ProcessEnv): LangfuseConfig | undefined {
  const baseUrl = environment.LANGFUSE_BASE_URL?.trim();
  const publicKey = environment.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = environment.LANGFUSE_SECRET_KEY?.trim();
  if (!baseUrl && !publicKey && !secretKey) return undefined;
  if (!baseUrl || !publicKey || !secretKey) throw new Error("Langfuse requires base URL, public key, and secret key");
  const parsed = new URL(baseUrl);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("LANGFUSE_BASE_URL must use http or https");
  return {
    provider: "langfuse",
    baseUrl: parsed.toString().replace(/\/$/, ""),
    publicKey,
    secretKey,
    captureContent: environment.LANGFUSE_CAPTURE_CONTENT === "true",
    healthPath: "/api/public/projects",
    timeoutMs: boundedNamedTimeout("LANGFUSE_TIMEOUT_MS", environment.LANGFUSE_TIMEOUT_MS)
  };
}

function valkeyConfig(environment: NodeJS.ProcessEnv): ValkeyConfig | undefined {
  const value = environment.VALKEY_URL?.trim() || environment.REDIS_URL?.trim();
  if (!value) return undefined;
  const url = new URL(value);
  if (!["redis:", "rediss:"].includes(url.protocol)) throw new Error("VALKEY_URL must use redis or rediss");
  return { provider: "valkey", url: url.toString(), keyPrefix: environment.VALKEY_KEY_PREFIX?.trim() || "deeptechly:" };
}

function s3Config(environment: NodeJS.ProcessEnv): S3Config | undefined {
  const bucket = environment.S3_BUCKET?.trim();
  const accessKeyId = environment.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = environment.S3_SECRET_ACCESS_KEY?.trim();
  if (!bucket && !accessKeyId && !secretAccessKey) return undefined;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error("S3 requires bucket and access credentials");
  const endpoint = environment.S3_ENDPOINT?.trim();
  if (endpoint && !/^https?:$/.test(new URL(endpoint).protocol)) throw new Error("S3_ENDPOINT must use http or https");
  return {
    provider: "s3",
    endpoint,
    region: environment.S3_REGION?.trim() || "us-east-1",
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: environment.S3_FORCE_PATH_STYLE === "true"
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
  return boundedNamedTimeout("STRIPE_TIMEOUT_MS", value);
}

function boundedNamedTimeout(name: string, value?: string) {
  const timeout = Number(value ?? 15_000);
  if (!Number.isFinite(timeout) || timeout < 100 || timeout > 120_000) {
    throw new Error(`${name} must be between 100 and 120000`);
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
