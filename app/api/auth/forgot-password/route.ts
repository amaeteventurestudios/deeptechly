import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = getField(formData, "email").toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=missing", request.url),
      { status: 303 }
    );
  }

  const authClient = createSupabaseRouteClient(request);

  if (!authClient) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=config", request.url),
      { status: 303 }
    );
  }

  const { error } = await authClient.supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${getSiteUrl(request.url)}/reset-password`
    }
  );

  if (error) {
    return authClient.applyAuthCookies(
      NextResponse.redirect(
        new URL("/forgot-password?error=send", request.url),
        { status: 303 }
      )
    );
  }

  return authClient.applyAuthCookies(
    NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), {
      status: 303
    })
  );
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
