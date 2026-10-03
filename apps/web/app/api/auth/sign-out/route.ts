import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteIdentityProvider } from "@/lib/auth/providers";
import { getAuthSession } from "@/lib/auth/session";
import { recordAuthAudit } from "@/lib/auth/audit";

export async function POST(request: NextRequest) {
  return signOut(request);
}

export async function GET(request: NextRequest) {
  return signOut(request);
}

async function signOut(request: NextRequest) {
  const session = await getAuthSession();
  const authClient = createRouteIdentityProvider(request);
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303
  });

  if (!authClient) {
    return response;
  }

  await authClient.signOut();
  await recordAuthAudit({ eventType: "sign_out", outcome: "success", actorAccountId: session?.userId });

  return authClient.applyCookies(response);
}
