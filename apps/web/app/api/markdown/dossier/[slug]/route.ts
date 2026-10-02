import { notFound } from "next/navigation";
import { getPublishedArtifactAvailability, getPublishedDossierEntityBySlug } from "@/lib/research/public-data";
import { dossierMarkdown } from "@/lib/research/markdown";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const entity = await getPublishedDossierEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  return new Response(dossierMarkdown(entity, await getPublishedArtifactAvailability(slug)), {
    headers: {
      "content-type": "text/markdown; charset=utf-8"
    }
  });
}
