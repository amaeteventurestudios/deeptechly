# Phase 22 PostgreSQL Rehearsal Report

## Outcome

Phase 22 passed against the recovered real legacy backup. Two newly initialized PostgreSQL 17.11 clusters independently produced equivalent inventory, reconciliation, application-model, and HTTP-validation reports. All selected source records have target identity mappings; all 10 source domains reconcile with zero mismatches; foreign keys and polymorphic artifact links have zero orphans; and all generated database clusters and production-derived staging SQL were removed after each run.

This was an isolated local rehearsal only. No production Supabase project, production PostgreSQL database, Appwrite project, DNS, deployment, or external capability service was read from or modified.

## Source and format

- Recovered backup path: `/Users/amaeteumanah/Projects/deeptechly/migration/legacy-supabase/db_cluster-19-08-2026@15-19-13.backup.gz`
- Source date encoded in filename: 2026-08-19 15:19:13
- Compressed size: approximately 129 KiB
- Uncompressed size: approximately 890 KiB
- SHA-256: `5f7de98ec365b3830eeb044cea3f463bb4ce87864bc3e6ff635efcdb570fcb0c`
- Format: gzip-compressed PostgreSQL plain-text cluster dump
- Restore tool: `psql`, after selective parsing and redaction; `pg_restore` is not appropriate for this archive format

The dump contains cluster roles and Supabase-managed `auth`, `realtime`, `storage`, `vault`, extension, GraphQL, and PgBouncer objects. Those were inspected but not blindly restored.

## Legacy schema inventory

### DeepTechly application tables

| Table | Rows | JSON/JSONB | Publication/ownership notes |
|---|---:|---|---|
| `public.articles` | 5 | `data` | All 5 published; all linked to entities. |
| `public.dossiers` | 4 | `data` | All 4 published; all linked to entities. |
| `public.entities` | 5 | `data` | All 5 published; all are companies. |
| `public.invite_codes` | 0 | none | Transform exists; no real row. |
| `public.research_jobs` | 30 | `data` | All owned: 3 done, 25 failed, 2 cancelled. |
| `public.saved_research_items` | 0 | `metadata` | Transform exists; no real row. |
| `public.sources` | 70 | none | All linked to entities; valid distinct canonical URLs. |
| `public.users_profile` | 12 | none | All linked to auth users. |

Application total: 126 rows.

The schema has eight UUID-primary-key application tables, five unique constraints beyond primary keys, eight application foreign keys, six application indexes, five application functions, six row triggers, eleven RLS policies, and RLS enabled on all eight tables. It has no application enums, sequences, views, or materialized views. `research_jobs.article_id`, `entity_id`, and `dossier_id` were logical rather than foreign-key relationships.

### Auth and platform counts

| Domain | Relevant counts | Disposition |
|---|---|---|
| Auth identity | 12 users, 12 email identities | Sanitized linkage selected for planning/import ledger. |
| Auth sessions/tokens | 8 sessions, 29 refresh tokens, 3 flow states | Excluded. Sessions cannot be transferred safely. |
| MFA | 8 AMR rows, no factors/challenges | Excluded platform state. |
| Storage | 0 buckets, 0 objects, 0 multipart/vector records | Nothing to migrate. |
| Realtime | 0 subscriptions; platform migration rows only | Excluded. |
| Vault | 0 secrets | Excluded. |

All 12 recovered password hashes identify as bcrypt. Hash values were never emitted to staging SQL, reports, logs, V2 tables, or committed files.

## Isolated environment

Docker CLI and Compose were present, but no Docker daemon was running. Colima was installed but could not start because its configured QEMU dependency was absent. Homebrew had no supported Monterey bottle and began compiling a large dependency chain, so that attempt was stopped before PostgreSQL installation. The rehearsal instead used the official Postgres.app 2.9.6 PostgreSQL 17.11 Intel binaries from a read-only mounted disk image. No background service was installed.

Each run used:

