import type { ResearchStage } from "./workflow-policy";

export type ResearchWorkflowStep = {
  stage: ResearchStage;
  durableBoundary: "checkpoint" | "artifact";
  retryClass: "transient" | "bounded" | "none";
};

/**
 * Canonical stage order shared by local and durable runners. UI copy is a
 * projection; providers may group steps but may not reorder publication gates.
 */
export const researchWorkflowPlan: readonly ResearchWorkflowStep[] = [
  { stage: "resolving_entity", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "finding_official_domain", durableBoundary: "checkpoint", retryClass: "transient" },
  { stage: "confirming_company_identity", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "searching_web", durableBoundary: "checkpoint", retryClass: "transient" },
  { stage: "reading_homepage", durableBoundary: "checkpoint", retryClass: "transient" },
  { stage: "reading_technical_pages", durableBoundary: "checkpoint", retryClass: "transient" },
  { stage: "distilling_facts", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "filling_gaps", durableBoundary: "checkpoint", retryClass: "transient" },
  { stage: "verifying_claims", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "mapping_technology_stack", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "mapping_government_relevance", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "estimating_readiness", durableBoundary: "checkpoint", retryClass: "bounded" },
  { stage: "drafting_outputs", durableBoundary: "artifact", retryClass: "bounded" },
  { stage: "publishing_article", durableBoundary: "artifact", retryClass: "none" },
  { stage: "publishing_profile", durableBoundary: "artifact", retryClass: "none" },
  { stage: "public_research_ready", durableBoundary: "artifact", retryClass: "none" },
  { stage: "finalizing_dossier", durableBoundary: "artifact", retryClass: "bounded" },
  { stage: "done", durableBoundary: "artifact", retryClass: "none" }
] as const;
