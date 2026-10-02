import "server-only";

import { createHash } from "node:crypto";
import {
  getPublishedArtifactAvailabilityForSlugs,
  getPublishedEntities
} from "@/lib/research/public-data";
import type { DiscoveryDocument } from "./types";

export async function buildPublishedDiscoveryDocuments(): Promise<DiscoveryDocument[]> {
  const entities = await getPublishedEntities();
  const availability = await getPublishedArtifactAvailabilityForSlugs(
    entities.map((entity) => entity.slug)
  );
  const documents: DiscoveryDocument[] = [];
  const seenPatents = new Set<string>();

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

    for (const source of [...entity.sources, ...entity.dossier.sources]) {
      if (source.type !== "patent" && !/patent/i.test(source.url)) continue;
      const key = normalizedExternalUrl(source.url);
      if (!key || seenPatents.has(key)) continue;
      seenPatents.add(key);
      documents.push({
        id: `patent:${createHash("sha256").update(key).digest("hex").slice(0, 20)}`,
        kind: "patent",
        title: source.title,
        slug: entity.slug,
        summary: `Patent evidence connected to the public ${entity.name} research profile.`,
        href: key,
        entityName: entity.name,
        sector: entity.sector,
        confidenceLabel: entity.confidenceLabel,
        sourceCount: 1,
        publishedAt: source.date ?? publishedAt,
        external: true,
        published: true
      });
    }
  }

  return documents;
}

function normalizedExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
