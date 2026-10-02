import type { NextRequest, NextResponse } from "next/server";
import type { IdentityMutationResult } from "@deeptechly/kernel";
import type { RouteIdentityProvider } from "./types";

/**
 * Appwrite migration boundary. Activating this provider requires an Appwrite
 * project and an approved session-cookie strategy. Until then every mutation
 * fails closed and the current Supabase provider remains the production default.
 */
export function createAppwriteIdentityProvider(request: NextRequest): RouteIdentityProvider {
  void request;
  return {
    name: "appwrite",
    async getCurrentIdentity() {
      return null;
    },
    async signIn() {
      return unavailable();
    },
    async register() {
      return unavailable();
    },
    async signOut() {
      return unavailable();
    },
    async requestPasswordReset() {
      return unavailable();
    },
    applyCookies(response: NextResponse) {
      return response;
    }
  };
}

function unavailable(): IdentityMutationResult {
  return {
    ok: false,
    reason: hasAppwriteConfiguration() ? "provider_unavailable" : "configuration"
  };
}

function hasAppwriteConfiguration() {
  return Boolean(process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID);
}
