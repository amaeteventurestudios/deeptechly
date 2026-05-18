import type { ResearchJob, ResearchStage } from "./types";
import {
  createCanonicalSlug,
  normalizeDomain,
  normalizeEntityName
} from "./entity-resolution";

export const MAX_RESEARCH_JOB_ATTEMPTS = 3;
export const RETRYABLE_RESEARCH_FAILURE_COPY =
  "Research failed. We could not complete this research job. Try a more specific company name, domain, patent number, or source URL.";

const terminalStatuses = new Set<ResearchStage>(["done", "failed", "cancelled"]);
const activeStatuses = new Set<ResearchStage>([
  "queued",
  "resolving_entity",
  "finding_official_domain",
  "confirming_company_identity",
  "searching_web",
  "reading_homepage",
  "reading_technical_pages",
  "distilling_facts",
  "filling_gaps",
  "verifying_claims",
  "mapping_technology_stack",
  "mapping_government_relevance",
  "estimating_readiness",
  "drafting_outputs",
  "publishing_article",
  "publishing_profile",
  "finalizing_dossier"
]);

const permanentFailurePatterns = [
  /authorization/i,
  /cancelled/i,
  /invalid input/i,
  /query is required/i,
  /sign[_ -]?in/i,
  /cannot resolve/i,
  /could not resolve/i
];

const transientFailurePatterns = [
  /timeout/i,
  /timed out/i,
  /fetch/i,
  /network/i,
  /rate limit/i,
  /temporar/i,
  /unavailable/i,
  /server/i,
  /supabase/i
];

export function normalizeResearchStatus(status: string | null | undefined): ResearchStage {
  const normalized = String(status ?? "queued").trim().toLowerCase();
  if (normalized === "complete" || normalized === "completed") return "done";
  if (normalized === "ready") return "public_research_ready";
  if (normalized === "error") return "failed";
  if (isResearchStage(normalized)) return normalized;
  return "queued";
}

export function isTerminalResearchStatus(status: string | null | undefined) {
  return terminalStatuses.has(normalizeResearchStatus(status));
}

export function isActiveResearchStatus(status: string | null | undefined) {
  return activeStatuses.has(normalizeResearchStatus(status));
}

export function canRetryResearchJob(job: ResearchJob, now = new Date()) {
  if (job.stage !== "failed") return false;
  if (hasCompletedOutput(job)) return false;

  const attemptCount = getAttemptCount(job);
  if (attemptCount >= getMaxAttempts(job)) return false;

  const failureType = job.orchestration?.failureType;
  const retryable =
    job.orchestration?.retryable ??
    (!isPermanentFailure(job.error ?? job.detail) && isTransientFailure(job.error ?? job.detail));
  if (!retryable || failureType === "permanent") return false;

  const nextRetryAt = job.orchestration?.nextRetryAt;
  if (nextRetryAt && Date.parse(nextRetryAt) > now.getTime()) return false;

  return true;
}

export function shouldMarkJobStuck(job: ResearchJob, now = new Date()) {
  if (!isActiveResearchStatus(job.stage)) return false;
  if (hasCompletedOutput(job)) return false;
  if (job.orchestration?.stuckMarkedAt) return false;

  const thresholdMs = stuckThresholdMs(job.stage);
  const lastActivity = mostRecentTimestamp([
    job.updatedAt,
    job.stageStartedAt,
    job.orchestration?.lastRunStartedAt,
    job.createdAt
  ]);

  if (!lastActivity) return false;
  return now.getTime() - lastActivity.getTime() >= thresholdMs;
}

export function computeRetryDelay(attemptCount: number) {
  const normalizedAttempt = Math.max(0, Math.floor(attemptCount));
  return Math.min(15 * 60 * 1000, 2 ** normalizedAttempt * 60 * 1000);
}

export function buildJobLockKey(input: {
  query?: string | null;
  normalizedQuery?: string | null;
  resolvedDomain?: string | null;
  resolvedName?: string | null;
  slug?: string | null;
}) {
  const domain =
    normalizeDomain(input.resolvedDomain) ??
    normalizeDomain(input.normalizedQuery) ??
    normalizeDomain(input.query);
  if (domain) return `domain:${domain}`;

  const slug = input.slug?.trim() || createCanonicalSlug(input.resolvedName ?? input.query ?? input.normalizedQuery ?? "");
  const name =
    normalizeEntityName(input.resolvedName ?? "") ||
    normalizeEntityName(input.query ?? "") ||
    normalizeEntityName(input.normalizedQuery ?? "");

  return slug ? `entity:${slug}` : `query:${name}`;
}

