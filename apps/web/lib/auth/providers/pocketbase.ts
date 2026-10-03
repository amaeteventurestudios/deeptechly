import type { NextRequest, NextResponse } from "next/server";
import type { ExternalIdentity, IdentityMutationResult } from "@deeptechly/kernel";
import { getPocketBaseConfig } from "@/lib/pocketbase/config";
import {
  pocketBaseRequest,
  PocketBaseRequestError,
  type PocketBaseAuthResponse,
  type PocketBaseRecord
} from "@/lib/pocketbase/rest";
import type { RouteIdentityProvider } from "./types";

export function createPocketBaseIdentityProvider(request: NextRequest): RouteIdentityProvider {
  const config = getPocketBaseConfig();
  const currentToken = config ? request.cookies.get(config.authCookieName)?.value : undefined;
  let nextToken: string | null | undefined;

  return {
    name: "pocketbase",
    async getCurrentIdentity() {
      if (!config || !currentToken) return null;
      const auth = await refreshPocketBaseIdentity(currentToken);
      if (!auth) return null;
      nextToken = auth.token;
      return identityFromRecord(auth.record);
    },
    async signIn(email, password) {
      if (!config) return configurationFailure();
      try {
        const auth = await pocketBaseRequest<PocketBaseAuthResponse>(
          `/api/collections/${encodeURIComponent(config.collection)}/auth-with-password`,
          { method: "POST", body: JSON.stringify({ identity: email, password }) }
        );
        if (auth.record.disabled) return { ok: false, reason: "invalid_credentials" };
        nextToken = auth.token;
        return { ok: true, identity: identityFromRecord(auth.record), hasSession: true };
      } catch (error) {
        return identityFailure(error, "invalid_credentials");
      }
    },
    async register(input) {
      if (!config) return configurationFailure();
      try {
        const record = await pocketBaseRequest<PocketBaseRecord>(
          `/api/collections/${encodeURIComponent(config.collection)}/records`,
          {
            method: "POST",
            body: JSON.stringify({
              email: input.email,
              password: input.password,
              passwordConfirm: input.password,
              name: typeof input.metadata?.full_name === "string" ? input.metadata.full_name.slice(0, 120) : ""
            })
          }
        );
        const auth = await pocketBaseRequest<PocketBaseAuthResponse>(
          `/api/collections/${encodeURIComponent(config.collection)}/auth-with-password`,
          { method: "POST", body: JSON.stringify({ identity: input.email, password: input.password }) }
        );
        nextToken = auth.token;
        void requestPocketBaseVerification(input.email).catch(() => undefined);
        return { ok: true, identity: identityFromRecord(record), hasSession: true };
      } catch (error) {
        return identityFailure(error, "request_failed");
      }
    },
    async signOut() {
      nextToken = null;
      return { ok: true };
    },
    async requestPasswordReset(email) {
      if (!config) return configurationFailure();
      try {
        await pocketBaseRequest(
          `/api/collections/${encodeURIComponent(config.collection)}/request-password-reset`,
          { method: "POST", body: JSON.stringify({ email }) }
        );
        return { ok: true };
      } catch (error) {
        return identityFailure(error, "request_failed");
      }
    },
    applyCookies(response: NextResponse) {
      if (!config || nextToken === undefined) return response;
      if (nextToken === null) {
        response.cookies.set(config.authCookieName, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
      } else {
        response.cookies.set(config.authCookieName, nextToken, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", priority: "high" });
      }
      return response;
    }
  };
}

export async function refreshPocketBaseIdentity(token: string) {
  const config = getPocketBaseConfig();
  if (!config) return null;
  try {
    const auth = await pocketBaseRequest<PocketBaseAuthResponse>(
      `/api/collections/${encodeURIComponent(config.collection)}/auth-refresh`,
      { method: "POST" }, token
    );
    return auth.record.disabled ? null : auth;
  } catch (error) {
    if (error instanceof PocketBaseRequestError && [401, 403].includes(error.status)) return null;
    throw error;
  }
}

export async function completePocketBasePasswordRecovery(input: { token: string; password: string }) {
  const config = getPocketBaseConfig();
  if (!config) return configurationFailure();
  try {
    await pocketBaseRequest(`/api/collections/${encodeURIComponent(config.collection)}/confirm-password-reset`, {
      method: "POST",
      body: JSON.stringify({ token: input.token, password: input.password, passwordConfirm: input.password })
    });
    return { ok: true as const };
  } catch (error) {
    return identityFailure(error, "request_failed");
  }
}

export async function requestPocketBaseVerification(email: string) {
  const config = getPocketBaseConfig();
  if (!config) return configurationFailure();
  await pocketBaseRequest(`/api/collections/${encodeURIComponent(config.collection)}/request-verification`, {
    method: "POST", body: JSON.stringify({ email })
  });
  return { ok: true as const };
}

export async function requestPocketBaseEmailChange(request: NextRequest, email: string) {
  const config = getPocketBaseConfig();
  const token = config ? request.cookies.get(config.authCookieName)?.value : undefined;
  if (!config || !token) return configurationFailure();
  try {
    await pocketBaseRequest(
      `/api/collections/${encodeURIComponent(config.collection)}/request-email-change`,
      { method: "POST", body: JSON.stringify({ newEmail: email }) },
      token
    );
    return { ok: true as const };
  } catch (error) {
    return identityFailure(error, "request_failed");
  }
}

function identityFromRecord(record: PocketBaseRecord): ExternalIdentity {
  return { provider: "pocketbase", providerUserId: record.id, email: record.email || null, displayName: record.name || null, emailVerified: Boolean(record.verified) };
}

function configurationFailure(): IdentityMutationResult { return { ok: false, reason: "configuration" }; }
function identityFailure(error: unknown, fallback: "invalid_credentials" | "request_failed"): IdentityMutationResult {
  if (error instanceof PocketBaseRequestError) {
    if (error.status === 400 || error.status === 409) return { ok: false, reason: fallback === "invalid_credentials" ? fallback : "duplicate_identity" };
    if (error.status === 401 || error.status === 403) return { ok: false, reason: "invalid_credentials" };
    if (error.status === 503) return configurationFailure();
  }
  return { ok: false, reason: fallback };
}
