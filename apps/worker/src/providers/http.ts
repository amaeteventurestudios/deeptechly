import type { CapabilityHealth } from "@deeptechly/kernel";
import type { HttpCapabilityConfig } from "./config";

export class CapabilityRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "CapabilityRequestError";
  }
}

export async function requestJson<ResponseBody>(
  config: HttpCapabilityConfig,
  fetchImplementation: typeof fetch,
  path: string,
  init: RequestInit = {}
): Promise<ResponseBody> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetchImplementation(`${config.baseUrl}${normalizePath(path)}`, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
        ...init.headers
      }
    });
    if (!response.ok) {
      throw new CapabilityRequestError(
        `${config.provider} request failed with HTTP ${response.status}`,
        response.status
      );
    }
    return (await response.json()) as ResponseBody;
  } catch (error) {
    if (error instanceof CapabilityRequestError) throw error;
    const message = error instanceof Error && error.name === "AbortError"
      ? `${config.provider} request timed out`
      : `${config.provider} request failed`;
    throw new CapabilityRequestError(message);
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkHttpHealth(
  config: HttpCapabilityConfig,
  fetchImplementation: typeof fetch
): Promise<CapabilityHealth> {
  try {
    await requestJson<unknown>(config, fetchImplementation, config.healthPath);
    return { provider: config.provider, status: "available", checkedAt: new Date().toISOString() };
  } catch (error) {
    return {
      provider: config.provider,
      status: "unavailable",
      detail: error instanceof CapabilityRequestError ? error.message : `${config.provider} health check failed`,
      checkedAt: new Date().toISOString()
    };
  }
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}
