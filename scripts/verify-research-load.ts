import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { ResearchEntity, Source } from "@/lib/types";
import type {
  ResearchJob,
  ResearchStage,
  StoredDossier,
  StoredResearchArticle
} from "@/lib/research/types";
import {
  buildJobLockKey,
  canRetryResearchJob,
  getAttemptCount,
  jobMatchesInput,
  safeErrorMessage,
  shouldMarkJobStuck,
  shouldReuseActiveJob
} from "@/lib/research/orchestration";

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
let normalizeStoredSources!: typeof import("@/lib/research/source-quality").normalizeStoredSources;

const now = new Date("2026-05-18T16:00:00.000Z");
const startedAt = Date.now();
const metrics = {
  simulatedJobs: 0,
  duplicateInputs: 0,
  dedupedSources: 0,
  adminReviewRecords: 0
};

function source(overrides: Partial<Source> = {}): Source {
  return {
    title: "Source",
    url: "https://example.com/source",
    publisher: "example.com",
    type: "unknown",
    ...overrides
  };
}

const officialSource = source({
  title: "Titanym official technology page",
  url: "https://www.titanym.com/technology",
  publisher: "titanym.com",
  type: "company_site",
  supportsClaims: ["company identity", "technical capability"]
});

const governmentSource = source({
  title: "NASA SBIR topic",
  url: "https://sbir.nasa.gov/topic/deep-tech",
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
});

const patentSource = source({
  title: "US Patent US1234567B2",
  url: "https://patents.google.com/patent/US1234567B2",
  publisher: "patents.google.com",
  type: "patent",
  supportsClaims: ["patent"],
  publicSectorSignals: {
    agencies: [],
    patentIds: ["US1234567B2"],
    programs: [],
    hasPatentSource: true,
    hasGovernmentSource: false,
    hasSBIRSTTR: false,
    hasTechnologyTransfer: false,
    documentTypes: [],
    sourceFamilies: ["patent_database"],
    confidence: "high",
    notes: ["Patent classification is source-backed or identifier-backed."]
  }
});

function weakSource(index: number): Source {
  return source({
    title: `Weak mention ${index}`,
    url: `https://example.com/blog/company?utm_source=newsletter&ref=${index}#section`,
    type: "unknown",
    supportsClaims: []
  });
}

function job(overrides: Partial<ResearchJob> = {}): ResearchJob {
  const query = overrides.query ?? "Titanym";
  const normalizedQuery = overrides.normalizedQuery ?? query;
  const stage = overrides.stage ?? "queued";
  const createdAt = overrides.createdAt ?? "2026-05-18T15:50:00.000Z";
  const mode = overrides.mode ?? "company";

  return {
    id: overrides.id ?? `job_${Math.random().toString(36).slice(2)}`,
    userId: overrides.userId ?? "user_a",
    query,
    normalizedQuery,
    mode,
    stage,
    progress: overrides.progress ?? progressForStage(stage),
    message: overrides.message ?? "Queued",
    detail: overrides.detail ?? "Waiting to begin research",
    statusLabel: overrides.statusLabel ?? statusLabelForStage(stage),
    sourceCount: overrides.sourceCount ?? 0,
    resolvedDomain: overrides.resolvedDomain ?? null,
    resolvedName: overrides.resolvedName ?? null,
    resolutionStatus: overrides.resolutionStatus ?? null,
    stageStartedAt: overrides.stageStartedAt ?? createdAt,
    publicResearchReadyAt: overrides.publicResearchReadyAt ?? null,
    cancellationRequested: overrides.cancellationRequested ?? false,
    error: overrides.error ?? null,
    articleId: overrides.articleId ?? null,
    entityId: overrides.entityId ?? null,
    dossierId: overrides.dossierId ?? null,
    articleUrl: overrides.articleUrl ?? null,
    profileUrl: overrides.profileUrl ?? null,
    dossierUrl: overrides.dossierUrl ?? null,
    orchestration: overrides.orchestration ?? {
      lockKey: buildJobLockKey({ query, normalizedQuery }),
      inputFingerprint: buildJobLockKey({ query }),
      attemptCount: 0,
      maxAttempts: 3,
      retryable: false,
      failureType: null
    },
    feed: overrides.feed ?? null,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    completedAt: overrides.completedAt ?? null
  };
}

