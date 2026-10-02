import { createHash } from "node:crypto";
import type { CapabilityHealth, TraceEvent, TraceSink } from "@deeptechly/kernel";
import { redactSensitive } from "@deeptechly/shared";
import type { LangfuseConfig } from "./config";

export class LangfuseTraceAdapter implements TraceSink {
  constructor(
    private readonly config: LangfuseConfig,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  async health(): Promise<CapabilityHealth> {
    try {
      const response = await this.request(this.config.healthPath, { method: "GET" });
      if (!response.ok) throw new Error("unavailable");
      return { provider: "langfuse", status: "available", checkedAt: new Date().toISOString() };
    } catch {
      return { provider: "langfuse", status: "unavailable", checkedAt: new Date().toISOString() };
    }
  }

  async record(event: TraceEvent) {
    const start = timestampNano(event.startedAt);
    const end = timestampNano(event.endedAt ?? new Date().toISOString());
    const attributes = [
      attribute("langfuse.trace.name", event.name),
      attribute("deeptechly.event_id", event.id),
      attribute("deeptechly.metadata", traceJson(event.metadata ?? {})),
      ...(event.error ? [attribute("error.type", "DeeptechlyTraceError"), attribute("error.message", String(redactSensitive(event.error)))] : []),
      ...(this.config.captureContent && event.input !== undefined
        ? [attribute("langfuse.observation.input", traceJson(event.input))]
        : []),
      ...(this.config.captureContent && event.output !== undefined
        ? [attribute("langfuse.observation.output", traceJson(event.output))]
        : [])
    ];
    const response = await this.request("/api/public/otel/v1/traces", {
      method: "POST",
      headers: { "content-type": "application/json", "x-langfuse-ingestion-version": "4" },
      body: JSON.stringify({
        resourceSpans: [{
          resource: { attributes: [attribute("service.name", "deeptechly-worker")] },
          scopeSpans: [{
            scope: { name: "deeptechly", version: "2" },
            spans: [{
              traceId: hexId(event.traceId, 32),
              spanId: hexId(event.id, 16),
              name: event.name,
              kind: 1,
              startTimeUnixNano: start,
              endTimeUnixNano: end,
              attributes,
              status: { code: event.error ? 2 : 1 }
            }]
          }]
        }]
      })
    });
    if (!response.ok) throw new Error(`Langfuse trace export failed with HTTP ${response.status}`);
  }

  private request(path: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    return this.fetchImplementation(`${this.config.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        authorization: `Basic ${Buffer.from(`${this.config.publicKey}:${this.config.secretKey}`).toString("base64")}`,
        ...init.headers
      }
    }).finally(() => clearTimeout(timeout));
  }
}

function attribute(key: string, value: string) {
  return { key, value: { stringValue: value } };
}

function hexId(value: string, length: number) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function timestampNano(value: string) {
  const milliseconds = new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) throw new Error("Trace timestamp is invalid");
  return (BigInt(milliseconds) * 1_000_000n).toString();
}

function traceJson(value: unknown) {
  const serialized = JSON.stringify(redactSensitive(value, { maxDepth: 6, maxStringLength: 10_000 }));
  return serialized.length > 100_000 ? `${serialized.slice(0, 100_000)}…[TRUNCATED]` : serialized;
}
