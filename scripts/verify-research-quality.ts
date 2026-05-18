import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { ResearchEntity } from "@/lib/types";
import type { ClaimVerification, ExtractedEntityFacts, SourceSummary } from "@/lib/research/types";

type SourceSummaryWithClaims = SourceSummary & {
  supportsClaims?: string[];
};

delete process.env.OPENAI_API_KEY;
delete process.env.OPENAI_MODEL;

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (
    request: string,
    parent: unknown,
    isMain: boolean,
    options?: unknown
  ) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");

let shimInstalled = false;
let dossierMarkdown!: typeof import("@/lib/research/markdown").dossierMarkdown;
let extractEntityFacts!: typeof import("@/lib/research/extract").extractEntityFacts;
let verifyClaims!: typeof import("@/lib/research/extract").verifyClaims;
let generateResearchOutput!: typeof import("@/lib/research/generate").generateResearchOutput;
let classifySource!: typeof import("@/lib/research/source-quality").classifySource;
let dedupeSourceSummaries!: typeof import("@/lib/research/source-quality").dedupeSourceSummaries;
let normalizeSearchResults!: typeof import("@/lib/research/source-quality").normalizeSearchResults;
let normalizeSourceUrl!: typeof import("@/lib/research/source-quality").normalizeSourceUrl;
let normalizeStoredSources!: typeof import("@/lib/research/source-quality").normalizeStoredSources;
let publisherFromUrl!: typeof import("@/lib/research/source-quality").publisherFromUrl;
let supportsClaimsForSource!: typeof import("@/lib/research/source-quality").supportsClaimsForSource;

