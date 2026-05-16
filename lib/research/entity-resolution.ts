import type { ResearchEntity, Source, SourceType } from "@/lib/types";
import type { SourceSummary } from "./types";

export type EntityInputType =
  | "company"
  | "domain"
  | "patent"
  | "lab"
  | "government_program"
  | "technology"
  | "unknown";

export type ResolutionConfidence = "high" | "medium" | "low";

export type EntityResolutionMetadata = {
  normalizedName: string;
  normalizedDomain?: string | null;
  aliases: string[];
  entityInputType: EntityInputType;
  resolutionConfidence: ResolutionConfidence;
  resolutionNotes: string[];
};

export type EntityCandidate = {
  name: string;
  entityType: string;
  slug: string;
  inputType: EntityInputType;
  normalizedName: string;
  normalizedDomain?: string | null;
  aliases: string[];
  sourceUrls: string[];
  sourceDomains: string[];
  sourceQuality: SourceQualitySummary;
};

export type EntityMatch = {
  entity: ResearchEntity;
  confidence: ResolutionConfidence;
  score: number;
  reasons: string[];
};

const genericCompanySuffixes = new Set([
  "ai",
  "co",
  "company",
  "corp",
  "corporation",
  "gmbh",
  "inc",
  "incorporated",
  "industries",
  "labs",
  "limited",
  "llc",
  "ltd",
  "plc",
  "systems",
  "technologies",
  "technology"
]);

const stronglyDifferentTypes: Record<EntityInputType, EntityInputType[]> = {
  company: ["patent", "government_program"],
  domain: ["patent", "government_program"],
  patent: ["company", "domain", "lab", "government_program", "technology"],
  lab: ["patent"],
  government_program: ["company", "domain", "patent", "lab"],
  technology: ["patent"],
  unknown: []
};

type ResolutionSourceMetadata = {
  qualityTier?: "official" | "strong" | "moderate" | "weak";
  sourceTypeCategory?: SourceType;
  supportsClaims?: string[];
};

type SourceQualitySummary = {
  total: number;
  official: number;
  strongOrBetter: number;
  moderate: number;
  weak: number;
  hasReliableEvidence: boolean;
};

function normalizeResolutionSourceUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    if (parsed.pathname === "/" && !parsed.search) {
      return `${parsed.protocol}//${parsed.hostname}`;
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function publisherFromResolutionUrl(url: string) {
  try {
    return new URL(normalizeResolutionSourceUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function qualityTierForSourceType(sourceType: SourceType) {
  if (
    sourceType === "company_site" ||
    sourceType === "government" ||
    sourceType === "patent" ||
    sourceType === "academic"
  ) {
    return "official";
  }
  if (
    sourceType === "press_release" ||
    sourceType === "investor" ||
    sourceType === "database"
  ) {
    return "strong";
  }
  if (sourceType === "news" || sourceType === "jobs") return "moderate";
  return "weak";
}

function sourceQuality(sources: Array<{ sourceType: SourceType } & ResolutionSourceMetadata>) {
  const tiers = sources.map(
    (source) => source.qualityTier ?? qualityTierForSourceType(source.sourceType)
  );
  const official = tiers.filter((tier) => tier === "official").length;
  const strong = tiers.filter((tier) => tier === "strong").length;
  const moderate = tiers.filter((tier) => tier === "moderate").length;
  const weak = tiers.filter((tier) => tier === "weak").length;

  return {
    total: tiers.length,
    official,
    strongOrBetter: official + strong,
    moderate,
    weak,
    hasReliableEvidence: official + strong > 0
  };
}

export function normalizeDomain(input?: string | null) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function normalizeEntityName(input: string) {
  const tokens = input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\.[a-z]{2,}(?:\/.*)?$/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length > 1 && genericCompanySuffixes.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens.join(" ");
}

export function classifyEntityInput(input: string): EntityInputType {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (normalizeDomain(trimmed) && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(
    trimmed.replace(/^https?:\/\//i, "")
  )) {
    return "domain";
  }

  if (
    /\b(?:us|wo|ep|jp|cn)\s?\d{4,}[a-z]?\b/i.test(trimmed) ||
    /\bpatent\b/i.test(trimmed) ||
    /patents\.google\.com/i.test(trimmed)
  ) {
    return "patent";
  }

  if (
    /\b(?:darpa|nasa|doe|dod|arpa-e|nsf|nih|afwerx|space force|sbir|sttr)\b/i.test(
      lower
    ) &&
    /\b(?:program|topic|award|solicitation|mission|technology|nom4d|sbir|sttr)\b/i.test(
      lower
    )
  ) {
    return "government_program";
  }

  if (/\b(?:university|institute|laboratory|lab|national lab|research center)\b/i.test(lower)) {
    return "lab";
  }

  if (/\b(?:platform|system|architecture|technology|material|process|sige|sapphire)\b/i.test(lower)) {
    return "technology";
  }

  if (normalizeEntityName(trimmed)) return "company";
  return "unknown";
}

export function createCanonicalSlug(entityName: string, entityType?: EntityInputType | string) {
  const base = (normalizeEntityName(entityName) || entityName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const normalizedType = String(entityType ?? "").replace(/_/g, "-");

  if (base) return base;
  return normalizedType ? `${normalizedType}-entity` : "entity";
}

export function createCollisionSafeSlug(
  candidate: EntityCandidate,
  existingEntities: ResearchEntity[]
) {
  const base = candidate.slug;
  const collision = existingEntities.find((entity) => entity.slug === base);
  if (!collision || shouldReuseEntity(collision, candidate)) return base;

  const suffix = candidate.inputType === "unknown" ? "entity" : candidate.inputType;
  const withType = `${base}-${suffix.replace(/_/g, "-")}`.slice(0, 88);
  const typeCollision = existingEntities.find((entity) => entity.slug === withType);

  if (!typeCollision || shouldReuseEntity(typeCollision, candidate)) return withType;

  const descriptor =
    candidate.normalizedDomain?.split(".")[0] ??
    candidate.sourceDomains[0]?.split(".")[0] ??
    candidate.inputType;
  return `${base}-${descriptor.replace(/[^a-z0-9]+/g, "-")}`.slice(0, 96);
}

export function buildEntityCandidates({
  input,
  name,
  entityType,
  domain,
  sources = []
}: {
  input: string;
  name?: string | null;
  entityType?: string | null;
  domain?: string | null;
  sources?: SourceSummary[] | Source[];
}): EntityCandidate {
  const inputType = classifyEntityInput(input);
  const normalizedDomain = normalizeDomain(domain ?? input);
  const displayName = name?.trim() || normalizedDomain || input.trim();
  const sourceUrls = sources
    .map((source) => source.url)
    .filter(Boolean)
    .map(normalizeResolutionSourceUrl);
  const sourceDomains = Array.from(
    new Set(sourceUrls.map((url) => publisherFromResolutionUrl(url)).filter(isPresent))
  );
  const summaries = sources.map((source) => {
    const enriched = source as Partial<ResolutionSourceMetadata>;
    const sourceType =
      "sourceType" in source
        ? source.sourceType
        : "type" in source
          ? source.type
          : "unknown";
    return {
      url: source.url,
      title: source.title,
      sourceType: sourceType as SourceType,
      keyFacts: "keyFacts" in source ? source.keyFacts : [],
      claims: "claims" in source ? source.claims : [],
      numbers: "numbers" in source ? source.numbers : [],
      people: "people" in source ? source.people : [],
      products: "products" in source ? source.products : [],
      dates: "dates" in source ? source.dates : [],
      uncertainty: "uncertainty" in source ? source.uncertainty : [],
      qualityTier: enriched.qualityTier,
      sourceTypeCategory: enriched.sourceTypeCategory,
      supportsClaims: enriched.supportsClaims
    };
  });
  const aliases = Array.from(
    new Set(
      [
        normalizeEntityName(input),
        normalizeEntityName(displayName),
        normalizedDomain?.split(".")[0] ?? ""
      ].filter(Boolean)
    )
  );

  return {
    name: displayName,
    entityType: entityType ?? entityTypeForInput(inputType),
    slug: createCanonicalSlug(displayName, inputType),
    inputType,
    normalizedName: normalizeEntityName(displayName),
    normalizedDomain,
    aliases,
    sourceUrls,
    sourceDomains,
    sourceQuality: sourceQuality(summaries)
  };
}

export function compareEntityCandidates(
  existing: ResearchEntity,
  candidate: EntityCandidate
): EntityMatch {
  const reasons: string[] = [];
  let score = 0;
  const existingType = inputTypeFromEntity(existing);
  const existingName = normalizeEntityName(existing.name);
  const existingDomain = normalizeDomain(existing.domain ?? existing.website);
  const existingAliases = entityAliases(existing);
  const existingSourceDomains = new Set(
    existing.sources.map((source) => publisherFromResolutionUrl(source.url)).filter(isPresent)
  );

  if (existing.slug === candidate.slug) {
    score += 45;
    reasons.push("exact canonical slug match");
  }
  if (existingName && existingName === candidate.normalizedName) {
    score += 35;
    reasons.push("normalized entity name match");
  }
  if (candidate.aliases.some((alias) => existingAliases.has(alias))) {
    score += 20;
    reasons.push("alias match");
  }
  if (existingDomain && candidate.normalizedDomain && existingDomain === candidate.normalizedDomain) {
    score += 65;
    reasons.push("normalized domain match");
  }
  if (candidate.sourceDomains.some((domain) => existingSourceDomains.has(domain))) {
    score += 15;
    reasons.push("shared source domain");
  }
  if (candidate.sourceQuality.official > 0) {
    score += 10;
    reasons.push("official source evidence present");
  }

  if (stronglyDifferentTypes[candidate.inputType]?.includes(existingType)) {
    score -= 70;
    reasons.push("entity input type conflicts with existing entity type");
  }
  if (
    existingDomain &&
    candidate.normalizedDomain &&
    existingDomain !== candidate.normalizedDomain
  ) {
    score -= 50;
    reasons.push("conflicting normalized domains");
  }
  if (candidate.sourceQuality.total > 0 && !candidate.sourceQuality.hasReliableEvidence) {
    score -= 10;
    reasons.push("only weak source evidence");
  }

  const confidence: ResolutionConfidence =
    score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  return { entity: existing, confidence, score, reasons };
}

export function resolveExistingEntity(
  candidate: EntityCandidate,
  existingEntities: ResearchEntity[]
) {
  return existingEntities
    .map((entity) => compareEntityCandidates(entity, candidate))
    .sort((a, b) => b.score - a.score)[0] ?? null;
}

export function shouldReuseEntity(existing: ResearchEntity, candidate: EntityCandidate) {
  const match = compareEntityCandidates(existing, candidate);
  return match.confidence === "high";
}

export function shouldCreateNewEntity(existing: ResearchEntity | null, candidate: EntityCandidate) {
  if (!existing) return true;
  return !shouldReuseEntity(existing, candidate);
}

export function metadataForResolution(
  candidate: EntityCandidate,
  match?: EntityMatch | null
): EntityResolutionMetadata {
  return {
    normalizedName: candidate.normalizedName,
    normalizedDomain: candidate.normalizedDomain ?? null,
    aliases: candidate.aliases,
    entityInputType: candidate.inputType,
    resolutionConfidence: match?.confidence ?? "low",
    resolutionNotes: match?.reasons ?? ["No high-confidence existing entity match."]
  };
}

export function entityTypeForInput(inputType: EntityInputType) {
  if (inputType === "patent") return "Patent";
  if (inputType === "lab") return "Lab";
  if (inputType === "government_program") return "Government Program";
  if (inputType === "technology") return "Technology";
  if (inputType === "domain" || inputType === "company") return "Company";
  return "Unknown";
}

function inputTypeFromEntity(entity: ResearchEntity): EntityInputType {
  const type = entity.entityType.toLowerCase();
  if (type.includes("patent")) return "patent";
  if (type.includes("government") || type.includes("program")) return "government_program";
  if (type.includes("lab")) return "lab";
  if (type.includes("technology")) return "technology";
  if (entity.domain || entity.website) return "domain";
  if (type.includes("company")) return "company";
  return "unknown";
}

function entityAliases(entity: ResearchEntity) {
  const aliases = new Set<string>([
    normalizeEntityName(entity.name),
    normalizeEntityName(entity.slug)
  ]);
  const domain = normalizeDomain(entity.domain ?? entity.website);
  if (domain) aliases.add(domain.split(".")[0]);
  for (const source of entity.sources) {
    const publisher = publisherFromResolutionUrl(source.url);
    if (publisher) aliases.add(publisher.split(".")[0]);
  }
  return aliases;
}

function isPresent<T>(value: T | null | undefined | ""): value is T {
  return Boolean(value);
}
