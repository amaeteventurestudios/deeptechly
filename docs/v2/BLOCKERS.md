# External Integration Blockers

This file records integrations that require user-authorized external accounts or credentials. They do not block independent V2 implementation work.

## Appwrite activation

Status: isolated; not active.

An Appwrite endpoint, project ID, allowed-origin configuration, email templates, and an approved server-session cookie design are not available in the repository. The Appwrite identity adapter therefore fails closed, while Supabase remains the working compatibility provider. See `06_AUTH_MIGRATION.md` for the cutover requirements.

## PostgreSQL migration activation

Repository migrations and reconciliation controls are ready, but production import/cutover requires an isolated target PostgreSQL database, encrypted exports from the deployed Supabase/Redis configuration, backup retention, and an authorized operator. No production database was accessed or changed during Phase 9.

## Commodity capability activation

Crawl4AI, Directus, Meilisearch, Trigger.dev, Langfuse, Valkey, and object storage have no approved production endpoints, credentials, image policy, network policy, backups, or operational owners in the repository. Phase 11 provides fail-closed ports, adapters, and opt-in local profiles only. No production integration is presented as active.

## Trigger.dev activation

The pinned task, dispatcher, private callback, idempotency, retry, concurrency, and cancellation paths are implemented. Live task registration and external execution require a Trigger.dev project reference/secret, a reachable HTTPS internal web URL, and a shared callback secret configured in both environments. Until those exist, `DEEPTECHLY_WORKFLOW_PROVIDER=local` preserves the tested production path.

## Directus newsroom activation

The newsroom CRUD port, Directus adapter, editorial schema, runtime selector, and admin Data Studio handoff are implemented. Live activation requires an authorized Directus deployment, scoped server token, collection registration/layout snapshot, least-privilege roles, and a reconciled V2 PostgreSQL import. `DEEPTECHLY_NEWSROOM_PROVIDER=compatibility` remains the safe default; no live Directus or production database was contacted.
