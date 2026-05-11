import { notFound } from "next/navigation";
import { getEntityBySlugFromAll } from "@/lib/research/public-data";
import { articleMarkdown } from "@/lib/research/markdown";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity) {
    notFound();
  }

  return new Response(articleMarkdown(entity), {
    headers: {
      "content-type": "text/markdown; charset=utf-8"
    }
  });
}
