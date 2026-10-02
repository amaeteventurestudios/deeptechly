import type { NextRequest } from "next/server";
import { createAppwriteIdentityProvider } from "./appwrite";
import type { AuthProviderName, RouteIdentityProvider } from "./types";

export function configuredAuthProvider(): AuthProviderName {
  return "appwrite";
}

export function createRouteIdentityProvider(request: NextRequest): RouteIdentityProvider | null {
  return createAppwriteIdentityProvider(request);
}

export type { AuthProviderName, RouteIdentityProvider } from "./types";
