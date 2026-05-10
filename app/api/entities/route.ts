import { NextResponse } from "next/server";
import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entities = await getPublishedEntities();
    return NextResponse.json({ entities });
  } catch (error) {
    console.error("Entity service unavailable", error);
    return NextResponse.json({ entities: [] });
  }
}
