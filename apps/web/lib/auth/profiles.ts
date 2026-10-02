import { createHash, randomUUID } from "node:crypto";
import type { Sql, TransactionSql } from "postgres";
import type { ExternalIdentity } from "@deeptechly/kernel";
import { getPostgres } from "@/lib/database/postgres";

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
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type EditableUserProfile = Pick<UserProfile, "full_name" | "organization">;

export type InviteResolution = {
  accessTier: string;
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
  inviteStatus: "not_provided" | "verified" | "invalid" | "unavailable";
  inviteCodeId?: string;
};

type ProfileInput = {
  authUserId: string;
  fullName: string;
  email: string;
  organization?: string;
  accessPath: AccessPath;
  inviteResolution: InviteResolution;
};

type ProfileRow = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string;
  organization: string | null;
  access_tier: string;
  is_institutional_verified: boolean;
  institutional_request_pending: boolean;
  is_admin: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

const profileProjection = `
  select
    accounts.id,
    identities.provider_user_id as auth_user_id,
    accounts.display_name as full_name,
    accounts.primary_email as email,
    accounts.organization,
    case when bool_or(grants.capability = 'institutional' and grants.status = 'active')
      then 'institutional' else 'free' end as access_tier,
    bool_or(grants.capability = 'institutional' and grants.status = 'active') as is_institutional_verified,
    bool_or(grants.capability = 'institutional' and grants.status = 'pending') as institutional_request_pending,
    bool_or(grants.capability = 'admin' and grants.status = 'active') as is_admin,
    accounts.created_at,
    accounts.updated_at
  from deeptechly.accounts accounts
  join deeptechly.external_identities identities on identities.account_id = accounts.id
  left join deeptechly.access_grants grants on grants.account_id = accounts.id
`;

export async function ensureAccountForIdentity(identity: ExternalIdentity) {
  if (!identity.email) return null;
  const sql = getPostgres();
  if (!sql) return null;

  const existing = await getUserProfile(identity.providerUserId);
  if (existing) return existing;
  if (!identity.emailVerified) return null;

  return sql.begin(async (transaction) => {
    const accounts = await transaction<{ id: string }[]>`
      select id from deeptechly.accounts
      where lower(primary_email) = lower(${identity.email})
      for update
    `;
    if (accounts.length !== 1) return null;
    await transaction`
      insert into deeptechly.external_identities (
        id, account_id, provider, provider_user_id, provider_email,
        email_verified, provider_payload, created_at, updated_at
      ) values (
        ${`identity:appwrite:${identity.providerUserId}`}, ${accounts[0].id},
        'appwrite', ${identity.providerUserId}, ${identity.email}, true,
        ${transaction.json({ linkedBy: "verified-email-cutover" })}, now(), now()
      ) on conflict (provider, provider_user_id) do nothing
    `;
    return getUserProfileWithSql(transaction, identity.providerUserId);
  });
}

export async function getUserProfile(authUserId: string) {
  const sql = getPostgres();
  if (!sql) return null;
  return getUserProfileWithSql(sql, authUserId);
}

export async function updateEditableUserProfile(
  authUserId: string,
  input: EditableUserProfile
) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const rows = await sql<{ id: string }[]>`
    update deeptechly.accounts accounts set
      display_name = ${input.full_name},
      organization = ${input.organization},
      updated_at = now()
    from deeptechly.external_identities identities
    where identities.account_id = accounts.id
      and identities.provider = 'appwrite'
      and identities.provider_user_id = ${authUserId}
    returning accounts.id
  `;
  if (rows.length !== 1) return { ok: false as const, reason: "missing_profile" };
  const profile = await getUserProfile(authUserId);
  return profile
    ? { ok: true as const, profile }
    : { ok: false as const, reason: "missing_profile" };
}

export async function syncUserProfileEmail(authUserId: string, email: string) {
  const sql = getPostgres();
  if (!sql) return;
  await sql.begin(async (transaction) => {
    await transaction`
      update deeptechly.accounts accounts set primary_email = ${email}, updated_at = now()
      from deeptechly.external_identities identities
      where identities.account_id = accounts.id
        and identities.provider = 'appwrite'
        and identities.provider_user_id = ${authUserId}
    `;
    await transaction`
      update deeptechly.external_identities
      set provider_email = ${email}, updated_at = now()
      where provider = 'appwrite' and provider_user_id = ${authUserId}
    `;
  });
}

