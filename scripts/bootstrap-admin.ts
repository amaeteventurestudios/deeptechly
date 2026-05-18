import { randomUUID } from "crypto";
import {
  createClient,
  type SupabaseClient,
  type User
} from "@supabase/supabase-js";

type BootstrapDatabase = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          auth_user_id: string;
        };
        Insert: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          organization: string | null;
          access_tier: string;
          is_institutional_verified: boolean;
          institutional_request_pending: boolean;
          created_at: string;
          updated_at: string;
        };
        Update: {
          email?: string;
          access_tier?: string;
          is_institutional_verified?: boolean;
          institutional_request_pending?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type AdminSupabaseClient = SupabaseClient<BootstrapDatabase>;

type RequiredEnv = {
  adminEmail: string;
  tempPassword: string;
  supabaseUrl: string;
  serviceRoleKey: string;
};

async function main() {
  const env = readRequiredEnv();
  const normalizedEmail = env.adminEmail.trim().toLowerCase();

  warnIfEmailIsNotAdmin(normalizedEmail);

  const supabase = createClient<BootstrapDatabase>(
    env.supabaseUrl,
    env.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const existingUser = await findAuthUserByEmail(supabase, normalizedEmail);
  const user =
    existingUser ??
    (await createAuthUser(supabase, normalizedEmail, env.tempPassword));

  await ensureAdminProfile(supabase, user, normalizedEmail);

  console.log(
    "Admin bootstrap user is ready. Change the temporary password immediately after first login."
  );
}

function readRequiredEnv(): RequiredEnv {
  const adminEmail = process.env.DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL?.trim();
  const tempPassword =
    process.env.DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const missing = [
    ["DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL", adminEmail],
    ["DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD", tempPassword],
    ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required bootstrap environment variables: ${missing.join(", ")}`
    );
  }

  return {
    adminEmail: requireEnvValue(adminEmail, "DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL"),
    tempPassword: requireEnvValue(
      tempPassword,
      "DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD"
    ),
    supabaseUrl: requireEnvValue(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: requireEnvValue(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY")
  };
}

function requireEnvValue(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`Missing required bootstrap environment variable: ${key}`);
  }

  return value;
}

function warnIfEmailIsNotAdmin(email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(email)) {
    console.warn(
      "Warning: ADMIN_EMAILS does not include the bootstrap email. Add it before using the admin console."
    );
  }
}

async function findAuthUserByEmail(
  supabase: AdminSupabaseClient,
  email: string
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email
    );

    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      return null;
    }
  }

  throw new Error("Could not confirm whether the bootstrap admin user exists.");
}

async function createAuthUser(
  supabase: AdminSupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "DeepTechly Admin"
    }
  });

  if (error || !data.user) {
    throw new Error(`Could not create Supabase Auth user: ${error?.message}`);
  }

  return data.user;
}

async function ensureAdminProfile(
  supabase: AdminSupabaseClient,
  user: User,
  email: string
) {
  const now = new Date().toISOString();
  const { data: existingProfile, error: readError } = await supabase
    .from("users_profile")
    .select("id, auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string; auth_user_id: string }>();

  if (readError) {
    throw new Error(`Could not read users_profile row: ${readError.message}`);
  }

  if (existingProfile) {
    const { error } = await supabase
      .from("users_profile")
      .update({
        email,
        access_tier: "institutional",
        is_institutional_verified: true,
        institutional_request_pending: false,
        updated_at: now
      })
      .eq("auth_user_id", user.id);

    if (error) {
      throw new Error(`Could not update users_profile row: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from("users_profile").insert({
    id: randomUUID(),
    auth_user_id: user.id,
    full_name: user.user_metadata?.full_name ?? "DeepTechly Admin",
    email,
    organization: null,
    access_tier: "institutional",
    is_institutional_verified: true,
    institutional_request_pending: false,
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw new Error(`Could not create users_profile row: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Admin bootstrap failed."
  );
  process.exit(1);
});
