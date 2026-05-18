import "server-only";

import type {
  ClaimVerification,
  ExtractedEntityFacts,
  ReadablePage,
  SearchResult,
  SourceSummary
} from "./types";
import {
  classifySource,
  dedupeSourceSummaries,
  displaySourceType,
  normalizeSearchResults,
  normalizeSourceUrl,
  publisherFromUrl,
  qualityForSourceType,
  supportsClaimsForSource,
  type EnrichedSearchResult,
  type EnrichedSourceSummary
} from "./source-quality";
import {
  extractPublicSectorSignals,
  type PublicSectorConfidence
} from "./public-sector-recognition";

const deepTechSectorTerms = [
  ["Semiconductors", ["semiconductor", "chip", "rf", "substrate", "wafer", "compute"]],
  ["Robotics", ["robot", "autonomy", "drone", "inspection", "manipulation"]],
  ["Energy", ["energy", "battery", "thermal", "fusion", "grid", "hydrogen"]],
  ["Space", ["space", "satellite", "orbital", "launch", "nasa"]],
  ["Defense", ["defense", "dod", "darpa", "military", "dual-use"]],
  ["Biotechnology", ["bio", "therapeutic", "diagnostic", "cell", "protein"]],
  ["Materials", ["material", "composite", "ceramic", "polymer", "alloy"]]
] as const;

function titleCase(value: string) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.[a-z]{2,}.*$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function extractSentences(text: string, count = 4) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 35)
    .slice(0, count);
}

function detectSectors(text: string) {
  const lower = text.toLowerCase();
  const sectors = deepTechSectorTerms
    .filter(([, terms]) => terms.some((term) => lower.includes(term)))
    .map(([sector]) => sector);

  return sectors.length > 0 ? sectors : ["Deep Tech"];
}

export function summarizeSources(
  pages: ReadablePage[],
  searchResults: SearchResult[]
): SourceSummary[] {
  const pageSummaries: EnrichedSourceSummary[] = pages.map((page) => {
    const url = normalizeSourceUrl(page.url);
    const sourceTypeCategory = classifySource(url, page.title);
    const sourceText = `${page.title} ${page.description} ${page.text}`;
    return {
    url,
    title: page.title,
    sourceType: displaySourceType(sourceTypeCategory),
    sourceTypeCategory,
    publisher: publisherFromUrl(url),
    retrievedAt: new Date().toISOString(),
    qualityTier: qualityForSourceType(sourceTypeCategory),
    supportsClaims: supportsClaimsForSource(sourceTypeCategory, sourceText),
    keyFacts: extractSentences(`${page.description}. ${page.text}`, 5),
    claims: extractSentences(page.text, 5),
    numbers: Array.from(page.text.matchAll(/\b(?:19|20)\d{2}\b|[$€£]\s?\d+(?:\.\d+)?[MBK]?|\d+\s?(?:employees|customers|patents|MW|kW|GHz)/gi)).map(
      (match) => match[0]
    ).slice(0, 8),
    people: Array.from(page.text.matchAll(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g)).map(
      (match) => match[0]
    ).slice(0, 8),
    products: extractSentences(page.text, 3),
    dates: Array.from(page.text.matchAll(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b|\b(?:19|20)\d{2}\b/g)).map(
      (match) => match[0]
    ).slice(0, 8),
    uncertainty: ["Public extraction requires source verification before hard claims are published."]
    };
  });

  const normalizedResults = normalizeSearchResults(searchResults);
  const resultSummaries: EnrichedSourceSummary[] = normalizedResults
    .filter((result) => !pages.some((page) => page.url === result.url))
    .map((result) => ({
      url: result.url,
      title: result.title,
      sourceType: result.sourceType ?? displaySourceType(
        (result as EnrichedSearchResult).sourceTypeCategory ??
          classifySource(result.url, result.title)
      ),
      sourceTypeCategory:
        (result as EnrichedSearchResult).sourceTypeCategory ??
        classifySource(result.url, result.title),
      publisher: (result as EnrichedSearchResult).publisher ?? publisherFromUrl(result.url),
      retrievedAt: (result as EnrichedSearchResult).retrievedAt ?? new Date().toISOString(),
      qualityTier:
        (result as EnrichedSearchResult).qualityTier ??
        qualityForSourceType(classifySource(result.url, result.title)),
      supportsClaims:
        (result as EnrichedSearchResult).supportsClaims ??
        supportsClaimsForSource(classifySource(result.url, result.title), result.snippet),
      keyFacts: result.snippet ? [result.snippet] : [],
      claims: result.snippet ? [result.snippet] : [],
      numbers: [],
      people: [],
      products: [],
      dates: [],
      uncertainty: ["Search result snippet only; page content not fully verified."]
    }));

  return dedupeSourceSummaries([...pageSummaries, ...resultSummaries]).slice(0, 18);
}

