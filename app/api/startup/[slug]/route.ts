import { NextResponse } from "next/server";
import { getPublishedEntityBySlug } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const entity = await getPublishedEntityBySlug(slug);

  if (!entity) {
    return NextResponse.json({ error: "Research profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    entity,
    article: entity.article,
    dossier: entity.dossier
  });
}
