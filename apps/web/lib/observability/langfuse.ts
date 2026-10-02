import "server-only";

import { createHash } from "node:crypto";
import { redactSensitive } from "@deeptechly/shared";

type Observation = {
  traceId: string;
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export async function recordObservation(observation: Observation) {
  const baseUrl = process.env.LANGFUSE_BASE_URL?.trim();
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
  if (!baseUrl || !publicKey || !secretKey) return;
  try {
    const captureContent = process.env.LANGFUSE_CAPTURE_CONTENT === "true";
    const attributes = [
      attribute("langfuse.trace.name", observation.name),
      attribute("deeptechly.metadata", traceJson(observation.metadata ?? {})),
      ...(observation.error ? [attribute("error.message", String(redactSensitive(observation.error)))] : []),
      ...(captureContent && observation.input !== undefined ? [attribute("langfuse.observation.input", traceJson(observation.input))] : []),
      ...(captureContent && observation.output !== undefined ? [attribute("langfuse.observation.output", traceJson(observation.output))] : [])
    ];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      await fetch(`${baseUrl.replace(/\/$/, "")}/api/public/otel/v1/traces`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
          "content-type": "application/json",
          "x-langfuse-ingestion-version": "4"
        },
        body: JSON.stringify({
          resourceSpans: [{
            resource: { attributes: [attribute("service.name", "deeptechly-web")] },
            scopeSpans: [{
              scope: { name: "deeptechly-research", version: "2" },
              spans: [{
                traceId: hexId(observation.traceId, 32),
                spanId: hexId(observation.id, 16),
                name: observation.name,
                kind: 1,
                startTimeUnixNano: nano(observation.startedAt),
                endTimeUnixNano: nano(observation.endedAt ?? new Date().toISOString()),
                attributes,
                status: { code: observation.error ? 2 : 1 }
              }]
            }]
          }]
        })
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // Telemetry cannot change research behavior.
  }
}

function attribute(key: string, value: string) {
  return { key, value: { stringValue: value } };
}

function hexId(value: string, length: number) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function nano(value: string) {
  return (BigInt(new Date(value).getTime()) * BigInt(1_000_000)).toString();
}

function traceJson(value: unknown) {
  const serialized = JSON.stringify(redactSensitive(value, { maxDepth: 6, maxStringLength: 10_000 }));
  return serialized.length > 100_000 ? `${serialized.slice(0, 100_000)}…[TRUNCATED]` : serialized;
}
