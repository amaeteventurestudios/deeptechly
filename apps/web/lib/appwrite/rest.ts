import { getAppwriteConfig, type AppwriteConfig } from "./config";

export type AppwriteUser = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  email: string;
  emailVerification: boolean;
  status: boolean;
  prefs?: Record<string, unknown>;
};

export type AppwriteSession = {
  $id: string;
  userId: string;
  expire: string;
  secret: string;
};

export class AppwriteRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: number | string | undefined,
    message: string
  ) {
    super(message);
  }
}

export function hasAppwriteConfiguration() {
  return Boolean(getAppwriteConfig());
}

export async function appwriteAdminRequest<T>(
  path: string,
  init: RequestInit = {}
) {
  const config = getAppwriteConfig();
  if (!config) throw new AppwriteRequestError(503, "configuration", "Appwrite is not configured");
  return appwriteRequest<T>(config, path, init, {
    "X-Appwrite-Key": config.apiKey
  });
}

export async function appwriteSessionRequest<T>(
  session: string,
  path: string,
  init: RequestInit = {}
) {
  const config = getAppwriteConfig();
  if (!config) throw new AppwriteRequestError(503, "configuration", "Appwrite is not configured");
  return appwriteRequest<T>(config, path, init, {
    "X-Appwrite-Session": session
  });
}

async function appwriteRequest<T>(
  config: AppwriteConfig,
  path: string,
  init: RequestInit,
  authHeaders: Record<string, string>
) {
  const response = await fetch(`${config.endpoint}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-Appwrite-Project": config.projectId,
      "X-Appwrite-Response-Format": "1.8.0",
      ...authHeaders,
      ...init.headers
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      code?: number | string;
      message?: string;
    };
    throw new AppwriteRequestError(
      response.status,
      payload.code,
      payload.message || `Appwrite request failed with status ${response.status}`
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
