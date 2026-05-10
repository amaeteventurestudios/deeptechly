import { NextResponse } from "next/server";
import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const entities = await getPublishedEntities();
  return NextResponse.json({ entities });
}
