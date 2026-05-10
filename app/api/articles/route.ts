import { NextResponse } from "next/server";
import { getPublishedArticles } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await getPublishedArticles();
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Article service unavailable", error);
    return NextResponse.json({ articles: [] });
  }
}
