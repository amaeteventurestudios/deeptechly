export const claimStates = [
  "CONFIRMED",
  "INFERRED",
  "UNVERIFIED",
  "CONFLICTING_SOURCES"
] as const;
export type ClaimState = (typeof claimStates)[number];

export const confidenceLabels = [
  "HIGH_CONFIDENCE",
  "MODERATE_CONFIDENCE",
  "LIMITED_PUBLIC_DATA",
  "LOW_CONFIDENCE"
] as const;
export type ConfidenceLabel = (typeof confidenceLabels)[number];

export const publicationStates = [
  "draft",
  "review",
  "eligible",
  "published",
  "withdrawn"
] as const;
export type PublicationState = (typeof publicationStates)[number];

export type ExternalIdentity = {
  accountId: string;
  provider: "supabase" | "appwrite" | string;
  providerUserId: string;
  emailVerified: boolean;
};

export type LegacyImportResult = {
  batchId: string;
  sourceSystem: string;
  sourceRecordCount: number;
  acceptedRecordCount: number;
  rejectedRecordCount: number;
  sourceChecksum: string;
};
