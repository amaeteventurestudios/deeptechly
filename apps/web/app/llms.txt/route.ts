import { getPublishedArtifactAvailabilityForSlugs, getPublishedEntities } from "@/lib/research/public-data";
import { listPublicOpportunities, listPublicProblems, listPublicSignals } from "@/lib/aperture/public-data";
import { listPublicPatentRecords } from "@/lib/patents/public-data";

export const dynamic = "force-dynamic";

const categories =
  "Space, Defense, Robotics, Energy, Semiconductors, Photonics, Materials, Manufacturing, Sensors, Autonomy, Quantum, Bioinfrastructure, Climate Systems.";

export async function GET() {
  const [entities, patents, signals, problems, opportunities] = await Promise.all([
    getPublishedEntities(),
    listPublicPatentRecords(),
    listPublicSignals(),
    listPublicProblems(),
    listPublicOpportunities()
  ]);
  const availability = await getPublishedArtifactAvailabilityForSlugs(entities.map((entity) => entity.slug));
  const recent = entities
    .slice(0, 12)
    .map(
      (entity) => {
        const artifact = availability.get(entity.slug);
        const routes = [
          artifact?.article ? `/article/${entity.slug}` : "",
          artifact?.profile ? `/startup/${entity.slug}` : "",
          artifact?.dossier ? `/dossier/${entity.slug}` : ""
        ].filter(Boolean);
        return routes.length ? `- ${entity.name}: ${routes.join(" | ")}` : "";
      }
    )
    .filter(Boolean)
    .join("\n");
  const intelligence = [
    ...patents.slice(0, 12).map((item) => `- Patent source brief: /patent/${item.slug}.md`),
    ...signals.map((item) => `- Aperture signal: /aperture/signals/${item.slug}.md`),
    ...problems.map((item) => `- Aperture problem: /aperture/problems/${item.slug}.md`),
    ...opportunities.map((item) => `- Aperture opportunity: /aperture/opportunities/${item.slug}.md`)
  ].join("\n");

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
- /explore
- /aperture
- /aperture/signals/[slug].md
- /aperture/problems/[slug].md
- /aperture/opportunities/[slug].md
- /sectors
- /sitemap.xml

Research categories:
${categories}

Use public markdown pages for summaries and citations. Institutional analysis may be gated and unavailable to crawlers.

Recent public research:
${recent || "- No published public research available."}

Public patent and government-demand intelligence:
${intelligence || "- No published intelligence artifacts available."}

Independent research. Not investment advice.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
