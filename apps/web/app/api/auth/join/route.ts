import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  type InviteResolution,
  persistUserProfile,
  resolveInstitutionalInvite,
  type AccessPath
} from "@/lib/auth/profiles";
import { getSiteUrl, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const accessPath =
    getField(formData, "accessPath") === "institutional"
      ? "institutional"
      : "research";
  const name = getField(formData, "fullName");
  const email = getField(
    formData,
    accessPath === "institutional" ? "workEmail" : "email"
  ).toLowerCase();
  const password = getField(formData, "password");
  const organization = getField(formData, "organization");
  const inviteCode = getField(formData, "inviteCode");

  if (!name || !isValidEmail(email) || !password) {
    return NextResponse.redirect(
      new URL(`/join?error=missing&access=${accessPath}`, request.url),
      { status: 303 }
    );
  }

  const authClient = createSupabaseRouteClient(request);

  if (!authClient || !getSupabaseServiceRoleKey()) {
    return NextResponse.redirect(
      new URL(`/join?error=config&access=${accessPath}`, request.url),
      { status: 303 }
    );
  }

  let inviteResolution: InviteResolution = {
    accessTier: "free",
    isInstitutionalVerified: false,
    institutionalRequestPending: false,
    inviteStatus: "not_provided"
  };

  try {
    inviteResolution =
      accessPath === "institutional"
        ? await resolveInstitutionalInvite(inviteCode)
        : inviteResolution;
  } catch {
    return NextResponse.redirect(
      new URL(`/join?error=invite&access=${accessPath}`, request.url),
      { status: 303 }
    );
  }

  const { data, error } = await authClient.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl(request.url)}/research`,
      data: {
        full_name: name,
        organization: organization || undefined,
        access_path: accessPath,
        institutional_request_pending:
          accessPath === "institutional"
            ? inviteResolution.institutionalRequestPending
            : false
      }
    }
  });

  if (error || !data.user) {
    return authClient.applyAuthCookies(
      NextResponse.redirect(
        new URL(`/join?error=signup&access=${accessPath}`, request.url),
        { status: 303 }
      )
    );
  }

  const profileResult = await persistUserProfile({
    authUserId: data.user.id,
    fullName: name,
    email,
    organization,
    accessPath: accessPath as AccessPath,
    inviteResolution
  });

  if (!profileResult.ok) {
    await authClient.supabase.auth.signOut();
    return authClient.applyAuthCookies(
      NextResponse.redirect(
        new URL(`/join?error=profile&access=${accessPath}`, request.url),
        { status: 303 }
      )
    );
  }

  const destination = data.session
    ? "/research"
    : "/sign-in?notice=check-email";

  return authClient.applyAuthCookies(
    NextResponse.redirect(new URL(destination, request.url), { status: 303 })
  );
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
