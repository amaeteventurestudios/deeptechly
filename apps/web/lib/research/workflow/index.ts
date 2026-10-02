import "server-only";

import type { WorkflowDispatcher } from "@deeptechly/kernel";
import { LocalWorkflowDispatcher } from "./local";
import { TriggerWorkflowDispatcher } from "./trigger";

export type ResearchWorkflowProvider = "local" | "trigger";

export function selectedResearchWorkflowProvider(
  value = process.env.DEEPTECHLY_WORKFLOW_PROVIDER
): ResearchWorkflowProvider {
  const provider = value?.trim().toLowerCase() || "local";
  if (provider === "local" || provider === "trigger") return provider;
  throw new Error(`Unsupported research workflow provider: ${provider}`);
}

export function getResearchWorkflowDispatcher(
  provider = selectedResearchWorkflowProvider()
): WorkflowDispatcher {
  return provider === "trigger"
    ? new TriggerWorkflowDispatcher()
    : new LocalWorkflowDispatcher();
}
