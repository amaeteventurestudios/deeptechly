import type { ResearchEntity, Source } from "@/lib/types";

function sourceList(sources: Source[]) {
  return sources
    .map((source, index) => `${index + 1}. [${source.title}](${source.url}) — ${source.type}`)
    .join("\n");
}

export function articleMarkdown(entity: ResearchEntity) {
  return `# ${entity.article.headline}

${entity.article.dek}

Entity: ${entity.name}
Sector: ${entity.sector}
Confidence: ${entity.confidenceLabel} (${entity.confidenceScore}/100)
Research dossier: /startup/${entity.slug}

${entity.article.sections
  .map(
    (section) => `## ${section.title}

${section.body.join("\n\n")}`
  )
  .join("\n\n")}

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

## Executive Summary

${entity.dossier.executiveSummary.join("\n\n")}

## Company Overview

${entity.dossier.companyOverview.join("\n\n")}

## Product and Technology

${entity.dossier.productAndTechnology.join("\n\n")}

## Market Research

${entity.dossier.marketResearch.join("\n\n")}

## Accuracy and Confidence

Confirmed:
${entity.dossier.accuracyAndConfidence.confirmed.map((item) => `- ${item}`).join("\n")}

Inferred:
${entity.dossier.accuracyAndConfidence.inferred.map((item) => `- ${item}`).join("\n")}

Unverified:
${entity.dossier.accuracyAndConfidence.unverified.map((item) => `- ${item}`).join("\n")}

## Strategic Outlook

${entity.dossier.strategicOutlook.join("\n\n")}

## Sources

${sourceList(entity.dossier.sources)}
`;
}
