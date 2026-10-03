import type { NextRequest } from "next/server";
import { createPocketBaseIdentityProvider } from "./pocketbase";
import type { AuthProviderName, RouteIdentityProvider } from "./types";

export function configuredAuthProvider(): AuthProviderName {
  return "pocketbase";
}

export function createRouteIdentityProvider(request: NextRequest): RouteIdentityProvider | null {
  return createPocketBaseIdentityProvider(request);
}

export type { AuthProviderName, RouteIdentityProvider } from "./types";