export function shouldReuseActiveJob(
  existingJob: ResearchJob,
  input: string,
  userId?: string | null
) {
  if (existingJob.userId !== (userId ?? null)) return false;
  if (!isActiveResearchStatus(existingJob.stage)) return false;
  return jobMatchesInput(existingJob, input);
}

export function shouldCreateNewJob(
  existingJob: ResearchJob | null | undefined,
  input: string,
  userId?: string | null
) {
  if (!existingJob) return true;
  if (shouldReuseActiveJob(existingJob, input, userId)) return false;
  if (existingJob.userId !== (userId ?? null)) return true;
  if (existingJob.stage === "failed" && canRetryResearchJob(existingJob)) return false;
  return true;
}

export function jobMatchesInput(job: ResearchJob, input: string) {
  const inputKey = buildJobLockKey({ query: input });
  const jobKey =
    job.orchestration?.lockKey ??
    buildJobLockKey({
      query: job.query,
      normalizedQuery: job.normalizedQuery,
      resolvedDomain: job.resolvedDomain,
      resolvedName: job.resolvedName,
      slug: job.feed?.slug ?? null
    });

  if (inputKey === jobKey) return true;

  const inputName = normalizeEntityName(input);
  const inputDomain = normalizeDomain(input);
  const jobNames = [
    job.query,
    job.normalizedQuery,
    job.resolvedName,
    job.feed?.entityName,
    job.feed?.slug
  ]
    .filter(Boolean)
    .map((value) => normalizeEntityName(String(value)))
    .filter(Boolean);
  const jobDomains = [job.resolvedDomain, job.normalizedQuery, job.query]
    .map((value) => normalizeDomain(value))
    .filter(Boolean);

  return Boolean(
    (inputName && jobNames.includes(inputName)) ||
      (inputDomain && jobDomains.includes(inputDomain))
  );
}

export async function safeMarkJobFailed(
  jobId: string,
  message = RETRYABLE_RESEARCH_FAILURE_COPY,
  options: {
    retryable?: boolean;
    failureType?: NonNullable<ResearchJob["orchestration"]>["failureType"];
  } = {}
) {
  const { getResearchJob, updateResearchJob } = await import("./store");
  const job = await getResearchJob(jobId);
  if (!job || isTerminalResearchStatus(job.stage)) return job;

  const attemptCount = getAttemptCount(job);
  const retryable =
    options.retryable ??
    (!isPermanentFailure(message) && attemptCount < getMaxAttempts(job));
  const now = new Date();

  return updateResearchJob(jobId, {
    stage: "failed",
    statusLabel: "FAILED",
    message: "Research failed",
    detail: RETRYABLE_RESEARCH_FAILURE_COPY,
    error: safeErrorMessage(message),
    completedAt: now.toISOString(),
    orchestration: {
      ...job.orchestration,
      lockKey: job.orchestration?.lockKey ?? buildJobLockKey({ query: job.query }),
      inputFingerprint:
        job.orchestration?.inputFingerprint ?? buildInputFingerprint(job.query),
      attemptCount,
      maxAttempts: getMaxAttempts(job),
      lastRunFinishedAt: now.toISOString(),
      nextRetryAt: retryable
        ? new Date(now.getTime() + computeRetryDelay(attemptCount)).toISOString()
        : null,
      retryable,
      failureType: options.failureType ?? (retryable ? "transient" : "permanent")
    }
  });
}

