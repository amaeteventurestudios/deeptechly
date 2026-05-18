import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { ResearchEntity, Source } from "@/lib/types";
import type { ResearchJob, StoredDossier, StoredResearchArticle } from "@/lib/research/types";

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

moduleLoader._resolveFilename = function resolveServerOnly(
  request: string,
  parent: unknown,
  isMain: boolean,
  options?: unknown
) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

let buildAdminResearchReview!: typeof import("@/lib/admin/research-review").buildAdminResearchReview;

const officialSource: Source = {
  title: "Titanym official technology page",
  url: "https://titanym.com/technology",
  publisher: "titanym.com",
  type: "company_site",
  supportsClaims: ["company identity", "technical capability"]
};

const patentSource: Source = {
  title: "US Patent US1234567B2",
  url: "https://patents.google.com/patent/US1234567B2",
  publisher: "patents.google.com",
  type: "patent",
  supportsClaims: ["patent"]
};

const governmentSource: Source = {
  title: "NASA SBIR topic",
  url: "https://sbir.nasa.gov/topic/example",
  publisher: "sbir.nasa.gov",
  type: "government",
  supportsClaims: ["government_relevance", "sbir_sttr"],
  publicSectorSignals: {
    agencies: ["NASA", "SBIR"],
    patentIds: [],
    programs: ["NASA SBIR topic"],
    hasPatentSource: false,
    hasGovernmentSource: true,
    hasSBIRSTTR: true,
    hasTechnologyTransfer: false,
    documentTypes: ["sbir_sttr_award_or_topic"],
    sourceFamilies: ["agency", "sbir_sttr"],
    confidence: "high",
    notes: ["Government/public-sector source classification is source-backed."]
  }
};

const weakSource = (index: number): Source => ({
  title: `Weak blog ${index}`,
  url: `https://example.com/blog/${index}`,
  publisher: "example.com",
  type: "unknown"
});

function job(overrides: Partial<ResearchJob> = {}): ResearchJob {
  return {
    id: "job_review",
    userId: "user_a",
    query: "Titanym",
    normalizedQuery: "Titanym",
    mode: "company",
    stage: "done",
    progress: 100,
    message: "Done",
    detail: "Research complete and published",
    statusLabel: "DONE",
    sourceCount: 3,
    resolvedDomain: "titanym.com",
    resolvedName: "Titanym",
    resolutionStatus: "resolved",
    stageStartedAt: "2026-05-18T15:00:00.000Z",
    publicResearchReadyAt: "2026-05-18T15:20:00.000Z",
    cancellationRequested: false,
    error: null,
    articleId: "article_titanym",
    entityId: "titanym",
    dossierId: "dossier_titanym",
    articleUrl: "/article/titanym",
    profileUrl: "/startup/titanym",
    dossierUrl: "/dossier/titanym",
    orchestration: {
      lockKey: "entity:titanym",
      inputFingerprint: "entity:titanym",
      attemptCount: 1,
      maxAttempts: 3,
      retryable: false,
      failureType: null
    },
    feed: {
      slug: "titanym",
      entityName: "Titanym",
      articleTitle: "Titanym profile",
      articleDek: "Research profile.",
      summary: "Verified technical profile.",
      sector: "Space",
      confidenceLabel: "HIGH CONFIDENCE",
      confidenceScore: 86,
      sourceCount: 3,
      heroImage: null,
      publishedAt: "2026-05-18T15:30:00.000Z"
    },
    createdAt: "2026-05-18T15:00:00.000Z",
    updatedAt: "2026-05-18T15:30:00.000Z",
    completedAt: "2026-05-18T15:30:00.000Z",
    ...overrides
  };
}

