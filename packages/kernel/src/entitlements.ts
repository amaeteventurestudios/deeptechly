export const deeptechlyCapabilities = [
  "public.read",
  "research.submit",
  "research.save",
  "dossier.institutional",
  "aperture.institutional"
] as const;

export type DeeptechlyCapability = (typeof deeptechlyCapabilities)[number];
export type EntitlementSource = "public" | "account" | "invite" | "admin" | "lago" | "stripe";

export type EntitlementDecision = {
  capability: DeeptechlyCapability;
  granted: boolean;
  source: EntitlementSource;
  reason: string;
};

export type AccountEntitlementContext = {
  signedIn: boolean;
  accessTier?: string | null;
  institutionalVerified?: boolean;
  institutionalPending?: boolean;
};

/** Compatibility policy. Billing providers may grant access only after a verified ledger write. */
export function resolveAccountEntitlements(context: AccountEntitlementContext) {
  const accountSource: EntitlementSource = context.signedIn ? "account" : "public";
  const institutional = Boolean(context.signedIn && context.institutionalVerified);
  const decisions: Record<DeeptechlyCapability, EntitlementDecision> = {
    "public.read": decision("public.read", true, "public", "Public research is free to read."),
    "research.submit": decision(
      "research.submit",
      context.signedIn,
      accountSource,
      context.signedIn ? "Signed-in accounts may submit research." : "Sign-in is required to submit research."
    ),
    "research.save": decision(
      "research.save",
      context.signedIn,
      accountSource,
      context.signedIn ? "Signed-in accounts may save public research." : "Sign-in is required to save research."
    ),
    "dossier.institutional": decision(
      "dossier.institutional",
      institutional,
      institutional ? "admin" : accountSource,
      institutional
        ? "Institutional access has been verified."
        : context.institutionalPending
          ? "Institutional access is pending review."
          : "Verified institutional access is required."
    ),
    "aperture.institutional": decision(
      "aperture.institutional",
      institutional,
      institutional ? "admin" : accountSource,
      institutional ? "Institutional access has been verified." : "Verified institutional access is required."
    )
  };
  return decisions;
}

function decision(
  capability: DeeptechlyCapability,
  granted: boolean,
  source: EntitlementSource,
  reason: string
): EntitlementDecision {
  return { capability, granted, source, reason };
}
