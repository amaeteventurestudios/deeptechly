import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");
moduleLoader._resolveFilename = function resolveServerOnly(request, parent, isMain, options) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

async function verify() {
  const { publicPatentMarkdown } = await import("../apps/web/lib/patents/public-data");
  const markdown = publicPatentMarkdown({
    slug: "source-tested",
    title: "Official patent record",
    sourceUrl: "https://patents.google.com/patent/US1234567",
    sourcePublisher: "Google Patents",
    sourceDate: "2025-01-01",
    entityName: "Test Entity",
    entitySlug: "test-entity",
    sector: "Robotics",
    confidenceLabel: "MODERATE CONFIDENCE",
    summary: "A verified public source.",
    caveat: "This is not proof of ownership."
  });
  assert.match(markdown, /^# Official patent record/m);
  assert.match(markdown, /## Evidence boundary/);
  assert.match(markdown, /not proof of ownership/);
  assert.match(markdown, /https:\/\/patents\.google\.com/);

  const nextConfig = readFileSync("apps/web/next.config.mjs", "utf8");
  assert.match(nextConfig, /\/patent\/:slug\.md/);

  const sitemap = readFileSync("apps/web/app/sitemap.xml/route.ts", "utf8");
  for (const route of ["/explore", "/patent/", "/aperture/signals/", "/aperture/problems/", "/aperture/opportunities/"]) {
    assert.ok(sitemap.includes(route), `sitemap must include ${route}`);
  }

  for (const guide of ["apps/web/app/llms.txt/route.ts", "apps/web/app/llms-full.txt/route.ts"]) {
    const contents = readFileSync(guide, "utf8");
    assert.match(contents, /Aperture/);
    assert.match(contents, /patent/i);
  }

  const structured = readFileSync("apps/web/components/seo/StructuredResearchData.tsx", "utf8");
  assert.match(structured, /application\/ld\+json/);
  assert.match(structured, /citation/);

  console.log("Public discovery and AI-readable output verification passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
