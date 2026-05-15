import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = `User-agent: *
Allow: /
Allow: /article/
Allow: /startup/
Allow: /dossier/
Allow: /patents
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /sitemap.xml
Disallow: /admin/
Disallow: /account
Disallow: /dashboard
Disallow: /api/
Disallow: /research/

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
