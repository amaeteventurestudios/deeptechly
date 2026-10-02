import "server-only";

import { randomInt, randomUUID } from "node:crypto";
import { getPostgres } from "@/lib/database/postgres";
import { hashInviteCode } from "@/lib/auth/profiles";

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

export type NormalizedInviteCodeRecord = InviteCodeRecord & { redeemed_users: null };

type InviteRow = {
  id: string;
  code: string | null;
  organization: string | null;
  tier: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: Date | string | null;
  disabled_at: Date | string | null;
  created_at: Date | string;
};

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}

export async function listInviteCodes() {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const rows = await sql<InviteRow[]>`
    select id, code_hint as code, organization, capability as tier, max_uses,
      used_count, expires_at, disabled_at, created_at
    from deeptechly.invite_codes order by created_at desc
  `;
  return { ok: true as const, inviteCodes: rows.map(normalizeInviteRow) };
}

export async function createInviteCode(input: CreateInviteCodeInput) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();
    try {
      const rows = await sql<InviteRow[]>`
        insert into deeptechly.invite_codes (
          id, code_hash, code_hint, organization, capability, max_uses, used_count,
          expires_at, disabled_at, created_at
        ) values (
          ${randomUUID()}, ${hashInviteCode(code)}, ${maskInviteCode(code)},
          ${input.label || null}, ${input.accessTier}, ${input.maxUses}, 0,
          ${input.expiresAt}, null, now()
        ) returning id, ${code}::text as code, organization, capability as tier,
          max_uses, used_count, expires_at, disabled_at, created_at
      `;
      return { ok: true as const, inviteCode: normalizeInviteRow(rows[0]) };
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      console.error("PostgreSQL invite creation failed", safeDatabaseError(error));
      return { ok: false as const, reason: "write_failed" };
    }
  }
  return { ok: false as const, reason: "generation_failed" };
}

export async function disableInviteCode(inviteCodeId: string) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const rows = await sql<{ code: string | null }[]>`
    update deeptechly.invite_codes set disabled_at = now()
    where id = ${inviteCodeId}
    returning code_hint as code
  `;
  return rows[0]
    ? { ok: true as const, code: rows[0].code ?? "Invite" }
    : { ok: false as const, reason: "not_found" };
}

export function getInviteCodeStatus(inviteCode: InviteCodeRecord, now = new Date()): InviteCodeStatus {
  if (inviteCode.disabled_at) return { isActive: false, label: "Disabled", reason: "Disabled" };
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) <= now) {
    return { isActive: false, label: "Expired", reason: "Expired" };
  }
  if (inviteCode.max_uses !== null && inviteCode.used_count >= inviteCode.max_uses) {
    return { isActive: false, label: "Maxed out", reason: "Max uses reached" };
  }
  return { isActive: true, label: "Active", reason: "Redeemable" };
}

export function generateInviteCode() {
  return `${CODE_PREFIX}-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
}

export function normalizeInviteCodeRecord(inviteCode: Partial<InviteCodeRecord>): NormalizedInviteCodeRecord {
  return {
    id: inviteCode.id ?? "", code: inviteCode.code ?? "",
    organization: inviteCode.organization ?? null, tier: inviteCode.tier ?? null,
    max_uses: inviteCode.max_uses ?? null, used_count: inviteCode.used_count ?? 0,
    expires_at: inviteCode.expires_at ?? null, disabled_at: inviteCode.disabled_at ?? null,
    created_at: inviteCode.created_at ?? "", updated_at: inviteCode.updated_at ?? null,
    redeemed_users: null
  };
}

export async function generateUniqueInviteCode() {
  const sql = getPostgres();
  if (!sql) return null;
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();
    const rows = await sql<{ exists: boolean }[]>`
      select exists(select 1 from deeptechly.invite_codes where code_hash = ${hashInviteCode(code)}) as exists
    `;
    if (!rows[0]?.exists) return code;
  }
  return null;
}

function normalizeInviteRow(row: InviteRow): InviteCodeRecord {
  return {
    ...row, code: row.code ?? "Invite code",
    created_at: new Date(row.created_at).toISOString(),
    expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    disabled_at: row.disabled_at ? new Date(row.disabled_at).toISOString() : null
  };
}

function maskInviteCode(code: string) {
  return `${code.slice(0, 9)}-••••-••••`;
}

function randomBlock() {
  let block = "";
  for (let index = 0; index < 4; index += 1) {
    block += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return block;
}

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}

function safeDatabaseError(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { message: "Unknown database error" };
}
