import "server-only";

import {
  getResearchJob,
  readStore,
  updateResearchJob,
  writeStore
} from "@/lib/research/store";
import {
  buildJobLockKey,
  getAttemptCount,
  getMaxAttempts,
  getRetryCount,
  RETRYABLE_RESEARCH_FAILURE_COPY,
  safeMarkJobFailed,
  safeResumeOrRetryJob
} from "@/lib/research/orchestration";
import { drainResearchQueue } from "@/lib/research/queue";
import {
  buildAdminResearchReview,
  type AdminResearchReviewSummary
} from "./research-review";

export type AdminContentRow = {
  jobId: string;
  entityName: string;
  slug: string | null;
  articleTitle: string | null;
  publishedStatus: "published" | "draft" | null;
  adminFeatured: boolean;
  stage: string;
  sourceCount: number;
  confidenceLabel: string | null;
  articleUrl: string | null;
  profileUrl: string | null;
  dossierUrl: string | null;
  createdAt: string;
  updatedAt: string;
  review: AdminResearchReviewSummary;
};

export type AdminRecoveryAction =
  | "force_retry"
  | "mark_failed"
  | "clear_stuck"
  | "restart_queued";

export async function listAllContent(): Promise<AdminContentRow[]> {
  const data = await readStore();

  return data.jobs.map((job) => {
    const slug = job.feed?.slug ?? null;
    const article = slug ? data.articles.find((a) => a.slug === slug) : null;
    const entity = slug ? data.entities.find((e) => e.slug === slug) : null;
    const dossier = slug ? data.dossiers.find((d) => d.slug === slug) : null;

    return {
      jobId: job.id,
      entityName: job.feed?.entityName ?? job.resolvedName ?? job.query,
      slug,
      articleTitle: job.feed?.articleTitle ?? article?.title ?? null,
      publishedStatus: article?.publishedStatus ?? entity?.publishedStatus ?? null,
      adminFeatured: article?.adminFeatured ?? false,
      stage: job.stage,
      sourceCount: job.sourceCount,
      confidenceLabel: job.feed?.confidenceLabel ?? null,
      articleUrl: job.articleUrl,
      profileUrl: job.profileUrl,
      dossierUrl: job.dossierUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      review: buildAdminResearchReview({ job, entity, article, dossier })
    };
  });
}

export async function recoverResearchJob(jobId: string, action: AdminRecoveryAction) {
  const job = await getResearchJob(jobId);
  if (!job) return { ok: false as const, reason: "not_found" };

  if (action === "force_retry") {
    const result = await safeResumeOrRetryJob(jobId, {
      force: true,
      detail: "Force retry queued by admin recovery control."
    });
    if (!result) return { ok: false as const, reason: "retry_limit" };
    await drainResearchQueue();
    return { ok: true as const };
  }

  if (action === "mark_failed" || action === "clear_stuck") {
    const failureCode =
      action === "mark_failed" ? "ADMIN_MARKED_FAILED" : "ADMIN_CLEARED_STUCK_JOB";
    const message =
      action === "mark_failed"
        ? "Research job marked failed by admin recovery control."
        : "Stuck research job cleared by admin recovery control.";
    await safeMarkJobFailed(jobId, RETRYABLE_RESEARCH_FAILURE_COPY, {
      retryable: action === "clear_stuck",
      failureType: action === "clear_stuck" ? "stuck" : "permanent",
      failureCode,
      failureStage: job.stage,
      internalMessage: message
    });
    return { ok: true as const };
  }

  if (action === "restart_queued") {
    const now = new Date().toISOString();
    await updateResearchJob(jobId, {
      stage: "queued",
      progress: 5,
      message: "Queued",
      detail: "Restarted from queued by admin recovery control.",
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
      retry_count: getRetryCount(job) + 1,
      completedAt: null,
      cancellationRequested: false,
      error: null,
      orchestration: {
        ...job.orchestration,
        lockKey: job.orchestration?.lockKey ?? buildJobLockKey({ query: job.query }),
        inputFingerprint:
          job.orchestration?.inputFingerprint ?? buildJobLockKey({ query: job.query }),
        attemptCount: getAttemptCount(job),
        maxAttempts: getMaxAttempts(job),
        lastRunStartedAt: null,
        lastRunFinishedAt: null,
        nextRetryAt: null,
        retryable: false,
        failureType: null,
        stuckMarkedAt: null
      },
      updatedAt: now
    });
    await drainResearchQueue();
    return { ok: true as const };
  }

  return { ok: false as const, reason: "invalid" };
}

export async function publishContent(slug: string) {
  const data = await readStore();
  const now = new Date().toISOString();
  let changed = false;

  const entityIndex = data.entities.findIndex((e) => e.slug === slug);
  if (entityIndex >= 0) {
    data.entities[entityIndex] = {
      ...data.entities[entityIndex],
      publishedStatus: "published",
      updatedAt: now
    };
    changed = true;
  }

  const articleIndex = data.articles.findIndex((a) => a.slug === slug);
  if (articleIndex >= 0) {
    data.articles[articleIndex] = {
      ...data.articles[articleIndex],
      publishedStatus: "published",
      publishedAt: data.articles[articleIndex].publishedAt ?? now,
      updatedAt: now
    };
    changed = true;
  }

  const dossierIndex = data.dossiers.findIndex((d) => d.slug === slug);
  if (dossierIndex >= 0) {
    data.dossiers[dossierIndex] = {
      ...data.dossiers[dossierIndex],
      publishedStatus: "published",
      updatedAt: now
    };
    changed = true;
  }

  if (!changed) {
    return { ok: false as const, reason: "not_found" };
  }

  await writeStore(data);
  return { ok: true as const };
}

export async function unpublishContent(slug: string) {
  const data = await readStore();
  const now = new Date().toISOString();
  let changed = false;

  const entityIndex = data.entities.findIndex((e) => e.slug === slug);
  if (entityIndex >= 0) {
    data.entities[entityIndex] = {
      ...data.entities[entityIndex],
      publishedStatus: "draft",
      updatedAt: now
    };
    changed = true;
  }

  const articleIndex = data.articles.findIndex((a) => a.slug === slug);
  if (articleIndex >= 0) {
    data.articles[articleIndex] = {
      ...data.articles[articleIndex],
      publishedStatus: "draft",
      publishedAt: null,
      updatedAt: now
    };
    changed = true;
  }

  const dossierIndex = data.dossiers.findIndex((d) => d.slug === slug);
  if (dossierIndex >= 0) {
    data.dossiers[dossierIndex] = {
      ...data.dossiers[dossierIndex],
      publishedStatus: "draft",
      updatedAt: now
    };
    changed = true;
  }

  if (!changed) {
    return { ok: false as const, reason: "not_found" };
  }

  await writeStore(data);
  return { ok: true as const };
}

export async function toggleArticleFeatured(slug: string, featured: boolean) {
  const data = await readStore();
  const now = new Date().toISOString();

  const articleIndex = data.articles.findIndex((a) => a.slug === slug);
  if (articleIndex < 0) {
    return { ok: false as const, reason: "not_found" };
  }

  data.articles[articleIndex] = {
    ...data.articles[articleIndex],
    adminFeatured: featured,
    updatedAt: now
  };

  await writeStore(data);
  return { ok: true as const };
}
