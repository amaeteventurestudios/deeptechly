import { createHash } from "node:crypto";
import postgres from "postgres";

type AppwriteUser = { $id: string; email: string; name: string };

async function main() {
  const endpoint = required("APPWRITE_ENDPOINT").replace(/\/$/, "");
  const projectId = required("APPWRITE_PROJECT_ID");
  const apiKey = required("APPWRITE_API_KEY");
  const databaseUrl = required("DEEPTECHLY_V2_DATABASE_URL");
  const email = required("DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL").trim().toLowerCase();
  const password = required("DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD");
  if (password.length < 12) throw new Error("Bootstrap admin password must contain at least 12 characters");

  const userId = `admin_${createHash("sha256").update(email).digest("hex").slice(0, 29)}`;
  let user: AppwriteUser;
  try {
    user = await appwrite<AppwriteUser>(endpoint, projectId, apiKey, "/users", {
      method: "POST",
      body: JSON.stringify({ userId, email, password, name: "DeepTechly Admin" })
    });
  } catch (error) {
    if (!(error instanceof AppwriteError) || error.status !== 409) throw error;
    user = await appwrite<AppwriteUser>(endpoint, projectId, apiKey, `/users/${encodeURIComponent(userId)}`);
    if (user.email.toLowerCase() !== email) throw new Error("Deterministic admin ID belongs to another email");
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await sql.begin(async (transaction) => {
      await transaction`
        insert into deeptechly.accounts (
          id, primary_email, display_name, status, created_at, updated_at
        ) values (${user.$id}, ${email}, ${user.name}, 'active', now(), now())
        on conflict (id) do update set
          primary_email = excluded.primary_email, display_name = excluded.display_name,
          status = 'active', updated_at = now()
      `;
      await transaction`
        insert into deeptechly.external_identities (
          id, account_id, provider, provider_user_id, provider_email,
          email_verified, provider_payload, created_at, updated_at
        ) values (
          ${`identity:appwrite:${user.$id}`}, ${user.$id}, 'appwrite', ${user.$id},
          ${email}, false, ${transaction.json({ bootstrap: true })}, now(), now()
        ) on conflict (provider, provider_user_id) do update set
          provider_email = excluded.provider_email, updated_at = now()
      `;
      await transaction`
        insert into deeptechly.access_grants (
          id, account_id, capability, source, status, metadata, created_at, updated_at
        ) values (
          ${`grant:admin:${user.$id}`}, ${user.$id}, 'admin', 'bootstrap', 'active',
          '{}'::jsonb, now(), now()
        ) on conflict (account_id, capability, source) do update set
          status = 'active', updated_at = now()
      `;
    });
  } finally {
    await sql.end();
  }
  console.log(`Admin account ready: ${email} (${user.$id})`);
}

class AppwriteError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function appwrite<T>(endpoint: string, projectId: string, apiKey: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      accept: "application/json", "content-type": "application/json",
      "X-Appwrite-Project": projectId, "X-Appwrite-Key": apiKey,
      "X-Appwrite-Response-Format": "1.8.0", ...init.headers
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string };
    throw new AppwriteError(response.status, payload.message || `Appwrite request failed: ${response.status}`);
  }
  return await response.json() as T;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Admin bootstrap failed");
  process.exitCode = 1;
});
