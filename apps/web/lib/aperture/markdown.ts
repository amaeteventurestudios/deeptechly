import type {
  ApertureOpportunity,
  ApertureProblem,
  AperturePublication,
  ApertureSignal
} from "@deeptechly/aperture";

export function apertureMarkdown(item: AperturePublication) {
  const sections = item.kind === "signal"
    ? signalSections(item)
    : item.kind === "problem"
      ? problemSections(item)
      : opportunitySections(item);
  const sources = item.sources
    .map((source, index) => `${index + 1}. [${clean(source.title)}](${source.url}) — ${clean(source.publisher)}; ${clean(source.documentType)}`)
    .join("\n");

  return [
    `# ${clean(item.title)}`,
    `\n> ${clean(item.summary)}`,
    "\n## Research metadata",
    `- Product: Aperture by DeepTechly`,
    `- Artifact: ${item.kind}`,
    `- Confidence: ${item.confidenceLabel}`,
    `- Public sources: ${item.sourceCount}`,
    `- Methodology: ${item.methodologyVersion}`,
    ...sections.flatMap(([title, values]) => values.length ? [`\n## ${title}`, values.map((value) => `- ${clean(value)}`).join("\n")] : []),
    "\n## Sources",
    sources,
    "\n---\nThis public Aperture artifact includes only published evidence-backed content. Missing fields are unknown, not negative evidence."
  ].join("\n");
}

function signalSections(item: ApertureSignal): Array<[string, string[]]> {
  return [
    ["Agency ask", item.agencyAsk],
    ["Underlying problem statement", item.problemStatement],
    ["Evidence base", item.evidenceBase],
    ["Technical requirement map", item.technicalRequirements],
    ["Prior and repeated signals", item.repeatedSignals],
    ["Related companies", item.relatedCompanies],
    ["Related patents", item.relatedPatents],
    ["Related labs", item.relatedLabs],
    ["Opportunity read", item.opportunityRead]
  ];
}

function problemSections(item: ApertureProblem): Array<[string, string[]]> {
  return [
    ["Problem statement", [item.problemText]],
    ["Evidence base", item.evidence],
    ["Technical requirements", item.technicalRequirements],
    ["Related signals", item.relatedSignalSlugs]
  ];
}

function opportunitySections(item: ApertureOpportunity): Array<[string, string[]]> {
  return [
    ["Problem statement", item.problemStatement],
    ["Repeated demand pattern", item.demandPattern],
    ["Technical requirement map", item.requirementMap],
    ["Company matches", item.companyMatches],
    ["Patent matches", item.patentMatches],
    ["Lab matches", item.labMatches],
    ["Opportunity read", item.opportunityRead]
  ];
}

function clean(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}
