import type { ExternalIdentity } from "@deeptechly/kernel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredAuthProvider } from ".";

export async function getServerIdentity(): Promise<ExternalIdentity | null> {
  if (configuredAuthProvider() === "appwrite") {
    // Appwrite remains fail-closed until its project and cookie integration are authorized.
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    provider: "supabase",
    providerUserId: data.user.id,
    email: data.user.email ?? null,
    displayName:
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null,
    emailVerified: Boolean(data.user.email_confirmed_at)
  };
}