function installServerOnlyShim() {
  if (shimInstalled) return;
  moduleLoader._resolveFilename = function resolveServerOnly(
    request: string,
    parent: unknown,
    isMain: boolean,
    options?: unknown
  ) {
    if (request === "server-only") return serverOnlyStubPath;
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
  shimInstalled = true;
}

async function loadResearchModules() {
  installServerOnlyShim();
  const markdown = await import("@/lib/research/markdown");
  const extract = await import("@/lib/research/extract");
  const generate = await import("@/lib/research/generate");
  const sourceQuality = await import("@/lib/research/source-quality");

  dossierMarkdown = markdown.dossierMarkdown;
  extractEntityFacts = extract.extractEntityFacts;
  verifyClaims = extract.verifyClaims;
  generateResearchOutput = generate.generateResearchOutput;
  classifySource = sourceQuality.classifySource;
  dedupeSourceSummaries = sourceQuality.dedupeSourceSummaries;
  normalizeSearchResults = sourceQuality.normalizeSearchResults;
  normalizeSourceUrl = sourceQuality.normalizeSourceUrl;
  normalizeStoredSources = sourceQuality.normalizeStoredSources;
  publisherFromUrl = sourceQuality.publisherFromUrl;
  supportsClaimsForSource = sourceQuality.supportsClaimsForSource;
}

const bannedTerms = [
  "guaranteed",
  "revolutionary",
  "unmatched",
  "definitive",
  "government-backed",
  "DoD-funded",
  "NASA-backed",
  "DARPA-backed",
  "has government customers",
  "procurement-ready",
  "contracted by",
  "strategic government partner"
] as const;

function sourceSummary(overrides: Partial<SourceSummary>): SourceSummary {
  return {
    url: "https://example.com/source",
    title: "Example source",
    sourceType: "unknown",
    keyFacts: [],
    claims: [],
    numbers: [],
    people: [],
    products: [],
    dates: [],
    uncertainty: [],
    ...overrides
  };
}

function outputText(entity: ResearchEntity) {
  return JSON.stringify({
    entity,
    article: entity.article,
    dossier: entity.dossier,
    sources: entity.sources
  });
}

function assertNoBannedTerms(text: string, context: string) {
  const lower = text.toLowerCase();
  for (const term of bannedTerms) {
    assert.ok(
      !lower.includes(term.toLowerCase()),
      `${context} must not include unsupported banned term: ${term}`
    );
  }
}

function assertIncludesAny(text: string, expected: string[], context: string) {
  const lower = text.toLowerCase();
  assert.ok(
    expected.some((phrase) => lower.includes(phrase.toLowerCase())),
    `${context} must include one of: ${expected.join(" | ")}`
  );
}

async function generateFixture(
  query: string,
  summaries: SourceSummary[],
  factOverrides: Partial<ExtractedEntityFacts> = {},
  verificationOverrides: Partial<ClaimVerification> = {}
) {
  const facts = {
    ...extractEntityFacts(query, null, summaries),
    ...factOverrides
  };
  const verification = {
    ...verifyClaims(facts, summaries),
    ...verificationOverrides
  };

  const originalConsoleLog = console.log;
  console.log = (...args: unknown[]) => {
    if (args[0] === "OPENAI_API_KEY missing. Running research job in demo mode.") {
      return;
    }
    originalConsoleLog(...args);
  };
  try {
    return await generateResearchOutput({
      query,
      facts,
      verification,
      summaries,
      heroImage: null
    });
  } finally {
    console.log = originalConsoleLog;
  }
}

function verifySourceQualityRegressions() {
  const normalizedA = normalizeSourceUrl(
    "http://www.Example.com/path/?utm_source=newsletter&fbclid=abc#section"
  );
  const normalizedB = normalizeSourceUrl("https://example.com/path");
  assert.equal(normalizedA, normalizedB, "normalizes protocol, www, trailing slash, tracking params, and fragments");
  assert.equal(
    normalizeSourceUrl("https://example.com/path?b=2&utm_campaign=x&a=1"),
    "https://example.com/path?a=1&b=2",
    "sorts remaining query params after removing tracking params"
  );
  assert.equal(publisherFromUrl("https://www.NASA.gov/path"), "nasa.gov", "derives publisher from normalized URL");
  assert.equal(classifySource("https://www.nasa.gov/missions", "NASA mission"), "government", "classifies official government source");
  assert.equal(classifySource("https://patents.google.com/patent/US7654321B2", "Patent"), "patent", "classifies patent source");

  const sorted = normalizeSearchResults([
    { title: "Weak blog mention", url: "https://example.com/blog/deep-tech" },
    { title: "NASA mission page", url: "https://www.nasa.gov/missions/deep-tech" }
  ]);
  assert.equal(sorted[0].sourceType, "government", "official sources outrank weak search results");

  const claimSupportingDuplicate: SourceSummaryWithClaims = {
    ...sourceSummary({
      url: "https://example.com/company/",
      title: "Duplicate with claim support"
    }),
    supportsClaims: ["technical capability"]
  };
  const duplicateSummaries = dedupeSourceSummaries([
    sourceSummary({
      url: "http://www.example.com/company?utm_source=x#top",
      title: "Duplicate without claim support"
    }),
    claimSupportingDuplicate
  ]);
  assert.equal(duplicateSummaries.length, 1, "dedupes trailing slash/protocol/tracking variants");
  assert.equal(
    duplicateSummaries[0].title,
    "Duplicate with claim support",
    "claim-supporting duplicate outranks otherwise equal duplicate"
  );
  assert.ok(duplicateSummaries[0].retrievedAt, "adds retrievedAt when normalizing source summaries");
  assert.equal(duplicateSummaries[0].publisher, "example.com", "adds publisher when normalizing source summaries");

  const stored = normalizeStoredSources([
    {
      title: "Bare source",
      url: "https://www.example.com/company/?utm_medium=social",
      type: "unknown"
    },
    {
      title: "Richer source",
      url: "http://example.com/company#about",
      type: "unknown",
      supportsClaims: ["company identity"]
    }
  ]);
  assert.equal(stored.length, 1, "dedupes stored source variants");
  assert.equal(stored[0].title, "Richer source", "keeps higher scoring stored duplicate");
  assert.equal(stored[0].publisher, "example.com", "adds publisher to stored source");
  assert.ok(stored[0].retrievedAt, "adds retrievedAt to stored source");
}

async function verifyWeakDataBehavior() {
  const noSourceOutput = await generateFixture("thin quantum materials startup", [], {
    name: "Thin Quantum Materials",
    sourceUrls: []
  });
  assert.notEqual(noSourceOutput.entity.confidenceLabel, "HIGH CONFIDENCE", "no-source output cannot be high confidence");
  assert.ok(
    ["LOW CONFIDENCE", "LIMITED PUBLIC DATA"].includes(noSourceOutput.entity.confidenceLabel),
    "no-source output remains low or limited"
  );
  assert.equal(noSourceOutput.entity.fundingAmount, null, "does not fabricate funding amount");
  assert.deepEqual(noSourceOutput.entity.investors, [], "does not fabricate investors");
  assert.deepEqual(noSourceOutput.entity.founders, [], "does not fabricate founders");
  assert.equal(noSourceOutput.entity.headquarters, null, "does not fabricate headquarters");
  assertIncludesAny(
    outputText(noSourceOutput.entity),
    ["DeepTechly could not confirm", "Not confirmed in public sources"],
    "weak-data generated output"
  );
  assertIncludesAny(
    noSourceOutput.entity.dossier.accuracyAndConfidence.unverified.join(" "),
    ["Funding amount is not confirmed", "Revenue, customer deployments"],
    "weak-data unverified claims"
  );

  const weakOnly = Array.from({ length: 12 }, (_, index) =>
    sourceSummary({
      url: `https://example.com/blog/source-${index}?utm_source=test#frag`,
      title: `Weak blog mention ${index}`,
      claims: ["The company claims major traction, named government customers, revenue, and patents without official support."]
    })
  );
  const weakOnlyOutput = await generateFixture("weak source count test", weakOnly, {
    name: "Weak Source Count Test"
  });
  assert.notEqual(weakOnlyOutput.entity.confidenceLabel, "HIGH CONFIDENCE", "source count alone cannot create high confidence");
  assert.ok(weakOnlyOutput.entity.confidenceScore <= 34, "weak-only source count remains capped");
  assert.ok(
    weakOnlyOutput.entity.article.openQuestions?.some((question) =>
      /not confirmed|could not confirm|revenue|customer|funding/i.test(question)
    ),
    "unsupported high-risk claims remain open questions"
  );
}

async function verifyClaimSafety() {
  const governmentClaims = supportsClaimsForSource(
    "government",
    "NASA mission overview for aerospace technology and agency relevance."
  );
  assert.ok(governmentClaims.includes("government_relevance"), "government source supports government relevance");
  assert.ok(!governmentClaims.includes("government_contract"), "government source does not imply contract by default");
  assert.ok(!governmentClaims.includes("government_funding"), "government source does not imply funding by default");

  const patentClaims = supportsClaimsForSource(
    "patent",
    "Patent record for a technical apparatus."
  );
  assert.ok(patentClaims.includes("patent"), "patent source supports patent claim");
  assert.ok(!patentClaims.includes("patent_assignee"), "patent source does not imply ownership by default");
  assert.ok(!patentClaims.includes("patent_license_available"), "patent source does not imply license availability by default");

  const governmentOutput = await generateFixture(
    "public sector relevance test",
    [
      sourceSummary({
        url: "https://www.darpa.mil/program/example",
        title: "DARPA example program",
        sourceType: "government",
        keyFacts: ["DARPA describes a technical program area."]
      })
    ],
    {
      name: "Public Sector Relevance Test",
      governmentLinks: ["https://www.darpa.mil/program/example"],
      publicSector: {
        detectedAgencies: ["DARPA"],
        detectedPatentIds: [],
        publicSectorSignals: [],
        governmentSourceCount: 1,
        patentSourceCount: 0,
        publicSectorConfidence: "high",
        publicSectorNotes: [
          "Government source candidate detected.",
          "Government relevance does not imply funding, procurement, customer status, endorsement, or revenue without explicit source support."
        ]
      }
    }
  );
  const governmentText = outputText(governmentOutput.entity);
  assertIncludesAny(
    governmentText,
    [
      "DeepTechly could not confirm funding, procurement, customer status, or endorsement",
      "DeepTechly could not confirm active procurement interest"
    ],
    "government output caution language"
  );
  assertNoBannedTerms(governmentText, "government output");

  const patentOutput = await generateFixture(
    "patent source safety test",
    [
      sourceSummary({
        url: "https://patents.google.com/patent/US10123456B2",
        title: "Patent record",
        sourceType: "patent",
        keyFacts: ["Patent records indicate related IP activity."]
      })
    ],
    {
      name: "Patent Source Safety Test",
      patents: ["https://patents.google.com/patent/US10123456B2"],
      publicSector: {
        detectedAgencies: [],
        detectedPatentIds: ["US10123456B2"],
        publicSectorSignals: [],
        governmentSourceCount: 0,
        patentSourceCount: 1,
        publicSectorConfidence: "high",
        publicSectorNotes: ["Patent source candidate detected."]
      }
    }
  );
  const patentText = outputText(patentOutput.entity);
  assertIncludesAny(
    patentText,
    [
      "not product readiness, ownership, exclusivity, or an active license by itself",
      "Patent ownership, exclusivity, active license status"
    ],
    "patent output caution language"
  );
  assertNoBannedTerms(patentText, "patent output");
}

async function verifyPublicGatedSerialization() {
  const output = await generateFixture(
    "public gated serialization test",
    [
      sourceSummary({
        url: "https://example.com/company",
        title: "Company overview",
        sourceType: "company_site",
        keyFacts: ["Company describes a technical product."]
      })
    ],
    {
      name: "Public Gated Serialization Test"
    }
  );
  const markdown = dossierMarkdown({
    ...output.entity,
    resolutionMetadata: {
      normalizedName: "private raw metadata",
      normalizedDomain: "private.example",
      aliases: ["private alias"],
      entityInputType: "company",
      resolutionConfidence: "high",
      resolutionNotes: ["internal note"]
    }
  });
  const forbiddenPublicMarkdown = [
    "Technology Stack",
    "White-Space Analysis",
    "Revenue Scenarios",
    "Senior Team",
    "Culture and Team Health",
    "Traction and Metrics",
    "institutionalMarkdown",
    "institutional_md",
    "auth_user_id",
    "private raw metadata",
    "private@example.com"
  ];

  for (const phrase of forbiddenPublicMarkdown) {
    assert.ok(
      !markdown.includes(phrase),
      `public dossier markdown must not serialize gated/private field: ${phrase}`
    );
  }
  assert.ok(
    markdown.includes("This markdown route includes only public dossier sections"),
    "public dossier markdown includes public access notice"
  );
}

function verifyBannedLanguageTemplates() {
  const generateSource = readFileSync(
    join(process.cwd(), "lib/research/generate.ts"),
    "utf8"
  );
  const lines = generateSource.split("\n");
  for (const [index, line] of lines.entries()) {
    for (const term of bannedTerms) {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        assert.ok(
          line.includes("NEVER use"),
          `unsupported banned term "${term}" appears outside a prompt guard at lib/research/generate.ts:${index + 1}`
        );
      }
    }
  }
}

async function main() {
  await loadResearchModules();
  verifySourceQualityRegressions();
  await verifyWeakDataBehavior();
  await verifyClaimSafety();
  await verifyPublicGatedSerialization();
  verifyBannedLanguageTemplates();

  console.log("Research quality verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
