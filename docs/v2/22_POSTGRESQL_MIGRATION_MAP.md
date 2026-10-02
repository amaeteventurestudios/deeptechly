# Phase 22 PostgreSQL Migration Map

## Authority and scope

The authoritative legacy source is the gzip-wrapped PostgreSQL cluster dump at:

`migration/legacy-supabase/db_cluster-19-08-2026@15-19-13.backup.gz`

It was created on 2026-08-19 and has SHA-256 `5f7de98ec365b3830eeb044cea3f463bb4ce87864bc3e6ff635efcdb570fcb0c`. The current hosted Supabase project's empty `public` schema is not a historical source and must not be used for migration counts or reconciliation.

The dump is a PostgreSQL plain-text cluster dump wrapped in gzip, not a custom-format `pg_restore` archive. Phase 22 parses only the eight DeepTechly application tables and the minimum `auth.users` / `auth.identities` fields required for identity planning. Supabase platform schemas are inventoried but not restored into V2.

## Actual source counts

| Source table | Rows | V2 target | Target rows | Reconciliation rule |
|---|---:|---|---:|---|
| `public.articles` | 5 | `deeptechly.articles`, `publications` | 5 / 5 | Preserve IDs and slugs one-to-one. |
| `public.dossiers` | 4 | `deeptechly.dossiers`, `publications` | 4 / 4 | Preserve IDs and entity links one-to-one. |
| `public.entities` | 5 | `deeptechly.entities`, derived `profiles`, `publications` | 5 / 5 / 5 | Preserve entity IDs; derive one profile per entity. |
| `public.invite_codes` | 0 | `deeptechly.invite_codes` | 0 | Raw codes would be SHA-256 hashed, never copied as cleartext. |
| `public.research_jobs` | 30 | `research_jobs`, `research_runs`, output/provenance links | 30 / 30 | Preserve every job, including failed/cancelled and partial-output jobs. |
| `public.saved_research_items` | 0 | `deeptechly.saved_research` | 0 | Ownership mapping remains implemented and tested with synthetic edge cases. |
| `public.sources` | 70 | `deeptechly.sources`, entity/artifact joins | 70 | Canonical URL reconciliation; no duplicates or malformed URLs were present. |
| `public.users_profile` | 12 | `deeptechly.accounts`, `access_grants` | merged / 2 | Merge with auth users; one verified and one pending institutional grant. |
| `auth.users` | 12 | `deeptechly.accounts`, `external_identities` | 12 / 12 | Preserve UUID as internal account ID; exclude auth secrets. |
| `auth.identities` | 12 | import ledger / account identity mapping | 12 mappings | All use the email provider and link to an existing auth user. |

Application records total 126. The selected migration set totals 150 when the 24 auth-planning records are included. All 150 have import-ledger and identity-map entries.

## Legacy application schema inventory

All application tables are owned by the legacy `postgres` role and have RLS enabled. There are no application-schema enums, sequences, views, or materialized views.

| Table | Keys and relationships | Indexes / triggers / RLS |
|---|---|---|
| `articles` | UUID PK; unique `slug`; nullable `entity_id` FK to `entities` with cascade delete. | Published/date index; update timestamp trigger; public SELECT only when published. |
| `dossiers` | UUID PK; unique `slug`; nullable `entity_id` FK to `entities` with cascade delete. | Published/update index; update timestamp trigger; public SELECT only when published. |
| `entities` | UUID PK; unique `slug`. | Published/update index; update timestamp trigger; public SELECT only when published. |
| `invite_codes` | UUID PK; unique cleartext `code`; no child relationship in the recovered schema. | RLS enabled with no client policy; redeemed through a security-definer function. |
| `research_jobs` | UUID PK; nullable `user_id` FK to `auth.users` with `ON DELETE SET NULL`. `article_id`, `entity_id`, and `dossier_id` are logical links without database FKs. | Status/update and user/update indexes; timestamp trigger; owner SELECT/INSERT policies. |
| `saved_research_items` | UUID PK; unique (`auth_user_id`, `item_id`); auth user FK with cascade delete. | Timestamp trigger; owner SELECT/INSERT/UPDATE/DELETE policies. |
| `sources` | UUID PK; nullable entity/article/dossier FKs with cascade delete. | Entity index; public read policy requires a published linked entity. |
| `users_profile` | UUID PK; unique `auth_user_id`; auth user FK with cascade delete. | Timestamp trigger; owner SELECT policy. |