- a new `initdb` cluster under the ignored migration directory;
- local trust authentication limited to the short-lived rehearsal;
- a repository-specific port and loopback-only network listener;
- database `deeptechly_rehearsal`;
- migrations `0001` through `0006` applied in order;
- production-derived staging SQL with mode `0600`;
- server, web server, and generated-data cleanup on success or error.

The ignored rehearsal root retains aggregate reports only. PostgreSQL data directories, generated staging SQL, and server/request logs are deleted after verification.

## Import process

1. Read and gunzip the source in memory.
2. Verify the cluster-dump signature and required COPY sections.
3. Parse PostgreSQL COPY escaping, column counts, JSON, unique IDs, URLs, and relationships.
4. Select all application rows plus sanitized `auth.users` / `auth.identities` planning fields.
5. Remove password hashes, tokens, phone values, provider identity payloads, and raw invite codes before SQL generation.
6. Apply DeepTechly URL normalization and source-quality classification.
7. Apply all additive V2 migrations, including new migration `0006` for output and artifact-source relationships.
8. Import accounts, grants, entities, jobs/runs, sources, artifacts, publications, provenance, and ownership links in one transaction.
9. Write immutable sanitized legacy records, one source-to-target identity map per selected row, findings, and per-domain reconciliation.
10. Force constraint validation, run application model/Markdown checks, start DeepTechly against the database, and exercise HTTP surfaces.
11. Stop processes, remove the database/staging/log data, initialize a second new cluster, and repeat.

## Reconciliation

| Target domain | Rows | Result |
|---|---:|---|
| Accounts | 12 | Matches auth users. |
| External Supabase identities | 12 | One per account. |
| Institutional access grants | 2 | One verified active grant; one pending grant. |
| Entities | 5 | All legacy IDs preserved. |
| Profiles | 5 | One derived from each entity. |
| Articles | 5 | All legacy IDs and slugs preserved. |
| Dossiers | 4 | All legacy IDs and slugs preserved. |
| Publications | 14 | Five profiles, five articles, four dossiers; all published. |
| Research jobs | 30 | Every status and owner preserved. |
| Research runs | 30 | One legacy methodology run per job. |
| Job-output links | 14 | Five profile, five article, four dossier links. |
| Sources | 70 | 70 valid unique canonical URLs; zero deduplications. |
| Artifact-source links | 196 | 70 profile, 70 article, 56 dossier evidence links. |
| Saved research | 0 | Matches source. |
| Invite codes | 0 | Matches source. |
| Sanitized legacy ledger | 150 | One per selected source record. |
| Legacy identity map | 150 | One per selected source record. |

Per-domain reconciliation rows: 10. Mismatched domains: 0. Unvalidated foreign keys: 0. Orphaned source, ownership, job-output, publication, or artifact-source links: 0. Malformed JSON records: 0. Malformed source URLs: 0. Duplicate primary IDs: 0. Unexplained data loss: 0.

The source count is 126 application rows or 150 selected rows including auth planning. Higher target totals are explained normalized/derived records, not duplication: each entity produces a profile/publication, each job produces a run, and entity evidence is materialized for each related artifact.

## Application validation

The opt-in `v2-postgres` research-store adapter reconstructed the existing application models from imported compatibility snapshots. It is read-only and inactive by default; Supabase/local behavior remains unchanged.

Model validation passed for:

- 5 entity/profile models;
- 5 article models;
- 4 dossier models;
- 30 queue/history jobs;
- 14 production Markdown renders;
- publication state on all imported artifacts;
- account ownership on all 30 jobs.

DeepTechly then ran against each migrated database and returned HTTP 200 with the selected real record rendered on 11 surfaces:

1. homepage;
2. article page;
3. public profile page;
4. dossier page, including public content and the existing signed-out institutional gate;
5. article archive;
6. profile/entity archive;
7. research queue shell;
8. article Markdown;
9. profile Markdown;
10. dossier Markdown;
11. search API.

