import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");
  const redirectTo = getSafeRedirectPath(getField(formData, "redirectTo"));

  if (!isValidEmail(email) || !password) {
    return NextResponse.redirect(
      new URL("/sign-in?error=missing", request.url),
      { status: 303 }
    );
  }

  const authClient = createSupabaseRouteClient(request);

  if (!authClient) {
    return NextResponse.redirect(
      new URL("/sign-in?error=config", request.url),
      { status: 303 }
    );
  }

  const { error } = await authClient.supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return authClient.applyAuthCookies(
      NextResponse.redirect(new URL("/sign-in?error=invalid", request.url), {
        status: 303
      })
    );
  }

  return authClient.applyAuthCookies(
    NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 })
  );
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSafeRedirectPath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/research";
  }

  return value;
}
