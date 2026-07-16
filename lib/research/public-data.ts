import "server-only";

import { entities as seedEntities, getEntityBySlug as getSeedEntityBySlug } from "@/lib/data";
import type { ResearchEntity } from "@/lib/types";
import type { StoredResearchArticle } from "./types";
import { listPublishedArticles, readStore } from "./store";
import {
  articleMetadataFromStoredArticle,
  inferRegionTag,
  inferStageTag,
  normalizeDeeptechlyAgent,
  storySectorTags
} from "@/lib/story-metadata";

const seedAsPublished = (entity: ResearchEntity): ResearchEntity => {
  const sectorTags = entity.sectorTags?.length
    ? entity.sectorTags
    : storySectorTags(entity);
  const stageTag =
    entity.stageTag ??
    inferStageTag({
      fundingStage: entity.fundingStage,
      stage: entity.stage,
      trl: entity.dossier.dataSnapshot.trl,
      mrl: entity.dossier.dataSnapshot.mrl
    });
  const regionTag = entity.regionTag ?? inferRegionTag(entity.headquarters ?? entity.region);
  const authorPersona =
    normalizeDeeptechlyAgent(entity.article.authorPersona, entity.sector, [
      ...sectorTags,
      entity.summary
    ]);

  return {
    ...entity,
    sectorTags,
    stageTag,
    regionTag,
    entityTypeTag: entity.entityTypeTag ?? entity.entityType,
    publishedStatus: "published",
    searchCount: entity.searchCount ?? 0,
    article: {
      ...entity.article,
      title: entity.article.headline,
      entityName: entity.name,
      entitySlug: entity.slug,
      authorPersona,
      publishedAt: entity.article.publishedAt ?? "2026-05-10T12:00:00.000Z",
      dossierUrl: `/dossier/${entity.slug}`,
      publishedStatus: "published",
      tags: entity.tags,
      sectorTags,
      stageTag,
      regionTag,
      entityTypeTag: entity.entityType,
      sources: entity.sources
    }
  };
};

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
  let generated: ResearchEntity[] = [];

  try {
    const stored = await readStore();
    generated = stored.entities.filter(
      (entity) => entity.publishedStatus === "published"
    );
  } catch (error) {
    console.error("Generated research store unavailable", error);
  }

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
  let generatedArticles: StoredResearchArticle[] = [];

  try {
    const stored = await readStore();
    const eligibleGeneratedSlugs = new Set(
      stored.entities
        .filter((entity) => entity.publishedStatus === "published")
        .map((entity) => entity.slug)
    );
    generatedArticles = (await listPublishedArticles())
      .filter((article) => eligibleGeneratedSlugs.has(article.slug))
      .map((article) => ({
        ...article,
        ...articleMetadataFromStoredArticle(article)
      }));
  } catch (error) {
    console.error("Generated article store unavailable", error);
  }

  const entities = await getPublishedEntities();
  const entityArticles = entities.map((entity) => {
    const sectorTags = entity.article.sectorTags ?? entity.sectorTags ?? storySectorTags(entity);
    return {
      id: entity.article.entitySlug ?? entity.slug,
      slug: entity.slug,
      entityId: entity.id ?? entity.slug,
      title: entity.article.headline,
      dek: entity.article.dek,
      authorPersona:
        normalizeDeeptechlyAgent(entity.article.authorPersona, entity.sector, [
          ...sectorTags,
          entity.summary
        ]),
      heroImage:
        entity.article.heroImageUrl ??
        entity.article.heroImage ??
        entity.heroImageUrl ??
        entity.heroImage ??
        entity.logoUrl ??
        entity.article.entityLogoUrl ??
        entity.faviconUrl ??
        entity.article.faviconUrl ??
        entity.article.sourceOgImageUrl ??
        null,
      heroImageUrl: entity.article.heroImageUrl ?? entity.heroImageUrl ?? null,
      heroImageSourceUrl: entity.article.heroImageSourceUrl ?? entity.heroImageSourceUrl ?? null,
      heroImageAlt: entity.article.heroImageAlt ?? entity.heroImageAlt ?? null,
      imageAttribution: entity.article.imageAttribution ?? entity.imageAttribution ?? null,
      sourceOgImageUrl: entity.article.sourceOgImageUrl ?? null,
      entityLogoUrl: entity.article.entityLogoUrl ?? entity.logoUrl ?? null,
      faviconUrl: entity.article.faviconUrl ?? entity.faviconUrl ?? null,
      bodySections: entity.article.sections,
      tags: entity.tags,
      sectorTags,
      stageTag: entity.article.stageTag ?? entity.stageTag ?? "UNKNOWN",
      regionTag: entity.article.regionTag ?? entity.regionTag ?? "UNKNOWN",
      entityTypeTag: entity.article.entityTypeTag ?? entity.entityTypeTag ?? entity.entityType,
      sources: entity.sources,
      publishedStatus: "published",
      adminFeatured: entity.article.adminFeatured ?? false,
      publishedAt: entity.article.publishedAt ?? null,
      createdAt: entity.createdAt ?? entity.article.publishedAt ?? new Date().toISOString(),
      updatedAt: entity.updatedAt ?? entity.article.publishedAt ?? new Date().toISOString()
    };
  }) satisfies StoredResearchArticle[];
  const generatedArticleSlugs = new Set(generatedArticles.map((article) => article.slug));

  return [
    ...generatedArticles,
    ...entityArticles.filter((article) => !generatedArticleSlugs.has(article.slug))
  ];
}

