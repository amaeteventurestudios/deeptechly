import "server-only";

import {
  getPublishedArtifactAvailabilityForSlugs,
  getPublishedEntities
} from "@/lib/research/public-data";
import type { DiscoveryDocument } from "./types";
import {
  listPublicOpportunities,
  listPublicProblems,
  listPublicSignals
} from "@/lib/aperture/public-data";
import { listPublicPatentRecords } from "@/lib/patents/public-data";

export async function buildPublishedDiscoveryDocuments(): Promise<DiscoveryDocument[]> {
  const [entities, signals, problems, opportunities, patents] = await Promise.all([
    getPublishedEntities(),
    listPublicSignals(),
    listPublicProblems(),
    listPublicOpportunities(),
    listPublicPatentRecords()
  ]);
  const availability = await getPublishedArtifactAvailabilityForSlugs(
    entities.map((entity) => entity.slug)
  );
  const documents: DiscoveryDocument[] = [];

  for (const entity of entities) {
    const publishedAt = entity.article.publishedAt ?? entity.updatedAt ?? entity.createdAt ?? null;
    documents.push({
      id: `entity:${entity.slug}`,
      kind: "entity",
      title: entity.name,
      slug: entity.slug,
      summary: entity.summary,
      href: `/startup/${entity.slug}`,
      entityName: entity.name,
      sector: entity.sector,
      confidenceLabel: entity.confidenceLabel,
      sourceCount: entity.sourceCount,
      publishedAt,
      published: true
    });

    if (availability.get(entity.slug)?.article) {
      documents.push({
        id: `article:${entity.slug}`,
        kind: "article",
        title: entity.article.headline,
        slug: entity.slug,
        summary: entity.article.dek,
        href: `/article/${entity.slug}`,
        entityName: entity.name,
        sector: entity.sector,
        confidenceLabel: entity.confidenceLabel,
        sourceCount: entity.sourceCount,
        publishedAt,
        published: true
      });
    }

  }

  for (const patent of patents) {
    documents.push({
      id: `patent:${patent.slug}`,
      kind: "patent",
      title: patent.title,
      slug: patent.slug,
      summary: patent.summary,
      href: `/patent/${patent.slug}`,
      entityName: patent.entityName,
      sector: patent.sector,
      confidenceLabel: patent.confidenceLabel,
      sourceCount: 1,
      publishedAt: patent.sourceDate,
      published: true
    });
  }

  for (const item of [...signals, ...problems, ...opportunities]) {
    const path = item.kind === "opportunity" ? "opportunities" : `${item.kind}s`;
    documents.push({
      id: `${item.kind}:${item.slug}`,
      kind: item.kind,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      href: `/aperture/${path}/${item.slug}`,
      entityName: item.kind === "signal" ? item.agency.name : item.kind === "problem" ? item.agency?.name : undefined,
      confidenceLabel: item.confidenceLabel,
      sourceCount: item.sourceCount,
      publishedAt: null,
      published: true
    });
  }

  return documents;
}
