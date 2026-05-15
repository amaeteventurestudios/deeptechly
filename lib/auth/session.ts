import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProfile, type UserProfile } from "./profiles";

export type InstitutionalAccessState =
  | "signed-out"
  | "free"
  | "pending"
  | "institutional";

export type DeeptechlyAuthSession = {
  userId: string;
  email: string;
  name?: string;
  profile: UserProfile | null;
  accessTier: string;
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
};

export async function getAuthSession(): Promise<DeeptechlyAuthSession | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const profile = await getUserProfile(user.id);
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;

  return {
    userId: user.id,
    email: user.email,
    name: profile?.full_name ?? metadataName,
    profile,
    accessTier: profile?.access_tier ?? "free",
    isInstitutionalVerified: Boolean(profile?.is_institutional_verified),
    institutionalRequestPending: Boolean(
      profile?.institutional_request_pending
    )
  };
}

export function getInstitutionalAccessState(
  session: DeeptechlyAuthSession | null
): InstitutionalAccessState {
  if (!session) {
    return "signed-out";
  }

  if (session.isInstitutionalVerified) {
    return "institutional";
  }

  if (session.institutionalRequestPending) {
    return "pending";
  }

  return "free";
}
