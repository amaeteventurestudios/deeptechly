import { getServerIdentity } from "./providers/server";
import { resolveAccountEntitlements } from "@deeptechly/kernel";
import {
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
};

export async function getAuthSession(): Promise<DeeptechlyAuthSession | null> {
  const identity = await getServerIdentity();
  if (!identity?.email) {
    return null;
  }

  const profile = await getUserProfile(identity.providerUserId);
  if (profile && profile.email !== identity.email) {
    await syncUserProfileEmail(identity.providerUserId, identity.email);
    profile.email = identity.email;
  }

  return {
    userId: identity.providerUserId,
    email: identity.email,
    name: profile?.full_name ?? identity.displayName ?? undefined,
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
