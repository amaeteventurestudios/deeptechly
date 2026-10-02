import "server-only";

import { createHash } from "node:crypto";
import { getPublishedEntities } from "@/lib/research/public-data";
import type { ConfidenceLabel, Source } from "@/lib/types";

export type PublicPatentRecord = {
  slug: string;
  title: string;
  sourceUrl: string;
  sourcePublisher: string;
  sourceDate: string | null;
  entityName: string;
  entitySlug: string;
  sector: string;
  confidenceLabel: ConfidenceLabel;
  summary: string;
  caveat: string;
};

export async function listPublicPatentRecords(): Promise<PublicPatentRecord[]> {
  const entities = await getPublishedEntities();
  const records = new Map<string, PublicPatentRecord>();

  for (const entity of entities) {
    for (const source of [...entity.sources, ...entity.dossier.sources]) {
      if (!isPatentSource(source)) continue;
      const sourceUrl = normalizePublicUrl(source.url);
      if (!sourceUrl || records.has(sourceUrl)) continue;
      records.set(sourceUrl, {
        slug: patentSlug(sourceUrl),
        title: source.title,
        sourceUrl,
        sourcePublisher: source.publisher ?? new URL(sourceUrl).hostname,
        sourceDate: source.date ?? null,
        entityName: entity.name,
        entitySlug: entity.slug,
        sector: entity.sector,
        confidenceLabel: entity.confidenceLabel,
        summary: `A public patent-related source attached to DeepTechly research on ${entity.name}.`,
        caveat:
          "This source establishes a patent-research lead only. It does not by itself establish ownership, assignment, exclusivity, licensing status, product readiness, or commercial traction."
      });
    }
  }

  return [...records.values()].sort((left, right) =>
    `${left.entityName}:${left.title}`.localeCompare(`${right.entityName}:${right.title}`)
  );
}

export async function getPublicPatentRecord(slug: string) {
  return (await listPublicPatentRecords()).find((record) => record.slug === slug) ?? null;
}

export function publicPatentMarkdown(record: PublicPatentRecord) {
  return `# ${record.title}

## Patent research signal

${record.summary}

- Related entity: ${record.entityName}
- Sector: ${record.sector}
- Confidence context: ${record.confidenceLabel}
- Source publisher: ${record.sourcePublisher}
${record.sourceDate ? `- Source date: ${record.sourceDate}\n` : ""}- Source: ${record.sourceUrl}

## Evidence boundary

${record.caveat}

## Related research

- Profile: /startup/${record.entitySlug}
- Patent page: /patent/${record.slug}

Independent research. Not investment advice.
`;
}

function patentSlug(sourceUrl: string) {
  return `source-${createHash("sha256").update(sourceUrl).digest("hex").slice(0, 16)}`;
}

function isPatentSource(source: Source) {
  return source.type === "patent" || /patent|uspto|lens\.org/i.test(source.url);
}

function normalizePublicUrl(value: string) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
