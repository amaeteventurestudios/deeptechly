import "server-only";

import type { ResearchEntity, Source } from "@/lib/types";
import type { ResearchJob, StoredDossier, StoredResearchArticle } from "@/lib/research/types";
import { safeErrorMessage } from "@/lib/research/orchestration";
import { extractPublicSectorSignals } from "@/lib/research/public-sector-recognition";
import { qualityForSourceType, type SourceQualityTier } from "@/lib/research/source-quality";

export type AdminReviewWarningCode =
  | "LOW CONFIDENCE"
  | "LIMITED PUBLIC DATA"
  | "NO SOURCES"
  | "MOSTLY WEAK SOURCES"
  | "UNVERIFIED HIGH-RISK CLAIMS"
  | "PUBLIC-SECTOR CLAIMS NEED REVIEW"
  | "PATENT CLAIMS NEED REVIEW"
  | "STUCK OR RETRYABLE JOB"
  | "FAILED JOB"
  | "DRAFT CONTENT";

export type AdminReviewWarning = {
  code: AdminReviewWarningCode;
  detail: string;
  severity: "info" | "review" | "blocker";
};

export type AdminResearchReviewSummary = {
  sourceQualitySummary: {
    total: number;
    official: number;
    strong: number;
    moderate: number;
    weak: number;
    patent: number;
    government: number;
    unknown: number;
    empty: boolean;
    mostlyWeak: boolean;
  };
  confidenceSummary: {
    label: string | null;
    score: number | null;
    explanation: string;
  };
  claimAuditSummary: {
    available: boolean;
    confirmed: number | null;
    sourceAttributed: number | null;
    inferred: number | null;
    unverified: number | null;
    rejected: number | null;
    openQuestions: number | null;
  };
  publicSectorSummary: {
    detectedAgencies: string[];
    patentSourceCount: number;
    governmentSourceCount: number;
    sbirSttrSignalPresent: boolean;
    confidence: "none" | "low" | "medium" | "high";
    governmentRelevanceNeedsReview: boolean;
  };
  patentSummary: {
    patentIds: string[];
    patentSourceCount: number;
    patentClaimNeedsReview: boolean;
  };
  orchestrationSummary: {
    jobStatus: string;
    retryable: boolean;
    attemptCount: number | null;
    maxAttempts: number | null;
    stuckOrRetryWarning: boolean;
    lastUpdated: string;
    failureMessage: string | null;
  };
  publishReadiness: {
    status: "READY" | "REVIEW RECOMMENDED" | "NOT READY";
    checklist: {
      label: string;
      ok: boolean;
    }[];
  };
  warnings: AdminReviewWarning[];
};

type ReviewInput = {
  job: ResearchJob;
  entity?: ResearchEntity | null;
  article?: StoredResearchArticle | null;
  dossier?: StoredDossier | null;
};

export function buildAdminResearchReview(input: ReviewInput): AdminResearchReviewSummary {
  const { job, entity, article, dossier } = input;
  const sources = collectSources(entity, article, dossier);
  const sourceQualitySummary = summarizeSources(sources);
  const confidenceLabel =
    entity?.confidenceLabel ??
    job.feed?.confidenceLabel ??
    dossier?.dossier.accuracyAndConfidence.label ??
    null;
  const confidenceScore = entity?.confidenceScore ?? job.feed?.confidenceScore ?? null;
  const claimAuditSummary = summarizeClaimAudit(entity, article, dossier, sources);
  const publicSectorSummary = summarizePublicSector(sources, entity, dossier);
  const patentSummary = summarizePatent(sources, entity, dossier);
  const orchestrationSummary = summarizeOrchestration(job);
  const warnings = buildWarnings({
    job,
    publishedStatus: article?.publishedStatus ?? entity?.publishedStatus ?? null,
    confidenceLabel,
    sourceQualitySummary,
    claimAuditSummary,
    publicSectorSummary,
    patentSummary,
    orchestrationSummary
  });
  const publishReadiness = buildPublishReadiness({
    article,
    entity,
    dossier,
    sourceQualitySummary,
    confidenceLabel,
    warnings
  });

  return {
    sourceQualitySummary,
    confidenceSummary: {
      label: confidenceLabel,
      score: confidenceScore,
      explanation: confidenceExplanation(confidenceLabel, confidenceScore)
    },
    claimAuditSummary,
    publicSectorSummary,
    patentSummary,
    orchestrationSummary,
    publishReadiness,
    warnings
  };
}

