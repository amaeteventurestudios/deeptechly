import type { ResearchJob, ResearchStage } from "./types";

export const queueStageLabels: Record<ResearchStage, string> = {
  queued: "Queued",
  resolving_entity: "Searching the web",
  finding_official_domain: "Searching the web",
  confirming_company_identity: "Searching the web",
  searching_web: "Searching the web",
  reading_homepage: "Reading homepage",
  reading_technical_pages: "Reading technical pages",
  distilling_facts: "Distilling structured facts",
  filling_gaps: "Filling gaps",
  verifying_claims: "Verifying claims",
  mapping_technology_stack: "Mapping technology stack",
  mapping_government_relevance: "Mapping government relevance",
  estimating_readiness: "Estimating readiness",
  drafting_outputs: "Drafting article/profile/dossier in parallel",
  publishing_article: "Publishing article",
  publishing_profile: "Publishing profile",
  finalizing_dossier: "Finalizing dossier",
  public_research_ready: "Finalizing dossier",
  done: "Done",
  failed: "Failed",
  cancelled: "Failed"
};

export const queueProgressByStage: Record<ResearchStage, number> = {
  queued: 5,
  resolving_entity: 12,
  finding_official_domain: 12,
  confirming_company_identity: 12,
  searching_web: 12,
  reading_homepage: 20,
  reading_technical_pages: 28,
  distilling_facts: 38,
  filling_gaps: 48,
  verifying_claims: 58,
  mapping_technology_stack: 68,
  mapping_government_relevance: 76,
  estimating_readiness: 82,
  drafting_outputs: 88,
  publishing_article: 92,
  publishing_profile: 95,
  finalizing_dossier: 98,
  public_research_ready: 98,
  done: 100,
  failed: 100,
  cancelled: 100
};

export function getQueueStageLabel(stage: ResearchStage) {
  return queueStageLabels[stage] ?? "Queued";
}

export function getQueueProgress(job: ResearchJob) {
  if (job.stage === "failed" || job.stage === "cancelled") {
    return clampProgress(job.progress);
  }

  return clampProgress(Math.max(job.progress, queueProgressByStage[job.stage] ?? 5));
}

export function getQueueStatusLabel(job: ResearchJob) {
  if (job.stage === "failed" || job.stage === "cancelled") return "FAILED";
  if (job.stage === "done") return "DONE";
  return "IN PROGRESS";
}

export function isTerminalQueueStage(stage: ResearchStage) {
  return stage === "done" || stage === "failed" || stage === "cancelled";
}

export function isActiveQueueStage(stage: ResearchStage) {
  return !isTerminalQueueStage(stage);
}

function clampProgress(progress: number) {
  return Math.max(0, Math.min(Math.round(progress), 100));
}
