import type { ResearchJob, ResearchStage } from "./types";

export type ResearchWorkflowStep = {
  id:
    | "queued"
    | "searching_web"
    | "reading_homepage"
    | "reading_technical_pages"
    | "distilling_facts"
    | "filling_gaps"
    | "verifying_claims"
    | "mapping_technology_stack"
    | "mapping_government_relevance"
    | "estimating_readiness"
    | "drafting_outputs"
    | "publishing_article"
    | "publishing_profile"
    | "finalizing_dossier"
    | "done";
  label: string;
  stages: ResearchStage[];
};

export const researchWorkflowSteps: ResearchWorkflowStep[] = [
  { id: "queued", label: "Queued", stages: ["queued"] },
  {
    id: "searching_web",
    label: "Searching the web",
    stages: [
      "resolving_entity",
      "finding_official_domain",
      "confirming_company_identity",
      "searching_web"
    ]
  },
  { id: "reading_homepage", label: "Reading homepage", stages: ["reading_homepage"] },
  {
    id: "reading_technical_pages",
    label: "Reading technical pages",
    stages: ["reading_technical_pages"]
  },
  {
    id: "distilling_facts",
    label: "Distilling structured facts",
    stages: ["distilling_facts"]
  },
  { id: "filling_gaps", label: "Filling gaps", stages: ["filling_gaps"] },
  { id: "verifying_claims", label: "Verifying claims", stages: ["verifying_claims"] },
  {
    id: "mapping_technology_stack",
    label: "Mapping technology stack",
    stages: ["mapping_technology_stack"]
  },
  {
    id: "mapping_government_relevance",
    label: "Mapping government relevance",
    stages: ["mapping_government_relevance"]
  },
  {
    id: "estimating_readiness",
    label: "Estimating readiness",
    stages: ["estimating_readiness"]
  },
  {
    id: "drafting_outputs",
    label: "Drafting article/profile/dossier in parallel",
    stages: ["drafting_outputs"]
  },
  {
    id: "publishing_article",
    label: "Publishing article",
    stages: ["publishing_article"]
  },
  {
    id: "publishing_profile",
    label: "Publishing profile",
    stages: ["publishing_profile"]
  },
  {
    id: "finalizing_dossier",
    label: "Finalizing dossier",
    stages: ["finalizing_dossier", "public_research_ready"]
  },
  { id: "done", label: "Done", stages: ["done"] }
];

const workflowStepIndexByStage = researchWorkflowSteps.reduce(
  (indexByStage, step, index) => {
    step.stages.forEach((stage) => {
      indexByStage[stage] = index;
    });
    return indexByStage;
  },
  {} as Partial<Record<ResearchStage, number>>
);

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

export function getResearchWorkflowStepIndex(stage: ResearchStage) {
  if (stage === "failed" || stage === "cancelled") {
    return -1;
  }

  return workflowStepIndexByStage[stage] ?? 0;
}

export function getQueueProgress(job: ResearchJob) {
  if (job.stage === "failed" || job.stage === "cancelled") {
    return clampProgress(job.progress);
  }

  return clampProgress(Math.max(job.progress, queueProgressByStage[job.stage] ?? 5));
}

export function getQueueStatusLabel(job: ResearchJob) {
  if (job.stage === "queued") return "QUEUED";
  if (job.stage === "failed" || job.stage === "cancelled") return "FAILED";
  if (job.stage === "done") return "DONE";
  return "IN PROGRESS";
}

export function isTerminalQueueStage(stage: ResearchStage) {
  return stage === "done" || stage === "failed" || stage === "cancelled";
}

export function isActiveQueueStage(stage: ResearchStage) {
  return stage !== "queued" && !isTerminalQueueStage(stage);
}

function clampProgress(progress: number) {
  return Math.max(0, Math.min(Math.round(progress), 100));
}
