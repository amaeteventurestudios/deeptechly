import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const entities = await getPublishedEntities();
  const articles = entities
    .slice(0, 12)
    .map((entity) => `- ${entity.article.headline}: /article/${entity.slug}`)
    .join("\n");
  const profiles = entities
    .slice(0, 12)
    .map((entity) => `- ${entity.name}: /startup/${entity.slug}`)
    .join("\n");

  const body = `# DeepTechly

DeepTechly is an independent, AI-native research and intelligence platform for deep-tech companies, patents, labs, government technologies, and emerging infrastructure systems.

## Site Sections

- Homepage: /
- Articles: /articles
- Research profiles: /explore
- Research queue: /research
- XML sitemap: /sitemap.xml

## Recent Articles

${articles}

## Research Profiles

${profiles}

## Markdown Routes

Where supported, append .md to public research URLs:

- /article/<slug>.md
- /startup/<slug>.md

## Research Policy

DeepTechly separates confirmed, inferred, and unverified claims. Public research may include AI-assisted extraction, source summaries, confidence scoring, and sober institutional analysis. Missing fields should not be treated as facts.

## Confidence Scoring

Confidence labels include High, Moderate, Limited, and Unverified. Scores are based on source count, source quality, public claim consistency, technical specificity, and completeness.

## Public vs Institutional Research

Public pages include editorial articles, public snapshots, taxonomy, sources, and selected dossier sections. Institutional sections may include investor read, founder analysis, revenue scenarios, traction signals, commercialization risk modeling, and deeper diligence notes.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
