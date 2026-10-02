import type { TraceEvent } from "@deeptechly/kernel";
import { loadCapabilityConfig } from "./providers/config";
import { LangfuseTraceAdapter } from "./providers/langfuse";

export async function traceWorkflow<T>(
  event: Omit<TraceEvent, "startedAt" | "endedAt" | "output" | "error">,
  operation: () => Promise<T>
): Promise<T> {
  const startedAt = new Date().toISOString();
  try {
    const output = await operation();
    await recordSafely({ ...event, startedAt, endedAt: new Date().toISOString(), output });
    return output;
  } catch (error) {
    await recordSafely({
      ...event,
      startedAt,
      endedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Workflow failed"
    });
    throw error;
  }
}

async function recordSafely(event: TraceEvent) {
  const config = loadCapabilityConfig(process.env).langfuse;
  if (!config) return;
  try {
    await new LangfuseTraceAdapter(config).record(event);
  } catch {
    // Observability is fail-open and must not change workflow outcome.
  }
}
