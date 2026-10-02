import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { redactSensitive } from "../packages/shared/src/index";
import { loadCapabilityConfig } from "../apps/worker/src/providers/config";
import { LangfuseTraceAdapter } from "../apps/worker/src/providers/langfuse";
import { ValkeyCacheAdapter } from "../apps/worker/src/providers/valkey";
import { S3ObjectStoreAdapter } from "../apps/worker/src/providers/s3";

async function verify() {
  const redacted = redactSensitive({
    authorization: "Bearer secret-value",
    nested: { email: "analyst@example.org", note: "Contact analyst@example.org using Bearer abc.def" }
  });
  assert.equal(redacted.authorization, "[REDACTED]");
  assert.equal(redacted.nested.email, "[REDACTED]");
  assert.doesNotMatch(redacted.nested.note, /example\.org|abc\.def/);

  assert.throws(
    () => loadCapabilityConfig({ LANGFUSE_BASE_URL: "https://trace.internal" }),
    /public key, and secret key/i
  );
  assert.throws(() => loadCapabilityConfig({ VALKEY_URL: "https://cache.internal" }), /redis or rediss/);
  assert.throws(() => loadCapabilityConfig({ S3_BUCKET: "evidence" }), /access credentials/);

  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const mockFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    return Response.json({ data: [] });
  }) as typeof fetch;
  const traceConfig = {
    provider: "langfuse",
    baseUrl: "https://trace.internal",
    publicKey: "pk-lf-public",
    secretKey: "sk-lf-secret",
    captureContent: false,
    healthPath: "/api/public/projects",
    timeoutMs: 1_000
  } as const;
  const langfuse = new LangfuseTraceAdapter(traceConfig, mockFetch);
  assert.equal((await langfuse.health()).status, "available");
  await langfuse.record({
    id: "span_1",
    traceId: "trace_1",
    name: "research.stage.verify",
    startedAt: "2026-10-01T00:00:00.000Z",
    endedAt: "2026-10-01T00:00:01.000Z",
    input: { prompt: "private prompt for analyst@example.org" },
    metadata: { email: "analyst@example.org", model: "test-model" }
  });
  const noCaptureBody = String(requests.at(-1)?.init?.body);
  assert.match(requests.at(-1)?.url ?? "", /\/api\/public\/otel\/v1\/traces$/);
  assert.match(noCaptureBody, /x|research\.stage\.verify/);
  assert.doesNotMatch(noCaptureBody, /private prompt|analyst@example\.org|sk-lf-secret/);
  assert.equal(new Headers(requests.at(-1)?.init?.headers).get("x-langfuse-ingestion-version"), "4");

  const capture = new LangfuseTraceAdapter({ ...traceConfig, captureContent: true }, mockFetch);
  await capture.record({
    id: "span_2",
    traceId: "trace_1",
    name: "llm.generate",
    startedAt: "2026-10-01T00:00:00.000Z",
    input: { prompt: "Email analyst@example.org with Bearer token-secret" }
  });
  const captureBody = String(requests.at(-1)?.init?.body);
  assert.match(captureBody, /REDACTED/);
  assert.doesNotMatch(captureBody, /analyst@example\.org|token-secret/);

  const values = new Map<string, string>();
  const fakeValkey = {
    isOpen: false,
    async connect() { this.isOpen = true; },
    async ping() { return "PONG"; },
    async get(key: string) { return values.get(key) ?? null; },
    async set(key: string, value: string) { values.set(key, value); },
    async del(key: string) { return values.delete(key) ? 1 : 0; }
  };
  const cache = new ValkeyCacheAdapter({ provider: "valkey", url: "redis://cache.internal", keyPrefix: "dt:" }, fakeValkey);
  await cache.set("entity:1", "cached", 60);
  assert.equal(await cache.get("entity:1"), "cached");
  await cache.delete("entity:1");
  assert.equal(await cache.get("entity:1"), null);
  await assert.rejects(() => cache.set("bad", "value", 0), /Cache TTL/);

  const commands: unknown[] = [];
  const fakeS3 = { async send(command: unknown) { commands.push(command); return {}; } };
  const objectStore = new S3ObjectStoreAdapter({
    provider: "s3",
    region: "us-east-1",
    bucket: "deeptechly-evidence",
    accessKeyId: "test-access",
    secretAccessKey: "test-secret",
    forcePathStyle: true
  }, fakeS3 as never);
  await objectStore.put("evidence/source.json", new TextEncoder().encode("{}"), "application/json");
  assert.equal(commands.length, 1);
  await assert.rejects(() => objectStore.put("../secret", new Uint8Array(), "text/plain"), /Object key/);
  await assert.rejects(() => objectStore.signedReadUrl("evidence/source.json", 3601), /expiry/);

  const nextConfig = readFileSync("apps/web/next.config.mjs", "utf8");
  for (const header of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Content-Security-Policy"]) {
    assert.ok(nextConfig.includes(header), `missing security header ${header}`);
  }
  const callback = readFileSync("apps/web/app/api/internal/research/run/route.ts", "utf8");
  assert.match(callback, /32_768/);
  assert.match(callback, /payload_too_large/);

  console.log("System hardening verification passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
