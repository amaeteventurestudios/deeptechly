import "server-only";

import {
  getResearchJobStallReason,
  getRetryCount,
  MAX_AUTOMATIC_RESEARCH_RETRIES,
  RETRYABLE_RESEARCH_FAILURE_COPY,
  safeMarkJobFailed,
  safeResumeOrRetryJob
} from "./orchestration";
import {
  isActiveResearchStage,
  listResearchJobs
} from "./store";
import type { ResearchJob } from "./types";

export type ResearchWatchdogResult = {
  checkedCount: number;
  timedOutJobIds: string[];
  stalledJobIds: string[];
  retriedJobIds: string[];
  failedJobIds: string[];
};

export async function detectStaleResearchJobs(now = new Date()) {
  const jobs = await listResearchJobs();
  return jobs
    .filter((job) => isActiveResearchStage(job.stage))
    .map((job) => ({ job, stallReason: getResearchJobStallReason(job, now) }))
    .filter((item): item is { job: ResearchJob; stallReason: NonNullable<ReturnType<typeof getResearchJobStallReason>> } =>
      Boolean(item.stallReason)
    );
}

export async function failTimedOutResearchJobs(now = new Date()) {
  const staleJobs = await detectStaleResearchJobs(now);
  const result: ResearchWatchdogResult = {
    checkedCount: staleJobs.length,
    timedOutJobIds: [],
    stalledJobIds: [],
    retriedJobIds: [],
    failedJobIds: []
  };

  for (const { job, stallReason } of staleJobs) {
    if (stallReason.code === "STAGE_TIMEOUT") {
      result.timedOutJobIds.push(job.id);
    } else {
      result.stalledJobIds.push(job.id);
    }

    const retryable = !job.cancellationRequested && getRetryCount(job) < MAX_AUTOMATIC_RESEARCH_RETRIES;
    await safeMarkJobFailed(job.id, RETRYABLE_RESEARCH_FAILURE_COPY, {
      retryable: true,
      failureType: stallReason.failureType,
      failureCode: stallReason.code,
      failureStage: stallReason.stage,
      internalMessage: stallReason.internalMessage
    });
    result.failedJobIds.push(job.id);

    if (retryable) {
      const retried = await safeResumeOrRetryJob(job.id, {
        force: true,
        detail: "Retry queued automatically after research watchdog recovery."
      });
      if (retried) {
        result.retriedJobIds.push(job.id);
      }
    }
  }

  return result;
}

export async function runResearchWatchdog({
  drainQueue = false,
  now = new Date()
}: {
  drainQueue?: boolean;
  now?: Date;
} = {}) {
  const result = await failTimedOutResearchJobs(now);

  if (drainQueue) {
    const { drainResearchQueue } = await import("./queue");
    await drainResearchQueue();
  }

  return result;
}
