import type { ApertureConfidenceLabel, ApertureSource } from "./index";

export type GovernmentDemandDocument = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  agency: string;
  documentType: string;
  publishedAt?: string | null;
  text: string;
  official: boolean;
};

export type DemandStatement = {
  text: string;
  documentId: string;
  state: "CONFIRMED" | "INFERRED";
};

export type TechnicalRequirement = DemandStatement & {
  id: string;
  requirementType: "performance" | "deployment" | "integration" | "production" | "general";
};

export type CapabilityTarget = {
  id: string;
  type: "entity" | "patent" | "lab" | "technology";
  name: string;
  summary: string;
  evidenceIds: string[];
};

export type CapabilityMatch = {
  targetId: string;
  targetType: CapabilityTarget["type"];
  name: string;
  score: number;
  matchedRequirementIds: string[];
  rationale: string;
  evidenceIds: string[];
};

export type RepeatedDemandCluster = {
  label: string;
  requirementIds: string[];
  documentIds: string[];
  repetitionCount: number;
};

export type ApertureAnalysis = {
  agencyAsks: DemandStatement[];
  problemStatements: DemandStatement[];
  requirements: TechnicalRequirement[];
  repeatedDemand: RepeatedDemandCluster[];
  matches: CapabilityMatch[];
  sources: ApertureSource[];
  confidenceLabel: ApertureConfidenceLabel;
  publicationEligible: boolean;
  publicationReasons: string[];
  methodologyVersion: string;
};

export type ApertureAnalysisInput = {
  documents: GovernmentDemandDocument[];
  targets?: CapabilityTarget[];
  methodologyVersion: string;
};

export function analyzeGovernmentDemand(input: ApertureAnalysisInput): ApertureAnalysis {
  const documents = dedupeDocuments(input.documents);
  const agencyAsks = extractStatements(documents, askPatterns, "CONFIRMED");
  const problemStatements = extractStatements(documents, problemPatterns, "INFERRED");
  const requirements = extractRequirements(documents);
  const repeatedDemand = detectRepeatedDemand(requirements);
  const matches = matchCapabilities(requirements, input.targets ?? []);
  const confidenceLabel = calculateApertureConfidence({
    documents,
    agencyAsks,
    problemStatements,
    requirements,
    repeatedDemand
  });
  const publication = aperturePublicationEligibility({
    documents,
    agencyAsks,
    problemStatements,
    requirements,
    confidenceLabel
  });

  return {
    agencyAsks,
    problemStatements,
    requirements,
    repeatedDemand,
    matches,
    sources: documents.map((document) => ({
      title: document.title,
      url: document.url,
      publisher: document.publisher,
      documentType: document.documentType,
      publishedAt: document.publishedAt
    })),
    confidenceLabel,
    publicationEligible: publication.eligible,
    publicationReasons: publication.reasons,
    methodologyVersion: input.methodologyVersion
  };
}

export function detectRepeatedDemand(requirements: readonly TechnicalRequirement[]) {
  const clusters: RepeatedDemandCluster[] = [];
  const consumed = new Set<string>();
  for (const requirement of requirements) {
    if (consumed.has(requirement.id)) continue;
    const related = requirements.filter(
      (candidate) =>
        candidate.id !== requirement.id &&
        candidate.documentId !== requirement.documentId &&
        tokenSimilarity(requirement.text, candidate.text) >= 0.28
    );
    const group = [requirement, ...related];
    const documentIds = [...new Set(group.map((item) => item.documentId))];
    if (documentIds.length < 2) continue;
    group.forEach((item) => consumed.add(item.id));
    clusters.push({
      label: conciseLabel(requirement.text),
      requirementIds: group.map((item) => item.id),
      documentIds,
      repetitionCount: documentIds.length
    });
  }
  return clusters;
}

export function matchCapabilities(
  requirements: readonly TechnicalRequirement[],
  targets: readonly CapabilityTarget[]
) {
  return targets
    .map((target): CapabilityMatch | null => {
      const ranked = requirements
        .map((requirement) => ({ requirement, score: tokenSimilarity(requirement.text, target.summary) }))
        .filter((entry) => entry.score >= 0.2)
        .sort((a, b) => b.score - a.score);
      if (ranked.length === 0 || target.evidenceIds.length === 0) return null;
      const score = Math.min(0.95, ranked.slice(0, 3).reduce((sum, entry) => sum + entry.score, 0) / Math.min(3, ranked.length));
      return {
        targetId: target.id,
        targetType: target.type,
        name: target.name,
        score,
        matchedRequirementIds: ranked.slice(0, 3).map((entry) => entry.requirement.id),
        rationale: `${target.name} shares supported technical language with ${ranked.length} extracted requirement${ranked.length === 1 ? "" : "s"}; this is relevance, not procurement eligibility or readiness.`,
        evidenceIds: [...new Set(target.evidenceIds)]
      };
    })
    .filter((match): match is CapabilityMatch => Boolean(match))
    .sort((a, b) => b.score - a.score);
}

