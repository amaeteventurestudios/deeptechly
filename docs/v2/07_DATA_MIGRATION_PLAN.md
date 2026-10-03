# V2 PostgreSQL and Legacy Data Migration Plan

> Historical planning document. Phase 22 completed the real-data rehearsal and Phase 23 made PostgreSQL the only runtime persistence authority. See documents 22–25 for current operations.

## Status and safety boundary

Phase 9 defines the target PostgreSQL model and an import/reconciliation path. It does **not** connect to a database, apply SQL, alter Supabase, or change production reads and writes. Supabase remains the compatibility source until a separately approved cutover proves backup, import, reconciliation, shadow reads, rollback, and authorization behavior.

The ordered migrations are:

1. `packages/database/migrations/0001_v2_core.sql` — stable accounts, research execution, evidence, entities, publishing, taxonomy, and transactional outbox.
2. `packages/database/migrations/0002_v2_aperture.sql` — agencies, government documents, signals, problems, repeated-demand clusters, requirements, evidence packs, matches, and opportunity maps.
3. `packages/database/migrations/0003_legacy_import_ledger.sql` — immutable legacy payloads, identity maps, findings, and reconciliation reports.
4. `packages/database/migrations/0004_newsroom_metadata.sql` — provider-neutral editorial metadata and review records for the Directus newsroom surface.

All tables use the `deeptechly` schema, preserve legacy-compatible text identifiers, and are created additively. SQL is never applied merely by starting or importing the application.

## Authority and cutover rule

Before cutover, authority remains whichever legacy backend is actually configured in production:

- Normalized Supabase tables are the active read/write path in the current web adapter when Supabase credentials exist.
- Rich `data` JSONB snapshots remain lossless compatibility payloads and may contain fields absent from normalized columns.
- Redis/KV may contain an older aggregate if deployment configuration changed.
- Process memory is development-only and cannot be migrated reliably.

The V2 database becomes authoritative only after every acceptance gate in this document passes. Search, Directus, cache, object storage, and workflow systems are derived capabilities, never competing systems of record.

## Stable identity rule

`deeptechly.accounts.id` is the durable DeepTechly owner ID. Provider identities belong in `external_identities(provider, provider_user_id, account_id)`. Legacy auth IDs are imported as mappings and are not rewritten in place. PocketBase record IDs attach to the same account and never become ownership foreign keys.

This prevents research ownership, saved research, grants, and audit history from changing when authentication providers change. Password hashes and sessions are outside this data import; they require a provider-supported migration or password-reset cutover.

## Legacy-to-V2 mapping

| Legacy source | V2 target | Required preservation / reconciliation |
|---|---|---|
| `auth.users` + `users_profile` | `accounts`, `external_identities`, `access_grants` | Supabase user ID, verified email state, full name, organization, access tier, institutional pending/verified state, timestamps. |
| `invite_codes` | `invite_codes`, `invite_redemptions` | Export code securely; target stores a hash. Preserve limits, counts, expiry, disable state; reconcile atomic redemption separately. |
| `research_jobs` columns + `data` | `research_jobs`, `research_runs`, `workflow_events` | Prefer rich snapshot for workflow/retry fields; compare normalized status, ownership, output links, and timestamps. Never expose internal errors to public clients. |
| `entities` columns + `data` | `entities`, aliases/domains/taxonomy/technology maps | Preserve nested facts and resolution metadata in `compatibility_snapshot`; normalize only claims with provenance. |
| `sources` + nested entity sources | `sources`, `entity_sources`, `evidence` | Canonical and original URL, publisher/type, authority, dates, supported claims, retrieval metadata, content hash/object key when available. Do not infer historical content that was not retained. |
| Structured claims embedded in snapshots | `claims`, `evidence`, `claim_evidence`, `contradictions` | Preserve status vocabulary exactly; record methodology version and unsupported/conflicting states. |
| `articles` columns + `data` | `articles`, `publications`, provenance | Structured sections are canonical; derived Markdown is a projection. Preserve image attribution, feature state, status, and dates. |
| Entity aggregate profile fields | `profiles`, `publications` | Generate only from the preserved public profile contract; do not promote dossier-only fields into public output. |
| `dossiers` columns + `data` | `dossiers`, `publications` | Store public and institutional projections separately. Public export/index paths must select only public fields. |
| `saved_research_items` | `saved_research` | Resolve Supabase owner through identity map; preserve uniqueness, metadata, and timestamps. Also inspect the user-metadata fallback key `deeptechly_saved_research_queue`. |
| Aggregate `searchEvents` | `search_events` | Preserve query, provider, result count, job relation, and time; legacy events may lack a run ID. |
| Future government research | Aperture tables | Reuse core sources/claims/evidence; retain document type, agency, solicitation ID, deadlines, methodology, and public/institutional separation. |

