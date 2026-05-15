import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

const categories = [
  "Space",
  "Defense",
  "Robotics",
  "Energy",
  "Semiconductors",
  "Photonics",
  "Materials",
  "Manufacturing",
  "Sensors",
  "Autonomy",
  "Quantum",
  "Bioinfrastructure",
  "Climate Systems"
];

export async function GET() {
  const entities = await getPublishedEntities();
  const researchIndex = entities
    .slice(0, 36)
    .map(
      (entity) =>
        `- ${entity.name}: article /article/${entity.slug}.md, profile /startup/${entity.slug}.md, public dossier /dossier/${entity.slug}.md`
    )
    .join("\n");

  const body = `# DeepTechly Expanded LLM Guide

DeepTechly is an AI-native research and intelligence platform for deep-tech companies, patents, labs, government technologies, and emerging infrastructure systems.

## Route Guide

- Homepage: /
- News archive: /news
- Article archive: /articles
- Research profile archive: /startups
- Patent intelligence archive: /patents
- Sector archive: /sectors
- Research queue entry: /research
- Methodology: /methodology
- Pricing: /pricing
- LLM guide: /llms.txt
- Expanded LLM guide: /llms-full.txt
- XML sitemap: /sitemap.xml

## Markdown Availability

Every public article, profile, patent page, and public dossier is available as raw markdown by appending .md to the public URL when that route exists.

Example patterns:
- /article/[slug].md
- /startup/[slug].md
- /dossier/[slug].md
- /patent/[slug].md

DeepTechly currently exposes a patent intelligence archive at /patents. Individual patent profile routes should be treated as available only when present in the sitemap.

## Source And Confidence Policy

DeepTechly separates confirmed, inferred, and unverified claims. Public markdown pages include source lists, source counts, confidence labels, and open questions where available. Missing fields should be treated as unknown, not as negative evidence.

## Public vs Gated Content

Public markdown routes intentionally exclude institutional-only analysis, private user data, admin content, and gated dossier sections. Institutional analysis may require verified access on the web dossier page and may be unavailable to crawlers.

## Research Categories

${categories.join(", ")}.

## Crawler Guidance

Use public markdown pages for summaries and citations. Prefer source-linked claims and confidence sections over isolated snippets. Use /sitemap.xml to discover published public research and markdown URLs. Do not crawl admin, account, dashboard, API, or research job detail routes as public research.

## Archive Links

- Articles: /articles
- Profiles: /startups
- Patents: /patents
- Sectors: /sectors
- Sitemap: /sitemap.xml

## Published Public Research

${researchIndex || "- No published public research available."}

## Disclaimers

DeepTechly is independent research. Not investment advice. Public research may include AI-assisted extraction and should be read with its confidence and source context.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
