import "server-only";

import type { Source, SourceType } from "@/lib/types";
import type { SearchResult, SourceSummary } from "./types";

export type ResearchSourceType = SourceType;
export type SourceQualityTier = "official" | "strong" | "moderate" | "weak";
export type SourceMetadata = {
  publisher?: string;
  retrievedAt?: string;
  sourceTypeCategory?: ResearchSourceType;
  supportsClaims?: string[];
  qualityTier?: SourceQualityTier;
};
export type EnrichedSearchResult = SearchResult & SourceMetadata;
export type EnrichedSourceSummary = SourceSummary & SourceMetadata;
export type EnrichedSource = Source & {
  qualityTier?: SourceQualityTier;
};

const TRACKING_PREFIXES = ["utm_", "vero_", "ga_"];
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref",
  "ref_src",
  "source",
  "spm"
]);

const sourceRank: Record<ResearchSourceType, number> = {
  company_site: 9,
  government: 9,
  patent: 9,
  academic: 9,
  press_release: 7,
  investor: 7,
  database: 7,
  news: 5,
  jobs: 4,
  unknown: 1
};

const qualityRank: Record<SourceQualityTier, number> = {
  official: 4,
  strong: 3,
  moderate: 2,
  weak: 1
};

export function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    for (const key of [...parsed.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (
        TRACKING_PARAMS.has(lower) ||
        TRACKING_PREFIXES.some((prefix) => lower.startsWith(prefix))
      ) {
        parsed.searchParams.delete(key);
      }
    }

    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";

    if (parsed.pathname === "/" && !parsed.search) {
      return `${parsed.protocol}//${parsed.hostname}`;
    }

    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function publisherFromUrl(url: string) {
  try {
    return new URL(normalizeSourceUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

export function classifySource(url: string, title = ""): ResearchSourceType {
  const normalized = normalizeSourceUrl(url).toLowerCase();
  const text = `${normalized} ${title.toLowerCase()}`;

  if (includesAny(text, ["patents.google", "uspto.gov", "patentcenter", "/patent/"])) {
    return "patent";
  }
  if (
    includesAny(text, [
      ".gov",
      ".mil",
      "sbir.gov",
      "nasa.gov",
      "darpa.mil",
      "defense.gov",
      "energy.gov",
      "nsf.gov",
      "nih.gov"
    ])
  ) {
    return "government";
  }
  if (
    includesAny(text, [
      "arxiv.org",
      "doi.org",
      "scholar.google",
      "nature.com",
      "science.org",
      "ieee.org",
      "acm.org",
      "springer.com",
      "sciencedirect.com",
      "pubmed.ncbi.nlm.nih.gov"
    ])
  ) {
    return "academic";
  }
  if (includesAny(text, ["sec.gov", "crunchbase.com", "pitchbook.com", "dealroom.co"])) {
    return "database";
  }
  if (includesAny(text, ["/press", "/newsroom", "prnewswire.com", "businesswire.com"])) {
    return "press_release";
  }
  if (includesAny(text, ["investor", "ir.", "/ir/", "funding", "venture"])) {
    return "investor";
  }
  if (includesAny(text, ["careers", "jobs", "greenhouse.io", "lever.co", "workable.com"])) {
    return "jobs";
  }
  if (
    includesAny(text, [
      "reuters.com",
      "bloomberg.com",
      "wsj.com",
      "techcrunch.com",
      "theinformation.com",
      "axios.com",
      "forbes.com",
      "cnbc.com"
    ])
  ) {
    return "news";
  }

  return "unknown";
}

export function displaySourceType(sourceType: ResearchSourceType): SourceType {
  return sourceType;
}

export function qualityForSourceType(sourceType: ResearchSourceType): SourceQualityTier {
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
  if (sourceType === "news" || sourceType === "jobs") {
    return "moderate";
  }
  return "weak";
}

export function supportsClaimsForSource(sourceType: ResearchSourceType, text = "") {
  const lower = text.toLowerCase();
  const claims = new Set<string>();

  if (sourceType === "company_site") {
    claims.add("company identity");
    claims.add("sector");
    claims.add("technical capability");
  }
  if (sourceType === "patent") claims.add("patent");
  if (sourceType === "government") claims.add("government relevance");
  if (sourceType === "academic") claims.add("technical capability");
  if (sourceType === "press_release") claims.add("market positioning");
  if (sourceType === "investor") {
    claims.add("funding");
    claims.add("investors");
  }
  if (sourceType === "jobs") claims.add("jobs/hiring");
  if (sourceType === "database") claims.add("company identity");
  if (sourceType === "news") claims.add("market positioning");

  if (includesAny(lower, ["headquarters", "based in", "hq"])) claims.add("headquarters");
  if (includesAny(lower, ["founder", "founded by", "co-founder"])) claims.add("team");
  if (includesAny(lower, ["customer", "client", "deployed with"])) claims.add("customers");
  if (includesAny(lower, ["partner", "partnership"])) claims.add("market positioning");

  return [...claims];
}

function asResearchSourceType(value: unknown): ResearchSourceType {
  return typeof value === "string" && value in sourceRank
    ? (value as ResearchSourceType)
    : "unknown";
}

function candidateScore(item: {
  title?: string;
  publisher?: string;
  supportsClaims?: string[];
  retrievedAt?: string;
  sourceType?: unknown;
  sourceTypeCategory?: unknown;
  qualityTier?: SourceQualityTier;
}) {
  const sourceType = asResearchSourceType(item.sourceTypeCategory ?? item.sourceType);
  const qualityTier = item.qualityTier ?? qualityForSourceType(sourceType);
  const retrievedAt = Date.parse(item.retrievedAt ?? "");
  return (
    sourceRank[sourceType] * 100 +
    qualityRank[qualityTier] * 20 +
    (item.title ? 8 : 0) +
    (item.publisher ? 6 : 0) +
    (item.supportsClaims?.length ?? 0) +
    (Number.isFinite(retrievedAt) ? retrievedAt / 10_000_000_000_000 : 0)
  );
}

export function normalizeSearchResults(results: SearchResult[]) {
  const byUrl = new Map<string, EnrichedSearchResult>();
  const retrievedAt = new Date().toISOString();

  for (const result of results) {
    if (!/^https?:\/\//i.test(result.url)) continue;
    const url = normalizeSourceUrl(result.url);
    const sourceType = classifySource(url, result.title);
    const next: EnrichedSearchResult = {
      ...result,
      url,
      publisher: publisherFromUrl(url),
      retrievedAt,
      sourceType: displaySourceType(sourceType),
      sourceTypeCategory: sourceType,
      supportsClaims: supportsClaimsForSource(
        sourceType,
        `${result.title} ${result.snippet ?? ""}`
      ),
      qualityTier: qualityForSourceType(sourceType)
    };
    const current = byUrl.get(url);
    if (!current || candidateScore(next) > candidateScore(current)) {
      byUrl.set(url, next);
    }
  }

  return [...byUrl.values()].sort((a, b) => candidateScore(b) - candidateScore(a));
}

export function dedupeSourceSummaries(summaries: SourceSummary[]) {
  const byUrl = new Map<string, EnrichedSourceSummary>();

  for (const summary of summaries) {
    const enriched = summary as EnrichedSourceSummary;
    const url = normalizeSourceUrl(summary.url);
    const sourceType = enriched.sourceTypeCategory ?? classifySource(url, summary.title);
    const qualityTier = enriched.qualityTier ?? qualityForSourceType(sourceType);
    const supportsClaims =
      enriched.supportsClaims?.length
        ? enriched.supportsClaims
        : supportsClaimsForSource(sourceType, [
            summary.title,
            ...summary.keyFacts,
            ...summary.claims
          ].join(" "));
    const next: EnrichedSourceSummary = {
      ...summary,
      url,
      publisher: enriched.publisher ?? publisherFromUrl(url),
      retrievedAt: enriched.retrievedAt ?? new Date().toISOString(),
      sourceType: displaySourceType(sourceType),
      sourceTypeCategory: sourceType,
      supportsClaims,
      qualityTier
    };
    const current = byUrl.get(url);
    if (!current || candidateScore(next) > candidateScore(current)) {
      byUrl.set(url, next);
    }
  }

  return [...byUrl.values()].sort((a, b) => candidateScore(b) - candidateScore(a));
}

export function normalizeStoredSources(sources: Source[]) {
  return dedupeStoredSources(sources).map((source) => {
    const enriched = source as EnrichedSource;
    const url = normalizeSourceUrl(source.url);
    const sourceType = source.type ?? classifySource(url, source.title);
    return {
      ...source,
      url,
      publisher: source.publisher ?? publisherFromUrl(url),
      retrievedAt: source.retrievedAt ?? new Date().toISOString(),
      type: source.type ?? displaySourceType(sourceType),
      supportsClaims:
        source.supportsClaims?.length
          ? source.supportsClaims
          : supportsClaimsForSource(sourceType, source.title),
      qualityTier: enriched.qualityTier ?? qualityForSourceType(sourceType)
    };
  });
}

function dedupeStoredSources(sources: Source[]) {
  const byUrl = new Map<string, EnrichedSource>();

  for (const source of sources) {
    if (!source.url) continue;
    const enriched = source as EnrichedSource;
    const url = normalizeSourceUrl(source.url);
    const sourceType = source.type ?? classifySource(url, source.title);
    const next: EnrichedSource = {
      ...source,
      url,
      type: source.type ?? displaySourceType(sourceType),
      qualityTier: enriched.qualityTier ?? qualityForSourceType(sourceType)
    };
    const current = byUrl.get(url);
    if (!current || candidateScore(next) > candidateScore(current)) {
      byUrl.set(url, next);
    }
  }

  return [...byUrl.values()].sort((a, b) => candidateScore(b) - candidateScore(a));
}

export function sourceMix(summaries: SourceSummary[]) {
  const deduped = dedupeSourceSummaries(summaries);
  const strongOrBetter = deduped.filter((source) =>
    ["official", "strong"].includes(source.qualityTier ?? "weak")
  ).length;
  const moderate = deduped.filter(
    (source) => (source.qualityTier ?? "weak") === "moderate"
  ).length;
  const weak = deduped.filter((source) => (source.qualityTier ?? "weak") === "weak").length;
  const official = deduped.filter((source) => source.qualityTier === "official").length;

  return {
    total: deduped.length,
    official,
    strongOrBetter,
    moderate,
    weak,
    hasReliableEvidence: strongOrBetter > 0
  };
}
