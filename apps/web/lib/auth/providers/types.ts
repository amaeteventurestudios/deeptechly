import type { NextResponse } from "next/server";
import type { IdentityProvider } from "@deeptechly/kernel";

export type AuthProviderName = "supabase" | "appwrite";

export interface RouteIdentityProvider extends IdentityProvider {
  readonly name: AuthProviderName;
  applyCookies(response: NextResponse): NextResponse;
}
