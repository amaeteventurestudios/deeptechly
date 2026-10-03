import { getPocketBaseConfig } from "./config";

export type PocketBaseRecord = {
  id: string;
  email: string;
  name?: string;
  verified?: boolean;
  disabled?: boolean;
  created?: string;
  updated?: string;
};

export type PocketBaseAuthResponse = { token: string; record: PocketBaseRecord };

export class PocketBaseRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function hasPocketBaseConfiguration() {
  return Boolean(getPocketBaseConfig());
}

export async function pocketBaseRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string
) {
  const config = getPocketBaseConfig();
  if (!config) throw new PocketBaseRequestError(503, "Identity service is not configured");
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(token ? { Authorization: token } : {}),
      ...init.headers
    }
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new PocketBaseRequestError(response.status, payload.message || `Identity request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getPocketBaseSuperuserToken() {
  const config = getPocketBaseConfig();
  if (!config) throw new PocketBaseRequestError(503, "Identity service is not configured");
  if (config.superuserToken) return config.superuserToken;
  if (!config.superuserEmail || !config.superuserPassword) {
    throw new PocketBaseRequestError(503, "Identity administration is not configured");
  }
  const auth = await pocketBaseRequest<PocketBaseAuthResponse>(
    "/api/collections/_superusers/auth-with-password",
    {
      method: "POST",
      body: JSON.stringify({ identity: config.superuserEmail, password: config.superuserPassword })
    }
  );
  return auth.token;
}

export async function pocketBaseAdminRequest<T>(path: string, init: RequestInit = {}) {
  return pocketBaseRequest<T>(path, init, await getPocketBaseSuperuserToken());
}