## Export and import sequence

1. **Inventory without writes.** Record deployed environment names, configured `SUPABASE_RESEARCH_STORE_TABLE`, `DEEPTECHLY_RESEARCH_STORE_KEY`, Supabase table counts, aggregate keys, Redis/KV key existence, schema version, and newest timestamps.
2. **Freeze an immutable export.** Export auth identity metadata through an approved provider method, every relevant Supabase table, every aggregate JSON record, and any Redis/KV aggregate. Encrypt the archive, checksum every file, and retain the original timestamps.
3. **Register the export.** Insert one `legacy_import_batches` record and append each untouched source record to `legacy_records`. Import tooling must be idempotent on `(batch, table, legacy_id)` and checksum.
4. **Create identity maps first.** Generate stable account IDs, attach Supabase external identities, and write `legacy_identity_map`. Reject ambiguous or duplicate emails for manual review; never merge accounts solely by unverified email.
5. **Import reference and research domains.** Entities precede jobs and artifacts; sources precede evidence; claims precede claim-evidence links. Preserve the original rich JSON in compatibility snapshots.
6. **Import publishing state.** Recreate independent profile/article/dossier states and publication events. Institutional fields remain inaccessible to public projections.
7. **Reconcile field by field.** Compare counts, IDs, ownership, status, timestamps, source URLs, claim states, publication visibility, and canonical artifact hashes. Write results to `reconciliation_results` and anomalies to `import_findings`.
8. **Shadow read.** For representative records, read legacy and V2 stores in the same request path and compare without serving V2 data. Alert on drift; do not silently repair it.
9. **Controlled dual write.** If needed, write through one application repository and transactional outbox. Never let legacy and V2 workers independently dispatch or publish the same job.
10. **Cut over by domain.** Switch reads only after zero severe reconciliation findings, tested rollback, backup restore proof, authorization tests, and operator approval. Retain legacy data for the agreed rollback window.

## Required acceptance checks

- Source and target counts reconcile per domain, with every exclusion explained.
- Every owned record resolves to exactly one internal account or is quarantined.
- Rich snapshots round-trip with stable checksums; normalized projections are compared field by field.
- Public artifact sets and slugs match before and after migration.
- Institutional dossier fields never appear in anonymous SQL views, search documents, markdown, sitemap, API responses, or caches.
- Research jobs retain stage, retry, attempt, heartbeat, completion, and output-link semantics.
- Claims retain `CONFIRMED`, `INFERRED`, `UNVERIFIED`, and `CONFLICTING_SOURCES` semantics and evidence links.
- Invite redemption and grant changes are atomic and auditable.
- Restore and rollback are rehearsed against an isolated environment.

## Migration risks that remain external

- No target PostgreSQL instance or production export is available in the repository, so counts and checksums cannot yet be reconciled.
- PocketBase credentials and an operator-approved identity activation are absent. Passwords and sessions are not migrated by these SQL files; migrated users complete PocketBase password recovery.
- The deployed Supabase schema version and whether Redis/KV contains divergent production records require environment access.

These items are also tracked in `docs/v2/BLOCKERS.md`; none prevents building repository boundaries and offline verification.

## Verification

Run `pnpm verify:database-migrations`. It verifies ordered migration registration, required domain tables, schema qualification, and absence of destructive statements. It deliberately does not connect to `DATABASE_URL`.
