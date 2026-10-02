import { getServerIdentity } from "./providers/server";
import { resolveAccountEntitlements } from "@deeptechly/kernel";
import {
  ensureAccountForIdentity,
  getUserProfile,
  syncUserProfileEmail,
  type UserProfile
} from "./profiles";

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
  isAdmin: boolean;
};

export async function getAuthSession(): Promise<DeeptechlyAuthSession | null> {
  const identity = await getServerIdentity();
  if (!identity?.email) {
    return null;
  }

  const profile =
    (await getUserProfile(identity.providerUserId)) ??
    (await ensureAccountForIdentity(identity));
  if (!profile) return null;
  if (profile && profile.email !== identity.email) {
    await syncUserProfileEmail(identity.providerUserId, identity.email);
    profile.email = identity.email;
  }

  return {
    userId: profile.id,
    email: identity.email,
    name: profile?.full_name ?? identity.displayName ?? undefined,
    profile,
    accessTier: profile?.access_tier ?? "free",
    isInstitutionalVerified: Boolean(profile?.is_institutional_verified),
    institutionalRequestPending: Boolean(
      profile?.institutional_request_pending
    ),
    isAdmin: Boolean(profile.is_admin) || isConfiguredBootstrapAdmin(identity.email)
  };
}

function isConfiguredBootstrapAdmin(email: string) {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}

export function getInstitutionalAccessState(
  session: DeeptechlyAuthSession | null
): InstitutionalAccessState {
  if (!session) {
    return "signed-out";
  }

  const entitlements = resolveAccountEntitlements({
    signedIn: true,
    accessTier: session.accessTier,
    institutionalVerified: session.isInstitutionalVerified,
    institutionalPending: session.institutionalRequestPending
  });

  if (entitlements["dossier.institutional"].granted) {
    return "institutional";
  }

  if (session.institutionalRequestPending) {
    return "pending";
  }

  return "free";
}
