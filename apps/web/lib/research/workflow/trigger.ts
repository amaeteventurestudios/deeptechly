import "server-only";

import { runs, tasks } from "@trigger.dev/sdk";
import type { ResearchDispatchInput, WorkflowDispatcher } from "@deeptechly/kernel";

export const RESEARCH_TRIGGER_TASK_ID = "deeptechly-research";

type TriggerClient = {
  trigger(input: ResearchDispatchInput): Promise<{ id: string }>;
  cancel(runId: string): Promise<void>;
};

const sdkClient: TriggerClient = {
  async trigger(input) {
    const handle = await tasks.trigger(
      RESEARCH_TRIGGER_TASK_ID,
      input,
      {
        idempotencyKey: input.idempotencyKey,
        idempotencyKeyTTL: "24h",
        tags: [`job:${input.jobId}`]
      }
    );
    return { id: handle.id };
  },
  async cancel(runId) {
    await runs.cancel(runId);
  }
};

export class TriggerWorkflowDispatcher implements WorkflowDispatcher {
  constructor(private readonly client: TriggerClient = sdkClient) {}

  async dispatchResearch(input: ResearchDispatchInput) {
    assertTriggerConfiguration();
    const handle = await this.client.trigger(input);
    return { runId: handle.id };
  }

  async cancelResearch(runId: string) {
    assertTriggerConfiguration();
    await this.client.cancel(runId);
  }
}

function assertTriggerConfiguration() {
  if (!process.env.TRIGGER_SECRET_KEY) {
    throw new Error("Trigger.dev is selected but TRIGGER_SECRET_KEY is not configured");
  }
}
