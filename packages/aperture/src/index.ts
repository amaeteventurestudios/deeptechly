export const APERTURE_METHODOLOGY_VERSION = "v1" as const;

export const apertureConfidenceLabels = [
  "HIGH CONFIDENCE",
  "MODERATE CONFIDENCE",
  "LIMITED PUBLIC DATA",
  "LOW CONFIDENCE"
] as const;

export type ApertureConfidenceLabel = (typeof apertureConfidenceLabels)[number];

export type ApertureSource = {
  title: string;
  url: string;
  publisher: string;
  documentType: string;
  publishedAt?: string | null;
  retrievedAt?: string | null;
};

export type ApertureAgency = {
  slug: string;
  name: string;
  abbreviation?: string | null;
  officialDomain?: string | null;
  summary: string;
};

export type ApertureSignal = {
  kind: "signal";
  slug: string;
  title: string;
  summary: string;
  agency: ApertureAgency;
  signalType: string;
  confidenceLabel: ApertureConfidenceLabel;
  sourceCount: number;
  firstObservedAt?: string | null;
  lastObservedAt?: string | null;
  agencyAsk: string[];
  problemStatement: string[];
  evidenceBase: string[];
  technicalRequirements: string[];
  repeatedSignals: string[];
  relatedCompanies: string[];
  relatedPatents: string[];
  relatedLabs: string[];
  opportunityRead: string[];
  institutionalRead?: string[];
  sources: ApertureSource[];
  methodologyVersion: string;
  published: boolean;
};

export type ApertureProblem = {
  kind: "problem";
  slug: string;
  title: string;
  summary: string;
  problemText: string;
  agency?: ApertureAgency | null;
  confidenceLabel: ApertureConfidenceLabel;
  sourceCount: number;
  evidence: string[];
  technicalRequirements: string[];
  relatedSignalSlugs: string[];
  sources: ApertureSource[];
  methodologyVersion: string;
  published: boolean;
};

export type ApertureOpportunity = {
  kind: "opportunity";
  slug: string;
  title: string;
  summary: string;
  confidenceLabel: ApertureConfidenceLabel;
  sourceCount: number;
  problemStatement: string[];
  demandPattern: string[];
  requirementMap: string[];
  companyMatches: string[];
  patentMatches: string[];
  labMatches: string[];
  opportunityRead: string[];
  sources: ApertureSource[];
  methodologyVersion: string;
  published: boolean;
};

export type AperturePublication = ApertureSignal | ApertureProblem | ApertureOpportunity;

export type ApertureEvidencePack = {
  slug: string;
  title: string;
  summary: string;
  subjectType: AperturePublication["kind"];
  subjectSlug: string;
  confidenceLabel: ApertureConfidenceLabel;
  sources: ApertureSource[];
  methodologyVersion: string;
  published: boolean;
};

export function publicApertureItems<T extends AperturePublication>(items: readonly T[]) {
  return items.filter((item) => item.published && item.sources.length > 0);
}

export * from "./intelligence";
export * from "./workflow";
