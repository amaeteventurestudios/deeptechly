# Search and Discovery

Phase 15 adds a complete public discovery path with a local authoritative fallback and an opt-in Meilisearch acceleration layer.

## Public experience

`/explore` is now a unified editorial archive for articles, profiles, patent evidence, and the future lab, technology, signal, problem, and opportunity collections. It supports:

- accessible GET-based search with shareable URLs;
- type filtering without client JavaScript;
- evidence context through source counts and confidence labels;
- external-source treatment for patent evidence;
- responsive archive cards rather than an admin-style results table;
- a useful empty state that can start new research.

`/api/search` exposes the same public-only result contract for machine-readable discovery. Query length, result limits, and filter kinds are bounded.

## Authority and privacy

PostgreSQL/compatibility persistence remains authoritative. Search documents are generated only from artifacts already eligible for public access. Before Meilisearch results are returned, every result ID is joined back to the current public document set. A stale or malicious index therefore cannot expose an unpublished or institutional artifact.

The current document builder emits:

- one profile document per published entity;
- one article document only when the article artifact is published;
- deduplicated patent-evidence documents linked from published research.

Aperture, lab, and technology documents use the same contract and are added when those data surfaces land in Phases 16–17.

## Providers

`DEEPTECHLY_SEARCH_PROVIDER=local` is the default. Local search provides deterministic title/entity/sector/summary relevance and requires no external service.

`DEEPTECHLY_SEARCH_PROVIDER=meilisearch` uses:

- `MEILISEARCH_BASE_URL`;
- `MEILISEARCH_API_KEY` (server-only scoped search key);
- `MEILISEARCH_RESEARCH_INDEX`, default `research`;
- `MEILISEARCH_TIMEOUT_MS`.

Meilisearch failures degrade to local search without exposing provider failures publicly. Empty valid Meilisearch results remain empty; activation should therefore occur only after initial indexing and reconciliation.

## Derived-index synchronization

The worker owns `syncPublishedResearchIndex`, which configures searchable, filterable, and sortable attributes before upserting public documents. It rejects documents that are not explicitly marked `published: true`.

The intended production path is:

1. PostgreSQL publication state changes transactionally.
2. An `outbox_events` record names the affected public artifact.
3. A durable worker rebuilds/upserts or removes its search document.
4. The Meilisearch task completes.
5. Reconciliation compares public PostgreSQL IDs with indexed IDs.

The outbox schema already exists, but no live database or Meilisearch project is available, so activation and full event consumption remain blocked. Local search remains complete in the meantime.

## Verification

- `pnpm verify:search-discovery` covers provider selection, local relevance, public-only indexing, and index settings.
- `pnpm verify:capability-adapters` covers Meilisearch search, upsert, settings, authentication headers, and task IDs.
- Playwright covers Explore at 320px, tablet, and desktop widths plus public API filtering.