function collectSources(
  entity?: ResearchEntity | null,
  article?: StoredResearchArticle | null,
  dossier?: StoredDossier | null
) {
  const byUrl = new Map<string, Source>();
  for (const source of [
    ...(entity?.sources ?? []),
    ...(article?.sources ?? []),
    ...(dossier?.dossier.sources ?? [])
  ]) {
    if (!source.url) continue;
    byUrl.set(source.url, source);
  }
  return [...byUrl.values()];
}

function summarizeSources(sources: Source[]): AdminResearchReviewSummary["sourceQualitySummary"] {
  const byQuality: Record<SourceQualityTier, number> = {
    official: 0,
    strong: 0,
    moderate: 0,
    weak: 0
  };
  let patent = 0;
  let government = 0;
  let unknown = 0;

  for (const source of sources) {
    const quality = qualityForSourceType(source.type);
    byQuality[quality] += 1;
    if (source.type === "patent") patent += 1;
    if (source.type === "government") government += 1;
    if (source.type === "unknown") unknown += 1;
  }

  return {
    total: sources.length,
    official: byQuality.official,
    strong: byQuality.strong,
    moderate: byQuality.moderate,
    weak: byQuality.weak,
    patent,
    government,
    unknown,
    empty: sources.length === 0,
    mostlyWeak: sources.length > 0 && byQuality.weak / sources.length >= 0.6
  };
}

function summarizeClaimAudit(
  entity: ResearchEntity | null | undefined,
  article: StoredResearchArticle | null | undefined,
  dossier: StoredDossier | null | undefined,
  sources: Source[]
): AdminResearchReviewSummary["claimAuditSummary"] {
  const audit = dossier?.dossier.accuracyAndConfidence ?? entity?.dossier.accuracyAndConfidence;
  if (!audit) {
    return {
      available: false,
      confirmed: null,
      sourceAttributed: null,
      inferred: null,
      unverified: null,
      rejected: null,
      openQuestions: null
    };
  }

  const sourceAttributed = new Set(sources.flatMap((source) => source.supportsClaims ?? []));
  const openQuestions = article?.bodySections
    .flatMap((section) => section.body)
    .filter((line) => /not confirmed|requires|unknown|unclear/i.test(line)).length;

  return {
    available: true,
    confirmed: audit.confirmed.length,
    sourceAttributed: sourceAttributed.size,
    inferred: audit.inferred.length,
    unverified: audit.unverified.length,
    rejected: null,
    openQuestions: openQuestions ?? 0
  };
}

function summarizePublicSector(
  sources: Source[],
  entity?: ResearchEntity | null,
  dossier?: StoredDossier | null
): AdminResearchReviewSummary["publicSectorSummary"] {
  const signals = sources.map((source) => source.publicSectorSignals ?? extractPublicSectorSignals(source));
  const detectedAgencies = unique(signals.flatMap((signal) => signal.agencies));
  const confidence = strongestPublicSectorConfidence(signals.map((signal) => signal.confidence));
  const sbirSttrSignalPresent = signals.some((signal) => signal.hasSBIRSTTR);
  const patentSourceCount = sources.filter((source) => source.type === "patent").length;
  const governmentSourceCount = sources.filter((source) => source.type === "government").length;
  const governmentText = [
    ...(entity?.dossier.opportunity.government ?? []),
    ...(dossier?.dossier.opportunity.government ?? []),
    entity?.summary,
    entity?.description
  ]
    .filter(Boolean)
    .join(" ");
  const mentionsGovernment = /\b(government|public-sector|public sector|dod|darpa|nasa|doe|sbir|sttr|defense|agency|procurement|contract)\b/i.test(
    governmentText
  );

  return {
    detectedAgencies,
    patentSourceCount,
    governmentSourceCount,
    sbirSttrSignalPresent,
    confidence,
    governmentRelevanceNeedsReview:
      mentionsGovernment && governmentSourceCount + patentSourceCount === 0
  };
}

