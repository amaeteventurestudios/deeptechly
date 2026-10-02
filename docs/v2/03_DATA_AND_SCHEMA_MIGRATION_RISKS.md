# Data and Schema Migration Risks

## Non-negotiable rule

Supabase and its schemas remain in place until V2 repositories, identity mapping, reconciliation, backup, and rollback have been proven. This document identifies migration risks; it does not authorize a migration or destructive SQL.

## Current authoritative data paths

### Research store precedence

`lib/research/store.ts` selects backends in this order:

1. Supabase `deeptechly_research_store` when URL and service-role key exist.
2. Upstash Redis/Vercel KV REST when URL and token exist.
3. Process-global memory when neither persistent backend is configured.

The selected backend stores one `ResearchStoreData` document with arrays for `jobs`, `entities`, `articles`, `dossiers`, and `searchEvents`. Supabase writes also mirror records into normalized tables, but reads come from the whole-store record. Therefore:

- The blob is currently authoritative wherever Supabase is configured.
- Normalized table completeness cannot be assumed.
- Redis and Supabase may contain divergent copies if deployment configuration changed over time.
- Memory-mode records disappear on process restart and must never be considered migratable production truth.
- Whole-document read/modify/write has no cross-instance compare-and-swap, so lost updates are possible.

Before implementation, inventory actual deployed backend configuration and row counts without changing them.

## Existing schemas that must be preserved

### `deeptechly_research_store`

Source: `supabase/research-store.sql`

| Field | Risk / required treatment |
|---|---|
| `id` | Defaults operationally to `deeptechly:research-store:v1`; preserve configured override and discover every key in use. |
| `data` | Contains the complete legacy aggregate. Export verbatim, checksum, retain original JSON, and build a repeatable importer. |
| `created_at`, `updated_at` | Preserve for audit/reconciliation even though inner objects also have timestamps. |

### `research_jobs`

Source: `supabase/research-persistence.sql`; rich legacy state is also embedded in `data`.

Preserve at minimum:

- Identity/ownership: `id`, `user_id`, input query, normalized query, mode/input type.
- Resolution: requested entity fields, resolved name/domain/status, resolution metadata.
- Workflow: status/stage/progress/message/detail, source count, stage/active/heartbeat timestamps.
- Retry: attempt count, max attempts, retry count, next retry, lock key, input fingerprint.
- Failure: public error plus code, stage, type, internal message, generated-name/slug/publisher diagnostics.
- Output links: entity/article/dossier IDs and URLs.
- Partial completion: profile/article/dossier status and internal errors, completion mode, public-ready and completed timestamps.
- Feed projection and creation/update timestamps.

Risk: the normalized columns contain only a subset; the full job must be imported from `data`, not reconstructed from columns.

### `entities`

Preserve the full `ResearchEntity` aggregate:

- Canonical identity: IDs, slug, name, type, domain/website, aliases and resolution metadata.
- Classification: sector, secondary sectors, region, stage, tags, editorial tags.
- Company facts: founding, location, people, funding, investors, employees.
- Research quality: source count, confidence score/label, research time, search count.
- Publication and editorial state: `publishedStatus`, created/updated dates.
- Media: hero/logo/favicon URLs, source URL, alt text, attribution.
- Nested snapshot, taxonomy, article, dossier, sources, external links, and related entities.

Risk: normalized entity columns are not sufficient to recreate nested taxonomy, dossier, evidence, images, or resolution state.

### `articles`

Preserve IDs/entity relationships, slug, title/dek, author persona, all image/attribution fields, body sections, tags, sources, publication status/time, admin feature flag, and timestamps. The current SQL `body_md` is derived and is not a lossless replacement for structured sections in `data`.

### `dossiers`

Preserve the complete structured dossier and both public/institutional Markdown projections, publication status, confidence/source count, entity link, and timestamps. Institutional content must never be accidentally exposed during export, indexing, or Directus setup.

### `sources`

Current normalized source rows preserve only title, URL, publisher, type, retrieval time, and artifact links. Legacy source JSON additionally contains dates, supported claims, image metadata, public-sector signals, and inferred quality. V2 needs an immutable evidence record with:

