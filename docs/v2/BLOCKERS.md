# External Integration Blockers

This file records integrations that require user-authorized external accounts or credentials. They do not block independent V2 implementation work.

## Appwrite activation

Status: isolated; not active.

An Appwrite endpoint, project ID, allowed-origin configuration, email templates, and an approved server-session cookie design are not available in the repository. The Appwrite identity adapter therefore fails closed, while Supabase remains the working compatibility provider. See `06_AUTH_MIGRATION.md` for the cutover requirements.

## PostgreSQL migration activation

The recovered August 19, 2026 legacy dump was imported twice into clean isolated PostgreSQL 17.11 clusters with equivalent results, zero reconciliation mismatches, and migrated-data application rendering. Production import/cutover still requires a final write-frozen export, an approved managed target with backup/restore operations, a transactional V2 write adapter and dual-write soak, encrypted custody, and an authorized operator. The current adapter is deliberately read-only. No production database was accessed or changed during Phases 9 or 22.

## Commodity capability activation

Crawl4AI, Directus, Meilisearch, Trigger.dev, Langfuse, Valkey, and object storage have no approved production endpoints, credentials, image policy, network policy, backups, or operational owners in the repository. Phase 11 provides fail-closed ports, adapters, and opt-in local profiles only. No production integration is presented as active.

## Trigger.dev activation

The pinned task, dispatcher, private callback, idempotency, retry, concurrency, and cancellation paths are implemented. Live task registration and external execution require a Trigger.dev project reference/secret, a reachable HTTPS internal web URL, and a shared callback secret configured in both environments. Until those exist, `DEEPTECHLY_WORKFLOW_PROVIDER=local` preserves the tested production path.

## Directus newsroom activation

The newsroom CRUD port, Directus adapter, editorial schema, runtime selector, and admin Data Studio handoff are implemented. Live activation requires an authorized Directus deployment, scoped server token, collection registration/layout snapshot, least-privilege roles, and a reconciled V2 PostgreSQL import. `DEEPTECHLY_NEWSROOM_PROVIDER=compatibility` remains the safe default; no live Directus or production database was contacted.

## Meilisearch activation

The public document policy, server query adapter, index settings, worker synchronization utility, local fallback, and public-ID reconciliation are implemented. Live activation requires an approved Meilisearch endpoint and scoped keys, initial indexing from reconciled PostgreSQL, durable outbox consumption, and index reconciliation/rollback. `DEEPTECHLY_SEARCH_PROVIDER=local` remains complete and production-safe.

## Automated Aperture ingestion and persistence

The Aperture intelligence kernel, evidence policy, PostgreSQL schema, Trigger.dev task, public UI, search integration, and a curated official-source artifact family are implemented. Continuous ingestion requires approved Crawl4AI/Trigger.dev endpoints, a reconciled V2 PostgreSQL database, reviewed government-source schedules, and newsroom review roles. Automated workflow output remains candidate-only until those controls exist.

## Lago and Stripe activation

The billing/checkout ports, adapters, entitlement policy, and additive ledgers are implemented. Live activation requires approved Lago and Stripe accounts, plans/prices, server and webhook signing secrets, tax/invoice/refund policy, webhook ingress, signature verification, replay tests, customer reconciliation, and an authorized application of migration `0005`. The existing verified-institutional profile flag remains authoritative until a reconciled access-grant cutover; payment state never unlocks content directly.

## Observability, cache, and object-store activation

Langfuse v4 OTLP tracing, Valkey/Redis caching, and S3-compatible object storage have production adapter implementations and deterministic tests. Live activation requires approved endpoints and credentials, network/egress policy, trace sampling and content-retention review, object lifecycle/CORS/encryption policy, cache memory/eviction policy, backup expectations, least-privilege identities, and incident ownership. They remain disabled when unconfigured.
