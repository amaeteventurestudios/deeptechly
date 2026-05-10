import { NextResponse } from "next/server";
import { getPublishedArticles } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await getPublishedArticles();
  return NextResponse.json({ articles });
}