- Canonical/normalized URL and original URL.
- Publisher, source family/type, authority tier, acquisition time.
- Content/object reference and content hash.
- Government/patent/program metadata.
- Claim-evidence relationships and extraction/version provenance.
- Which entity, research run, and artifacts used the evidence.

### `searchEvents`

Search events exist only inside the blob (`id`, `jobId`, query, provider, result count, creation time). Add a normalized table and preserve them for debugging/cost/quality analysis.

### `users_profile`

Source: `supabase/auth-users-profile.sql`

Preserve `id`, `auth_user_id`, name, email, organization, access tier, institutional verified/pending flags, and timestamps. Current `auth_user_id` references Supabase `auth.users` and is used by saved research and jobs. V2 should introduce a stable internal `users.id` and an `external_identities(provider, provider_user_id, user_id)` mapping before Appwrite migration.

### `invite_codes`

Preserve code, organization, tier, max/used counts, expiry, disable time, and creation time. The current RPC atomically increments usage only for eligible codes. Any replacement must preserve atomic redemption and add actor/audit records.

### `saved_research_items`

Preserve row ID, owner, item ID/type, title, href, sector, entity name, source, arbitrary metadata, and timestamps. Maintain uniqueness on `(user_id, item_id)` and owner-only access.

## Integrity gaps in the current normalized schema

- `research_jobs.article_id`, `entity_id`, and `dossier_id` are UUID columns without declared foreign keys.
- `sources` allows simultaneous entity/article/dossier references and has no URL uniqueness/content identity rule.
- Artifact slugs are unique independently, but no constraint guarantees a single shared canonical slug across an entity's artifacts.
- Status, stage, access tier, source type, and confidence are unconstrained text.
- The normalized schema has no explicit claim, evidence link, contradiction, research plan, task/activity, workflow event, model trace, prompt version, content revision, or publication audit tables.
- Mirror writes replace all source rows for an entity and may lose history.
- RLS protects current public/user access, but service-role application code bypasses it. V2 must make authorization explicit at both service and database boundaries.
- SQL files are “run once” scripts rather than an ordered migration ledger, so deployed schema version is unknown from the repository alone.

## Recommended V2 schema domains

This is a mapping target, not a migration to run now.

| Domain | Tables / concepts |
|---|---|
| Identity | `users`, `external_identities`, `account_profiles`, `access_grants`, `invite_codes`, `invite_redemptions` |
| Research execution | `research_jobs`, `research_runs`, `workflow_events`, `stage_attempts`, `search_events` |
| Entities | `entities`, `entity_aliases`, `entity_domains`, `entity_resolutions`, `entity_relationships` |
| Evidence | `sources`, `source_snapshots`, `evidence_extractions`, `claims`, `claim_evidence`, `contradictions` |
| Research analysis | `research_plans`, `research_gaps`, `technology_mappings`, `readiness_estimates`, `competitive_mappings`, `patent_mappings`, `commercialization_analyses` |
| Publishing | `articles`, `profiles`, `dossiers`, `artifact_revisions`, `publication_events`, `media_assets` |
| Editorial | `features`, `review_findings`, `review_actions`, `saved_research_items` |
| Aperture | `agencies`, `government_documents`, `signals`, `problem_statements`, `opportunity_maps`, `evidence_packs`, `technical_requirements`, `demand_clusters`, `capability_matches`, methodology/version tables |
| Integration | Transactional `outbox_events`, external workflow/trace/index/object IDs |

Use JSONB only for versioned raw/provider payloads and compatibility snapshots; do not make one JSONB document the transaction boundary for the system.

## Highest-risk migration areas

### 1. Identity migration

Passwords and active sessions cannot be treated like ordinary table rows. Appwrite migration requires a supported import/reset strategy, verified email semantics, session cutover, and a durable mapping from Supabase auth IDs. Never rewrite existing job/saved-item ownership directly to provider IDs.

### 2. Blob-to-relational migration

Every optional nested field must round-trip. Use an append-only export, content hash, import report, per-entity comparison, and rollback copy. Records mirrored into normalized tables must be compared with the blob rather than trusted.

### 3. Workflow cutover

Old queue/watchdog and Trigger.dev must not both dispatch the same jobs. Introduce an idempotency key and external workflow ID, drain or explicitly hand over queued/active work, and fence legacy workers before enabling the new dispatcher.

### 4. Publication and access state

