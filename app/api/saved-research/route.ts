import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import {
  deleteSavedResearchItem,
  listSavedResearchItems,
  saveResearchItem
} from "@/lib/saved-research";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const savedResearch = await listSavedResearchItems(session.userId, 50);
  return NextResponse.json(savedResearch);
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    itemId?: string;
    itemType?: string;
    title?: string;
    href?: string;
    sector?: string;
    entityName?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  };

  const result = await saveResearchItem({
    authUserId: session.userId,
    itemId: body.itemId ?? "",
    itemType: body.itemType ?? "",
    title: body.title ?? "",
    href: body.href ?? "",
    sector: body.sector,
    entityName: body.entityName,
    source: body.source,
    metadata: body.metadata
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: result.reason === "invalid" ? 400 : 503 }
    );
  }

  return NextResponse.json({ item: result.item });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    itemId?: string;
  };
  const itemId = body.itemId?.trim();

  if (!itemId) {
    return NextResponse.json({ error: "item_id_required" }, { status: 400 });
  }

  const result = await deleteSavedResearchItem(session.userId, itemId);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
