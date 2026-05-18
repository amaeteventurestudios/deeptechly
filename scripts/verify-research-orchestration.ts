import assert from "node:assert/strict";
import {
  buildJobLockKey,
  canRetryResearchJob,
  computeRetryDelay,
  isActiveResearchStatus,
  isTerminalResearchStatus,
  jobMatchesInput,
  normalizeResearchStatus,
  shouldCreateNewJob,
  shouldMarkJobStuck,
  shouldReuseActiveJob
} from "@/lib/research/orchestration";
import { createCanonicalSlug } from "@/lib/research/entity-resolution";
import type { ResearchJob, ResearchStage } from "@/lib/research/types";

const now = new Date("2026-05-18T16:00:00.000Z");

function job(overrides: Partial<ResearchJob> = {}): ResearchJob {
  const stage = overrides.stage ?? "queued";
  const createdAt = overrides.createdAt ?? "2026-05-18T15:55:00.000Z";
  const query = overrides.query ?? "Titanym";
  const normalizedQuery = overrides.normalizedQuery ?? "Titanym";

  return {
    id: overrides.id ?? "job_test",
    userId: overrides.userId ?? "user_a",
    query,
    normalizedQuery,
    mode: overrides.mode ?? "company",
    stage,
    progress: overrides.progress ?? progressForStage(stage),
    message: overrides.message ?? "Queued",
    detail: overrides.detail ?? "Waiting to begin research",
    statusLabel: overrides.statusLabel ?? "QUEUED",
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
      lastRunStartedAt: null,
      lastRunFinishedAt: null,
      nextRetryAt: null,
      retryable: false,
      failureType: null,
      stuckMarkedAt: null
    },
    feed: overrides.feed ?? null,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    completedAt: overrides.completedAt ?? null
  };
}

function progressForStage(stage: ResearchStage) {
  if (stage === "done" || stage === "failed" || stage === "cancelled") return 100;
  if (stage === "drafting_outputs") return 88;
  if (stage === "finalizing_dossier") return 98;
  return 5;
}

function verifyStatusClassification() {
  assert.equal(normalizeResearchStatus("complete"), "done");
  assert.equal(normalizeResearchStatus("ready"), "public_research_ready");
  assert.equal(isTerminalResearchStatus("done"), true);
  assert.equal(isTerminalResearchStatus("failed"), true);
  assert.equal(isTerminalResearchStatus("cancelled"), true);
  assert.equal(isTerminalResearchStatus("searching_web"), false);
  assert.equal(isActiveResearchStatus("queued"), true);
  assert.equal(isActiveResearchStatus("searching_web"), true);
  assert.equal(isActiveResearchStatus("public_research_ready"), false);
  assert.equal(isActiveResearchStatus("done"), false);
}

function verifyStuckDetection() {
  assert.equal(
    shouldMarkJobStuck(
      job({
        stage: "searching_web",
        createdAt: "2026-05-18T15:40:00.000Z",
        updatedAt: "2026-05-18T15:44:59.000Z",
        stageStartedAt: "2026-05-18T15:44:59.000Z"
      }),
      now
    ),
    true,
    "searching jobs older than the search threshold are stuck"
  );
  assert.equal(
    shouldMarkJobStuck(
      job({
        stage: "searching_web",
        updatedAt: "2026-05-18T15:50:30.000Z",
        stageStartedAt: "2026-05-18T15:50:30.000Z"
      }),
      now
    ),
    false,
    "recent active jobs are not stuck"
  );
  assert.equal(
    shouldMarkJobStuck(
      job({
        stage: "finalizing_dossier",
        createdAt: "2026-05-18T15:20:00.000Z",
        updatedAt: "2026-05-18T15:34:59.000Z",
        stageStartedAt: "2026-05-18T15:34:59.000Z"
      }),
      now
    ),
    true,
    "writing/finalizing jobs use a longer stuck threshold"
  );
  assert.equal(
    shouldMarkJobStuck(job({ stage: "done", updatedAt: "2026-05-18T12:00:00.000Z" }), now),
    false,
    "completed jobs are never marked stuck"
  );
}