The backup has zero saved-research rows, so account saved-research positive rendering cannot be validated with real data. All 30 research jobs are account-owned and their queue view models validate, but the signed-in queue/history UI was not bypassed or exposed during the rehearsal. The backup also has zero related-entity links, so related-research empty behavior is preserved; no synthetic relationship was added to production data.

## Repeatability and reset proof

`pnpm migration:rehearse` performed two complete runs. Before each run, the script accepted deletion only for the exact `rehearsal/run-1` or `rehearsal/run-2` path. Each run created a new cluster, database, schema, imported dataset, and web process. Each run then stopped the web/database processes and removed its PostgreSQL data, staging SQL, socket, and logs.

The two inventory, reconciliation, application-validation, and HTTP-validation reports were byte-equivalent. No rehearsal PostgreSQL or Next.js process remained running afterward.

## Repository regression results

| Check | Final result |
|---|---|
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS across all workspace projects |
| `pnpm test` | PASS, including migration parser/redaction and six-migration verification |
| `pnpm migration:rehearse` | PASS twice from clean PostgreSQL clusters |
| PostgreSQL constraints/reconciliation | PASS; 10 domains, 0 mismatches, 0 orphans, 0 unvalidated FKs |
| Migrated application model/Markdown validation | PASS; 5 profiles, 5 articles, 4 dossiers, 30 jobs, 14 Markdown renders |
| Migrated-data HTTP validation | PASS; 11 surfaces on each of two runs |
| `pnpm build` | PASS with Next.js 16.3.8 |
| `pnpm audit --prod` | PASS; no known vulnerabilities |
| Production Playwright | PASS; 20/20 scenarios |

The research-quality suite used its documented deterministic/demo model path because no OpenAI key was configured. The live Supabase load smoke remained disabled because `DEEPTECHLY_ALLOW_LIVE_LOAD_TEST` was not set; no production service was contacted.

## Failures diagnosed and resolved

- The initial local server path was blocked by an absent Docker daemon, an unusable Colima/QEMU configuration, and an unsupported Homebrew bottle. Resolution: use current official PostgreSQL 17.11 binaries without installing a service.
- The first application validator used top-level `await` under the root CommonJS script target. Resolution: use an async entrypoint.
- The Markdown formatter had an unnecessary Next.js `server-only` dependency through source policy. Resolution: import the identical policy directly from `@deeptechly/research`.
- The first zero-row reconciliation query counted the outer-join placeholder. Resolution: count real legacy IDs; invite and saved-research domains now correctly reconcile 0 to 0.
- An early manual aggregate check compared COPY booleans to `true` rather than PostgreSQL's `t`. Final SQL casts and reports correctly show all 14 artifacts published and two institutional grant records.

Every failed rehearsal stopped the isolated server, was diagnosed, fixed, and rerun. No failure was ignored.

## Known migration issues and blockers

1. The V2 PostgreSQL application adapter is intentionally read-only. A transactional write path for new jobs, artifacts, saved research, admin publication, and outbox events must pass dual-write/shadow-read tests before production cutover.
2. Appwrite is not configured. The 12 bcrypt users can only be transparently imported after validating the exact Appwrite version/API in an isolated project; otherwise use the documented password-recovery path.
3. No real saved-research, invite-code, storage-object, or related-entity positive rows exist in this snapshot. Synthetic privacy/integrity fixtures cover the import mechanics, but final production validation must repeat against the final freeze export.
4. The legacy source rows link to entities, not directly to articles/dossiers. Artifact evidence links are transparently marked as entity-derived legacy evidence.
5. Directus, Meilisearch, Trigger.dev, Crawl4AI, Langfuse, Valkey, S3, Lago, and Stripe remain unconfigured and were not required or activated.

## No-production-cutover statement

No production Supabase project was modified. The backup was not restored into production. No production PostgreSQL database or Appwrite project was created or changed. No DNS, deployment, auth, workflow, search, CMS, observability, cache, storage, or billing cutover occurred. The production runbook in `24_PRODUCTION_CUTOVER_RUNBOOK.md` is documentation only and requires explicit operator approval for every destructive or external step.
