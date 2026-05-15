import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminUserRow = {
  id: string;
  authUserId: string;
  fullName: string | null;
  email: string;
  organization: string | null;
  accessTier: string;
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
  createdAt: string;
};

type UserProfileRecord = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string;
  organization: string | null;
  access_tier: string;
  is_institutional_verified: boolean;
  institutional_request_pending: boolean;
  created_at: string;
};

export async function listAllUsers(): Promise<
  { ok: true; users: AdminUserRow[] } | { ok: false; reason: string }
> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false, reason: "configuration" };
  }

  const { data, error } = await admin
    .from("users_profile")
    .select(
      "id, auth_user_id, full_name, email, organization, access_tier, is_institutional_verified, institutional_request_pending, created_at"
    )
    .order("created_at", { ascending: false })
    .returns<UserProfileRecord[]>();

  if (error) {
    console.error("Admin user list failed", { code: error.code, message: error.message });
    return { ok: false, reason: "read_failed" };
  }

  const users: AdminUserRow[] = (data ?? []).map((row) => ({
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name ?? null,
    email: row.email,
    organization: row.organization ?? null,
    accessTier: row.access_tier,
    isInstitutionalVerified: Boolean(row.is_institutional_verified),
    institutionalRequestPending: Boolean(row.institutional_request_pending),
    createdAt: row.created_at
  }));

  return { ok: true, users };
}

export async function verifyInstitutionalAccess(authUserId: string) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { error } = await admin
    .from("users_profile")
    .update({
      is_institutional_verified: true,
      institutional_request_pending: false,
      access_tier: "institutional"
    })
    .eq("auth_user_id", authUserId);

  if (error) {
    console.error("Admin verify user failed", { code: error.code, message: error.message });
    return { ok: false as const, reason: "write_failed" };
  }

  return { ok: true as const };
}

export async function revokeInstitutionalAccess(authUserId: string) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { error } = await admin
    .from("users_profile")
    .update({
      is_institutional_verified: false,
      institutional_request_pending: false,
      access_tier: "free"
    })
    .eq("auth_user_id", authUserId);

  if (error) {
    console.error("Admin revoke user failed", { code: error.code, message: error.message });
    return { ok: false as const, reason: "write_failed" };
  }

  return { ok: true as const };
}
