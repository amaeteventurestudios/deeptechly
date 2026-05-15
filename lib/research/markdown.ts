import type { ResearchEntity, Source } from "@/lib/types";

function sourceList(sources: Source[]) {
  return sources
    .map((source, index) => `${index + 1}. [${source.title}](${source.url}) — ${source.type}`)
    .join("\n");
}

export function articleMarkdown(entity: ResearchEntity) {
  const showOpenQuestions =
    entity.confidenceLabel !== "HIGH CONFIDENCE" &&
    (entity.article.openQuestions?.length ?? 0) > 0;

  const openQuestionsSection = showOpenQuestions
    ? `\n\n## Open Questions\n\n${entity.article.openQuestions!.map((q) => `- ${q}`).join("\n")}`
    : "";

  return `# ${entity.article.headline}

${entity.article.dek}

Entity: ${entity.name}
Sector: ${entity.sector}
Confidence: ${entity.confidenceLabel} (${entity.confidenceScore}/100)
Research dossier: /dossier/${entity.slug}

${entity.article.sections
  .map(
    (section) => `## ${section.title}

${section.body.join("\n\n")}`
  )
  .join("\n\n")}${openQuestionsSection}

## Sources

${sourceList(entity.sources)}
`;
}

export function startupMarkdown(entity: ResearchEntity) {
  return `# ${entity.name} Research Profile

${entity.summary}

Entity type: ${entity.entityType}
Primary sector: ${entity.sector}
Secondary sectors: ${entity.secondarySectors.join(", ")}
Region: ${entity.region}
Stage: ${entity.stage}
Confidence: ${entity.confidenceLabel} (${entity.confidenceScore}/100)
Article: /article/${entity.slug}
Dossier: /dossier/${entity.slug}

## Snapshot

- Entity type: ${entity.snapshot.entityType}
- Primary sector: ${entity.snapshot.primarySector}
- Region: ${entity.snapshot.region}
- Stage: ${entity.snapshot.stage}
- Source count: ${entity.snapshot.sourceCount}
- Confidence: ${entity.snapshot.confidence}

## Overview

${entity.dossier.companyOverview.join("\n\n")}

## Technical Summary

${entity.dossier.productAndTechnology.join("\n\n")}

## Market Position

${entity.dossier.marketResearch.join("\n\n")}

## Competitive Landscape

${entity.dossier.competitiveLandscape
  .map(
    (item) =>
      `- ${item.companyOrApproach}: ${item.category}. Strength: ${item.strength}. Constraint: ${item.constraint}. Relevance: ${item.relevance}.`
  )
  .join("\n")}

## Key Signals

${[
  entity.dossier.hiringSignal?.[0] ?? null,
  entity.dossier.tractionAndMetrics?.[0] ?? null,
  entity.dossier.socialAndPRSignal?.[0] ?? null,
  entity.dossier.opportunity?.government?.[0] ?? null
]
  .filter(Boolean)
  .map((signal) => `- ${signal}`)
  .join("\n") || "- No confirmed signals in available public sources."}

## Open Questions

${entity.dossier.accuracyAndConfidence.unverified.length > 0
  ? entity.dossier.accuracyAndConfidence.unverified.map((item) => `- ${item}`).join("\n")
  : "- No open questions identified in the current source set."}

## Technology Tags

${Array.from(new Set([entity.sector, ...entity.secondarySectors, ...entity.tags, ...(entity.sectorTags ?? [])]))
  .map((tag) => `- ${tag}`)
  .join("\n")}

## Confidence Score

${entity.confidenceScore}/100 — ${entity.confidenceLabel}

## Accuracy and Confidence

Confirmed:
${entity.dossier.accuracyAndConfidence.confirmed.map((item) => `- ${item}`).join("\n")}

Inferred:
${entity.dossier.accuracyAndConfidence.inferred.map((item) => `- ${item}`).join("\n")}

Unverified:
${entity.dossier.accuracyAndConfidence.unverified.map((item) => `- ${item}`).join("\n")}

## Sources

${sourceList(entity.sources)}

## Related Pages

- Article: /article/${entity.slug}
- Dossier: /dossier/${entity.slug}
`;
}

export function dossierMarkdown(entity: ResearchEntity) {
  const competitiveLandscape = entity.dossier.competitiveLandscape
    .map(
      (item) =>
        `- ${item.companyOrApproach}: ${item.category}. Strength: ${item.strength}. Constraint: ${item.constraint}. Relevance: ${item.relevance}.`
    )
    .join("\n");

  return `# ${entity.name} Public Research Dossier

${entity.summary}

Entity type: ${entity.entityType}
Primary sector: ${entity.sector}
Region: ${entity.region}
Confidence: ${entity.confidenceLabel} (${entity.confidenceScore}/100)
Article: /article/${entity.slug}
Profile: /startup/${entity.slug}

## Executive Summary

${entity.dossier.executiveSummary.join("\n\n")}

## Overview

${entity.dossier.companyOverview.join("\n\n")}

## Key Facts

- Source count: ${entity.sourceCount}
- Research status: ${entity.snapshot.researchStatus}
- Stage: ${entity.stage}
- Secondary sectors: ${entity.secondarySectors.join(", ")}

## Technical Summary

${entity.dossier.productAndTechnology.join("\n\n")}

## Market Position

${entity.dossier.marketResearch.join("\n\n")}

## Competitive Landscape

${competitiveLandscape}

## Confidence

Label: ${entity.dossier.accuracyAndConfidence.label}

Confirmed:
${entity.dossier.accuracyAndConfidence.confirmed.map((item) => `- ${item}`).join("\n")}

Inferred:
${entity.dossier.accuracyAndConfidence.inferred.map((item) => `- ${item}`).join("\n")}

Unverified:
${entity.dossier.accuracyAndConfidence.unverified.map((item) => `- ${item}`).join("\n")}

## Sources

${sourceList(entity.dossier.sources)}

## Related Pages

- Article: /article/${entity.slug}
- Article markdown: /article/${entity.slug}.md
- Public profile: /startup/${entity.slug}
- Public profile markdown: /startup/${entity.slug}.md
`;
}
