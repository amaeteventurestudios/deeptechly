import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateEditableUserProfile } from "@/lib/auth/profiles";
import { getSiteUrl, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

type ProfilePayload = {
  fullName?: unknown;
  organization?: unknown;
  email?: unknown;
};

export async function POST(request: NextRequest) {
  const authClient = createSupabaseRouteClient(request);

  if (!authClient || !getSupabaseServiceRoleKey()) {
    return NextResponse.json(
      { error: "We could not update your profile. Please try again." },
      { status: 503 }
    );
  }

  const {
    data: { user },
    error: userError
  } = await authClient.supabase.auth.getUser();

  if (userError || !user?.id || !user.email) {
    return authClient.applyAuthCookies(
      NextResponse.json(
        { error: "You must be signed in to update your profile." },
        { status: 401 }
      )
    );
  }

  let payload: ProfilePayload;
  try {
    payload = (await request.json()) as ProfilePayload;
  } catch {
    return NextResponse.json(
      { error: "We could not update your profile. Please try again." },
      { status: 400 }
    );
  }

  const fullName = cleanText(payload.fullName);
  const organization = cleanOptionalText(payload.organization);
  const email = cleanText(payload.email).toLowerCase();

  if (!fullName || fullName.length > 120) {
    return NextResponse.json(
      { error: "Full name is required." },
      { status: 400 }
    );
  }

  if (organization && organization.length > 160) {
    return NextResponse.json(
      { error: "Organization must be 160 characters or fewer." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const profileResult = await updateEditableUserProfile(user.id, {
    full_name: fullName,
    organization
  });

  if (!profileResult.ok) {
    return NextResponse.json(
      { error: "We could not update your profile. Please try again." },
      { status: 500 }
    );
  }

  let emailChangeRequested = false;
  const normalizedCurrentEmail = user.email.toLowerCase();

  if (email !== normalizedCurrentEmail) {
    const { error } = await authClient.supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${getSiteUrl(request.url)}/account` }
    );

    if (error) {
      return authClient.applyAuthCookies(
        NextResponse.json(
          { error: "Email changes must be confirmed through Supabase Auth." },
          { status: 400 }
        )
      );
    }

    emailChangeRequested = true;
  }

  return authClient.applyAuthCookies(
    NextResponse.json({
      message: emailChangeRequested
        ? "PROFILE UPDATED. Confirm the email change from your inbox."
        : "PROFILE UPDATED",
      profile: {
        fullName: profileResult.profile.full_name,
        organization: profileResult.profile.organization,
        email: user.email
      },
      emailChangeRequested
    })
  );
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
