import { getPublishedEntities } from "@/lib/research/public-data";
import { siteUrl } from "@/lib/site";

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
  const entities = await getPublishedEntities();
  const staticRoutes = [
    "/",
    "/news",
    "/articles",
    "/research",
    "/startups",
    "/patents",
    "/sectors",
    "/pricing",
    "/methodology",
    "/llms.txt",
    "/llms-full.txt",
    "/sitemap.xml"
  ];
  const sectorRoutes = sectorSlugs.map((slug) => `/sector/${slug}`);
  const entityRoutes = entities.flatMap((entity) => {
    const lastmod = entity.updatedAt ?? entity.article.publishedAt ?? entity.createdAt ?? null;
    return [
      [`/article/${entity.slug}`, lastmod],
      [`/article/${entity.slug}.md`, lastmod],
      [`/startup/${entity.slug}`, lastmod],
      [`/startup/${entity.slug}.md`, lastmod],
      [`/dossier/${entity.slug}`, lastmod],
      [`/dossier/${entity.slug}.md`, lastmod]
    ] as Array<[string, string | null]>;
  });

  const seen = new Set<string>();
  const entries = [
    ...staticRoutes.map((route) => [route, null] as [string, string | null]),
    ...sectorRoutes.map((route) => [route, null] as [string, string | null]),
    ...entityRoutes
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