function summarizePatent(
  sources: Source[],
  entity?: ResearchEntity | null,
  dossier?: StoredDossier | null
): AdminResearchReviewSummary["patentSummary"] {
  const signals = sources.map((source) => source.publicSectorSignals ?? extractPublicSectorSignals(source));
  const patentIds = unique(signals.flatMap((signal) => signal.patentIds));
  const patentSourceCount = sources.filter((source) => source.type === "patent").length;
  const text = [
    entity?.summary,
    entity?.description,
    ...(entity?.dossier.productAndTechnology ?? []),
    ...(dossier?.dossier.productAndTechnology ?? []),
    ...(dossier?.dossier.strategicOutlook ?? [])
  ]
    .filter(Boolean)
    .join(" ");
  const mentionsPatentClaim = /\b(patent|ip|intellectual property|assignee|assigned to|license|licensing|exclusive|ownership)\b/i.test(
    text
  );

  return {
    patentIds,
    patentSourceCount,
    patentClaimNeedsReview: mentionsPatentClaim && patentSourceCount === 0
  };
}

function summarizeOrchestration(job: ResearchJob): AdminResearchReviewSummary["orchestrationSummary"] {
  const retryable = Boolean(job.orchestration?.retryable);
  const failed = job.stage === "failed";
  const stuck =
    job.orchestration?.failureType === "stuck" ||
    Boolean(job.orchestration?.stuckMarkedAt);

  return {
    jobStatus: job.stage,
    retryable,
    attemptCount: job.orchestration?.attemptCount ?? null,
    maxAttempts: job.orchestration?.maxAttempts ?? null,
    stuckOrRetryWarning: retryable || stuck,
    lastUpdated: job.updatedAt,
    failureMessage: failed ? safeErrorMessage(job.error ?? job.detail) : null
  };
}

function buildWarnings(input: {
  job: ResearchJob;
  publishedStatus: "published" | "draft" | null;
  confidenceLabel: string | null;
  sourceQualitySummary: AdminResearchReviewSummary["sourceQualitySummary"];
  claimAuditSummary: AdminResearchReviewSummary["claimAuditSummary"];
  publicSectorSummary: AdminResearchReviewSummary["publicSectorSummary"];
  patentSummary: AdminResearchReviewSummary["patentSummary"];
  orchestrationSummary: AdminResearchReviewSummary["orchestrationSummary"];
}) {
  const warnings: AdminReviewWarning[] = [];
  const add = (warning: AdminReviewWarning) => {
    if (!warnings.some((item) => item.code === warning.code)) warnings.push(warning);
  };

  if (input.confidenceLabel === "LOW CONFIDENCE") {
    add({
      code: "LOW CONFIDENCE",
      detail: "Research confidence is low; review claims and sources before publishing.",
      severity: "review"
    });
  }
  if (input.confidenceLabel === "LIMITED PUBLIC DATA") {
    add({
      code: "LIMITED PUBLIC DATA",
      detail: "Public data is limited; avoid treating inferred fields as facts.",
      severity: "review"
    });
  }
  if (input.sourceQualitySummary.empty) {
    add({
      code: "NO SOURCES",
      detail: "No public sources are attached to this research item.",
      severity: "blocker"
    });
  }
  if (input.sourceQualitySummary.mostlyWeak) {
    add({
      code: "MOSTLY WEAK SOURCES",
      detail: "Most attached sources are weak or unknown source types.",
      severity: "review"
    });
  }
  if ((input.claimAuditSummary.unverified ?? 0) >= 4) {
    add({
      code: "UNVERIFIED HIGH-RISK CLAIMS",
      detail: "Several important claims remain unverified in the stored audit.",
      severity: "review"
    });
  }
  if (input.publicSectorSummary.governmentRelevanceNeedsReview) {
    add({
      code: "PUBLIC-SECTOR CLAIMS NEED REVIEW",
      detail: "Government relevance appears in output without government or patent source support.",
      severity: "review"
    });
  }
  if (input.patentSummary.patentClaimNeedsReview) {
    add({
      code: "PATENT CLAIMS NEED REVIEW",
      detail: "Patent/IP language appears in output without a patent source.",
      severity: "review"
    });
  }
  if (input.orchestrationSummary.stuckOrRetryWarning) {
    add({
      code: "STUCK OR RETRYABLE JOB",
      detail: "The research job is marked retryable or previously stalled.",
      severity: "blocker"
    });
  }
  if (input.job.stage === "failed") {
    add({
      code: "FAILED JOB",
      detail: input.orchestrationSummary.failureMessage ?? "The research job failed.",
      severity: "blocker"
    });
  }
  if (input.publishedStatus === "draft") {
    add({
      code: "DRAFT CONTENT",
      detail: "Generated content is currently unpublished.",
      severity: "info"
    });
  }

  return warnings;
}

