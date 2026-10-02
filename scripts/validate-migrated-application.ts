import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readV2PostgresStore } from "../apps/web/lib/research/postgres-store";
import {
  articleMarkdown,
  dossierMarkdown,
  startupMarkdown
} from "../apps/web/lib/research/markdown";

const outputIndex = process.argv.indexOf("--output");
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
if (!outputPath) {
  throw new Error(
    "Usage: configure the local V2 database and pass --output <aggregate.json>"
  );
}
const aggregateOutputPath = outputPath;

void main();

async function main() {
  const data = await readV2PostgresStore();
  assert.equal(data.entities.length, 5);
  assert.equal(data.articles.length, 5);
  assert.equal(data.dossiers.length, 4);
  assert.equal(data.jobs.length, 30);

  const articlesBySlug = new Map(data.articles.map((article) => [article.slug, article]));
  const dossiersBySlug = new Map(data.dossiers.map((dossier) => [dossier.slug, dossier]));
  let articleMarkdownCount = 0;
  let profileMarkdownCount = 0;
  let dossierMarkdownCount = 0;
  let relatedResearchCount = 0;

  for (const entity of data.entities) {
    assert.ok(entity.id && entity.slug && entity.name);
    assert.ok(Array.isArray(entity.sources) && entity.sources.length > 0);
    assert.ok(entity.article && entity.dossier);
    assert.match(startupMarkdown(entity), new RegExp(`# ${escapeRegExp(entity.name)}`));
    profileMarkdownCount += 1;

    if (articlesBySlug.has(entity.slug)) {
      assert.match(articleMarkdown(entity), /^# /);
      articleMarkdownCount += 1;
    }
    if (dossiersBySlug.has(entity.slug)) {
      assert.match(dossierMarkdown(entity), /Research Dossier/);
      dossierMarkdownCount += 1;
    }
    relatedResearchCount += entity.relatedEntities?.length ?? 0;
  }

  for (const job of data.jobs) {
    assert.ok(job.id && job.query && job.createdAt && job.updatedAt);
    assert.ok(["done", "failed", "cancelled"].includes(job.stage));
    assert.ok(job.completedAt, `Terminal migrated job ${job.id} must have completedAt`);
  }

  const summary = {
    status: "pass",
    records: {
      entities: data.entities.length,
      articles: data.articles.length,
      dossiers: data.dossiers.length,
      researchJobs: data.jobs.length
    },
    markdown: {
      profiles: profileMarkdownCount,
      articles: articleMarkdownCount,
      dossiers: dossierMarkdownCount
    },
    queueHistoryRows: data.jobs.length,
    relatedResearchLinks: relatedResearchCount,
    publicationStates: {
      publishedEntities: data.entities.filter(
        (entity) => entity.publishedStatus === "published"
      ).length,
      draftEntities: data.entities.filter((entity) => entity.publishedStatus === "draft")
        .length,
      publishedArticles: data.articles.filter(
        (article) => article.publishedStatus === "published"
      ).length,
      publishedDossiers: data.dossiers.filter(
        (dossier) => dossier.publishedStatus === "published"
      ).length
    }
  };

  writeFileSync(resolve(aggregateOutputPath), `${JSON.stringify(summary, null, 2)}\n`, {
    mode: 0o600
  });
  console.log(
    `Validated ${data.entities.length} migrated entity models, ${data.jobs.length} queue rows, and ${profileMarkdownCount + articleMarkdownCount + dossierMarkdownCount} Markdown renders.`
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
