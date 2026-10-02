import { getPublishedArtifactAvailabilityForSlugs, getPublishedEntities } from "@/lib/research/public-data";
import { siteUrl } from "@/lib/site";
import {
  listPublicAgencies,
  listPublicOpportunities,
  listPublicProblems,
  listPublicSignals
} from "@/lib/aperture/public-data";
import { listPublicPatentRecords } from "@/lib/patents/public-data";

export const dynamic = "force-dynamic";

const sectorSlugs = [
  "space",
  "defense",
  "robotics",
  "energy",
  "semiconductors",
  "photonics",
  "materials",
  "manufacturing",
  "sensors",
  "autonomy",
  "bioinfrastructure",
  "quantum",
  "climate-systems"
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(route: string, lastmod?: string | null) {
  const loc = escapeXml(new URL(route, siteUrl).toString());
  const safeLastmod = lastmod ? escapeXml(lastmod) : null;

  return `  <url>
    <loc>${loc}</loc>${safeLastmod ? `\n    <lastmod>${safeLastmod}</lastmod>` : ""}
  </url>`;
}

export async function GET() {
  const [entities, patents, signals, problems, opportunities, agencies] = await Promise.all([
    getPublishedEntities(),
    listPublicPatentRecords(),
    listPublicSignals(),
    listPublicProblems(),
    listPublicOpportunities(),
    listPublicAgencies()
  ]);
  const availability = await getPublishedArtifactAvailabilityForSlugs(entities.map((entity) => entity.slug));
  const staticRoutes = [
    "/",
    "/news",
    "/articles",
    "/explore",
    "/research",
    "/startups",
    "/patents",
    "/sectors",
    "/pricing",
    "/methodology",
    "/api-access",
    "/aperture",
    "/aperture/signals",
    "/aperture/problems",
    "/aperture/opportunities",
    "/aperture/agencies",
    "/aperture/evidence",
    "/aperture/methodology",
    "/llms.txt",
    "/llms-full.txt",
    "/sitemap.xml"
  ];
  const sectorRoutes = sectorSlugs.map((slug) => `/sector/${slug}`);
  const patentRoutes = patents.flatMap((patent) => [
    [`/patent/${patent.slug}`, patent.sourceDate],
    [`/patent/${patent.slug}.md`, patent.sourceDate]
  ] as Array<[string, string | null]>);
  const apertureRoutes = [
    ...signals.flatMap((item) => [[`/aperture/signals/${item.slug}`, item.lastObservedAt], [`/aperture/signals/${item.slug}.md`, item.lastObservedAt]] as Array<[string, string | null]>),
    ...problems.flatMap((item) => [[`/aperture/problems/${item.slug}`, null], [`/aperture/problems/${item.slug}.md`, null]] as Array<[string, string | null]>),
    ...opportunities.flatMap((item) => [[`/aperture/opportunities/${item.slug}`, null], [`/aperture/opportunities/${item.slug}.md`, null]] as Array<[string, string | null]>),
    ...agencies.map((agency) => [`/aperture/agencies/${agency.slug}`, null] as [string, string | null])
  ];
  const entityRoutes = entities.flatMap((entity) => {
    const lastmod = entity.updatedAt ?? entity.article.publishedAt ?? entity.createdAt ?? null;
    const artifact = availability.get(entity.slug);
    return [
      artifact?.article ? [`/article/${entity.slug}`, lastmod] : null,
      artifact?.article ? [`/article/${entity.slug}.md`, lastmod] : null,
      artifact?.profile ? [`/startup/${entity.slug}`, lastmod] : null,
      artifact?.profile ? [`/startup/${entity.slug}.md`, lastmod] : null,
      artifact?.dossier ? [`/dossier/${entity.slug}`, lastmod] : null,
      artifact?.dossier ? [`/dossier/${entity.slug}.md`, lastmod] : null
    ].filter(Boolean) as Array<[string, string | null]>;
  });

  const seen = new Set<string>();
  const entries = [
    ...staticRoutes.map((route) => [route, null] as [string, string | null]),
    ...sectorRoutes.map((route) => [route, null] as [string, string | null]),
    ...entityRoutes,
    ...patentRoutes,
    ...apertureRoutes
  ]
    .filter(([route]) => {
      if (seen.has(route)) return false;
      seen.add(route);
      return true;
    })
    .map(([route, lastmod]) => urlEntry(route, lastmod))
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8"
    }
  });
}
