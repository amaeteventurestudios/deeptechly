import assert from "node:assert/strict";
import { Crawl4AIAdapter } from "../apps/worker/src/providers/crawl4ai";
import { DirectusAdapter } from "../apps/worker/src/providers/directus";
import { loadCapabilityConfig } from "../apps/worker/src/providers/config";
import { MeilisearchAdapter } from "../apps/worker/src/providers/meilisearch";

async function main() {
assert.equal(
  Object.values(loadCapabilityConfig({})).filter(Boolean).length,
  0,
  "Unconfigured capabilities remain disabled"
);
assert.throws(
  () => loadCapabilityConfig({ MEILISEARCH_BASE_URL: "file:///tmp/search" }),
  /http or https/
);

const requests: Array<{ url: string; init?: RequestInit }> = [];
const mockFetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  requests.push({ url, init });
  if (url.endsWith("/health")) return Response.json({ status: "available" });
  if (url.includes("/indexes/research/search")) {
    return Response.json({
      hits: [{ id: "entity_1", kind: "entity", title: "Acme", slug: "acme" }],
      estimatedTotalHits: 1,
      processingTimeMs: 2
    });
  }
  if (url.includes("/items/entities/entity_1")) {
    return Response.json({ data: { id: "entity_1", name: "Acme" } });
  }
  if (url.includes("/items/entities")) {
    return Response.json({ data: [{ id: "entity_1", name: "Acme" }] });
  }
  if (url.endsWith("/crawl")) {
    return Response.json({
      results: [{
        success: true,
        url: "https://acme.example/technical",
        markdown: { fit_markdown: "# Technical system" },
        metadata: { title: "Technical system", canonical: "https://acme.example/technical" },
        links: { internal: [{ href: "https://acme.example/about" }] }
      }]
    });
  }
  return Response.json({ taskUid: 42 });
}) as typeof fetch;

const meilisearch = new MeilisearchAdapter(
  {
    provider: "meilisearch",
    baseUrl: "http://search.internal",
    token: "search-secret",
    healthPath: "/health",
    timeoutMs: 1_000
  },
  mockFetch
);
assert.equal((await meilisearch.health()).status, "available");
const search = await meilisearch.search({ index: "research", query: "Acme", limit: 10 });
assert.equal(search.hits[0]?.slug, "acme");
assert.equal((await meilisearch.upsert("research", search.hits)).taskId, "42");

const directus = new DirectusAdapter(
  {
    provider: "directus",
    baseUrl: "http://newsroom.internal",
    token: "newsroom-secret",
    healthPath: "/server/health",
    timeoutMs: 1_000
  },
  mockFetch
);
assert.equal((await directus.list<{ id: string }>("entities")).length, 1);
assert.equal((await directus.read<{ id: string }>("entities", "entity_1"))?.id, "entity_1");

const crawl4ai = new Crawl4AIAdapter(
  {
    provider: "crawl4ai",
    baseUrl: "http://crawler.internal",
    healthPath: "/health",
    acquirePath: "/crawl",
    timeoutMs: 1_000
  },
  mockFetch
);
const document = await crawl4ai.acquire("https://acme.example/technical");
assert.equal(document.markdown, "# Technical system");
assert.equal(document.canonicalUrl, "https://acme.example/technical");
await assert.rejects(() => crawl4ai.acquire("file:///etc/passwd"), /http or https/);
await assert.rejects(
  () => crawl4ai.acquire("http://169.254.169.254/latest/meta-data"),
  /not publicly routable/
);
await assert.rejects(
  () => crawl4ai.acquire("https://user:password@example.org/private"),
  /must not contain credentials/
);

assert.ok(
  requests.some((request) =>
    new Headers(request.init?.headers).get("authorization") === "Bearer search-secret"
  ),
  "Configured server token is applied to capability calls"
);
assert.ok(
  requests.every((request) => !request.url.includes("secret")),
  "Credentials never enter request URLs"
);

console.log("Capability adapter verification passed.");
}

void main();