function extractRequirements(documents: readonly GovernmentDemandDocument[]) {
  return extractStatements(documents, requirementPatterns, "CONFIRMED").map((statement, index) => ({
    ...statement,
    id: `requirement:${statement.documentId}:${index + 1}`,
    requirementType: classifyRequirement(statement.text)
  }));
}

function extractStatements(
  documents: readonly GovernmentDemandDocument[],
  patterns: readonly RegExp[],
  state: DemandStatement["state"]
) {
  const statements: DemandStatement[] = [];
  for (const document of documents) {
    for (const sentence of sentences(document.text)) {
      if (!patterns.some((pattern) => pattern.test(sentence))) continue;
      statements.push({ text: sentence, documentId: document.id, state });
    }
  }
  return dedupeStatements(statements);
}

function calculateApertureConfidence(input: {
  documents: GovernmentDemandDocument[];
  agencyAsks: DemandStatement[];
  problemStatements: DemandStatement[];
  requirements: TechnicalRequirement[];
  repeatedDemand: RepeatedDemandCluster[];
}): ApertureConfidenceLabel {
  const official = input.documents.filter((document) => document.official).length;
  const publishers = new Set(input.documents.map((document) => document.publisher.toLowerCase())).size;
  let score = official * 12 + Math.min(20, publishers * 5);
  if (input.agencyAsks.length) score += 15;
  if (input.problemStatements.length) score += 10;
  if (input.requirements.length >= 2) score += 15;
  if (input.repeatedDemand.length) score += 15;
  if (score >= 75) return "HIGH CONFIDENCE";
  if (score >= 50) return "MODERATE CONFIDENCE";
  if (score >= 25) return "LIMITED PUBLIC DATA";
  return "LOW CONFIDENCE";
}

function aperturePublicationEligibility(input: {
  documents: GovernmentDemandDocument[];
  agencyAsks: DemandStatement[];
  problemStatements: DemandStatement[];
  requirements: TechnicalRequirement[];
  confidenceLabel: ApertureConfidenceLabel;
}) {
  const reasons: string[] = [];
  if (input.documents.filter((document) => document.official).length < 2) reasons.push("At least two official public documents are required.");
  if (input.agencyAsks.length === 0) reasons.push("No explicit agency ask was extracted.");
  if (input.problemStatements.length === 0) reasons.push("No evidence-linked problem statement was derived.");
  if (input.requirements.length === 0) reasons.push("No technical or deployment requirement was extracted.");
  if (input.confidenceLabel === "LOW CONFIDENCE") reasons.push("Low-confidence analysis is not publication eligible.");
  return { eligible: reasons.length === 0, reasons };
}

function dedupeDocuments(documents: readonly GovernmentDemandDocument[]) {
  const byUrl = new Map<string, GovernmentDemandDocument>();
  for (const document of documents) {
    if (!/^https:\/\//i.test(document.url) || !document.text.trim()) continue;
    byUrl.set(document.url.replace(/\/$/, ""), { ...document, text: normalize(document.text) });
  }
  return [...byUrl.values()];
}

function dedupeStatements(statements: DemandStatement[]) {
  const seen = new Set<string>();
  return statements.filter((statement) => {
    const key = normalize(statement.text).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sentences(text: string) {
  return normalize(text).split(/(?<=[.!?])\s+/).map((value) => value.trim()).filter((value) => value.length >= 24 && value.length <= 700);
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function tokenSimilarity(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / new Set([...a, ...b]).size;
}

function tokens(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9]{4,}/g)?.filter((token) => !stopwords.has(token)) ?? []);
}

function conciseLabel(value: string) {
  return value.split(/\s+/).slice(0, 10).join(" ").replace(/[.,;:]$/, "");
}

function classifyRequirement(value: string): TechnicalRequirement["requirementType"] {
  if (/scale|production|manufactur|thousands|afford|low-cost/i.test(value)) return "production";
  if (/integrat|interoperab|architecture|network|software/i.test(value)) return "integration";
  if (/deploy|field|operate|environment|domain/i.test(value)) return "deployment";
  if (/performance|speed|range|latency|resilien|accuracy/i.test(value)) return "performance";
  return "general";
}

const askPatterns = [/\b(?:seek|seeks|seeking|request|requires?|prioriti[sz]|focus(?:es|ed)?|deliver|field)\b/i];
const problemPatterns = [/\b(?:challenge|gap|need|counter|barrier|risk|shortfall|constraint|problem)\b/i];
const requirementPatterns = [/\b(?:must|shall|requires?|capable|ensure|deliver|field|operate|scale|resilien|modular|interoperab|low-cost|afford)\b/i];
const stopwords = new Set(["that", "this", "with", "from", "have", "will", "into", "their", "across", "within", "where", "which", "while", "using", "through"]);
