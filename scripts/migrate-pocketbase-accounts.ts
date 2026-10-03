import { randomBytes } from "node:crypto";
import postgres from "postgres";

type LegacyAccount = { accountId: string; email: string; displayName: string | null };
type PocketBaseUser = { id: string; email: string };
type RecordList<T> = { items: T[] };

async function main() {
  const databaseUrl = required("DEEPTECHLY_V2_DATABASE_URL");
  const url = required("POCKETBASE_URL").replace(/\/$/, "");
  const collection = process.env.POCKETBASE_AUTH_COLLECTION?.trim() || "users";
  const apply = process.env.DEEPTECHLY_ALLOW_POCKETBASE_ACCOUNT_MIGRATION === "true";
  const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: process.env.DEEPTECHLY_V2_DATABASE_SSL === "disable" ? false : "require" });
  try {
    const accounts = await sql<LegacyAccount[]>`
      select accounts.id as "accountId", accounts.primary_email as email, accounts.display_name as "displayName"
      from deeptechly.accounts accounts
      join deeptechly.external_identities legacy on legacy.account_id = accounts.id and legacy.provider = 'supabase'
      left join deeptechly.external_identities pocketbase on pocketbase.account_id = accounts.id and pocketbase.provider = 'pocketbase'
      where accounts.primary_email is not null and pocketbase.id is null order by accounts.created_at
    `;
    console.log(`${apply ? "Applying" : "Planning"} ${accounts.length} PocketBase identity mappings.`);
    if (!apply) { console.log("Dry run only. Set DEEPTECHLY_ALLOW_POCKETBASE_ACCOUNT_MIGRATION=true after operator approval."); return; }
    const token = await superuserToken(url);
    for (const account of accounts) {
      const filter = encodeURIComponent(`email = "${account.email.replaceAll('"', '\\"')}"`);
      const existing = await pb<RecordList<PocketBaseUser>>(url, `/api/collections/${collection}/records?perPage=1&filter=${filter}`, token);
      let user = existing.items[0];
      if (!user) {
        const temporaryPassword = randomBytes(32).toString("base64url");
        user = await pb<PocketBaseUser>(url, `/api/collections/${collection}/records`, token, { method: "POST", body: JSON.stringify({ email: account.email, name: account.displayName || account.email.split("@")[0], password: temporaryPassword, passwordConfirm: temporaryPassword, verified: false }) });
      }
      if (user.email.toLowerCase() !== account.email.toLowerCase()) throw new Error(`PocketBase identity ${user.id} email mismatch for account ${account.accountId}`);
      await sql`insert into deeptechly.external_identities (id, account_id, provider, provider_user_id, provider_email, email_verified, provider_payload, created_at, updated_at) values (${`identity:pocketbase:${user.id}`}, ${account.accountId}, 'pocketbase', ${user.id}, ${user.email}, false, ${sql.json({ migration: "password-recovery-required" })}, now(), now()) on conflict (provider, provider_user_id) do update set account_id = excluded.account_id, provider_email = excluded.provider_email, provider_payload = excluded.provider_payload, updated_at = now()`;
    }
    console.log(`Mapped ${accounts.length} legacy accounts. Users must complete PocketBase password recovery.`);
  } finally { await sql.end(); }
}

async function superuserToken(url: string) { if (process.env.POCKETBASE_SUPERUSER_TOKEN?.trim()) return process.env.POCKETBASE_SUPERUSER_TOKEN.trim(); const auth = await pb<{ token: string }>(url, "/api/collections/_superusers/auth-with-password", undefined, { method: "POST", body: JSON.stringify({ identity: required("POCKETBASE_SUPERUSER_EMAIL"), password: required("POCKETBASE_SUPERUSER_PASSWORD") }) }); return auth.token; }
async function pb<T>(url: string, path: string, token?: string, init: RequestInit = {}) { const response = await fetch(`${url}${path}`, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...(token ? { Authorization: token } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string }; throw new Error(body.message || `PocketBase request failed: ${response.status}`); } return response.status === 204 ? undefined as T : await response.json() as T; }
function required(name: string) { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name} is required`); return value; }
main().catch((error) => { console.error(error instanceof Error ? error.message : "PocketBase account migration failed"); process.exitCode = 1; });
