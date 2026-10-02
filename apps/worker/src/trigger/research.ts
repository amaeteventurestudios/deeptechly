import { task } from "@trigger.dev/sdk";
import type { ResearchDispatchInput } from "@deeptechly/kernel";

export const deeptechlyResearchTask = task({
  id: "deeptechly-research",
  queue: { concurrencyLimit: 3 },
  maxDuration: 600,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
    randomize: true
  },
  run: async (payload: ResearchDispatchInput) => {
    validatePayload(payload);
    const baseUrl = requireEnvironment("DEEPTECHLY_INTERNAL_WEB_URL").replace(/\/$/, "");
    const secret = requireEnvironment("DEEPTECHLY_WORKER_CALLBACK_SECRET");
    const response = await fetch(`${baseUrl}/api/internal/research/run`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(9 * 60 * 1000)
    });
    if (!response.ok) {
      throw new Error(`Research callback failed with HTTP ${response.status}`);
    }
    return await response.json() as { jobId: string; status: string };
  }
});

function validatePayload(payload: ResearchDispatchInput) {
  if (!payload.jobId?.trim() || !payload.query?.trim() || !payload.idempotencyKey?.trim()) {
    throw new Error("Invalid research workflow payload");
  }
}

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
