import type { NextRequest, NextResponse } from "next/server";
import type {
  ExternalIdentity,
  IdentityMutationResult,
  IdentityRegistration
} from "@deeptechly/kernel";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import type { RouteIdentityProvider } from "./types";

export function createSupabaseIdentityProvider(request: NextRequest): RouteIdentityProvider | null {
  const client = createSupabaseRouteClient(request);
  if (!client) return null;

  return {
    name: "supabase",
    async getCurrentIdentity() {
      const { data, error } = await client.supabase.auth.getUser();
      if (error || !data.user) return null;
      return identityFromSupabaseUser(data.user);
    },
    async signIn(email, password) {
      const { data, error } = await client.supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return failure("invalid_credentials");
      return { ok: true, identity: identityFromSupabaseUser(data.user), hasSession: Boolean(data.session) };
    },
    async register(input: IdentityRegistration) {
      const { data, error } = await client.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { emailRedirectTo: input.emailRedirectTo, data: input.metadata }
      });
      if (error || !data.user) {
        return failure(error?.message.toLowerCase().includes("already") ? "duplicate_identity" : "request_failed");
      }
      return { ok: true, identity: identityFromSupabaseUser(data.user), hasSession: Boolean(data.session) };
    },
    async signOut() {
      const { error } = await client.supabase.auth.signOut();
      return error ? failure("request_failed") : { ok: true };
    },
    async requestPasswordReset(email, redirectTo) {
      const { error } = await client.supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return error ? failure("request_failed") : { ok: true };
    },
    applyCookies(response: NextResponse) {
      return client.applyAuthCookies(response);
    }
  };
}

function identityFromSupabaseUser(user: {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}): ExternalIdentity {
  return {
    provider: "supabase",
    providerUserId: user.id,
    email: user.email ?? null,
    displayName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    emailVerified: Boolean(user.email_confirmed_at)
  };
}

function failure(reason: "invalid_credentials" | "duplicate_identity" | "request_failed"): IdentityMutationResult {
  return { ok: false, reason };
}
