import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://deeptechly.vercel.app";
  const entities = await getPublishedEntities();
  const staticRoutes = [
    "/",
    "/news",
    "/articles",
    "/startups",
    "/explore",
    "/research",
    "/sectors",
    "/patents",
    "/pricing",
    "/join",
    "/methodology",
    "/llms.txt",
    "/llms-full.txt",
    "/sitemap.xml"
  ];
  const entityRoutes = entities.flatMap((entity) => [
    `/article/${entity.slug}`,
    `/article/${entity.slug}.md`,
    `/startup/${entity.slug}`,
    `/startup/${entity.slug}.md`,
    `/dossier/${entity.slug}`,
    `/dossier/${entity.slug}.md`
  ]);
  const urls = [...staticRoutes, ...entityRoutes]
    .map(
      (route) => `  <url>
    <loc>${new URL(route, baseUrl).toString()}</loc>
  </url>`
    )
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8"
    }
  });
}
