"use client";

import type { ResearchJob } from "@/lib/research/types";

export const researchQueueStorageKey = "deeptechly_research_queue";
const maxStoredJobs = 50;

function isResearchJob(value: unknown): value is ResearchJob {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "query" in value &&
      "stage" in value &&
      "progress" in value
  );
}

function rankJob(job: ResearchJob) {
  if (job.stage !== "done" && job.stage !== "failed") return 0;
  if (job.stage === "done") return 1;
  return 2;
}

function jobTimestamp(job: ResearchJob) {
  if (job.stage === "done") return job.completedAt ?? job.updatedAt;
  return job.updatedAt ?? job.createdAt;
}

export function sortQueueJobs(jobs: ResearchJob[]) {
  return [...jobs].sort((a, b) => {
    const rankDelta = rankJob(a) - rankJob(b);
    if (rankDelta !== 0) return rankDelta;
    return jobTimestamp(b).localeCompare(jobTimestamp(a));
  });
}

export function loadLocalQueueJobs() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(researchQueueStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isResearchJob) : [];
  } catch {
    return [];
  }
}

export function saveLocalQueueJobs(jobs: ResearchJob[], notify = false) {
  if (typeof window === "undefined") return;

  const sorted = sortQueueJobs(jobs).slice(0, maxStoredJobs);
  window.localStorage.setItem(researchQueueStorageKey, JSON.stringify(sorted));
  if (notify) {
    window.dispatchEvent(new Event("deeptechly-research-queue-updated"));
  }
}

export function mergeQueueJobs(serverJobs: ResearchJob[], localJobs: ResearchJob[]) {
  const merged = new Map<string, ResearchJob>();

  for (const job of localJobs) {
    merged.set(job.id, job);
  }

  for (const job of serverJobs) {
    merged.set(job.id, job);
  }

  return sortQueueJobs(Array.from(merged.values()));
}

export function upsertLocalQueueJobs(jobs: ResearchJob[]) {
  saveLocalQueueJobs(mergeQueueJobs(jobs, loadLocalQueueJobs()), true);
}
