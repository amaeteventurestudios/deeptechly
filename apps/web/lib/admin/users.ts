import { getPostgres } from "@/lib/database/postgres";
import { highestApplicationRole, type ApplicationRole } from "@/lib/auth/authorization";

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
  updatedAt: string | null;
  inviteCodeUsed: string | null;
  role: ApplicationRole;
  status: "active" | "suspended" | "closed";
  lastLoginAt: string | null;
};

type UserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  organization: string | null;
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
  createdAt: Date | string;
  updatedAt: Date | string | null;
  inviteCodeUsed: string | null;
  authUserId: string | null;
  roles: string[] | null;
  status: "active" | "suspended" | "closed";
  lastLoginAt: Date | string | null;
};

export async function listAllUsers(): Promise<
  { ok: true; users: AdminUserRow[] } | { ok: false; reason: string }
> {
  const sql = getPostgres();
  if (!sql) return { ok: false, reason: "configuration" };
  const rows = await sql<UserRow[]>`
    select accounts.id, accounts.display_name as "fullName",
      identities.provider_user_id as "authUserId", accounts.primary_email as email, accounts.organization,
      bool_or(grants.capability = 'institutional' and grants.status = 'active') as "isInstitutionalVerified",
      bool_or(grants.capability = 'institutional' and grants.status = 'pending') as "institutionalRequestPending",
      accounts.created_at as "createdAt", accounts.updated_at as "updatedAt",
      max(invites.code_hint) as "inviteCodeUsed",
      array_remove(array_agg(distinct roles.role), null) as roles,
      accounts.status, accounts.last_login_at as "lastLoginAt"
    from deeptechly.accounts accounts
    left join deeptechly.access_grants grants on grants.account_id = accounts.id
    left join deeptechly.invite_redemptions redemptions on redemptions.account_id = accounts.id
    left join deeptechly.invite_codes invites on invites.id = redemptions.invite_code_id
    left join deeptechly.external_identities identities on identities.account_id = accounts.id and identities.provider = 'pocketbase'
    left join deeptechly.account_roles roles on roles.account_id = accounts.id
    group by accounts.id, identities.provider_user_id
    order by accounts.created_at desc
  `;
  return {
    ok: true,
    users: rows.map((row) => ({
      id: row.id, authUserId: row.authUserId || "", fullName: row.fullName, email: row.email || "",
      organization: row.organization,
      accessTier: row.isInstitutionalVerified ? "institutional" : "free",
      isInstitutionalVerified: Boolean(row.isInstitutionalVerified),
      institutionalRequestPending: Boolean(row.institutionalRequestPending),
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
      inviteCodeUsed: row.inviteCodeUsed,
      role: highestApplicationRole(row.roles || []),
      status: row.status,
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null
    }))
  };
}

export async function setUserRole(accountId: string, role: ApplicationRole, actorAccountId: string) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const accounts = await sql<{ id: string }[]>`select id from deeptechly.accounts where id = ${accountId}`;
  if (!accounts[0]) return { ok: false as const, reason: "not_found" };
  await sql.begin(async (transaction) => {
    await transaction`delete from deeptechly.account_roles where account_id = ${accountId} and role in ('SUPER_ADMIN', 'ADMIN', 'USER', 'VIEWER')`;
    await transaction`
      insert into deeptechly.account_roles (id, account_id, role, assigned_by, metadata, created_at, updated_at)
      values (${`role:${accountId}:${role}`}, ${accountId}, ${role}, ${actorAccountId}, '{}'::jsonb, now(), now())
    `;
  });
  return { ok: true as const };
}

export async function setAccountStatus(accountId: string, status: "active" | "suspended") {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const rows = await sql<{ id: string }[]>`update deeptechly.accounts set status = ${status}, updated_at = now() where id = ${accountId} returning id`;
  return rows[0] ? { ok: true as const } : { ok: false as const, reason: "not_found" };
}

export async function verifyInstitutionalAccess(accountId: string) {
  return setInstitutionalAccess(accountId, "active");
}

export async function revokeInstitutionalAccess(accountId: string) {
  return setInstitutionalAccess(accountId, "revoked");
}

async function setInstitutionalAccess(accountId: string, status: "active" | "revoked") {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const accounts = await sql<{ id: string }[]>`
    select id from deeptechly.accounts where id = ${accountId}
  `;
  if (!accounts[0]) return { ok: false as const, reason: "not_found" };
  await sql.begin(async (transaction) => {
    await transaction`
      update deeptechly.access_grants set status = 'revoked', updated_at = now()
      where account_id = ${accountId} and capability = 'institutional'
    `;
    if (status === "active") {
      await transaction`
        insert into deeptechly.access_grants (
          id, account_id, capability, source, status, metadata, created_at, updated_at
        ) values (
          ${`grant:admin:${accountId}`}, ${accountId}, 'institutional',
          'admin_review', 'active', '{}'::jsonb, now(), now()
        ) on conflict (account_id, capability, source) do update set
          status = 'active', updated_at = now()
      `;
    }
  });
  return { ok: true as const };
}

export function getAdminUserInstitutionalStatus(
  user: Pick<AdminUserRow, "isInstitutionalVerified" | "institutionalRequestPending">
) {
  if (user.isInstitutionalVerified) return "Verified";
  if (user.institutionalRequestPending) return "Pending review";
  return "Not verified";
}

export function displayAdminStoredValue(value?: string | null) {
  return value?.trim() ? value : "Not stored";
}
