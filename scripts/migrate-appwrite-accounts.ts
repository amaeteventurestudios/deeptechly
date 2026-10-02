import postgres from "postgres";

type LegacyAccount = {
  accountId: string;
  email: string;
  displayName: string | null;
};

type AppwriteUser = { $id: string; email: string };

async function main() {
  const databaseUrl = required("DEEPTECHLY_V2_DATABASE_URL");
  const endpoint = required("APPWRITE_ENDPOINT").replace(/\/$/, "");
  const projectId = required("APPWRITE_PROJECT_ID");
  const apiKey = required("APPWRITE_API_KEY");
  const apply = process.env.DEEPTECHLY_ALLOW_APPWRITE_ACCOUNT_MIGRATION === "true";
  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    const accounts = await sql<LegacyAccount[]>`
      select accounts.id as "accountId", accounts.primary_email as email,
        accounts.display_name as "displayName"
      from deeptechly.accounts accounts
      join deeptechly.external_identities legacy
        on legacy.account_id = accounts.id and legacy.provider = 'supabase'
      left join deeptechly.external_identities appwrite
        on appwrite.account_id = accounts.id and appwrite.provider = 'appwrite'
      where accounts.primary_email is not null and appwrite.id is null
      order by accounts.created_at
    `;

    console.log(`${apply ? "Applying" : "Planning"} ${accounts.length} Appwrite account mappings.`);
    if (!apply) {
      console.log("Dry run only. Set DEEPTECHLY_ALLOW_APPWRITE_ACCOUNT_MIGRATION=true after operator approval.");
      return;
    }

    for (const account of accounts) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(account.accountId)) {
        throw new Error(`Account ${account.accountId} cannot be preserved as an Appwrite user ID`);
      }
      let user: AppwriteUser;
      try {
        user = await appwrite<AppwriteUser>(endpoint, projectId, apiKey, "/users", {
          method: "POST",
          body: JSON.stringify({
            userId: account.accountId,
            email: account.email,
            name: account.displayName || account.email.split("@")[0]
          })
        });
      } catch (error) {
        if (!(error instanceof AppwriteError) || error.status !== 409) throw error;
        user = await appwrite<AppwriteUser>(
          endpoint,
          projectId,
          apiKey,
          `/users/${encodeURIComponent(account.accountId)}`
        );
      }
      if (user.email.toLowerCase() !== account.email.toLowerCase()) {
        throw new Error(`Appwrite user ${user.$id} email does not match account ${account.accountId}`);
      }
      await sql`
        insert into deeptechly.external_identities (
          id, account_id, provider, provider_user_id, provider_email,
          email_verified, provider_payload, created_at, updated_at
        ) values (
          ${`identity:appwrite:${user.$id}`}, ${account.accountId}, 'appwrite',
          ${user.$id}, ${user.email}, false,
          ${sql.json({ migration: "password-recovery-required" })}, now(), now()
        ) on conflict (provider, provider_user_id) do update set
          account_id = excluded.account_id, provider_email = excluded.provider_email,
          provider_payload = excluded.provider_payload, updated_at = now()
      `;
    }
    console.log(`Mapped ${accounts.length} legacy accounts. Send recovery links through the approved operator workflow.`);
  } finally {
    await sql.end();
  }
}

class AppwriteError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function appwrite<T>(
  endpoint: string,
  projectId: string,
  apiKey: string,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Response-Format": "1.8.0",
      ...init.headers
    }
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new AppwriteError(response.status, payload.message || `Appwrite request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Appwrite account migration failed");
  process.exitCode = 1;
});