function entity(overrides: Partial<ResearchEntity> = {}): ResearchEntity {
  const sources = overrides.sources ?? [officialSource, governmentSource, patentSource];
  return {
    slug: "titanym",
    name: "Titanym",
    entityType: "Company",
    domain: "titanym.com",
    website: "https://titanym.com",
    sector: "Space",
    secondarySectors: [],
    region: "US",
    stage: "Growth",
    summary: "Titanym builds aerospace materials with public-sector relevance.",
    description: "Public-source research profile.",
    tags: [],
    sourceCount: sources.length,
    confidenceScore: 86,
    confidenceLabel: "HIGH CONFIDENCE",
    lastResearchedAt: "2026-05-18T15:30:00.000Z",
    publishedStatus: "published",
    externalLinks: [],
    snapshot: {
      entityType: "Company",
      primarySector: "Space",
      secondarySectors: [],
      region: "US",
      stage: "Growth",
      sourceCount: sources.length,
      confidence: "HIGH CONFIDENCE",
      researchStatus: "complete"
    },
    taxonomy: {} as ResearchEntity["taxonomy"],
    article: {} as ResearchEntity["article"],
    dossier: dossier({ sources }).dossier,
    sources,
    relatedEntities: [],
    ...overrides
  };
}

function article(overrides: Partial<StoredResearchArticle> = {}): StoredResearchArticle {
  return {
    id: "article_titanym",
    slug: "titanym",
    entityId: "titanym",
    title: "Titanym profile",
    dek: "Research profile.",
    authorPersona: "Axon Reyes",
    heroImage: null,
    bodySections: [{ title: "Overview", body: ["Source-attributed profile."] }],
    tags: [],
    sectorTags: ["Space"],
    sources: [officialSource, governmentSource, patentSource],
    publishedStatus: "published",
    adminFeatured: false,
    publishedAt: "2026-05-18T15:30:00.000Z",
    createdAt: "2026-05-18T15:00:00.000Z",
    updatedAt: "2026-05-18T15:30:00.000Z",
    ...overrides
  };
}

function dossier(overrides: { sources?: Source[]; unverified?: string[] } = {}): StoredDossier {
  const sources = overrides.sources ?? [officialSource, governmentSource, patentSource];
  return {
    id: "dossier_titanym",
    slug: "titanym",
    entityId: "titanym",
    publishedStatus: "published",
    createdAt: "2026-05-18T15:00:00.000Z",
    updatedAt: "2026-05-18T15:30:00.000Z",
    dossier: {
      executiveSummary: ["Summary"],
      taxonomySnapshot: {} as ResearchEntity["taxonomy"],
      companyOverview: ["Overview"],
      productAndTechnology: ["Product is source-supported."],
      productTechnologyFacts: {
        coreSystem: "System",
        primaryTechnicalAdvantage: "Advantage",
        keyDependencies: "Dependencies",
        validationNeeded: "Validation",
        deploymentEnvironment: "Space"
      },
      marketResearch: [],
      customerSegments: [],
      dataSnapshot: {
        sourceCount: sources.length,
        confidenceScore: 86,
        trl: 5,
        mrl: 4,
        riskScore: 40,
        sectorActivity: 60
      },
      accuracyAndConfidence: {
        label: "HIGH CONFIDENCE",
        confirmed: ["Company identity", "Technical capability"],
        inferred: ["Market position"],
        unverified: overrides.unverified ?? []
      },
      competitiveLandscape: [],
      companyPositioning: {
        whereItCompetes: "Space",
        whereItMayDifferentiate: "Materials",
        whereItIsExposed: "Validation",
        likelyBuyer: "Commercial",
        strategicWedge: "Manufacturing"
      },
      opportunity: {
        commercial: [],
        government: ["NASA relevance is source-supported."],
        technical: [],
        partnerships: []
      },
      scenarios: [],
      investorRead: [],
      foundersAndTeam: [],
      seniorTeam: [],
      teamSignalForInvestors: [],
      cultureAndTeamHealth: [],
      hiringSignal: [],
      tractionAndMetrics: [],
      socialAndPRSignal: [],
      revenueAndUnitEconomics: [],
      bestCaseScenario: [],
      baseCaseScenario: [],
      downsideScenario: [],
      risksAndConstraints: [],
      strategicOutlook: [],
      sources,
      relatedResearch: []
    }
  };
}

function warningCodes(summary: ReturnType<typeof buildAdminResearchReview>) {
  return summary.warnings.map((warning) => warning.code);
}

function verifyReadyStatus() {
  const summary = buildAdminResearchReview({
    job: job(),
    entity: entity(),
    article: article(),
    dossier: dossier()
  });
  assert.equal(summary.publishReadiness.status, "READY");
  assert.equal(summary.sourceQualitySummary.official, 3);
  assert.equal(summary.publicSectorSummary.governmentSourceCount, 1);
  assert.equal(summary.patentSummary.patentSourceCount, 1);
}

