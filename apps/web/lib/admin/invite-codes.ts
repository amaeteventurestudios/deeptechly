import "server-only";

import { randomInt } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PREFIX = "DTLY";
const MAX_CODE_GENERATION_ATTEMPTS = 12;

export type InviteCodeRecord = {
  id: string;
  code: string;
  organization: string | null;
  tier: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  disabled_at: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type InviteCodeStatus = {
  isActive: boolean;
  label: "Active" | "Disabled" | "Expired" | "Maxed out";
  reason: string;
};

export type CreateInviteCodeInput = {
  label: string;
  accessTier: string;
  maxUses: number;
  expiresAt: string | null;
};

export type NormalizedInviteCodeRecord = InviteCodeRecord & {
  redeemed_users: null;
};

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);
  return getAdminEmails().includes(normalizedEmail);
}

export async function listInviteCodes() {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { data, error } = await admin
    .from("invite_codes")
    .select(
      "id, code, organization, tier, max_uses, used_count, expires_at, disabled_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase invite code read failed", {
      code: error.code,
      message: error.message
    });
    return { ok: false as const, reason: "read_failed" };
  }

  return {
    ok: true as const,
    inviteCodes: (data ?? []) as InviteCodeRecord[]
  };
}

export async function createInviteCode(input: CreateInviteCodeInput) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const code = await generateUniqueInviteCode();

    if (!code) {
      return { ok: false as const, reason: "generation_failed" };
    }

    const { data, error } = await admin
      .from("invite_codes")
      .insert({
        code,
        organization: input.label,
        tier: input.accessTier,
        max_uses: input.maxUses,
        expires_at: input.expiresAt,
        disabled_at: null
      })
      .select(
        "id, code, organization, tier, max_uses, used_count, expires_at, disabled_at, created_at"
      )
      .single<InviteCodeRecord>();

    if (!error && data) {
      return { ok: true as const, inviteCode: data };
    }

    if (error?.code === "23505") {
      continue;
    }

    console.error("Supabase invite code create failed", {
      code: error?.code,
      message: error?.message
    });
    return { ok: false as const, reason: "write_failed" };
  }

  return { ok: false as const, reason: "generation_failed" };
}

export async function disableInviteCode(inviteCodeId: string) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { data, error } = await admin
    .from("invite_codes")
    .update({ disabled_at: new Date().toISOString() })
    .eq("id", inviteCodeId)
    .select("code")
    .single<{ code: string }>();

  if (error || !data) {
    console.error("Supabase invite code disable failed", {
      code: error?.code,
      message: error?.message
    });
    return { ok: false as const, reason: "write_failed" };
  }

  return { ok: true as const, code: data.code };
}

export function getInviteCodeStatus(
  inviteCode: InviteCodeRecord,
  now = new Date()
): InviteCodeStatus {
  if (inviteCode.disabled_at) {
    return {
      isActive: false,
      label: "Disabled",
      reason: "Disabled"
    };
  }

  if (inviteCode.expires_at && new Date(inviteCode.expires_at) <= now) {
    return {
      isActive: false,
      label: "Expired",
      reason: "Expired"
    };
  }

  if (
    inviteCode.max_uses !== null &&
    inviteCode.used_count >= inviteCode.max_uses
  ) {
    return {
      isActive: false,
      label: "Maxed out",
      reason: "Max uses reached"
    };
  }

  return {
    isActive: true,
    label: "Active",
    reason: "Redeemable"
  };
}

export function generateInviteCode() {
  return `${CODE_PREFIX}-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
}

export function normalizeInviteCodeRecord(
  inviteCode: Partial<InviteCodeRecord>
): NormalizedInviteCodeRecord {
  return {
    id: inviteCode.id ?? "",
    code: inviteCode.code ?? "",
    organization: inviteCode.organization ?? null,
    tier: inviteCode.tier ?? null,
    max_uses: inviteCode.max_uses ?? null,
    used_count: inviteCode.used_count ?? 0,
    expires_at: inviteCode.expires_at ?? null,
    disabled_at: inviteCode.disabled_at ?? null,
    created_at: inviteCode.created_at ?? "",
    updated_at: inviteCode.updated_at ?? null,
    redeemed_users: null
  };
}

export async function generateUniqueInviteCode() {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return null;
  }

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();
    const { data, error } = await admin
      .from("invite_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("Supabase invite code uniqueness check failed", {
        code: error.code,
        message: error.message
      });
      return null;
    }

    if (!data) {
      return code;
    }
  }

  return null;
}

function randomBlock() {
  let block = "";

  for (let index = 0; index < 4; index += 1) {
    block += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  return block;
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
