import type { ResearchFailureStage, ResearchJob, ResearchStage } from "./types";
import {
  computeRetryDelay,
  isActiveResearchStatus,
  isTerminalResearchStatus,
  redactInternalFailure,
  safePublicErrorMessage
} from "@deeptechly/research";
import {
  createCanonicalSlug,
  normalizeDomain,
  normalizeEntityName
} from "./entity-resolution";

export {
  computeRetryDelay,
  isActiveResearchStatus,
  isTerminalResearchStatus,
  normalizeResearchStatus
} from "@deeptechly/research";

export const MAX_RESEARCH_JOB_ATTEMPTS = 3;
export const MAX_MANUAL_RESEARCH_RETRIES = 3;
export const MAX_AUTOMATIC_RESEARCH_RETRIES = 1;
export const RETRYABLE_RESEARCH_FAILURE_COPY =
  "Research failed. We could not complete this research job. Try a more specific company name, domain, patent number, or source URL.";

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
  /server/i
];

const stageTimeoutsMs: Partial<Record<ResearchStage, number>> = {
  searching_web: 4 * 60 * 1000,
  reading_homepage: 3 * 60 * 1000,
  reading_technical_pages: 4 * 60 * 1000,
  distilling_facts: 3 * 60 * 1000,
  filling_gaps: 5 * 60 * 1000,
  verifying_claims: 6 * 60 * 1000,
  mapping_technology_stack: 4 * 60 * 1000,
  mapping_government_relevance: 4 * 60 * 1000,
  estimating_readiness: 3 * 60 * 1000,
  drafting_outputs: 8 * 60 * 1000,
  publishing_article: 3 * 60 * 1000,
  publishing_profile: 3 * 60 * 1000,
  finalizing_dossier: 3 * 60 * 1000
};

const workerStalledMs = 5 * 60 * 1000;

export function canRetryResearchJob(job: ResearchJob, now = new Date()) {
  if (job.stage !== "failed") return false;
  if (hasCompletedOutput(job)) return false;

  const attemptCount = getAttemptCount(job);
  if (attemptCount >= getMaxAttempts(job)) return false;
  if (getRetryCount(job) >= MAX_MANUAL_RESEARCH_RETRIES) return false;

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
  return Boolean(getResearchJobStallReason(job, now));
}

export type ResearchJobStallReason = {
  code: "STAGE_TIMEOUT" | "WORKER_STALLED";
  failureType: "timeout" | "stuck";
  stage: ResearchStage;
  elapsedMs: number;
  timeoutMs: number;
  lastHeartbeatAt: string | null;
  activeStartedAt: string | null;
  stageStartedAt: string | null;
  internalMessage: string;
};

