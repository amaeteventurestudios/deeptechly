import "server-only";

import type { ResearchDispatchInput, WorkflowDispatcher } from "@deeptechly/kernel";

export class LocalWorkflowDispatcher implements WorkflowDispatcher {
  async dispatchResearch(input: ResearchDispatchInput) {
    const { runResearchJob } = await import("../pipeline");
    void runResearchJob(input.jobId, input.query);
    return { runId: `local:${input.jobId}` };
  }

  async cancelResearch() {
    // The persisted cancellation flag is observed at every local stage boundary.
  }
}
