import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readV2PostgresStore } from "../apps/web/lib/research/postgres-store";

const outputIndex = process.argv.indexOf("--output");
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
const baseUrl = process.env.DEEPTECHLY_REHEARSAL_WEB_URL;
if (!outputPath || !baseUrl) {
  throw new Error("Migration HTTP validation requires an output path and web URL");
}
const aggregateOutputPath = outputPath;
const rehearsalBaseUrl = baseUrl;

void main();

async function main() {
  const data = await readV2PostgresStore();
  const entity = data.entities.find(
    (candidate) =>
      candidate.publishedStatus === "published" &&
      data.articles.some((article) => article.slug === candidate.slug) &&
      data.dossiers.some((dossier) => dossier.slug === candidate.slug)
  );
  assert.ok(entity, "A published entity with article and dossier is required");

  const encodedQuery = encodeURIComponent(entity.name);
  const checks: Array<[string, string, string | RegExp]> = [
    ["homepage", "/", entity.name],
    ["article", `/article/${entity.slug}`, entity.article.headline],
    ["profile", `/startup/${entity.slug}`, entity.name],
    ["dossier", `/dossier/${entity.slug}`, entity.name],
    ["article_archive", "/articles", entity.article.headline],
    ["profile_archive", "/startups", entity.name],
    ["research_queue_shell", "/research", /Queue deep-tech research/i],
    ["article_markdown", `/article/${entity.slug}.md`, /^# /m],
    ["profile_markdown", `/startup/${entity.slug}.md`, /^# /m],
    ["dossier_markdown", `/dossier/${entity.slug}.md`, /Research Dossier/],
    ["search", `/api/search?q=${encodedQuery}`, entity.name]
  ];

  for (const [label, path, expected] of checks) {
    const response = await fetch(`${rehearsalBaseUrl}${path}`, { redirect: "manual" });
    assert.equal(response.status, 200, `${label} returned ${response.status}`);
    const body = await response.text();
    if (typeof expected === "string") {
      assert.ok(body.includes(expected), `${label} omitted the migrated record`);
    } else {
      assert.match(body, expected, `${label} did not match its render contract`);
    }
  }

  const summary = {
    status: "pass",
    checks: checks.map(([label]) => label),
    checkedRoutes: checks.length,
    savedResearchExpectation: 0,
    accountOwnedResearchRows: data.jobs.filter((job) => Boolean(job.userId)).length
  };
  writeFileSync(resolve(aggregateOutputPath), `${JSON.stringify(summary, null, 2)}\n`, {
    mode: 0o600
  });
  console.log(`Validated ${checks.length} HTTP surfaces against migrated PostgreSQL data.`);
}
