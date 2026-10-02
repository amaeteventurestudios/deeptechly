import { notFound } from "next/navigation";
import { apertureMarkdown } from "@/lib/aperture/markdown";
import { getPublicSignal } from "@/lib/aperture/public-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const item = await getPublicSignal((await params).slug);
  if (!item) notFound();
  return new Response(apertureMarkdown(item), { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
