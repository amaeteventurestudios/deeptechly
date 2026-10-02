import { getPublicPatentRecord, publicPatentMarkdown } from "@/lib/patents/public-data";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  const record = await getPublicPatentRecord((await params).slug);
  if (!record) return new Response("Not found", { status: 404 });
  return new Response(publicPatentMarkdown(record), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}
