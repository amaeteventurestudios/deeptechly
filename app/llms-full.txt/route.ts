import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const entities = await getPublishedEntities();
  const body = `# DeepTechly Expanded LLM Guide

DeepTechly is an independent, AI-native research and intelligence platform for deep-tech companies, patents, labs, government technologies, and emerging infrastructure systems.

## Public Routes

- Homepage: /
- News archive: /news
- Articles archive: /articles
- Research profiles archive: /startups
- Legacy profile archive: /explore
- Research queue: /research
- Sector archive: /sectors
- Patent intelligence archive: /patents
- Pricing: /pricing
- Methodology: /methodology
- LLM guide: /llms.txt
- Expanded LLM guide: /llms-full.txt
- XML sitemap: /sitemap.xml

## Public Research URL Patterns

- Article HTML: /article/<slug>
- Article markdown: /article/<slug>.md
- Startup profile HTML: /startup/<slug>
- Startup profile markdown: /startup/<slug>.md
- Dossier HTML: /dossier/<slug>
- Public dossier markdown: /dossier/<slug>.md

## Recent Public Articles

${entities
  .slice(0, 24)
  .map((entity) => `- ${entity.article.headline}: /article/${entity.slug}`)
  .join("\n")}

## Public Profiles And Dossiers

${entities
  .slice(0, 24)
  .map(
    (entity) =>
      `- ${entity.name}: /startup/${entity.slug} | /dossier/${entity.slug} | /dossier/${entity.slug}.md`
  )
  .join("\n")}

## Research Policy

DeepTechly separates confirmed, inferred, and unverified claims. Public crawler routes should use source lists, confidence labels, and markdown summaries for citation. Institutional sections can be gated and should not be treated as public facts unless they also appear in public markdown.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
