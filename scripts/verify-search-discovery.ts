import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import type { SearchDocument, SearchIndex } from "../packages/kernel/src/ports";
import type { DiscoveryDocument } from "../apps/web/lib/discovery/types";

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");
moduleLoader._resolveFilename = function resolveServerOnly(
  request: string,
  parent: unknown,
  isMain: boolean,
  options?: unknown
) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const documents: DiscoveryDocument[] = [
  {
    id: "entity:orbital",
    kind: "entity",
    title: "Orbital Materials",
    slug: "orbital-materials",
    summary: "Advanced materials for space systems.",
    href: "/startup/orbital-materials",
    entityName: "Orbital Materials",
    sector: "Space",
    publishedAt: "2026-09-01T00:00:00.000Z",
    published: true
  },
  {
    id: "article:robotics",
    kind: "article",
    title: "Robotics at the edge",
    slug: "robotics-edge",
    summary: "Autonomy for industrial inspection.",
    href: "/article/robotics-edge",
    sector: "Robotics",
    publishedAt: "2026-08-01T00:00:00.000Z",
    published: true
  }
];

async function verify() {
  const discovery = await import("../apps/web/lib/discovery/search");
  const { syncPublishedResearchIndex, researchIndexSettings } = await import(
    "../apps/worker/src/search/sync"
  );

  assert.equal(discovery.selectedDiscoveryProvider(undefined), "local");
  assert.equal(discovery.selectedDiscoveryProvider("meilisearch"), "meilisearch");
  assert.throws(() => discovery.selectedDiscoveryProvider("unknown"), /Unsupported/);
  assert.deepEqual(
    discovery.searchLocally(documents, "space materials").map((document) => document.id),
    ["entity:orbital"]
  );
  assert.deepEqual(
    discovery.searchLocally(documents, "inspection").map((document) => document.id),
    ["article:robotics"]
  );

  const calls: string[] = [];
  const index: SearchIndex = {
    async health() {
      return { provider: "test", status: "available", checkedAt: new Date(0).toISOString() };
    },
    async search() {
      return { hits: [], estimatedTotalHits: 0 };
    },
    async upsert(name, items) {
      calls.push(`upsert:${name}:${items.length}`);
      return { taskId: "documents" };
    },
    async remove() {
      return { taskId: "remove" };
    },
    async configure(name, settings) {
      calls.push(`configure:${name}:${settings.filterableAttributes?.join(",")}`);
      return { taskId: "settings" };
    }
  };
  const privateDocument = { ...documents[0], id: "entity:private", published: false } as unknown as SearchDocument;
  const sync = await syncPublishedResearchIndex(index, [...documents, privateDocument]);
  assert.equal(sync.indexed, 2);
  assert.deepEqual(calls, [
    `configure:research:${researchIndexSettings.filterableAttributes.join(",")}`,
    "upsert:research:2"
  ]);

  console.log("Search and discovery verification passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
