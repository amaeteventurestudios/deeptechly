import type { NextRequest } from "next/server";
import { createAppwriteIdentityProvider } from "./appwrite";
import { createSupabaseIdentityProvider } from "./supabase";
import type { AuthProviderName, RouteIdentityProvider } from "./types";

export function configuredAuthProvider(): AuthProviderName {
  return process.env.DEEPTECHLY_AUTH_PROVIDER === "appwrite" ? "appwrite" : "supabase";
}

export function createRouteIdentityProvider(request: NextRequest): RouteIdentityProvider | null {
  if (configuredAuthProvider() === "appwrite") {
    return createAppwriteIdentityProvider(request);
  }
  return createSupabaseIdentityProvider(request);
}

export type { AuthProviderName, RouteIdentityProvider } from "./types";
