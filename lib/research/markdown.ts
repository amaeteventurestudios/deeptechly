import type { ResearchEntity, Source } from "@/lib/types";

const emptyCopy = "Not confirmed in public sources.";

function valueOrEmpty(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return emptyCopy;
  return String(value);
}

function bulletList(items: string[], fallback = "Limited public data found.") {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return `- ${fallback}`;
  return visible.map((item) => `- ${item}`).join("\n");
}

function sourceList(sources: Source[]) {
  if (sources.length === 0) return "- Limited public data found.";

  return sources
    .map((source, index) => {
      const meta = [
        source.publisher,
        source.type,
        source.date,
        source.retrievedAt ? `retrieved ${source.retrievedAt}` : null
      ]
        .filter(Boolean)
        .join("; ");
      return `${index + 1}. [${source.title}](${source.url})${meta ? ` — ${meta}` : ""}`;
    })
    .join("\n");
}

function competitiveLandscape(entity: ResearchEntity) {
  return bulletList(
    entity.dossier.competitiveLandscape.map(
      (item) =>
        `${item.companyOrApproach}: ${item.category}. Strength: ${item.strength}. Constraint: ${item.constraint}. Relevance: ${item.relevance}.`
    )
  );
}

function keySignals(entity: ResearchEntity) {
  return bulletList([
    entity.dossier.opportunity.government[0],
    entity.dossier.opportunity.technical[0],
    entity.dossier.companyPositioning.strategicWedge,
    entity.dossier.accuracyAndConfidence.confirmed[0]
  ].filter(Boolean));
}

function confidenceBlock(entity: ResearchEntity) {
  const accuracy = entity.dossier.accuracyAndConfidence;
  return `## Confidence

${entity.confidenceLabel} (${entity.confidenceScore}/100)

### Confirmed Facts

${bulletList(accuracy.confirmed)}

### Source-Attributed / Inferred Claims

${bulletList(accuracy.inferred)}

### Unverified Claims

${bulletList(accuracy.unverified)}
`;
}

export function articleMarkdown(entity: ResearchEntity) {
  const openQuestions =
    entity.article.openQuestions?.length
      ? entity.article.openQuestions
      : entity.dossier.accuracyAndConfidence.unverified;

  return `# ${entity.article.headline}

## Summary

${entity.article.dek}

## Research Snapshot

- Entity: ${entity.name}
- Sector: ${entity.sector}
- Region: ${valueOrEmpty(entity.region)}
- Stage: ${valueOrEmpty(entity.stage)}
- Source count: ${entity.sourceCount}
- Confidence: ${entity.confidenceLabel} (${entity.confidenceScore}/100)
- Analyst: ${valueOrEmpty(entity.article.authorPersona)}
- Published: ${valueOrEmpty(entity.article.publishedAt ?? entity.updatedAt)}

## Article Body

${entity.article.sections
  .map(
    (section) => `### ${section.title}

${section.body.join("\n\n")}`
  )
  .join("\n\n")}

## Open Questions

${bulletList(openQuestions, "DeepTechly could not confirm additional open questions from available public sources.")}

## Sources

${sourceList(entity.sources)}

${confidenceBlock(entity)}

## Related Pages

- Article: /article/${entity.slug}
- Public profile: /startup/${entity.slug}
- Public dossier: /dossier/${entity.slug}
- Dossier markdown: /dossier/${entity.slug}.md
`;
}

export function startupMarkdown(entity: ResearchEntity) {
  return `# ${entity.name} Research Profile

${entity.summary}

## Snapshot

- Entity type: ${valueOrEmpty(entity.entityType)}
- Primary sector: ${valueOrEmpty(entity.sector)}
- Secondary sectors: ${entity.secondarySectors.length ? entity.secondarySectors.join(", ") : emptyCopy}
- Region: ${valueOrEmpty(entity.region)}
- Stage: ${valueOrEmpty(entity.stage)}
- Source count: ${entity.sourceCount}
- Confidence: ${entity.confidenceLabel} (${entity.confidenceScore}/100)
- Last updated: ${valueOrEmpty(entity.updatedAt ?? entity.lastResearchedAt)}

## Overview

${entity.dossier.companyOverview.join("\n\n") || emptyCopy}

## Technical Summary

${entity.dossier.productAndTechnology.join("\n\n") || emptyCopy}

## Market Position

${entity.dossier.marketResearch.join("\n\n") || emptyCopy}

## Competitive Landscape

${competitiveLandscape(entity)}

## Key Signals

${keySignals(entity)}

## Open Questions

${bulletList(entity.dossier.accuracyAndConfidence.unverified, "DeepTechly could not confirm this from available public sources.")}

## Sources

${sourceList(entity.sources)}

${confidenceBlock(entity)}

## Related Pages

- Article: /article/${entity.slug}
- Article markdown: /article/${entity.slug}.md
- Public dossier: /dossier/${entity.slug}
- Public dossier markdown: /dossier/${entity.slug}.md
`;
}

export function dossierMarkdown(entity: ResearchEntity) {
  return `# ${entity.name} Public Research Dossier

${entity.summary}

## Overview

${entity.dossier.companyOverview.join("\n\n") || emptyCopy}

## Technical Summary

${entity.dossier.productAndTechnology.join("\n\n") || emptyCopy}

## Market Position

${entity.dossier.marketResearch.join("\n\n") || emptyCopy}

## Competitive Landscape

${competitiveLandscape(entity)}

## Sources

${sourceList(entity.dossier.sources)}

${confidenceBlock(entity)}

## Public Dossier Link

- Public dossier: /dossier/${entity.slug}

## Related Pages

- Feature article: /article/${entity.slug}
- Feature article markdown: /article/${entity.slug}.md
- Public profile: /startup/${entity.slug}
- Public profile markdown: /startup/${entity.slug}.md

Institutional sections are intentionally omitted from this public markdown route.
`;
}
