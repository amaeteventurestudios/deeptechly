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
};

export function getResearchQueueStats(jobs: ResearchJob[]): ResearchQueueStats {
  return {
    activeCount: jobs.filter((job) => isActiveResearchStage(job.stage)).length,
    queuedCount: jobs.filter((job) => job.stage === "queued").length,
    completedCount: jobs.filter((job) => job.stage === "done").length,
    failedCount: jobs.filter((job) => job.stage === "failed" || job.stage === "cancelled").length,
    maxActive: MAX_ACTIVE_RESEARCH_JOBS
  };
}

export async function drainResearchQueue(userId?: string | null) {
  const jobs = await listResearchJobs(userId);
  const runningJobs = jobs.filter((job) => isActiveResearchStage(job.stage));
  const queuedJobs = jobs
    .filter((job) => job.stage === "queued")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const openSlots = Math.max(0, MAX_ACTIVE_RESEARCH_JOBS - runningJobs.length);
  const jobsToStart = queuedJobs.slice(0, openSlots);
  let startedCount = 0;

  for (const queuedJob of jobsToStart) {
    const reservedJob = await reserveResearchJobSlot(queuedJob.id);
    if (!reservedJob) continue;

    startedCount += 1;
    const { runResearchJob } = await import("./pipeline");
    void runResearchJob(reservedJob.id, reservedJob.query);
  }

  const refreshedJobs = await listResearchJobs(userId);
  return {
    startedCount,
    jobs: refreshedJobs,
    queueStats: getResearchQueueStats(refreshedJobs)
  };
}

async function reserveResearchJobSlot(jobId: string) {
  const job = await getResearchJob(jobId);
  if (!job || job.stage !== "queued") return null;

  return updateResearchJob(job.id, {
    stage: "resolving_entity",
    progress: 12,
    message: "Starting research",
    detail: "An active research slot is now preparing this job."
  });
}