export async function resolveInstitutionalInvite(inviteCode: string): Promise<InviteResolution> {
  const trimmedCode = inviteCode.trim();
  if (!trimmedCode) return pendingInvite("not_provided");
  const sql = getPostgres();
  if (!sql) return pendingInvite("unavailable");

  const rows = await sql<{
    id: string;
    capability: string;
  }[]>`
    select id, capability from deeptechly.invite_codes
    where code_hash = ${hashInviteCode(trimmedCode)}
      and disabled_at is null
      and (expires_at is null or expires_at > now())
      and (max_uses is null or used_count < max_uses)
    limit 1
  `;
  if (!rows[0]) return pendingInvite("invalid");
  return {
    accessTier: rows[0].capability || "institutional",
    isInstitutionalVerified: true,
    institutionalRequestPending: false,
    inviteStatus: "verified",
    inviteCodeId: rows[0].id
  };
}

export async function persistUserProfile(input: ProfileInput) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };

  try {
    await sql.begin(async (transaction) => {
      const accountId = input.authUserId;
      await transaction`
        insert into deeptechly.accounts (
          id, primary_email, display_name, organization, status, created_at, updated_at
        ) values (
          ${accountId}, ${input.email}, ${input.fullName}, ${input.organization || null},
          'active', now(), now()
        ) on conflict (id) do update set
          primary_email = excluded.primary_email,
          display_name = excluded.display_name,
          organization = excluded.organization,
          updated_at = now()
      `;
      await transaction`
        insert into deeptechly.external_identities (
          id, account_id, provider, provider_user_id, provider_email,
          email_verified, provider_payload, created_at, updated_at
        ) values (
          ${`identity:appwrite:${input.authUserId}`}, ${accountId}, 'appwrite',
          ${input.authUserId}, ${input.email}, false, '{}'::jsonb, now(), now()
        ) on conflict (provider, provider_user_id) do update set
          provider_email = excluded.provider_email,
          updated_at = now()
      `;

      if (input.accessPath === "institutional") {
        const status = input.inviteResolution.isInstitutionalVerified ? "active" : "pending";
        const source = input.inviteResolution.inviteCodeId ? "invite_code" : "self_requested";
        await transaction`
          insert into deeptechly.access_grants (
            id, account_id, capability, source, status, metadata, created_at, updated_at
          ) values (
            ${`grant:institutional:${accountId}`}, ${accountId}, 'institutional', ${source},
            ${status}, ${transaction.json({ inviteStatus: input.inviteResolution.inviteStatus })},
            now(), now()
          ) on conflict (account_id, capability, source) do update set
            status = excluded.status, metadata = excluded.metadata, updated_at = now()
        `;
      }

      if (input.inviteResolution.inviteCodeId) {
        const updated = await transaction<{ id: string }[]>`
          update deeptechly.invite_codes set used_count = used_count + 1
          where id = ${input.inviteResolution.inviteCodeId}
            and disabled_at is null
            and (expires_at is null or expires_at > now())
            and (max_uses is null or used_count < max_uses)
          returning id
        `;
        if (updated.length !== 1) throw new Error("Invite is no longer redeemable");
        await transaction`
          insert into deeptechly.invite_redemptions (id, invite_code_id, account_id, redeemed_at)
          values (${randomUUID()}, ${input.inviteResolution.inviteCodeId}, ${accountId}, now())
          on conflict (invite_code_id, account_id) do nothing
        `;
      }
    });
    return { ok: true as const };
  } catch (error) {
    console.error("PostgreSQL profile persistence failed", safeDatabaseError(error));
    return { ok: false as const, reason: "write_failed" };
  }
}

async function getUserProfileWithSql(
  sql: Sql | TransactionSql,
  authUserId: string
) {
  const rows = await sql<ProfileRow[]>`${sql.unsafe(profileProjection)}
    where identities.provider = 'appwrite'
      and identities.provider_user_id = ${authUserId}
    group by accounts.id, identities.provider_user_id
    limit 1
  `;
  return rows[0] ? normalizeProfile(rows[0]) : null;
}

function normalizeProfile(row: ProfileRow): UserProfile {
  return {
    ...row,
    email: row.email || "",
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    is_institutional_verified: Boolean(row.is_institutional_verified),
    institutional_request_pending: Boolean(row.institutional_request_pending),
    is_admin: Boolean(row.is_admin)
  };
}

function pendingInvite(inviteStatus: InviteResolution["inviteStatus"]): InviteResolution {
  return {
    accessTier: "free",
    isInstitutionalVerified: false,
    institutionalRequestPending: true,
    inviteStatus
  };
}

export function hashInviteCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function safeDatabaseError(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { message: "Unknown database error" };
}
