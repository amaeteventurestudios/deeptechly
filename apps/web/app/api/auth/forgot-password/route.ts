import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/appwrite/config";
import { createRouteIdentityProvider } from "@/lib/auth/providers";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = getField(formData, "email").toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=missing", request.url),
      { status: 303 }
    );
  }

  const authClient = createRouteIdentityProvider(request);

  if (!authClient) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=config", request.url),
      { status: 303 }
    );
  }

  const result = await authClient.requestPasswordReset(
    email,
    `${getSiteUrl(request.url)}/reset-password`
  );

  if (!result.ok) {
    return authClient.applyCookies(
      NextResponse.redirect(
        new URL(`/forgot-password?error=${isProviderUnavailable(result.reason) ? "config" : "send"}`, request.url),
        { status: 303 }
      )
    );
  }

  return authClient.applyCookies(
    NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), {
      status: 303
    })
  );
}

function isProviderUnavailable(reason: string) {
  return reason === "configuration" || reason === "provider_unavailable";
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