function buildPublishReadiness(input: {
  article?: StoredResearchArticle | null;
  entity?: ResearchEntity | null;
  dossier?: StoredDossier | null;
  sourceQualitySummary: AdminResearchReviewSummary["sourceQualitySummary"];
  confidenceLabel: string | null;
  warnings: AdminReviewWarning[];
}): AdminResearchReviewSummary["publishReadiness"] {
  const checklist = [
    { label: "Article exists", ok: Boolean(input.article) },
    { label: "Profile/entity exists", ok: Boolean(input.entity) },
    { label: "Dossier exists", ok: Boolean(input.dossier) },
    { label: "Sources attached", ok: !input.sourceQualitySummary.empty },
    { label: "Confidence assigned", ok: Boolean(input.confidenceLabel) },
    { label: "No failed job state", ok: !hasWarning(input.warnings, "FAILED JOB") },
    { label: "No stuck/retry warning", ok: !hasWarning(input.warnings, "STUCK OR RETRYABLE JOB") },
    { label: "Public markdown safe", ok: Boolean(input.article && input.entity) },
    { label: "Gated dossier separation intact", ok: Boolean(input.dossier) },
    {
      label: "No unsupported government/procurement claim detected",
      ok: !hasWarning(input.warnings, "PUBLIC-SECTOR CLAIMS NEED REVIEW")
    },
    {
      label: "No unsupported patent ownership/license claim detected",
      ok: !hasWarning(input.warnings, "PATENT CLAIMS NEED REVIEW")
    }
  ];
  const blocker = input.warnings.some((warning) => warning.severity === "blocker");
  const review = input.warnings.some((warning) => warning.severity === "review");
  const missingRequired = checklist.slice(0, 5).some((item) => !item.ok);
  const lowConfidence =
    input.confidenceLabel === "LOW CONFIDENCE" ||
    input.confidenceLabel === "LIMITED PUBLIC DATA";

  return {
    status:
      blocker || missingRequired
        ? "NOT READY"
        : review || lowConfidence || input.sourceQualitySummary.mostlyWeak
          ? "REVIEW RECOMMENDED"
          : "READY",
    checklist
  };
}

function confidenceExplanation(label: string | null, score: number | null) {
  if (!label) return "No confidence label has been persisted for this item.";
  const scoreCopy = typeof score === "number" ? ` Score: ${score}.` : "";
  if (label === "HIGH CONFIDENCE") return `Strong source coverage and verification signals are present.${scoreCopy}`;
  if (label === "MODERATE CONFIDENCE") return `Usable source coverage is present, with some fields still inferred.${scoreCopy}`;
  if (label === "LIMITED PUBLIC DATA") return `Important fields rely on limited public evidence.${scoreCopy}`;
  return `Low confidence; review source support and claims before publishing.${scoreCopy}`;
}

function hasWarning(warnings: AdminReviewWarning[], code: AdminReviewWarningCode) {
  return warnings.some((warning) => warning.code === code);
}

function strongestPublicSectorConfidence(values: Array<"none" | "low" | "medium" | "high">) {
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  if (values.includes("low")) return "low";
  return "none";
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