function progressForStage(stage: ResearchStage) {
  if (stage === "done" || stage === "failed" || stage === "cancelled") return 100;
  if (stage === "public_research_ready") return 98;
  if (stage === "drafting_outputs") return 88;
  return 5;
}

function statusLabelForStage(stage: ResearchStage): ResearchJob["statusLabel"] {
  if (stage === "done") return "DONE";
  if (stage === "failed") return "FAILED";
  if (stage === "cancelled") return "CANCELLED";
  if (stage === "public_research_ready") return "READY";
  return "QUEUED";
}

function entity(overrides: Partial<ResearchEntity> = {}): ResearchEntity {
  const sources = overrides.sources ?? [officialSource, governmentSource, patentSource];
  const confidenceLabel = overrides.confidenceLabel ?? "HIGH CONFIDENCE";
  const confidenceScore = overrides.confidenceScore ?? 86;

  return {
    slug: overrides.slug ?? "titanym",
    name: overrides.name ?? "Titanym",
    entityType: overrides.entityType ?? "Company",
    domain: overrides.domain ?? "titanym.com",
    website: overrides.website ?? "https://titanym.com",
    sector: overrides.sector ?? "Space",
    secondarySectors: overrides.secondarySectors ?? [],
    region: overrides.region ?? "US",
    stage: overrides.stage ?? "Growth",
    summary: overrides.summary ?? "Source-backed aerospace materials profile.",
    description: overrides.description ?? "Public-source research profile.",
    tags: overrides.tags ?? [],
    sourceCount: overrides.sourceCount ?? sources.length,
    confidenceScore,
    confidenceLabel,
    lastResearchedAt: overrides.lastResearchedAt ?? "2026-05-18T15:30:00.000Z",
    publishedStatus: overrides.publishedStatus ?? "published",
    externalLinks: overrides.externalLinks ?? [],
    snapshot: {
      entityType: overrides.entityType ?? "Company",
      primarySector: overrides.sector ?? "Space",
      secondarySectors: [],
      region: "US",
      stage: "Growth",
      sourceCount: sources.length,
      confidence: confidenceLabel,
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
  const sources = overrides.sources ?? [officialSource, governmentSource, patentSource];
  return {
    id: overrides.id ?? "article_titanym",
    slug: overrides.slug ?? "titanym",
    entityId: overrides.entityId ?? "titanym",
    title: overrides.title ?? "Titanym profile",
    dek: overrides.dek ?? "Research profile.",
    authorPersona: overrides.authorPersona ?? "Axon Reyes",
    heroImage: overrides.heroImage ?? null,
    bodySections: overrides.bodySections ?? [
      { title: "Overview", body: ["Source-attributed profile."] }
    ],
    tags: overrides.tags ?? [],
    sectorTags: overrides.sectorTags ?? ["Space"],
    sources,
    publishedStatus: overrides.publishedStatus ?? "published",
    adminFeatured: overrides.adminFeatured ?? false,
    publishedAt: overrides.publishedAt ?? "2026-05-18T15:30:00.000Z",
    createdAt: overrides.createdAt ?? "2026-05-18T15:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-18T15:30:00.000Z"
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

function simulateSubmission(existingJobs: ResearchJob[], input: string, userId: string) {
  const reusable = existingJobs.find((candidate) =>
    shouldReuseActiveJob(candidate, input, userId)
  );
  if (reusable) return reusable;

  const created = job({
    id: `job_${existingJobs.length + 1}`,
    userId,
    query: input,
    normalizedQuery: input
  });
  existingJobs.unshift(created);
  return created;
}

function upsertBySlug<T extends { slug: string }>(items: T[], item: T) {
  return [item, ...items.filter((candidate) => candidate.slug !== item.slug)];
}

function sortQueueLikeStore(jobs: ResearchJob[]) {
  const rank = (candidate: ResearchJob) => {
    if (!["done", "failed", "cancelled", "public_research_ready"].includes(candidate.stage)) {
      return 0;
    }
    if (candidate.stage === "done" || candidate.stage === "public_research_ready") return 1;
    return 2;
  };
  return [...jobs].sort((a, b) => {
    const rankDelta = rank(a) - rank(b);
    if (rankDelta !== 0) return rankDelta;
    return (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt);
  });
}

function verifyDuplicateSubmissionLoad() {
  const jobs = [
    job({
      id: "active_titanym",
      userId: "user_a",
      query: "https://www.titanym.com/",
      normalizedQuery: "titanym.com",
      resolvedDomain: "titanym.com",
      stage: "searching_web",
      orchestration: {
        lockKey: "domain:titanym.com",
        inputFingerprint: "domain:titanym.com",
        attemptCount: 1,
        maxAttempts: 3,
        retryable: false,
        failureType: null
      }
    })
  ];
  const inputs = Array.from({ length: 25 }, (_, index) =>
    index % 2 === 0 ? "titanym.com" : "https://www.titanym.com/"
  );
  const results = inputs.map((input) => simulateSubmission(jobs, input, "user_a"));
  metrics.duplicateInputs += inputs.length;
  metrics.simulatedJobs += jobs.length;

  assert.equal(new Set(results.map((candidate) => candidate.id)).size, 1);
  assert.equal(jobs.length, 1, "same user equivalent submissions reuse one active job");

  const otherUser = simulateSubmission(jobs, "titanym.com", "user_b");
  assert.notEqual(otherUser.id, "active_titanym");
  assert.equal(otherUser.userId, "user_b", "same input from another user remains isolated");

  assert.equal(
    shouldReuseActiveJob(jobs[0], "US Patent 1234567B2", "user_a"),
    false,
    "patent input does not false-merge into company job"
  );
  assert.equal(
    shouldReuseActiveJob(jobs[0], "DARPA NOM4D program", "user_a"),
    false,
    "government program input does not false-merge into company job"
  );
}

function verifyCompletedReuseIdempotency() {
  const generatedEntity = entity();
  const generatedArticle = article();
  const generatedDossier = dossier();
  const entities = Array.from({ length: 20 }).reduce<ResearchEntity[]>(
    (items) => upsertBySlug(items, generatedEntity),
    []
  );
  const articles = Array.from({ length: 20 }).reduce<StoredResearchArticle[]>(
    (items) => upsertBySlug(items, generatedArticle),
    []
  );
  const dossiers = Array.from({ length: 20 }).reduce<StoredDossier[]>(
    (items) => upsertBySlug(items, generatedDossier),
    []
  );

  assert.equal(entities.length, 1);
  assert.equal(articles.length, 1);
  assert.equal(dossiers.length, 1);
  assert.equal(jobMatchesInput(job({ resolvedName: "Titanym", stage: "done" }), "Titanym Inc"), true);
}

function verifyRetryAndStuckLoad() {
  const transient = job({
    stage: "failed",
    error: "Network timeout",
    completedAt: null,
    orchestration: {
      lockKey: "entity:titanym",
      inputFingerprint: "entity:titanym",
      attemptCount: 1,
      maxAttempts: 3,
      nextRetryAt: "2026-05-18T15:59:00.000Z",
      retryable: true,
      failureType: "transient"
    }
  });
  const beforeAttempt = getAttemptCount(transient);
  for (let index = 0; index < 50; index += 1) {
    assert.equal(canRetryResearchJob(transient, now), true);
    assert.equal(getAttemptCount(transient), beforeAttempt);
  }

  assert.equal(
    canRetryResearchJob(
      job({
        stage: "failed",
        error: "invalid input",
        orchestration: {
          lockKey: "entity:bad",
          inputFingerprint: "entity:bad",
          attemptCount: 1,
          maxAttempts: 3,
          retryable: false,
          failureType: "permanent"
        }
      }),
      now
    ),
    false
  );
  assert.equal(
    canRetryResearchJob(
      job({
        stage: "done",
        completedAt: "2026-05-18T15:30:00.000Z",
        articleUrl: "/article/titanym",
        profileUrl: "/startup/titanym",
        dossierUrl: "/dossier/titanym"
      }),
      now
    ),
    false
  );

  const staleJobs = Array.from({ length: 100 }, (_, index) =>
    job({
      id: `stale_${index}`,
      stage: index % 2 === 0 ? "searching_web" : "finalizing_dossier",
      createdAt: "2026-05-18T15:00:00.000Z",
      stageStartedAt: "2026-05-18T15:20:00.000Z",
      updatedAt: "2026-05-18T15:20:00.000Z"
    })
  );
  const freshJobs = Array.from({ length: 100 }, (_, index) =>
    job({
      id: `fresh_${index}`,
      stage: "searching_web",
      updatedAt: "2026-05-18T15:55:00.000Z"
    })
  );
  assert.equal(staleJobs.every((candidate) => shouldMarkJobStuck(candidate, now)), true);
  assert.equal(freshJobs.some((candidate) => shouldMarkJobStuck(candidate, now)), false);
  assert.equal(safeErrorMessage("Error: stack trace at handler with apikey redacted"), "Research failed. We could not complete this research job. Try a more specific company name, domain, patent number, or source URL.");
  metrics.simulatedJobs += staleJobs.length + freshJobs.length + 3;
}

function verifySourceLoadBehavior() {
  const sourceVariants = [
    officialSource,
    source({
      title: "Weak duplicate",
      url: "http://www.titanym.com/technology?utm_source=x#team",
      type: "unknown"
    }),
    ...Array.from({ length: 40 }, (_, index) => weakSource(index))
  ];
  const deduped = normalizeStoredSources(sourceVariants);
  metrics.dedupedSources = sourceVariants.length - deduped.length;

  assert.equal(deduped[0].type, "company_site", "official duplicate outranks weak duplicate");
  assert.ok(deduped.length < sourceVariants.length, "tracking variants are deduped");

  const weakOnly = Array.from({ length: 30 }, (_, index) => weakSource(index));
  const weakReview = buildAdminResearchReview({
    job: job({ sourceCount: weakOnly.length, feed: null }),
    entity: entity({
      sources: weakOnly,
      sourceCount: weakOnly.length,
      confidenceLabel: "LIMITED PUBLIC DATA",
      confidenceScore: 35
    }),
    article: article({ sources: weakOnly }),
    dossier: dossier({ sources: weakOnly })
  });
  assert.equal(weakReview.publishReadiness.status, "REVIEW RECOMMENDED");
  assert.ok(weakReview.warnings.some((warning) => warning.code === "MOSTLY WEAK SOURCES"));

  const publicSectorReview = buildAdminResearchReview({
    job: job(),
    entity: entity({ sources: [governmentSource, patentSource] }),
    article: article({ sources: [governmentSource, patentSource] }),
    dossier: dossier({ sources: [governmentSource, patentSource] })
  });
  const warningText = publicSectorReview.warnings.map((warning) => warning.detail).join(" ");
  assert.equal(/funded by|contracted by|exclusive|license status|customer relationship/i.test(warningText), false);
}

function verifyAdminReviewLoadBehavior() {
  const records = [
    { job: job(), entity: entity(), article: article(), dossier: dossier() },
    {
      job: job({ feed: null }),
      entity: entity({ confidenceLabel: "LOW CONFIDENCE", confidenceScore: 20 }),
      article: article(),
      dossier: dossier()
    },
    { job: job({ stage: "failed", error: "Network timeout", orchestration: { lockKey: "entity:titanym", inputFingerprint: "entity:titanym", attemptCount: 2, maxAttempts: 3, retryable: true, failureType: "timeout" } }), entity: entity(), article: article(), dossier: dossier() },
    { job: job(), entity: entity({ sources: [], sourceCount: 0 }), article: article({ sources: [] }), dossier: dossier({ sources: [] }) },
    { job: job(), entity: entity({ sources: [officialSource], summary: "Relevant to NASA and DoD missions.", sourceCount: 1 }), article: article({ sources: [officialSource] }), dossier: dossier({ sources: [officialSource] }) },
    { job: job(), entity: null, article: null, dossier: null }
  ];
  const expanded = Array.from({ length: 15 }, () => records).flat();
  const summaries = expanded.map((record) => buildAdminResearchReview(record));
  metrics.adminReviewRecords = summaries.length;

  assert.ok(summaries.some((summary) => summary.publishReadiness.status === "READY"));
  assert.ok(summaries.some((summary) => summary.publishReadiness.status === "REVIEW RECOMMENDED"));
  assert.ok(summaries.some((summary) => summary.publishReadiness.status === "NOT READY"));
  assert.ok(summaries.some((summary) => summary.warnings.some((warning) => warning.code === "NO SOURCES")));
  assert.ok(summaries.some((summary) => summary.warnings.some((warning) => warning.code === "FAILED JOB")));
  assert.ok(summaries.every((summary) => !JSON.stringify(summary).includes("service_role")));
}

function verifyQueueSortingLoadBehavior() {
  const jobs = [
    job({ id: "failed", stage: "failed", updatedAt: "2026-05-18T15:59:00.000Z" }),
    job({ id: "done", stage: "done", updatedAt: "2026-05-18T15:58:00.000Z" }),
    job({ id: "active", stage: "searching_web", updatedAt: "2026-05-18T15:57:00.000Z" }),
    job({ id: "ready", stage: "public_research_ready", updatedAt: "2026-05-18T15:56:00.000Z" })
  ];
  const sorted = sortQueueLikeStore(jobs);
  assert.deepEqual(sorted.map((candidate) => candidate.id), ["active", "done", "ready", "failed"]);
}

async function verifyOptionalLiveSupabaseMode() {
  if (process.env.DEEPTECHLY_ALLOW_LIVE_LOAD_TEST !== "true") {
    return "Skipped live Supabase smoke test; DEEPTECHLY_ALLOW_LIVE_LOAD_TEST is not true.";
  }

  throw new Error(
    "Live Supabase load mutation is intentionally not implemented for Phase 14G. Use deterministic mode only unless a cleanup-safe RPC is added."
  );
}

async function main() {
  ({ buildAdminResearchReview } = await import("@/lib/admin/research-review"));
  ({ normalizeStoredSources } = await import("@/lib/research/source-quality"));

  verifyDuplicateSubmissionLoad();
  verifyCompletedReuseIdempotency();
  verifyRetryAndStuckLoad();
  verifySourceLoadBehavior();
  verifyAdminReviewLoadBehavior();
  verifyQueueSortingLoadBehavior();
  const liveModeStatus = await verifyOptionalLiveSupabaseMode();

  const elapsedMs = Date.now() - startedAt;
  console.log("Research load verification passed.");
  console.log(`Simulated jobs: ${metrics.simulatedJobs}`);
  console.log(`Duplicate inputs: ${metrics.duplicateInputs}`);
  console.log(`Deduped source variants: ${metrics.dedupedSources}`);
  console.log(`Admin review records: ${metrics.adminReviewRecords}`);
  console.log(`Runtime: ${elapsedMs}ms`);
  console.log(liveModeStatus);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
