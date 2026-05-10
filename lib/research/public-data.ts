import "server-only";

import { entities as seedEntities, getEntityBySlug as getSeedEntityBySlug } from "@/lib/data";
import type { ResearchEntity } from "@/lib/types";
import type { StoredResearchArticle } from "./types";
import { readStore } from "./store";

const seedAsPublished = (entity: ResearchEntity): ResearchEntity => ({
  ...entity,
  publishedStatus: "published",
  searchCount: entity.searchCount ?? 0,
  article: {
    ...entity.article,
    title: entity.article.headline,
    entityName: entity.name,
    entitySlug: entity.slug,
    authorPersona: entity.article.authorPersona ?? "Viral Bernstein",
    publishedAt: entity.article.publishedAt ?? "2026-05-10T12:00:00.000Z",
    dossierUrl: `/startup/${entity.slug}`,
    publishedStatus: "published",
    tags: entity.tags,
    sources: entity.sources
  }
});

export function storyScore(entity: ResearchEntity) {
  const publishedAt = entity.article.publishedAt
    ? new Date(entity.article.publishedAt).getTime()
    : Date.now() - 1000 * 60 * 60 * 24;
  const ageHours = Math.max(1, (Date.now() - publishedAt) / (1000 * 60 * 60));
  const recencyBoost = Math.max(0, 100 - ageHours * 2);
  const adminBoost = entity.article.adminFeatured ? 100 : 0;
  const sourceCountBoost = entity.sourceCount * 2;
  const confidenceBoost = entity.confidenceScore;
  const searchFrequencyBoost = (entity.searchCount ?? 0) * 5;

  return (
    recencyBoost +
    adminBoost +
    sourceCountBoost +
    confidenceBoost +
    searchFrequencyBoost
  );
}

export async function getPublishedEntities() {
  const data = await readStore();
  const generated = data.entities.filter(
    (entity) => entity.publishedStatus === "published"
  );
  const seedSlugs = new Set(generated.map((entity) => entity.slug));
  const merged = [
    ...generated,
    ...seedEntities
      .filter((entity) => !seedSlugs.has(entity.slug))
      .map(seedAsPublished)
  ];

  return merged.sort((a, b) => storyScore(b) - storyScore(a));
}

export async function getPublishedArticles() {
  const entities = await getPublishedEntities();
  return entities.map((entity) => ({
    id: entity.article.entitySlug ?? entity.slug,
    slug: entity.slug,
    entityId: entity.id ?? entity.slug,
    title: entity.article.headline,
    dek: entity.article.dek,
    authorPersona: entity.article.authorPersona ?? "Viral Bernstein",
    heroImage: entity.article.heroImage ?? entity.heroImage ?? null,
    bodySections: entity.article.sections,
    tags: entity.tags,
    sources: entity.sources,
    publishedStatus: "published",
    adminFeatured: entity.article.adminFeatured ?? false,
    publishedAt: entity.article.publishedAt ?? null,
    createdAt: entity.createdAt ?? entity.article.publishedAt ?? new Date().toISOString(),
    updatedAt: entity.updatedAt ?? entity.article.publishedAt ?? new Date().toISOString()
  })) satisfies StoredResearchArticle[];
}

export async function getEntityBySlugFromAll(slug: string) {
  const data = await readStore();
  const generated = data.entities.find((entity) => entity.slug === slug);
  if (generated) {
    return generated;
  }

  return getSeedEntityBySlug(slug) ? seedAsPublished(getSeedEntityBySlug(slug)!) : null;
}

export async function getPublishedEntityBySlug(slug: string) {
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity || entity.publishedStatus === "draft") {
    return null;
  }

  return entity;
}
