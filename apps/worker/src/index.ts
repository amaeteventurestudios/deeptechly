import type { WorkflowDispatcher } from "@deeptechly/kernel";

export type WorkerRuntime = { workflows: WorkflowDispatcher };

export function createWorkerRuntime(workflows: WorkflowDispatcher): WorkerRuntime {
  return { workflows };
}