export function getResearchJobStallReason(
  job: ResearchJob,
  now = new Date()
): ResearchJobStallReason | null {
  if (!isActiveResearchStatus(job.stage)) return null;
  if (hasCompletedOutput(job)) return null;
  if (job.orchestration?.stuckMarkedAt) return null;

  const activeStartedAt =
    job.active_started_at ?? job.orchestration?.lastRunStartedAt ?? null;
  const stageStartedAt = job.stage_started_at ?? job.stageStartedAt ?? null;
  const lastHeartbeatAt =
    job.last_heartbeat_at ?? activeStartedAt ?? stageStartedAt ?? null;
  const lastHeartbeat = parseTimestamp(lastHeartbeatAt);
  const stageStarted = parseTimestamp(stageStartedAt);

  if (lastHeartbeat) {
    const elapsedMs = now.getTime() - lastHeartbeat.getTime();
    if (elapsedMs >= workerStalledMs) {
      return {
        code: "WORKER_STALLED",
        failureType: "stuck",
        stage: job.stage,
        elapsedMs,
        timeoutMs: workerStalledMs,
        lastHeartbeatAt,
        activeStartedAt,
        stageStartedAt,
        internalMessage: `Worker stalled in stage ${job.stage}. Last heartbeat: ${lastHeartbeatAt ?? "unknown"}. Active started: ${activeStartedAt ?? "unknown"}. Stage started: ${stageStartedAt ?? "unknown"}.`
      };
    }
  }

  const stageTimeoutMs = stageTimeoutsMs[job.stage];
  if (stageTimeoutMs && stageStarted) {
    const elapsedMs = now.getTime() - stageStarted.getTime();
    if (elapsedMs >= stageTimeoutMs) {
      return {
        code: "STAGE_TIMEOUT",
        failureType: "timeout",
        stage: job.stage,
        elapsedMs,
        timeoutMs: stageTimeoutMs,
        lastHeartbeatAt,
        activeStartedAt,
        stageStartedAt,
        internalMessage: `Stage timeout in ${job.stage}. Elapsed stage time: ${formatDuration(elapsedMs)}. Timeout: ${formatDuration(stageTimeoutMs)}. Last heartbeat: ${lastHeartbeatAt ?? "unknown"}.`
      };
    }
  }

  return null;
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
  if (isTerminalResearchStatus(existingJob.stage)) return false;
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
    failureCode?: string;
    failureStage?: ResearchFailureStage | null;
    internalMessage?: string;
  } = {}
) {
  const { getResearchJob, updateResearchJob } = await import("./store");
  const job = await getResearchJob(jobId);
  if (!job || isTerminalResearchStatus(job.stage)) return job;

  if (hasUsableArtifact(job)) {
    const now = new Date().toISOString();
    const failedStage = job.stage !== "failed" ? job.stage : (job.failedStage ?? null);
    const dossierFailure = failedStage === "finalizing_dossier";
    return updateResearchJob(jobId, {
      stage: "done",
      progress: 100,
      statusLabel: "DONE",
      message: "Research complete",
      detail: dossierFailure ? "Public research is ready. The institutional dossier is still unavailable." : "Research is ready with the available public artifacts.",
      completedAt: now,
      completion_mode: job.feed?.confidenceLabel === "LIMITED PUBLIC DATA" ? "limited_public_data" : "partial",
      profile_status: job.profileUrl ? "published" : "missing",
      article_status: job.articleUrl ? "published" : "missing",
      dossier_status: job.dossierUrl ? "published" : (dossierFailure ? "failed" : "missing"),
      dossier_error_internal: dossierFailure ? safeInternalFailureMessage(options.internalMessage ?? message) : job.dossier_error_internal ?? null,
      failure_code: options.failureCode ?? failureCodeForMessage(message, options.failureType),
      failure_stage: options.failureStage ?? failedStage,
      failure_message_internal: safeInternalFailureMessage(options.internalMessage ?? message),
      orchestration: { ...job.orchestration, lockKey: job.orchestration?.lockKey ?? buildJobLockKey({ query: job.query }), inputFingerprint: job.orchestration?.inputFingerprint ?? buildInputFingerprint(job.query), attemptCount: getAttemptCount(job), maxAttempts: getMaxAttempts(job), lastRunFinishedAt: now, nextRetryAt: null, retryable: false, failureType: null }
    });
  }

  const attemptCount = getAttemptCount(job);
  const retryable =
    options.retryable ??
    (!isPermanentFailure(message) && attemptCount < getMaxAttempts(job));
  const now = new Date();
  const failedStage =
    job.stage !== "failed" ? job.stage : (job.failedStage ?? null);

  return updateResearchJob(jobId, {
    stage: "failed",
    statusLabel: "FAILED",
    message: "Research failed",
    detail: RETRYABLE_RESEARCH_FAILURE_COPY,
    error: safeErrorMessage(message),
    failedStage,
    failure_code: options.failureCode ?? failureCodeForMessage(message, options.failureType),
    failure_stage: options.failureStage ?? failedStage,
    failure_message_internal: safeInternalFailureMessage(options.internalMessage ?? message),
    active_started_at: job.active_started_at ?? null,
    stage_started_at: job.stage_started_at ?? job.stageStartedAt ?? null,
    last_heartbeat_at: job.last_heartbeat_at ?? null,
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
  const stallReason = job ? getResearchJobStallReason(job) : null;
  if (!job || !stallReason) return job;

  const now = new Date().toISOString();
  const failedStage = job.stage !== "failed" ? job.stage : (job.failedStage ?? null);
  return updateResearchJob(jobId, {
    stage: "failed",
    statusLabel: "FAILED",
    message: "Research failed",
    detail: RETRYABLE_RESEARCH_FAILURE_COPY,
    error: RETRYABLE_RESEARCH_FAILURE_COPY,
    failedStage,
    failure_code: stallReason.code,
    failure_stage: failedStage,
    failure_message_internal: safeInternalFailureMessage(
      stallReason.internalMessage
    ),
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
      failureType: stallReason.failureType,
      stuckMarkedAt: now
    }
  });
}

export async function safeResumeOrRetryJob(
  jobId: string,
  options: { force?: boolean; detail?: string } = {}
) {
  const { getResearchJob, updateResearchJob } = await import("./store");
  const job = await getResearchJob(jobId);
  if (!job || (!options.force && !canRetryResearchJob(job))) return null;
  if (hasCompletedOutput(job)) return null;
  if (getRetryCount(job) >= MAX_MANUAL_RESEARCH_RETRIES) return null;
  const retryCount = getRetryCount(job) + 1;

  return updateResearchJob(jobId, {
    stage: "queued",
    progress: 5,
    message: "Queued",
    detail: options.detail ?? "Retry queued after a recoverable research failure.",
    error: null,
    failedStage: null,
    previous_failure_code: job.failure_code ?? job.previous_failure_code ?? null,
    previous_failure_stage:
      typeof job.failure_stage === "string"
        ? job.failure_stage
        : (job.failedStage ?? job.previous_failure_stage ?? null),
    previous_failure_message_internal:
      job.failure_message_internal ?? job.previous_failure_message_internal ?? null,
    failure_code: null,
    failure_stage: null,
    failure_message_internal: null,
    failure_generated_entity_name: null,
    failure_generated_slug: null,
    failure_suspected_source_publisher: null,
    active_started_at: null,
    stage_started_at: null,
    last_heartbeat_at: null,
    retry_count: retryCount,
    completedAt: null,
    cancellationRequested: false,
    orchestration: {
      ...job.orchestration,
      lockKey: job.orchestration?.lockKey ?? buildJobLockKey({ query: job.query }),
      inputFingerprint:
        job.orchestration?.inputFingerprint ?? buildInputFingerprint(job.query),
      attemptCount: getAttemptCount(job),
      maxAttempts: getMaxAttempts(job),
      lastRunStartedAt: null,
      lastRunFinishedAt: null,
      nextRetryAt: null,
      retryable: false,
      failureType: null,
      stuckMarkedAt: null
    }
  });
}

export function buildInputFingerprint(input: string) {
  return buildJobLockKey({ query: input });
}

export function getAttemptCount(job: ResearchJob) {
  return Math.max(0, Math.floor(job.orchestration?.attemptCount ?? 0));
}

export function getRetryCount(job: ResearchJob) {
  return Math.max(0, Math.floor(job.retry_count ?? 0));
}

export function nextAttempt(job: ResearchJob) {
  return getAttemptCount(job) + 1;
}

export function getMaxAttempts(job: ResearchJob) {
  return Math.max(1, Math.floor(job.orchestration?.maxAttempts ?? MAX_RESEARCH_JOB_ATTEMPTS));
}

export function safeErrorMessage(message: string | null | undefined) {
  return safePublicErrorMessage(message, RETRYABLE_RESEARCH_FAILURE_COPY);
}

export function safeInternalFailureMessage(message: string | null | undefined) {
  return redactInternalFailure(message);
}

function failureCodeForMessage(
  message: string | null | undefined,
  failureType?: NonNullable<ResearchJob["orchestration"]>["failureType"]
) {
  if (failureType === "timeout") return "research_timeout";
  if (failureType === "stuck") return "job_stalled";

  const text = String(message ?? "").toLowerCase();
  if (text.includes("openai")) return "openai_error";
  if (text.includes("tavily")) return "tavily_error";
  if (text.includes("timeout") || text.includes("timed out")) return "research_timeout";
  if (text.includes("source")) return "insufficient_sources";
  return "research_pipeline_error";
}

export function stageTimeoutForResearchStage(stage: ResearchStage) {
  return stageTimeoutsMs[stage] ?? null;
}

export function workerStalledThresholdMs() {
  return workerStalledMs;
}

function hasUsableArtifact(job: ResearchJob) {
  return Boolean(job.profileUrl || job.articleUrl || job.dossierUrl);
}

function hasCompletedOutput(job: ResearchJob) {
  return Boolean(
    job.stage === "done" ||
      job.completedAt ||
      hasUsableArtifact(job)
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

function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time) : null;
}

function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
