import { NextResponse } from "next/server";
import { searchPublishedResearch } from "@/lib/discovery/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await searchPublishedResearch({
    query: url.searchParams.get("q") ?? "",
    kind: url.searchParams.get("kind") ?? "",
    limit: Number(url.searchParams.get("limit") ?? 36)
  });
  return NextResponse.json(result, {
    headers: { "cache-control": "public, max-age=30, stale-while-revalidate=300" }
  });
}
