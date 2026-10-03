import postgres from "postgres";

type PocketBaseUser = { id: string; email: string; name?: string; verified?: boolean };
type RecordList<T> = { items: T[] };

async function main() {
  const url = required("POCKETBASE_URL").replace(/\/$/, "");
  const collection = process.env.POCKETBASE_AUTH_COLLECTION?.trim() || "users";
  const adminToken = await superuserToken(url);
  const databaseUrl = required("DEEPTECHLY_V2_DATABASE_URL");
  const email = required("DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = required("DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD");
  if (password.length < 12) throw new Error("Bootstrap admin password must contain at least 12 characters");

  let user: PocketBaseUser;
  try {
    user = await pb<PocketBaseUser>(url, `/api/collections/${collection}/records`, adminToken, {
      method: "POST", body: JSON.stringify({ email, password, passwordConfirm: password, name: "DeepTechly Super Admin", verified: true })
    });
  } catch (error) {
    if (!(error instanceof PocketBaseError) || error.status !== 400) throw error;
    const filter = encodeURIComponent(`email = "${email.replaceAll('"', '\\"')}"`);
    const existing = await pb<RecordList<PocketBaseUser>>(url, `/api/collections/${collection}/records?perPage=1&filter=${filter}`, adminToken);
    if (!existing.items[0]) throw error;
    user = existing.items[0];
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: process.env.DEEPTECHLY_V2_DATABASE_SSL === "disable" ? false : "require" });
  try {
    await sql.begin(async (transaction) => {
      await transaction`insert into deeptechly.accounts (id, primary_email, display_name, status, created_at, updated_at) values (${user.id}, ${email}, ${user.name || "DeepTechly Super Admin"}, 'active', now(), now()) on conflict (id) do update set primary_email = excluded.primary_email, display_name = excluded.display_name, status = 'active', updated_at = now()`;
      await transaction`insert into deeptechly.external_identities (id, account_id, provider, provider_user_id, provider_email, email_verified, provider_payload, created_at, updated_at) values (${`identity:pocketbase:${user.id}`}, ${user.id}, 'pocketbase', ${user.id}, ${email}, ${Boolean(user.verified)}, ${transaction.json({ bootstrap: true })}, now(), now()) on conflict (provider, provider_user_id) do update set account_id = excluded.account_id, provider_email = excluded.provider_email, updated_at = now()`;
      await transaction`delete from deeptechly.account_roles where account_id = ${user.id}`;
      await transaction`insert into deeptechly.account_roles (id, account_id, role, assigned_by, metadata, created_at, updated_at) values (${`role:${user.id}:SUPER_ADMIN`}, ${user.id}, 'SUPER_ADMIN', ${user.id}, '{}'::jsonb, now(), now())`;
    });
  } finally { await sql.end(); }
  console.log(`PocketBase-backed Super Admin ready: ${email} (${user.id})`);
}

async function superuserToken(url: string) {
  if (process.env.POCKETBASE_SUPERUSER_TOKEN?.trim()) return process.env.POCKETBASE_SUPERUSER_TOKEN.trim();
  const auth = await pb<{ token: string }>(url, "/api/collections/_superusers/auth-with-password", undefined, { method: "POST", body: JSON.stringify({ identity: required("POCKETBASE_SUPERUSER_EMAIL"), password: required("POCKETBASE_SUPERUSER_PASSWORD") }) });
  return auth.token;
}
class PocketBaseError extends Error { constructor(readonly status: number, message: string) { super(message); } }
async function pb<T>(url: string, path: string, token?: string, init: RequestInit = {}) { const response = await fetch(`${url}${path}`, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...(token ? { Authorization: token } : {}), ...init.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string }; throw new PocketBaseError(response.status, body.message || `PocketBase request failed: ${response.status}`); } return response.status === 204 ? undefined as T : await response.json() as T; }
function required(name: string) { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name} is required`); return value; }
main().catch((error) => { console.error(error instanceof Error ? error.message : "Admin bootstrap failed"); process.exitCode = 1; });