Profile/article/dossier states are independent, while admin actions can update them together. Preserve exact public visibility, institutional gating, feature state, and partial completion. Search indexes and caches must consume only committed publication events.

### 5. Evidence provenance and confidence

Changing crawlers or source classifiers can change source count, quality mix, and confidence. Preserve acquired content hashes and algorithm/methodology versions so old conclusions remain explainable.

### 6. Media migration

Current artifacts point at third-party URLs. S3 migration must preserve original/source URL, attribution, content type/hash, licensing notes where known, and broken-link fallback behavior.

### 7. Directus and service-role equivalence

Directus must not receive unrestricted ability to publish, retry, or edit protected identity fields. Model commands and permissions explicitly, log actors, and enforce invariants outside the CMS.

## Environment variable inventory

### Documented in `.env.example`

| Variable | Current use | V2 treatment |
|---|---|---|
| `OPENAI_API_KEY` | Synthesis and OpenAI web search; absent enables demo generation. | Worker-only secret behind model/search adapters; production must not silently demo. |
| `OPENAI_MODEL` | Model for search and synthesis; example is `gpt-5.4-mini`. | Typed worker config; record actual model on each run. |
| `OPENAI_ENABLE_WEB_SEARCH` | Enables OpenAI web-search tool. | Legacy adapter flag; retire with acquisition replacement. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs and auth redirects. | Web public config with strict validation. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server/admin/store Supabase endpoint. | Legacy compatibility until auth/data cutovers. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server session client. | Legacy public key; do not expose replacement admin credentials. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin auth, profiles, saved items, research store. | Highest-risk legacy secret; server/worker only. |
| `ADMIN_EMAILS` | Email allowlist for admin access/bootstrap. | Migrate to explicit role grants; retain compatibility temporarily. |
| `DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL` | Bootstrap script. | One-time legacy operation; replace with audited provisioning. |
| `DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD` | Bootstrap script. | Remove after provider migration; never log or persist. |
| `SUPABASE_RESEARCH_STORE_TABLE` | Overrides blob table name. | Discover deployed value; needed by importer. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Fallback whole-store backend. | Inventory existing data, then replace with coordination/cache role. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Alternative fallback names. | Same as above. |

### Used but missing from `.env.example`

| Variable | Current use | Risk / action |
|---|---|---|
| `SEARCH_PROVIDER` | Selects `openai` (default) or Tavily path. | Document and validate; provider choice currently changes acquisition behavior silently. |
| `TAVILY_API_KEY` | Tavily search. | Worker-only secret; add to compatibility docs. |
| `DEEPTECHLY_RESEARCH_STORE_KEY` | Overrides the blob/Redis key. | Critical for data discovery/import; document before migration. |
| `RESEARCH_STAGE_DELAY_MS` | Artificial inter-stage delay, default 450 ms. | Make dev/test-only; forbid unexpected production use. |
| `DEEPTECHLY_ALLOW_LIVE_LOAD_TEST` | Enables destructive/live load smoke path. | Keep explicit opt-in and target allowlisting. |
| `BASE_URL` | Link audit and Playwright target. | Test/tool config only. Avoid accidental reuse of unrelated port 3000 service. |
| `CI` | Playwright retries/forbid-only behavior. | Standard CI setting. |

Future provider variables for Appwrite, Trigger.dev, Crawl4AI, Directus, Langfuse, Meilisearch, Valkey, S3, Lago, and Stripe should not be added until those adapters are intentionally implemented.

## Required migration controls

- Immutable backup of each current backend and schema before any write migration.
- Repeatable importer with dry-run, per-table counts, rejected-record report, and checksums.
- Stable internal identifiers; provider IDs remain mappings.
- Dual-write only through one application service, with reconciliation metrics and dead-letter handling.
- Shadow reads and field-by-field comparison before changing authoritative reads.
- Transactional outbox for workflows, indexing, cache invalidation, and Directus projections.
- Idempotency keys for research submission, workflow activity, artifact generation, and publication.
- Explicit schema and methodology versions on evidence, claims, confidence, synthesis, and Aperture outputs.
- Rollback runbook retaining the blob and Supabase paths until acceptance criteria and retention window are met.
- Redaction policy for internal failures, prompts/traces, service credentials, and institutional dossier content.