export function extractEntityFacts(
  query: string,
  homepage: ReadablePage | null,
  sourceSummaries: SourceSummary[]
): ExtractedEntityFacts {
  const allText = [
    homepage?.title,
    homepage?.description,
    homepage?.text,
    ...sourceSummaries.flatMap((summary) => [
      summary.title,
      ...summary.keyFacts,
      ...summary.claims
    ])
  ]
    .filter(Boolean)
    .join(" ");
  const sectors = detectSectors(allText);
  const normalizedDomain =
    homepage?.url ? new URL(homepage.url).host.replace(/^www\./, "") : null;
  const fallbackName = normalizedDomain ? titleCase(normalizedDomain) : titleCase(query);
  const titleName = homepage?.title
    ?.replace(/\s+[|\-–]\s+.*$/, "")
    .replace(/\b(Home|Homepage)\b/gi, "")
    .trim();
  const name = titleName && titleName.length <= 60 ? titleName : fallbackName;
  const year = /\b(19|20)\d{2}\b/.exec(allText)?.[0] ?? null;
  const founders: string[] = [];
  const governmentLinks = sourceSummaries
    .filter((summary) => summary.sourceType === "government")
    .map((summary) => summary.url);
  const patents = sourceSummaries
    .filter((summary) => summary.sourceType === "patent")
    .map((summary) => summary.url);
  const papers = sourceSummaries
    .filter((summary) => summary.sourceType === "academic")
    .map((summary) => summary.url);
  const publicSectorSignals = sourceSummaries.map((summary) =>
    extractPublicSectorSignals(summary, [
      summary.title,
      ...summary.keyFacts,
      ...summary.claims
    ].join(" "))
  );
  const detectedAgencies = [
    ...new Set(publicSectorSignals.flatMap((signals) => signals.agencies))
  ];
  const detectedPatentIds = [
    ...new Set(publicSectorSignals.flatMap((signals) => signals.patentIds))
  ];
  const governmentSourceCount = sourceSummaries.filter(
    (summary) => summary.sourceType === "government"
  ).length;
  const patentSourceCount = sourceSummaries.filter(
    (summary) => summary.sourceType === "patent"
  ).length;
  const publicSectorConfidence: PublicSectorConfidence =
    governmentSourceCount + patentSourceCount > 0
      ? "high"
      : detectedAgencies.length || detectedPatentIds.length
        ? "medium"
        : "none";

  return {
    name,
    domain: normalizedDomain,
    website: homepage?.url ?? null,
    foundedYear: year,
    headquarters: null,
    founders,
    employeeCount: null,
    fundingStage: null,
    fundingAmount: null,
    investors: [],
    sector: sectors[0],
    secondarySectors: sectors.slice(1, 4),
    productSummary:
      homepage?.description ||
      sourceSummaries[0]?.keyFacts[0] ||
      "Not confirmed in public sources.",
    customerSegments:
      sectors[0] === "Robotics"
        ? ["Industrial operators", "Defense integrators", "Infrastructure teams"]
        : sectors[0] === "Energy"
          ? ["Industrial operators", "Energy developers", "Government demonstration programs"]
          : ["Aerospace partners", "Defense integrators", "Industrial technology teams"],
    businessModel: null,
    openRoles: sourceSummaries
      .filter((summary) => summary.sourceType === "jobs")
      .map((summary) => summary.title),
    patents,
    papers,
    governmentLinks,
    publicSector: {
      detectedAgencies,
      detectedPatentIds,
      publicSectorSignals: publicSectorSignals.filter(
        (signals) => signals.confidence !== "none"
      ),
      governmentSourceCount,
      patentSourceCount,
      publicSectorConfidence,
      publicSectorNotes: [
        governmentSourceCount > 0
          ? `${governmentSourceCount} government/public-sector source candidate(s) detected.`
          : "No government source was classified from available public sources.",
        patentSourceCount > 0
          ? `${patentSourceCount} patent source candidate(s) detected.`
          : "No patent source was classified from available public sources.",
        "Government relevance does not imply funding, procurement, customer status, endorsement, or revenue without explicit source support."
      ]
    },
    sourceUrls: sourceSummaries.map((summary) => summary.url),
    confidenceNotes: [
      homepage
        ? "Homepage was readable and used for initial extraction."
        : "Homepage was not readable; extraction used search result snippets.",
      "Fields not present in public sources are left unconfirmed.",
      "Deep-tech relevance is inferred from public language and source categories."
    ]
  };
}

export function verifyClaims(
  facts: ExtractedEntityFacts,
  summaries: SourceSummary[]
): ClaimVerification {
  const confirmed = [
    facts.website ? `Public website identified: ${facts.website}` : "",
    facts.name ? `Entity name identified as ${facts.name}` : "",
    facts.sector ? `Primary sector classified as ${facts.sector}` : ""
  ].filter(Boolean);
  const inferred = [
    `Customer segments are inferred as ${facts.customerSegments.join(", ")} from public positioning.`,
    `Deep-tech relevance is inferred from sector language and related source categories.`,
    summaries.some((summary) => summary.sourceType === "government")
      ? "Public-sector relevance is supported by at least one government source, but funding, procurement, and customer status require explicit evidence."
      : "Public-sector relevance is inferred from source context and has not been confirmed as funding, procurement, or customer activity."
  ];
  const unverified = [
    facts.fundingAmount ? "" : "Funding amount is not confirmed in public sources.",
    facts.headquarters ? "" : "Headquarters is not confirmed in public sources.",
    facts.employeeCount ? "" : "Employee count is not confirmed in public sources.",
    facts.investors?.length ? "" : "Investors are not confirmed in public sources.",
    "Revenue, customer deployments, manufacturing readiness, and qualification status are not confirmed.",
    "DeepTechly could not confirm a direct government contract, active procurement interest, or government customer relationship from available public sources."
  ].filter(Boolean);

  return { confirmed, inferred, unverified };
}
