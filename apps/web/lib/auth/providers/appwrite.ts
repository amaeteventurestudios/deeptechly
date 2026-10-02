import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { ExternalIdentity, IdentityMutationResult } from "@deeptechly/kernel";
import { getAppwriteConfig } from "@/lib/appwrite/config";
import {
  appwriteAdminRequest,
  AppwriteRequestError,
  appwriteSessionRequest,
  type AppwriteSession,
  type AppwriteUser
} from "@/lib/appwrite/rest";
import type { RouteIdentityProvider } from "./types";

export function createAppwriteIdentityProvider(request: NextRequest): RouteIdentityProvider {
  const config = getAppwriteConfig();
  let nextSession: AppwriteSession | null | undefined;
  const currentSession = config
    ? request.cookies.get(config.sessionCookieName)?.value
    : undefined;

  return {
    name: "appwrite",
    async getCurrentIdentity() {
      if (!currentSession) return null;
      return getAppwriteIdentity(currentSession);
    },
    async signIn(email, password) {
      if (!config) return configurationFailure();
      try {
        nextSession = await createEmailSession(email, password);
        const identity = await getAppwriteIdentity(nextSession.secret);
        return identity
          ? { ok: true, identity, hasSession: true }
          : { ok: false, reason: "request_failed" };
      } catch (error) {
        return identityFailure(error, "invalid_credentials");
      }
    },
    async register(input) {
      if (!config) return configurationFailure();
      try {
        const user = await appwriteAdminRequest<AppwriteUser>("/users", {
          method: "POST",
          body: JSON.stringify({
            userId: randomUUID(),
            email: input.email,
            password: input.password,
            name:
              typeof input.metadata?.full_name === "string"
                ? input.metadata.full_name.slice(0, 128)
                : input.email.split("@")[0]
          })
        });
        nextSession = await createEmailSession(input.email, input.password);
        return {
          ok: true,
          identity: identityFromUser(user),
          hasSession: true
        };
      } catch (error) {
        return identityFailure(error, "request_failed");
      }
    },
    async signOut() {
      if (!config) return configurationFailure();
      const sessionToDelete = nextSession?.secret || currentSession;
      if (sessionToDelete) {
        try {
          await appwriteSessionRequest(sessionToDelete, "/account/sessions/current", {
            method: "DELETE"
          });
        } catch (error) {
          if (!(error instanceof AppwriteRequestError) || error.status !== 401) {
            return identityFailure(error, "request_failed");
          }
        }
      }
      nextSession = null;
      return { ok: true };
    },
    async requestPasswordReset(email, redirectTo) {
      if (!config) return configurationFailure();
      try {
        await appwriteAdminRequest("/account/recovery", {
          method: "POST",
          body: JSON.stringify({ email, url: redirectTo })
        });
        return { ok: true };
      } catch (error) {
        return identityFailure(error, "request_failed");
      }
    },
    applyCookies(response: NextResponse) {
      if (!config || nextSession === undefined) return response;
      if (nextSession === null) {
        response.cookies.delete(config.sessionCookieName);
        return response;
      }
      response.cookies.set(config.sessionCookieName, nextSession.secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(nextSession.expire)
      });
      return response;
    }
  };
}

export async function getAppwriteIdentity(session: string): Promise<ExternalIdentity | null> {
  try {
    const user = await appwriteSessionRequest<AppwriteUser>(session, "/account");
    return identityFromUser(user);
  } catch (error) {
    if (error instanceof AppwriteRequestError && error.status === 401) return null;
    throw error;
  }
}

export async function completeAppwritePasswordRecovery(input: {
  userId: string;
  secret: string;
  password: string;
}) {
  try {
    await appwriteAdminRequest("/account/recovery", {
      method: "PUT",
      body: JSON.stringify(input)
    });
    return { ok: true as const };
  } catch (error) {
    return identityFailure(error, "request_failed");
  }
}

export async function updateAppwriteUserEmail(userId: string, email: string) {
  try {
    await appwriteAdminRequest(`/users/${encodeURIComponent(userId)}/email`, {
      method: "PATCH",
      body: JSON.stringify({ email })
    });
    return { ok: true as const };
  } catch (error) {
    return identityFailure(error, "request_failed");
  }
}

async function createEmailSession(email: string, password: string) {
  return appwriteAdminRequest<AppwriteSession>("/account/sessions/email", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

function identityFromUser(user: AppwriteUser): ExternalIdentity {
  return {
    provider: "appwrite",
    providerUserId: user.$id,
    email: user.email || null,
    displayName: user.name || null,
    emailVerified: Boolean(user.emailVerification)
  };
}

function configurationFailure(): IdentityMutationResult {
  return { ok: false, reason: "configuration" };
}

function identityFailure(
  error: unknown,
  fallback: "invalid_credentials" | "request_failed"
): IdentityMutationResult {
  if (error instanceof AppwriteRequestError) {
    if (error.status === 409) return { ok: false, reason: "duplicate_identity" };
    if (error.status === 401) return { ok: false, reason: "invalid_credentials" };
    if (error.status === 503 || error.code === "configuration") {
      return configurationFailure();
    }
  }
  return { ok: false, reason: fallback };
}
