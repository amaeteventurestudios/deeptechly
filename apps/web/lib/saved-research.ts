import { randomUUID } from "node:crypto";
import { getPostgres } from "@/lib/database/postgres";

export type SavedResearchItem = {
  id: string;
  auth_user_id: string;
  item_id: string;
  item_type: string;
  title: string;
  href: string;
  sector: string | null;
  entity_name: string | null;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SaveResearchInput = {
  authUserId: string;
  itemId: string;
  itemType: string;
  title: string;
  href: string;
  sector?: string;
  entityName?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type SavedResearchSummary = {
  items: SavedResearchItem[];
  count: number;
  unavailable: boolean;
};

type SavedResearchRow = Omit<SavedResearchItem, "created_at" | "updated_at"> & {
  created_at: Date | string;
  updated_at: Date | string;
};

export async function listSavedResearchItems(
  accountId: string,
  limit = 20
): Promise<SavedResearchSummary> {
  const sql = getPostgres();
  if (!sql) return emptySummary(true);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const rows = await sql<SavedResearchRow[]>`
    select id, account_id as auth_user_id, item_id, item_type, title, href,
      sector, entity_name, source, metadata, created_at, updated_at
    from deeptechly.saved_research
    where account_id = ${accountId}
    order by updated_at desc
    limit ${safeLimit}
  `;
  const items = rows.map(normalizeRow);
  const counts = await sql<{ count: number }[]>`
    select count(*)::int as count from deeptechly.saved_research
    where account_id = ${accountId}
  `;
  return { items, count: counts[0]?.count ?? items.length, unavailable: false };
}

export async function saveResearchItem(input: SaveResearchInput) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const record = {
    itemId: cleanValue(input.itemId).slice(0, 160),
    itemType: cleanValue(input.itemType).slice(0, 60),
    title: cleanValue(input.title).slice(0, 240),
    href: cleanHref(input.href),
    sector: cleanOptional(input.sector, 80),
    entityName: cleanOptional(input.entityName, 160),
    source: cleanValue(input.source ?? "deeptechly").slice(0, 80),
    metadata: input.metadata ?? {}
  };
  if (!record.itemId || !record.itemType || !record.title || !record.href) {
    return { ok: false as const, reason: "invalid" };
  }

  const rows = await sql<SavedResearchRow[]>`
    insert into deeptechly.saved_research (
      id, account_id, item_id, item_type, title, href, sector, entity_name,
      source, metadata, created_at, updated_at
    ) values (
      ${randomUUID()}, ${input.authUserId}, ${record.itemId}, ${record.itemType},
      ${record.title}, ${record.href}, ${record.sector}, ${record.entityName},
      ${record.source}, ${sql.json(record.metadata as never)}, now(), now()
    ) on conflict (account_id, item_id) do update set
      item_type = excluded.item_type, title = excluded.title, href = excluded.href,
      sector = excluded.sector, entity_name = excluded.entity_name,
      source = excluded.source, metadata = excluded.metadata, updated_at = now()
    returning id, account_id as auth_user_id, item_id, item_type, title, href,
      sector, entity_name, source, metadata, created_at, updated_at
  `;
  return { ok: true as const, item: normalizeRow(rows[0]) };
}

export async function deleteSavedResearchItem(accountId: string, itemId: string) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  await sql`
    delete from deeptechly.saved_research
    where account_id = ${accountId} and item_id = ${itemId}
  `;
  return { ok: true as const };
}

function normalizeRow(row: SavedResearchRow): SavedResearchItem {
  return {
    ...row,
    metadata: row.metadata ?? {},
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function emptySummary(unavailable: boolean): SavedResearchSummary {
  return { items: [], count: 0, unavailable };
}

function cleanValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function cleanOptional(value: string | undefined, length: number) {
  const cleaned = value ? cleanValue(value) : "";
  return cleaned ? cleaned.slice(0, length) : null;
}

function cleanHref(value: string) {
  const href = cleanValue(value);
  if (!href.startsWith("/") || href.startsWith("//")) return "";
  return href.slice(0, 240);
}
