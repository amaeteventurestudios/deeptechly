import type { ResearchEntity, Source } from "@/lib/types";

const emptyCopy = "Not confirmed in public sources.";
const limitedCopy = "Limited public data found.";

function valueOrEmpty(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return emptyCopy;
  return String(value);
}

function cleanText(value?: string | number | null) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n").trim();
}

function joinSections(sections: Array<string | null | undefined>) {
  return sections.map(cleanText).filter(Boolean).join("\n\n");
}

function markdownSection(title: string, body?: string | null) {
  const content = cleanText(body);
  if (!content) return "";
  return `## ${title}\n\n${content}`;
}

function bulletList(items: Array<string | null | undefined>, fallback = limitedCopy) {
  const visible = items.map(cleanText).filter(Boolean);
  if (visible.length === 0) return `- ${fallback}`;
  return visible.map((item) => `- ${item}`).join("\n");
}

function sourceTitle(source: Source) {
  return cleanText(source.title) || "Source";
}

function sourceList(sources: Source[]) {
  const visibleSources = sources.filter((source) => cleanText(source.url));
  if (visibleSources.length === 0) return `- ${limitedCopy}`;

  return visibleSources
    .map((source) => {
      const meta = [
        cleanText(source.publisher),
        cleanText(source.type),
        source.retrievedAt
          ? `Retrieved ${source.retrievedAt}`
          : source.date
            ? `Retrieved ${source.date}`
            : ""
      ].filter(Boolean);
      return `- [${sourceTitle(source)}](${source.url})${meta.length ? ` — ${meta.join(" · ")}` : ""}`;
    })
    .join("\n");
}

function publicCompetitiveLandscape(entity: ResearchEntity) {
  return bulletList(
    entity.dossier.competitiveLandscape.map((item) =>
      [
        cleanText(item.companyOrApproach),
        cleanText(item.category),
        cleanText(item.relevance)
      ]
        .filter(Boolean)
        .join(" — ")
    )
  );
}

function profileCompetitiveLandscape(entity: ResearchEntity) {
  return bulletList(
    entity.dossier.competitiveLandscape.map((item) =>
      [
        cleanText(item.companyOrApproach),
        cleanText(item.category),
        item.strength ? `Strength: ${item.strength}` : "",
        item.constraint ? `Constraint: ${item.constraint}` : "",
        item.relevance ? `Relevance: ${item.relevance}` : ""
      ]
        .filter(Boolean)
        .join(". ")
    )
  );
}

function keySignals(entity: ResearchEntity) {
  return bulletList([
    entity.dossier.opportunity.government[0],
    entity.dossier.opportunity.technical[0],
    entity.dossier.companyPositioning.strategicWedge,
    entity.dossier.accuracyAndConfidence.confirmed[0]
  ]);
}

function confidenceBlock(entity: ResearchEntity) {
  const accuracy = entity.dossier.accuracyAndConfidence;
  return `## Confidence

- Label: ${valueOrEmpty(entity.confidenceLabel)}
- Score: ${valueOrEmpty(entity.confidenceScore)}

### Confirmed Facts

${bulletList(accuracy.confirmed)}

### Source-Attributed / Inferred Claims

${bulletList(accuracy.inferred)}

### Unverified Claims

${bulletList(accuracy.unverified)}
`;
}

function relatedPages(entity: ResearchEntity) {
  return `## Related Pages

- Article: /article/${entity.slug}
- Profile: /startup/${entity.slug}
- Dossier: /dossier/${entity.slug}
- Article markdown: /article/${entity.slug}.md
- Profile markdown: /startup/${entity.slug}.md
- Dossier markdown: /dossier/${entity.slug}.md`;
}

function articleBody(entity: ResearchEntity) {
  return entity.article.sections
    .filter((section) => cleanText(section.title) || section.body.some(Boolean))
    .map(
      (section) => `### ${valueOrEmpty(section.title)}

${joinSections(section.body) || emptyCopy}`
    )
    .join("\n\n");
}

export function articleMarkdown(entity: ResearchEntity) {
  const openQuestions =
    entity.article.openQuestions?.length
      ? entity.article.openQuestions
      : entity.dossier.accuracyAndConfidence.unverified;

  return [
    `# ${valueOrEmpty(entity.article.headline)}`,
    markdownSection("Summary", entity.article.dek || entity.summary),
    `## Entity

- Name: ${valueOrEmpty(entity.name)}
- Sector: ${valueOrEmpty(entity.sector)}
- Confidence: ${valueOrEmpty(entity.confidenceLabel)}
- Source count: ${valueOrEmpty(entity.sourceCount)}
- Published: ${valueOrEmpty(entity.article.publishedAt)}
- Updated: ${valueOrEmpty(entity.updatedAt ?? entity.lastResearchedAt)}`,
    markdownSection(
      "Research Snapshot",
      bulletList([
        entity.summary,
        entity.description,
        entity.dossier.accuracyAndConfidence.confirmed[0]
      ])
    ),
    markdownSection("Article", articleBody(entity)),
    markdownSection("Open Questions", bulletList(openQuestions)),
    markdownSection("Sources", sourceList(entity.sources)),
    confidenceBlock(entity),
    relatedPages(entity)
  ]
    .filter(Boolean)
    .join("\n\n")
    .trimEnd()
    .concat("\n");
}

export function startupMarkdown(entity: ResearchEntity) {
  return [
    `# ${valueOrEmpty(entity.name)}`,
    `## Snapshot

- Sector: ${valueOrEmpty(entity.sector)}
- Region: ${valueOrEmpty(entity.region)}
- Stage: ${valueOrEmpty(entity.stage)}
- Source count: ${valueOrEmpty(entity.sourceCount)}
- Confidence: ${valueOrEmpty(entity.confidenceLabel)}
- Last updated: ${valueOrEmpty(entity.updatedAt ?? entity.lastResearchedAt)}`,
    markdownSection("Overview", joinSections([entity.summary, ...entity.dossier.companyOverview])),
    markdownSection("Technical Summary", joinSections(entity.dossier.productAndTechnology)),
    markdownSection("Market Position", joinSections(entity.dossier.marketResearch)),
    markdownSection("Competitive Landscape", profileCompetitiveLandscape(entity)),
    markdownSection("Key Signals", keySignals(entity)),
    markdownSection("Open Questions", bulletList(entity.dossier.accuracyAndConfidence.unverified)),
    markdownSection("Sources", sourceList(entity.sources)),
    confidenceBlock(entity),
    relatedPages(entity)
  ]
    .filter(Boolean)
    .join("\n\n")
    .trimEnd()
    .concat("\n");
}

export function dossierMarkdown(entity: ResearchEntity) {
  return [
    `# ${valueOrEmpty(entity.name)} Research Dossier`,
    markdownSection("Overview", joinSections([entity.summary, ...entity.dossier.companyOverview])),
    markdownSection("Technical Summary", joinSections(entity.dossier.productAndTechnology)),
    markdownSection("Market Position", joinSections(entity.dossier.marketResearch)),
    markdownSection("Competitive Landscape", publicCompetitiveLandscape(entity)),
    markdownSection("Sources", sourceList(entity.dossier.sources)),
    confidenceBlock(entity),
    `## Public Access Notice

This markdown route includes only public dossier sections. Institutional analysis may require verified access on the web dossier page.`,
    relatedPages(entity)
  ]
    .filter(Boolean)
    .join("\n\n")
    .trimEnd()
    .concat("\n");
}