export async function safeMarkJobStuck(jobId: string) {
  const { getResearchJob, updateResearchJob } = await import("./store");
  const job = await getResearchJob(jobId);
  if (!job || !shouldMarkJobStuck(job)) return job;

  const now = new Date().toISOString();
  return updateResearchJob(jobId, {
    stage: "failed",
    statusLabel: "FAILED",
    message: "Research failed",
    detail: RETRYABLE_RESEARCH_FAILURE_COPY,
    error: "Research job stalled before completion.",
    completedAt: now,
    orchestration: {
      ...job.orchestration,
      lockKey: job.orchestration?.lockKey ?? buildJobLockKey({ query: job.query }),
      inputFingerprint:
        job.orchestration?.inputFingerprint ?? buildInputFingerprint(job.query),
      attemptCount: getAttemptCount(job),
      maxAttempts: getMaxAttempts(job),
      lastRunFinishedAt: now,
      nextRetryAt: now,
      retryable: true,
      failureType: "stuck",
      stuckMarkedAt: now
    }
  });
}

export async function safeResumeOrRetryJob(jobId: string) {
  const { getResearchJob, updateResearchJob } = await import("./store");
  const job = await getResearchJob(jobId);
  if (!job || !canRetryResearchJob(job)) return null;

  const now = new Date().toISOString();
  return updateResearchJob(jobId, {
    stage: "queued",
    progress: 5,
    message: "Queued",
    detail: "Retry queued after a recoverable research failure.",
    error: null,
    completedAt: null,
    cancellationRequested: false,
    orchestration: {
      ...job.orchestration,
      lockKey: job.orchestration?.lockKey ?? buildJobLockKey({ query: job.query }),
      inputFingerprint:
        job.orchestration?.inputFingerprint ?? buildInputFingerprint(job.query),
      attemptCount: getAttemptCount(job),
      maxAttempts: getMaxAttempts(job),
      lastRunStartedAt: now,
      lastRunFinishedAt: null,
      nextRetryAt: null,
      retryable: false,
      failureType: null
    }
  });
}

export function buildInputFingerprint(input: string) {
  return buildJobLockKey({ query: input });
}

export function getAttemptCount(job: ResearchJob) {
  return Math.max(0, Math.floor(job.orchestration?.attemptCount ?? 0));
}

export function nextAttempt(job: ResearchJob) {
  return getAttemptCount(job) + 1;
}

export function getMaxAttempts(job: ResearchJob) {
  return Math.max(1, Math.floor(job.orchestration?.maxAttempts ?? MAX_RESEARCH_JOB_ATTEMPTS));
}

export function safeErrorMessage(message: string | null | undefined) {
  const fallback = RETRYABLE_RESEARCH_FAILURE_COPY;
  const text = String(message ?? "").trim();
  if (!text) return fallback;
  if (/stack|trace|at\s+\w+|apikey|api_key|service_role|supabase_service_role/i.test(text)) {
    return fallback;
  }
  return text.length > 180 ? fallback : text;
}

function isResearchStage(value: string): value is ResearchStage {
  return [
    "queued",
    "resolving_entity",
    "finding_official_domain",
    "confirming_company_identity",
    "searching_web",
    "reading_homepage",
    "reading_technical_pages",
    "distilling_facts",
    "filling_gaps",
    "verifying_claims",
    "mapping_technology_stack",
    "mapping_government_relevance",
    "estimating_readiness",
    "drafting_outputs",
    "publishing_article",
    "publishing_profile",
    "finalizing_dossier",
    "public_research_ready",
    "done",
    "failed",
    "cancelled"
  ].includes(value);
}

function hasCompletedOutput(job: ResearchJob) {
  return Boolean(
    job.stage === "done" ||
      job.completedAt ||
      (job.articleUrl && job.profileUrl && job.dossierUrl)
  );
}

function isPermanentFailure(message: string | null | undefined) {
  const text = String(message ?? "");
  return permanentFailurePatterns.some((pattern) => pattern.test(text));
}

function isTransientFailure(message: string | null | undefined) {
  const text = String(message ?? "");
  return transientFailurePatterns.some((pattern) => pattern.test(text));
}

function stuckThresholdMs(stage: ResearchStage) {
  if (
    stage === "drafting_outputs" ||
    stage === "publishing_article" ||
    stage === "publishing_profile" ||
    stage === "finalizing_dossier"
  ) {
    return 25 * 60 * 1000;
  }
  if (stage === "queued") return 20 * 60 * 1000;
  return 15 * 60 * 1000;
}

function mostRecentTimestamp(values: Array<string | null | undefined>) {
  const times = values
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((value) => Number.isFinite(value));
  if (times.length === 0) return null;
  return new Date(Math.max(...times));
}
