import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AccessPath = "research" | "institutional";

export type UserProfile = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string;
  organization: string | null;
  access_tier: string;
  is_institutional_verified: boolean;
  institutional_request_pending: boolean;
  created_at: string;
  updated_at: string;
};

export type InviteResolution = {
  accessTier: string;
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
  inviteStatus: "not_provided" | "verified" | "invalid" | "unavailable";
};

type ProfileInput = {
  authUserId: string;
  fullName: string;
  email: string;
  organization?: string;
  accessPath: AccessPath;
  inviteResolution: InviteResolution;
};

export async function getUserProfile(authUserId: string) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("users_profile")
    .select(
      "id, auth_user_id, full_name, email, organization, access_tier, is_institutional_verified, institutional_request_pending, created_at, updated_at"
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle<UserProfile>();

  if (error) {
    console.error("Supabase profile read failed", {
      code: error.code,
      message: error.message
    });
    return null;
  }

  return data;
}

export async function resolveInstitutionalInvite(
  inviteCode: string
): Promise<InviteResolution> {
  const trimmedCode = inviteCode.trim();

  if (!trimmedCode) {
    return pendingInvite("not_provided");
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    return pendingInvite("unavailable");
  }

  const { data, error } = await admin.rpc("redeem_invite_code", {
    invite_code_input: trimmedCode
  });

  if (error) {
    if (isMissingInviteInfrastructure(error)) {
      return pendingInvite("unavailable");
    }

    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.is_valid) {
    return pendingInvite("invalid");
  }

  return {
    accessTier: result.access_tier || "institutional",
    isInstitutionalVerified: true,
    institutionalRequestPending: false,
    inviteStatus: "verified"
  };
}

export async function persistUserProfile(input: ProfileInput) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const now = new Date().toISOString();
  const profile = {
    id: randomUUID(),
    auth_user_id: input.authUserId,
    full_name: input.fullName,
    email: input.email,
    organization: input.organization || null,
    access_tier: input.inviteResolution.accessTier,
    is_institutional_verified:
      input.inviteResolution.isInstitutionalVerified,
    institutional_request_pending:
      input.accessPath === "institutional"
        ? input.inviteResolution.institutionalRequestPending
        : false,
    created_at: now,
    updated_at: now
  };

  const { error } = await admin.from("users_profile").insert(profile);

  if (!error) {
    return { ok: true as const };
  }

  if (error.code === "23505") {
    const { error: updateError } = await admin
      .from("users_profile")
      .update({
        full_name: profile.full_name,
        email: profile.email,
        organization: profile.organization,
        access_tier: profile.access_tier,
        is_institutional_verified: profile.is_institutional_verified,
        institutional_request_pending: profile.institutional_request_pending,
        updated_at: now
      })
      .eq("auth_user_id", input.authUserId);

    if (!updateError) {
      return { ok: true as const };
    }

    console.error("Supabase profile update failed", {
      code: updateError.code,
      message: updateError.message
    });
    return { ok: false as const, reason: "write_failed" };
  }

  console.error("Supabase profile insert failed", {
    code: error.code,
    message: error.message
  });
  return { ok: false as const, reason: "write_failed" };
}

function pendingInvite(
  inviteStatus: InviteResolution["inviteStatus"]
): InviteResolution {
  return {
    accessTier: "free",
    isInstitutionalVerified: false,
    institutionalRequestPending: true,
    inviteStatus
  };
}

function isMissingInviteInfrastructure(error: { code?: string; message: string }) {
  return (
    error.code === "PGRST202" ||
    error.code === "42P01" ||
    error.message.toLowerCase().includes("redeem_invite_code") ||
    error.message.toLowerCase().includes("invite_codes")
  );
}