Application functions are `redeem_invite_code`, `rls_auto_enable`, `set_research_updated_at`, `set_saved_research_items_updated_at`, and `set_users_profile_updated_at`. Six application row triggers apply the timestamp functions. The `ensure_rls` event trigger invokes `rls_auto_enable`; the other cluster event triggers are Supabase platform internals and are not migrated.

Defaults use `gen_random_uuid()` for IDs, `now()` for timestamps, `{}` for JSONB, zero for source/progress/use counts, `false` for publication/access flags, and legacy status/stage defaults of `queued` / `Queued`. Every application JSON field parsed successfully.

## Field-level source-to-target map

### Identity and ownership

| Legacy field | V2 field | Transformation |
|---|---|---|
| `auth.users.id` | `accounts.id` | Preserve the 36-character UUID as text. |
| `auth.users.email` | `accounts.primary_email` | Preserve; profile email is fallback only. |
| `users_profile.full_name` | `accounts.display_name` | Preserve nullable value. |
| `users_profile.organization` | `accounts.organization` | Preserve nullable value. |
| `auth.users.deleted_at` | `accounts.status` | `active` when null; otherwise `closed`. |
| auth create/update timestamps | account timestamps | Preserve exactly. |
| `auth.users.id` | `external_identities.provider_user_id` | Provider is `supabase`; deterministic identity ID is derived from the UUID. |
| email confirmation | `external_identities.email_verified` | True only when `email_confirmed_at` exists. |
| auth audience/role/sign-in flags | `provider_payload` | Preserve only non-secret migration context. |
| verified institutional profile | `access_grants` | Active `institutional` capability sourced from `legacy_profile_verified`. |
| pending institutional request | `access_grants` | Pending `institutional` capability sourced from `legacy_profile_pending`. |
| free profile | no access grant | Free is the absence of an institutional capability. |

