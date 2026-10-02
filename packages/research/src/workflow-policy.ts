export const researchStages = [
  "queued", "resolving_entity", "finding_official_domain", "confirming_company_identity",
  "searching_web", "reading_homepage", "reading_technical_pages", "distilling_facts",
  "filling_gaps", "verifying_claims", "mapping_technology_stack",
  "mapping_government_relevance", "estimating_readiness", "drafting_outputs",
  "publishing_article", "publishing_profile", "finalizing_dossier",
  "public_research_ready", "done", "failed", "cancelled"
] as const;

export type ResearchStage = (typeof researchStages)[number];

const terminalStages = new Set<ResearchStage>(["done", "failed", "cancelled"]);
const activeStages = new Set<ResearchStage>(
  researchStages.filter((stage) => !terminalStages.has(stage) && stage !== "queued")
);

export function normalizeResearchStatus(status: string | null | undefined): ResearchStage {
  const normalized = String(status ?? "queued").trim().toLowerCase();
  if (normalized === "complete" || normalized === "completed") return "done";
  if (normalized === "ready") return "public_research_ready";
  if (normalized === "error") return "failed";
  return researchStages.includes(normalized as ResearchStage) ? (normalized as ResearchStage) : "queued";
}

export function isTerminalResearchStatus(status: string | null | undefined) {
  return terminalStages.has(normalizeResearchStatus(status));
}

export function isActiveResearchStatus(status: string | null | undefined) {
  return activeStages.has(normalizeResearchStatus(status));
}

export function computeRetryDelay(attemptCount: number) {
  return Math.min(15 * 60 * 1000, 2 ** Math.max(0, Math.floor(attemptCount)) * 60 * 1000);
}

export function safePublicErrorMessage(
  message: string | null | undefined,
  fallback: string
) {
  const text = String(message ?? "").trim();
  if (!text || /stack|trace|at\s+\w+|api\s*key|apikey|api_key|service_role|supabase_service_role|authorization|bearer/i.test(text)) return fallback;
  return text.length > 180 ? fallback : text;
}

export function redactInternalFailure(message: string | null | undefined) {
  const text = String(message ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "Unknown research failure.";
  const redacted = text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/gi, "sk-[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-token]")
    .replace(/\b(apikey|api_key|service_role|supabase_service_role|authorization)\b\s*[:=]\s*[^,\s}]+/gi, "$1=[redacted]");
  return redacted.length > 1200 ? `${redacted.slice(0, 1197)}...` : redacted;
}
