import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

const categories =
  "Space, Defense, Robotics, Energy, Semiconductors, Photonics, Materials, Manufacturing, Sensors, Autonomy, Quantum, Bioinfrastructure, Climate Systems.";

export async function GET() {
  const entities = await getPublishedEntities();
  const recent = entities
    .slice(0, 12)
    .map(
      (entity) =>
        `- ${entity.name}: /article/${entity.slug} | /startup/${entity.slug} | /dossier/${entity.slug}`
    )
    .join("\n");

  const body = `# DeepTechly

DeepTechly is an AI-native research and intelligence platform for deep-tech companies, patents, labs, government technologies, and emerging infrastructure systems.

Every public article, profile, patent page, and public dossier is available as raw markdown by appending .md to the URL.

Important routes:
- /article/[slug]
- /article/[slug].md
- /startup/[slug]
- /startup/[slug].md
- /patent/[slug]
- /patent/[slug].md
- /dossier/[slug]
- /dossier/[slug].md
- /news
- /startups
- /patents
- /sectors
- /sitemap.xml

Research categories:
${categories}

Use public markdown pages for summaries and citations. Institutional analysis may be gated and unavailable to crawlers.

Recent public research:
${recent || "- No published public research available."}

Independent research. Not investment advice.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