function verifyRetryEligibility() {
  assert.equal(computeRetryDelay(0), 60_000);
  assert.equal(computeRetryDelay(1), 120_000);
  assert.equal(computeRetryDelay(10), 900_000);

  assert.equal(
    canRetryResearchJob(
      job({
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
      }),
      now
    ),
    true,
    "transient failed jobs below max attempts can retry"
  );
  assert.equal(
    canRetryResearchJob(
      job({
        stage: "failed",
        error: "invalid input",
        orchestration: {
          lockKey: "entity:titanym",
          inputFingerprint: "entity:titanym",
          attemptCount: 1,
          maxAttempts: 3,
          retryable: false,
          failureType: "permanent"
        }
      }),
      now
    ),
    false,
    "permanent failures do not retry"
  );
  assert.equal(
    canRetryResearchJob(
      job({
        stage: "done",
        completedAt: "2026-05-18T15:59:00.000Z",
        articleUrl: "/article/titanym",
        profileUrl: "/startup/titanym",
        dossierUrl: "/dossier/titanym"
      }),
      now
    ),
    false,
    "completed jobs do not retry"
  );
}

function verifyDuplicateProtection() {
  const active = job({
    stage: "searching_web",
    userId: "user_a",
    query: "https://www.titanym.com/",
    normalizedQuery: "www.titanym.com",
    resolvedDomain: "titanym.com",
    orchestration: {
      lockKey: "domain:titanym.com",
      inputFingerprint: "domain:titanym.com",
      attemptCount: 1,
      maxAttempts: 3
    }
  });

  assert.equal(shouldReuseActiveJob(active, "titanym.com", "user_a"), true);
  assert.equal(shouldReuseActiveJob(active, "https://titanym.com", "user_a"), true);
  assert.equal(shouldReuseActiveJob(active, "titanym.com", "user_b"), false);
  assert.equal(shouldCreateNewJob(active, "titanym.com", "user_a"), false);
  assert.equal(shouldCreateNewJob(active, "titanym.com", "user_b"), true);
  assert.equal(jobMatchesInput(active, "titanym.com"), true);
}

function verifyCompletedReuseAndIdempotencyHelpers() {
  const completed = job({
    stage: "done",
    query: "Titanym, Inc.",
    resolvedName: "Titanym",
    completedAt: "2026-05-18T15:59:00.000Z",
    articleUrl: "/article/titanym",
    profileUrl: "/startup/titanym",
    dossierUrl: "/dossier/titanym",
    feed: {
      slug: "titanym",
      entityName: "Titanym",
      articleTitle: "Titanym profile",
      articleDek: "A generated research profile.",
      summary: "Summary",
      sector: "Space",
      confidenceLabel: "HIGH CONFIDENCE",
      confidenceScore: 88,
      sourceCount: 12,
      heroImage: null,
      publishedAt: "2026-05-18T15:59:00.000Z"
    }
  });

  assert.equal(canRetryResearchJob(completed, now), false);
  assert.equal(createCanonicalSlug("Titanym, Inc."), "titanym");
  assert.equal(createCanonicalSlug("https://www.titanym.com/"), "titanym");
  assert.equal(buildJobLockKey({ query: "https://www.titanym.com/" }), "domain:titanym.com");
  assert.equal(buildJobLockKey({ query: "Titanym, Inc." }), "entity:titanym");
  assert.equal(jobMatchesInput(completed, "Titanym Inc"), true);
}

function main() {
  verifyStatusClassification();
  verifyStuckDetection();
  verifyRetryEligibility();
  verifyDuplicateProtection();
  verifyCompletedReuseAndIdempotencyHelpers();
  console.log("Research orchestration verification passed.");
}

main();
