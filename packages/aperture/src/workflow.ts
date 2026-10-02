export const apertureWorkflowPlan = [
  "acquiring_government_documents",
  "reading_solicitations",
  "extracting_agency_ask",
  "deriving_problem_statements",
  "retrieving_supporting_evidence",
  "detecting_repeated_demand",
  "mapping_technical_requirements",
  "matching_companies_patents_labs",
  "calculating_confidence",
  "assembling_evidence_pack",
  "reviewing_publication_eligibility"
] as const;

export type ApertureWorkflowStage = (typeof apertureWorkflowPlan)[number];
