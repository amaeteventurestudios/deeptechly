import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

const SELECT_FIELDS =
  "id, auth_user_id, item_id, item_type, title, href, sector, entity_name, source, metadata, created_at, updated_at";
const METADATA_KEY = "deeptechly_saved_research_queue";

export async function listSavedResearchItems(
  authUserId: string,
  limit = 20
): Promise<SavedResearchSummary> {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return emptySummary(true);
  }

  const { data, error, count } = await admin
    .from("saved_research_items")
    .select(SELECT_FIELDS, { count: "exact" })
    .eq("auth_user_id", authUserId)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<SavedResearchItem[]>();

  if (error) {
    if (isMissingSavedResearchTable(error)) {
      return listMetadataSavedResearchItems(authUserId, limit);
    }

    logSavedResearchError("Saved research read failed", error);
    return emptySummary(false);
  }

  return {
    items: data ?? [],
    count: count ?? data?.length ?? 0,
    unavailable: false
  };
}

export async function saveResearchItem(input: SaveResearchInput) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    auth_user_id: input.authUserId,
    item_id: cleanValue(input.itemId).slice(0, 160),
    item_type: cleanValue(input.itemType).slice(0, 60),
    title: cleanValue(input.title).slice(0, 240),
    href: cleanHref(input.href),
    sector: cleanOptional(input.sector, 80),
    entity_name: cleanOptional(input.entityName, 160),
    source: cleanValue(input.source ?? "deeptechly").slice(0, 80),
    metadata: input.metadata ?? {},
    created_at: now,
    updated_at: now
  };

  if (!record.item_id || !record.item_type || !record.title || !record.href) {
    return { ok: false as const, reason: "invalid" };
  }

  const { data, error } = await admin
    .from("saved_research_items")
    .upsert(record, {
      onConflict: "auth_user_id,item_id",
      ignoreDuplicates: false
    })
    .select(SELECT_FIELDS)
    .single<SavedResearchItem>();

  if (error) {
    if (isMissingSavedResearchTable(error)) {
      return saveMetadataResearchItem(input, record);
    }

    logSavedResearchError("Saved research write failed", error);
    return {
      ok: false as const,
      reason: "write_failed"
    };
  }

  return { ok: true as const, item: data };
}

export async function deleteSavedResearchItem(
  authUserId: string,
  itemId: string
) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { error } = await admin
    .from("saved_research_items")
    .delete()
    .eq("auth_user_id", authUserId)
    .eq("item_id", itemId);

  if (error) {
    if (isMissingSavedResearchTable(error)) {
      return deleteMetadataSavedResearchItem(authUserId, itemId);
    }

    logSavedResearchError("Saved research delete failed", error);
    return {
      ok: false as const,
      reason: "delete_failed"
    };
  }

  return { ok: true as const };
}

async function listMetadataSavedResearchItems(authUserId: string, limit: number) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return emptySummary(true);
  }

  const { data, error } = await admin.auth.admin.getUserById(authUserId);

  if (error || !data.user) {
    if (error) {
      logSavedResearchError("Saved research metadata read failed", error);
    }
    return emptySummary(false);
  }

  const items = getMetadataSavedItems(data.user.user_metadata, authUserId);

  return {
    items: items.slice(0, limit),
    count: items.length,
    unavailable: false
  };
}

async function saveMetadataResearchItem(
  input: SaveResearchInput,
  record: SavedResearchItem
) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { data, error } = await admin.auth.admin.getUserById(input.authUserId);

  if (error || !data.user) {
    if (error) {
      logSavedResearchError("Saved research metadata read failed", error);
    }
    return { ok: false as const, reason: "write_failed" };
  }

  const existingItems = getMetadataSavedItems(
    data.user.user_metadata,
    input.authUserId
  );
  const nextItem = {
    ...record,
    id:
      existingItems.find((item) => item.item_id === record.item_id)?.id ??
      record.id,
    created_at:
      existingItems.find((item) => item.item_id === record.item_id)
        ?.created_at ?? record.created_at
  };
  const nextItems = [
    nextItem,
    ...existingItems.filter((item) => item.item_id !== record.item_id)
  ].slice(0, 100);
  const userMetadata = {
    ...(data.user.user_metadata ?? {}),
    [METADATA_KEY]: nextItems
  };

  const { error: updateError } = await admin.auth.admin.updateUserById(
    input.authUserId,
    { user_metadata: userMetadata }
  );

  if (updateError) {
    logSavedResearchError("Saved research metadata write failed", updateError);
    return { ok: false as const, reason: "write_failed" };
  }

  return { ok: true as const, item: nextItem };
}

async function deleteMetadataSavedResearchItem(
  authUserId: string,
  itemId: string
) {
  const admin = createSupabaseAdminClient();

  if (!admin) {
    return { ok: false as const, reason: "configuration" };
  }

  const { data, error } = await admin.auth.admin.getUserById(authUserId);

  if (error || !data.user) {
    if (error) {
      logSavedResearchError("Saved research metadata read failed", error);
    }
    return { ok: false as const, reason: "delete_failed" };
  }

  const existingItems = getMetadataSavedItems(data.user.user_metadata, authUserId);
  const userMetadata = {
    ...(data.user.user_metadata ?? {}),
    [METADATA_KEY]: existingItems.filter((item) => item.item_id !== itemId)
  };
  const { error: updateError } = await admin.auth.admin.updateUserById(
    authUserId,
    { user_metadata: userMetadata }
  );

  if (updateError) {
    logSavedResearchError("Saved research metadata delete failed", updateError);
    return { ok: false as const, reason: "delete_failed" };
  }

  return { ok: true as const };
}

function getMetadataSavedItems(
  metadata: Record<string, unknown> | undefined,
  authUserId: string
) {
  const rawItems = metadata?.[METADATA_KEY];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => normalizeMetadataItem(item, authUserId))
    .filter((item): item is SavedResearchItem => Boolean(item))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

function normalizeMetadataItem(
  item: unknown,
  authUserId: string
): SavedResearchItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const candidate = item as Partial<SavedResearchItem>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.item_id !== "string" ||
    typeof candidate.item_type !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.href !== "string" ||
    typeof candidate.source !== "string" ||
    typeof candidate.created_at !== "string" ||
    typeof candidate.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    auth_user_id: authUserId,
    item_id: candidate.item_id,
    item_type: candidate.item_type,
    title: candidate.title,
    href: candidate.href,
    sector: typeof candidate.sector === "string" ? candidate.sector : null,
    entity_name:
      typeof candidate.entity_name === "string" ? candidate.entity_name : null,
    source: candidate.source,
    metadata:
      candidate.metadata && typeof candidate.metadata === "object"
        ? candidate.metadata
        : {},
    created_at: candidate.created_at,
    updated_at: candidate.updated_at
  };
}

function emptySummary(unavailable: boolean): SavedResearchSummary {
  return {
    items: [],
    count: 0,
    unavailable
  };
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

  if (!href.startsWith("/") || href.startsWith("//")) {
    return "";
  }

  return href.slice(0, 240);
}

function isMissingSavedResearchTable(error: { code?: string; message: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message.toLowerCase().includes("saved_research_items")
  );
}

function logSavedResearchError(
  label: string,
  error: { code?: string; message: string }
) {
  console.error(label, {
    code: error.code,
    message: error.message
  });
}