export async function getEntityBySlugFromAll(slug: string) {
  try {
    const data = await readStore();
    const generated = data.entities.find((entity) => entity.slug === slug);
    if (generated) {
      return generated;
    }
  } catch (error) {
    console.error("Generated research store unavailable", error);
  }

  return getSeedEntityBySlug(slug) ? seedAsPublished(getSeedEntityBySlug(slug)!) : null;
}

export async function getPublishedEntityBySlug(slug: string) {
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity || entity.publishedStatus !== "published") {
    return null;
  }

  return entity;
}

/**
 * Public pages must respect artifact-level publication, not just the profile's
 * entity record. Seed research is intentionally treated as a complete public set.
 */
async function hasPublishedStoredArtifact(
  slug: string,
  artifact: "article" | "dossier"
) {
  if (getSeedEntityBySlug(slug)) return true;

  try {
    const data = await readStore();
    return artifact === "article"
      ? data.articles.some(
          (item) => item.slug === slug && item.publishedStatus === "published"
        )
      : data.dossiers.some(
          (item) => item.slug === slug && item.publishedStatus === "published"
        );
  } catch (error) {
    console.error("Generated research store unavailable", error);
    return false;
  }
}

export async function getPublishedArticleEntityBySlug(slug: string) {
  const entity = await getPublishedEntityBySlug(slug);
  if (!entity || !(await hasPublishedStoredArtifact(slug, "article"))) return null;
  return entity;
}

export async function getPublishedDossierEntityBySlug(slug: string) {
  const entity = await getPublishedEntityBySlug(slug);
  if (!entity || !(await hasPublishedStoredArtifact(slug, "dossier"))) return null;
  return entity;
}

export async function getPublishedArtifactAvailability(slug: string) {
  const entity = await getPublishedEntityBySlug(slug);
  if (!entity) return { profile: false, article: false, dossier: false };
  const [article, dossier] = await Promise.all([
    hasPublishedStoredArtifact(slug, "article"),
    hasPublishedStoredArtifact(slug, "dossier")
  ]);
  return { profile: true, article, dossier };
}

/** Batch availability is used by discovery routes to avoid one store read per URL. */
export async function getPublishedArtifactAvailabilityForSlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs));
  const result = new Map<string, { profile: boolean; article: boolean; dossier: boolean }>();
  let data: Awaited<ReturnType<typeof readStore>> | null = null;

  try {
    data = await readStore();
  } catch (error) {
    console.error("Generated research store unavailable", error);
  }

  for (const slug of uniqueSlugs) {
    const seed = getSeedEntityBySlug(slug);
    const entity = seed
      ? seedAsPublished(seed)
      : data?.entities.find(
          (item) => item.slug === slug && item.publishedStatus === "published"
        );
    result.set(slug, {
      profile: Boolean(entity),
      article: Boolean(
        seed || data?.articles.some((item) => item.slug === slug && item.publishedStatus === "published")
      ),
      dossier: Boolean(
        seed || data?.dossiers.some((item) => item.slug === slug && item.publishedStatus === "published")
      )
    });
  }

  return result;
}