The 12 password hashes are bcrypt. They, recovery/confirmation/reauthentication tokens, phone fields, refresh tokens, sessions, and identity payloads are deliberately excluded from the rehearsal database and import ledger. Appwrite currently documents server-side bcrypt user import and password recovery, but either path requires an authorized Appwrite sandbox rehearsal before production use. See [Appwrite Users API](https://appwrite.io/docs/references/cloud/server-rest/users) and [password recovery](https://appwrite.io/docs/products/auth/email-password#password-recovery).

### Entities and derived profiles

| Legacy field | V2 field | Transformation |
|---|---|---|
| `id`, `slug`, `name` | same | Preserve exactly. |
| `entity_type` | `entity_type` | Preserve; fallback `unknown` exists for future nulls. All recovered rows are `Company`. |
| `sector`, `region`, `stage`, `summary` | same | Preserve; stage prefers the structured `data.stage` value. |
| `data.domain` / `data.website` | `official_domain` | Prefer resolved domain, then website. This is carried as legacy resolution, not re-verified. |
| `data.resolutionStatus` | `resolution_status` | Preserve when present; otherwise `legacy_imported`. |
| text confidence | `confidence_label` | Normalize spaces and legacy aliases to the four V2 labels. |
| `data.confidenceScore` | `confidence_score` | Convert recovered 0–100 values to 0–1 numeric values. |
| full row and `data` JSONB | `compatibility_snapshot` | Preserve losslessly for application model reconstruction. |
| technical/market/competitive text | derived profile Markdown | Build one `profiles` row per entity using only recovered text. |
| structured `data` | `profiles.structured_content` | Preserve the recovered public research model. |

Recovered entity confidence distribution is one high, one moderate, and three limited-public-data records. All five entities are published.

### Articles

| Legacy field | V2 field | Transformation |
|---|---|---|
| `id`, `entity_id`, `slug`, `title`, `dek`, `author_name` | same | Preserve exactly. |
| `body_md` | `body_markdown` | Rename only. |
| `data.bodySections` | `structured_body` | Preserve structured sections; use an empty array only when absent. |
| `sector`, `confidence`, `source_count`, `hero_image_url` | compatibility / publication metadata | Preserve without inventing normalized facts. |
| `published`, `published_at` | `publications.state`, `published_at` | Preserve. All five recovered articles are published. |
| timestamps | timestamps | Preserve exactly. |

### Dossiers

| Legacy field | V2 field | Transformation |
|---|---|---|
| `id`, `entity_id`, `slug` | same | Preserve exactly. |
| `public_md` | `public_markdown` | Rename only. |
| `institutional_md` | `institutional_markdown` | Preserve; do not expose through public Markdown. |
| `data` | public/institutional structured content and compatibility snapshot | Preserve recovered dossier model. |
| confidence/source count | publication eligibility metadata | Preserve. |
| `published` | publication state | Preserve. All four recovered dossiers are published. |
| missing legacy `published_at` | publication timestamp | Use `updated_at` and record that derivation in eligibility metadata. |

### Research jobs, runs, outputs, and provenance

| Legacy field | V2 field | Transformation |
|---|---|---|
| `id` | `research_jobs.id` | Preserve exactly. |
| `user_id` | `account_id` | Preserve linked account UUID. All 30 jobs have owners. |
| `entity_name`, `input_query` | requested entity / compatibility snapshot | Preserve both; view-model JSON remains intact. |
| `data.mode` / `entity_type` | `research_mode` | Prefer stored mode. |
| `status` | `status` | Preserve: 3 done, 25 failed, 2 cancelled. |
| `data.stage` / display `stage` | `current_stage` | Prefer canonical machine stage. |
| progress | progress | Preserve and enforce 0–100 target constraint. |
| retry count | attempt count | Stored retry count plus the initial attempt. |
| heartbeat/start/completion values | corresponding timestamps | Prefer structured timestamps, with legacy create/update fallback. |
| `error_message` | public/internal errors | Preserve public value; retain a scoped internal compatibility object. |
| `article_id`, `entity_id`, `dossier_id` | job output join table | Preserve 5 article, 5 profile, and 4 dossier links, including partial outputs on unsuccessful jobs. |
| each job | one `research_runs` and one provenance event | Mark methodology/provider as legacy Supabase. |
| whole row / `data` | compatibility snapshot | Preserve the exact queue/history model. |

Migration `0006_legacy_relationships.sql` adds `research_job_outputs` because the actual source proved that output relationships must not remain implicit JSON-only fields.

### Sources and provenance

| Legacy field | V2 field | Transformation |
|---|---|---|
| `id` | `sources.id` | Preserve when the canonical URL is unique. |
| `url` | original and canonical URL | Apply the research kernel's URL normalization. |
| title/publisher/type | same | Preserve. |
| source type | authority tier | Apply the existing DeepTechly source-quality policy. |
| retrieved/create timestamps | same | Preserve. |
| `entity_id` | `entity_sources` | Preserve all 70 links. |
| nullable article/dossier IDs | `artifact_sources` | Preserve direct links where present. Actual rows have only entity links. |
| entity-to-artifact ownership | derived artifact source links | Create explicitly labelled legacy-evidence links for the related profile/article/dossier. |

All 70 URLs are valid, canonicalize to 70 distinct targets, and have entity owners. The target contains 196 artifact-source joins: 70 profile, 70 article, and 56 dossier links. Every original source ID retains a `legacy_identity_map` row even if a future dump requires URL deduplication.

### Saved research and invites

`saved_research_items` maps field-for-field to `saved_research`, with `auth_user_id` renamed to `account_id` and JSON metadata preserved. The recovered table has zero rows, so no synthetic production row was introduced.

Invite IDs, organization, tier/capability, use limits, expiry, disable state, and timestamps map to V2. Cleartext codes are never written to staging or the import ledger; the tool produces SHA-256 hashes before SQL generation. The recovered table has zero rows.

## Supabase platform data excluded from V2 PostgreSQL

The dump includes 12 auth users, 12 identities, 8 sessions, 29 refresh tokens, 8 MFA authentication-method rows, 3 flow-state rows, and Supabase schema-migration metadata. Only the sanitized users and identity linkage are selected. Sessions, refresh/one-time tokens, password hashes, MFA internals, SSO/OAuth internals, audit/platform migrations, Realtime internals, Vault internals, and all Supabase roles/extensions/event triggers are excluded.

Storage has zero buckets and zero objects, so there is no binary payload to migrate from this backup. The legacy `hero_image_url` values remain in compatibility snapshots pending a separately authorized object-storage acquisition plan.

## ID and ownership strategy

- Preserve every legacy application UUID as target text where the target represents the same object.
- Preserve auth UUIDs as stable internal account IDs and Supabase provider IDs.
- Use deterministic prefixes only for new derived objects: profiles, publications, runs, grants, provenance, and reconciliation rows.
- Maintain one identity-map entry for every one of the 150 selected source records.
- Never use email as the primary ownership key; it is a reconciliation attribute only.
- Never infer institutional access from payment state. The recovered verified and pending flags become explicit access grants.

## Unsupported, transformed, and obsolete fields

| Field/domain | Disposition |
|---|---|
| Supabase password/token/session internals | Excluded from rehearsal and V2 data store; use separately approved Appwrite import or reset flow. |
| Raw invite code | Hash before staging; never retain cleartext. |
| Platform roles, extensions, policies, and RLS event triggers | Replace with application/service authorization and V2 database roles; do not restore blindly. |
| Legacy entity rich fields not normalized in V2 | Preserve in compatibility snapshot and derived profile structured content. |
| Article image URL and attribution fields | Preserve in compatibility data; object acquisition is a later authorized operation. |
| Display-oriented research stage text | Preserve in compatibility data; canonical machine stage drives V2 state. |
| Legacy output IDs without FKs | Validate before import and normalize through `research_job_outputs`. |
| Legacy source-to-artifact relationship implied through entity | Materialize as explicitly derived `artifact_sources` links. |
| Missing dossier/profile publication timestamp | Derive from legacy `updated_at` and record the derivation. |
| Separate profile source table | None existed; derive exactly one profile from each entity and report the transformation. |

## Migration risks

1. The production write adapter for the V2 PostgreSQL research store is not yet active; Phase 22 adds an opt-in read-only adapter for rehearsal and rendering only.
2. Appwrite auth activation still requires a sandbox, scoped API credentials, email templates, cookie/session design, and a verified bcrypt-import or password-reset decision.
3. Legacy job output columns lacked foreign keys. The recovered rows pass explicit orphan checks, but every future/final dump must be revalidated.
4. Artifact-source links for these rows are entity-derived because the legacy source rows did not populate article/dossier IDs. They are evidence lineage, not proof that every source supports every artifact claim.
5. The recovered dataset is small but includes real personal data. Generated staging SQL and rehearsal clusters must remain ignored, mode-restricted, short-lived, and excluded from logs and commits.
6. There are no saved-research or invite rows and no storage objects in this snapshot. Their transforms are synthetic-tested but cannot be production-proven until a later source contains those edge cases.
7. Related-entity arrays are empty in the recovered application models, so related-research navigation has no real positive edge case in this backup.
