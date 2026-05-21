import "server-only";

import { MAX_ACTIVE_RESEARCH_JOBS } from "./limits";
import {
  getResearchJob,
  isActiveResearchStage,
  listResearchJobs,
  updateResearchJob
} from "./store";
import type { ResearchJob } from "./types";

export type ResearchQueueStats = {
  activeCount: number;
  queuedCount: number;
  completedCount: number;
  failedCount: number;
  maxActive: number;
  globalActiveCount?: number;
  globalQueuedCount?: number;
};

type ResearchQueueDrainResult = {
  startedCount: number;
  jobs: ResearchJob[];
  queueStats: ResearchQueueStats;
};

type ResearchQueueStartResult = {
  startedCount: number;
  startedJobIds: string[];
};

declare global {
  var __deeptechlyResearchQueueDrain: Promise<ResearchQueueStartResult> | undefined;
}

export function getResearchQueueStats(jobs: ResearchJob[]): ResearchQueueStats {
  return {
    activeCount: jobs.filter((job) => isActiveResearchStage(job.stage)).length,
    queuedCount: jobs.filter((job) => job.stage === "queued").length,
    completedCount: jobs.filter((job) => job.stage === "done").length,
    failedCount: jobs.filter((job) => job.stage === "failed" || job.stage === "cancelled").length,
    maxActive: MAX_ACTIVE_RESEARCH_JOBS
  };
}

export async function getActiveResearchJobCount(userId?: string | null) {
  const jobs = await listResearchJobs(userId);
  return jobs.filter((job) => isActiveResearchStage(job.stage)).length;
}

export async function getQueuedResearchJobs(userId?: string | null) {
  const jobs = await listResearchJobs(userId);
  return jobs
    .filter((job) => job.stage === "queued")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function startNextQueuedResearchJobs() {
  const result: ResearchQueueStartResult = {
    startedCount: 0,
    startedJobIds: []
  };

  while (await hasOpenResearchSlot()) {
    const [nextQueuedJob] = await getQueuedResearchJobs();
    if (!nextQueuedJob) break;

    const reservedJob = await reserveResearchJobSlot(nextQueuedJob.id);
    if (!reservedJob) break;

    result.startedCount += 1;
    result.startedJobIds.push(reservedJob.id);

    const { runResearchJob } = await import("./pipeline");
    void runResearchJob(reservedJob.id, reservedJob.query);
  }

  return result;
}

export async function drainResearchQueue(userId?: string | null): Promise<ResearchQueueDrainResult> {
  const startResult = await runSerializedQueueDrain();
  const [scopedJobs, globalJobs] = await Promise.all([
    listResearchJobs(userId),
    listResearchJobs()
  ]);
  const scopedStats = getResearchQueueStats(scopedJobs);

  return {
    startedCount: startResult.startedCount,
    jobs: scopedJobs,
    queueStats: {
      ...scopedStats,
      globalActiveCount: globalJobs.filter((job) => isActiveResearchStage(job.stage)).length,
      globalQueuedCount: globalJobs.filter((job) => job.stage === "queued").length
    }
  };
}

async function runSerializedQueueDrain() {
  if (globalThis.__deeptechlyResearchQueueDrain) {
    await globalThis.__deeptechlyResearchQueueDrain.catch(() => ({
      startedCount: 0,
      startedJobIds: []
    }));
  }

  const drainPromise = startNextQueuedResearchJobs();
  globalThis.__deeptechlyResearchQueueDrain = drainPromise;

  try {
    return await drainPromise;
  } finally {
    if (globalThis.__deeptechlyResearchQueueDrain === drainPromise) {
      globalThis.__deeptechlyResearchQueueDrain = undefined;
    }
  }
}

async function hasOpenResearchSlot() {
  const activeCount = await getActiveResearchJobCount();
  return activeCount < MAX_ACTIVE_RESEARCH_JOBS;
}

async function reserveResearchJobSlot(jobId: string) {
  if (!(await hasOpenResearchSlot())) {
    return null;
  }

  const job = await getResearchJob(jobId);
  if (!job || job.stage !== "queued") return null;

  return updateResearchJob(job.id, {
    stage: "resolving_entity",
    progress: 12,
    message: "Starting research",
    detail: "An active research slot is now preparing this job.",
    failedStage: null,
    failure_code: null,
    failure_stage: null,
    failure_message_internal: null,
    error: null
  });
}