function verifyReviewRecommended() {
  const summary = buildAdminResearchReview({
    job: job({ feed: null }),
    entity: entity({
      confidenceLabel: "LIMITED PUBLIC DATA",
      confidenceScore: 35,
      publishedStatus: "draft"
    }),
    article: article({ publishedStatus: "draft" }),
    dossier: dossier()
  });
  assert.equal(summary.publishReadiness.status, "REVIEW RECOMMENDED");
  assert.ok(warningCodes(summary).includes("LIMITED PUBLIC DATA"));
  assert.ok(warningCodes(summary).includes("DRAFT CONTENT"));
}

function verifyNotReadyForFailedOrMissing() {
  const failed = buildAdminResearchReview({
    job: job({ stage: "failed", error: "Network timeout", orchestration: { lockKey: "entity:titanym", inputFingerprint: "entity:titanym", attemptCount: 2, maxAttempts: 3, retryable: true, failureType: "timeout" } }),
    entity: entity(),
    article: article(),
    dossier: dossier()
  });
  assert.equal(failed.publishReadiness.status, "NOT READY");
  assert.ok(warningCodes(failed).includes("FAILED JOB"));
  assert.ok(warningCodes(failed).includes("STUCK OR RETRYABLE JOB"));

  const missing = buildAdminResearchReview({ job: job(), entity: null, article: null, dossier: null });
  assert.equal(missing.publishReadiness.status, "NOT READY");
}

function verifySourceWarnings() {
  const noSources = buildAdminResearchReview({
    job: job({ sourceCount: 0 }),
    entity: entity({ sources: [], sourceCount: 0 }),
    article: article({ sources: [] }),
    dossier: dossier({ sources: [] })
  });
  assert.ok(warningCodes(noSources).includes("NO SOURCES"));
  assert.equal(noSources.publishReadiness.status, "NOT READY");

  const weakSources = [weakSource(1), weakSource(2), weakSource(3), officialSource];
  const mostlyWeak = buildAdminResearchReview({
    job: job(),
    entity: entity({ sources: weakSources, sourceCount: weakSources.length }),
    article: article({ sources: weakSources }),
    dossier: dossier({ sources: weakSources })
  });
  assert.ok(warningCodes(mostlyWeak).includes("MOSTLY WEAK SOURCES"));
  assert.equal(mostlyWeak.publishReadiness.status, "REVIEW RECOMMENDED");
}

function verifyPublicSectorAndPatentWarnings() {
  const unsupportedGovernment = buildAdminResearchReview({
    job: job(),
    entity: entity({
      sources: [officialSource],
      summary: "Company may be relevant to NASA and DoD missions.",
      sourceCount: 1
    }),
    article: article({ sources: [officialSource] }),
    dossier: dossier({ sources: [officialSource] })
  });
  assert.ok(warningCodes(unsupportedGovernment).includes("PUBLIC-SECTOR CLAIMS NEED REVIEW"));

  const unsupportedPatent = buildAdminResearchReview({
    job: job(),
    entity: entity({
      sources: [officialSource],
      description: "The company discusses patent ownership and licensing potential.",
      sourceCount: 1
    }),
    article: article({ sources: [officialSource] }),
    dossier: dossier({ sources: [officialSource] })
  });
  assert.ok(warningCodes(unsupportedPatent).includes("PATENT CLAIMS NEED REVIEW"));
}

function verifyClaimAuditWarning() {
  const summary = buildAdminResearchReview({
    job: job(),
    entity: entity(),
    article: article(),
    dossier: dossier({
      unverified: ["Funding", "Customers", "Revenue", "Contracts"]
    })
  });
  assert.ok(warningCodes(summary).includes("UNVERIFIED HIGH-RISK CLAIMS"));
  assert.equal(summary.claimAuditSummary.unverified, 4);
}

async function main() {
  ({ buildAdminResearchReview } = await import("@/lib/admin/research-review"));

  verifyReadyStatus();
  verifyReviewRecommended();
  verifyNotReadyForFailedOrMissing();
  verifySourceWarnings();
  verifyPublicSectorAndPatentWarnings();
  verifyClaimAuditWarning();

  console.log("Admin research review verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
