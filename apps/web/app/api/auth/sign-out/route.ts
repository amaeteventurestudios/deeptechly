import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteIdentityProvider } from "@/lib/auth/providers";

export async function POST(request: NextRequest) {
  return signOut(request);
}

export async function GET(request: NextRequest) {
  return signOut(request);
}

async function signOut(request: NextRequest) {
  const authClient = createRouteIdentityProvider(request);
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303
  });

  if (!authClient) {
    return response;
  }

  await authClient.signOut();

  return authClient.applyCookies(response);
}
