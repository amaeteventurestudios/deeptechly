# Directus Newsroom Integration

Phase 14 establishes Directus as the optional commodity newsroom and PostgreSQL as the future data authority. It deliberately retains DeepTechly's source/claim review, publication eligibility, retry decisions, and institutional gating in custom code.

## Ownership boundary

Directus is appropriate for routine editing and inspection of:

- entities and normalized metadata;
- research jobs and operational state;
- sources, claims, and evidence records;
- articles, profiles, dossiers, and publication rows;
- images and attribution metadata;
- taxonomy;
- editorial metadata, notes, and review records.

Directus must not calculate source authority, claim confidence, publication eligibility, contradiction outcomes, or retry policy. Those remain in `@deeptechly/research` and the existing custom review console. The `/admin/content` route remains valuable because it joins those proprietary signals into one decision surface.

## Runtime selection

`DEEPTECHLY_NEWSROOM_PROVIDER=compatibility` is the default and preserves current production behavior. Selecting `directus` requires all of:

- `DIRECTUS_BASE_URL`, used only by server-side adapters;
- `DIRECTUS_TOKEN`, a scoped static token stored only in the server environment;
- `DIRECTUS_STUDIO_URL`, an optional browser-facing Data Studio URL with no credentials;
- the V2 PostgreSQL migrations and reconciled legacy import;
- registered Directus collections, field layouts, roles, and least-privilege policies.

When Directus is selected and configured, authorized reviewers get an **Open Directus** action in the existing content console. Tokens are never serialized into that link or page data.

## Schema

Migration `0004_newsroom_metadata.sql` adds two provider-neutral tables:

- `editorial_metadata` for featured state, image attribution, SEO metadata, and internal notes;
- `editorial_reviews` for reviewer disposition, notes, and a structured checklist.

Both use a single text primary key so Directus can manage them directly; the artifact type/ID pair remains unique.

Existing V2 tables remain the collections for entities, jobs, sources, claims, evidence, artifacts, taxonomy, and publication state. Directus is a CRUD surface over those records, not a second source of truth.

No migration is applied automatically. Directus bootstrap/system migrations and DeepTechly domain migrations must be backed up, reviewed, and applied by an authorized operator before collection registration.

## Adapter contract

The provider-neutral newsroom port now supports list, read, create, and update. The worker Directus REST adapter implements all four with bounded timeouts, bearer-token headers, encoded collection/item identifiers, and sanitized HTTP failures. Delete is intentionally absent from the application port; destructive editorial removal requires a separately reviewed archival policy.

## Cutover sequence

1. Provision and back up isolated PostgreSQL and Directus instances.
2. Apply reviewed DeepTechly migrations through `0004`.
3. Import and reconcile legacy Supabase content according to `07_DATA_MIGRATION_PLAN.md`.
4. Register only the approved collections in Directus and configure field layouts.
5. Create scoped newsroom roles; keep internal errors, institutional dossier fields, account secrets, and provider credentials inaccessible to editorial roles.
6. Test create/update operations against staging and verify public output remains driven by PostgreSQL publication state.
7. Set `DEEPTECHLY_NEWSROOM_PROVIDER=directus` only after rollback and audit logging are confirmed.

## Current blocker

No authorized Directus project, production endpoint, scoped token, collection snapshot, or migrated V2 PostgreSQL database is available. The integration therefore remains fail-closed and opt-in; no production service or database was contacted.
