import "server-only";

import { buildPublishedDiscoveryDocuments } from "./documents";
import {
  isDiscoveryKind,
  type DiscoveryDocument,
  type DiscoveryKind
} from "./types";

export type DiscoverySearchInput = {
  query?: string;
  kind?: string;
  limit?: number;
};

export type DiscoverySearchResult = {
  documents: DiscoveryDocument[];
  query: string;
  kind: DiscoveryKind | null;
  total: number;
};

export function selectedDiscoveryProvider(value = process.env.DEEPTECHLY_SEARCH_PROVIDER) {
  const provider = value?.trim().toLowerCase() || "local";
  if (provider === "local" || provider === "meilisearch") return provider;
  throw new Error(`Unsupported discovery provider: ${provider}`);
}

export async function searchPublishedResearch(
  input: DiscoverySearchInput
): Promise<DiscoverySearchResult> {
  const query = normalizeQuery(input.query);
  const kind = input.kind && isDiscoveryKind(input.kind) ? input.kind : null;
  const requestedLimit = input.limit ?? 36;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
    : 36;
  const publishedDocuments = await buildPublishedDiscoveryDocuments();
  const filteredDocuments = kind
    ? publishedDocuments.filter((document) => document.kind === kind)
    : publishedDocuments;

  if (query && selectedDiscoveryProvider() === "meilisearch") {
    const ordered = await searchMeilisearch(query, filteredDocuments, limit, kind).catch(() => null);
    if (ordered) {
      return { documents: ordered, query, kind, total: ordered.length };
    }
  }

  const documents = searchLocally(filteredDocuments, query).slice(0, limit);
  return { documents, query, kind, total: documents.length };
}

export function searchLocally(
  documents: readonly DiscoveryDocument[],
  query: string
) {
  const terms = normalizeQuery(query).toLowerCase().split(" ").filter(Boolean);
  return [...documents]
    .map((document) => ({ document, score: localScore(document, terms) }))
    .filter((entry) => terms.length === 0 || entry.score > 0)
    .sort((a, b) => b.score - a.score || newestFirst(a.document, b.document))
    .map((entry) => entry.document);
}

async function searchMeilisearch(
  query: string,
  publishedDocuments: readonly DiscoveryDocument[],
  limit: number,
  kind: DiscoveryKind | null
) {
  const baseUrl = httpUrl(process.env.MEILISEARCH_BASE_URL);
  const apiKey = process.env.MEILISEARCH_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), boundedTimeout());
  try {
    const response = await fetch(
      `${baseUrl}/indexes/${encodeURIComponent(process.env.MEILISEARCH_RESEARCH_INDEX ?? "research")}/search`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          q: query,
          limit: Math.min(100, Math.max(limit * 3, limit)),
          ...(kind ? { filter: `kind = "${kind}"` } : {})
        }),
        cache: "no-store",
        signal: controller.signal
      }
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { hits?: Array<{ id?: unknown }> };
    const allowed = new Map(publishedDocuments.map((document) => [document.id, document]));
    return (body.hits ?? [])
      .map((hit) => (typeof hit.id === "string" ? allowed.get(hit.id) : undefined))
      .filter((document): document is DiscoveryDocument => Boolean(document))
      .slice(0, limit);
  } finally {
    clearTimeout(timeout);
  }
}

function localScore(document: DiscoveryDocument, terms: string[]) {
  if (terms.length === 0) return timestamp(document.publishedAt);
  const title = document.title.toLowerCase();
  const entity = document.entityName?.toLowerCase() ?? "";
  const sector = document.sector?.toLowerCase() ?? "";
  const summary = document.summary.toLowerCase();
  return terms.reduce((score, term) => {
    if (title === term || entity === term) return score + 30;
    return score + (title.includes(term) ? 12 : 0) + (entity.includes(term) ? 8 : 0) +
      (sector.includes(term) ? 5 : 0) + (summary.includes(term) ? 2 : 0);
  }, 0);
}

function newestFirst(a: DiscoveryDocument, b: DiscoveryDocument) {
  return timestamp(b.publishedAt) - timestamp(a.publishedAt) || a.title.localeCompare(b.title);
}

function timestamp(value: string | null | undefined) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeQuery(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
}

function httpUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

function boundedTimeout() {
  const timeout = Number(process.env.MEILISEARCH_TIMEOUT_MS ?? 5_000);
  return Number.isFinite(timeout) ? Math.min(30_000, Math.max(250, timeout)) : 5_000;
}
