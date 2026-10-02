# DeepTechly V2 Production Cutover Runbook

Status: **not executed**. This is an operator runbook, not authorization to migrate production.

## Cutover principle

The August 19 backup proves the transformation, but it is not automatically the final cutover source. Production cutover must use a newly authorized final export after a write freeze and must reconcile that export independently. The recovered backup remains the historical baseline and must never be restored over the current hosted Supabase project.

Use staged capability switches, not a flag day. PostgreSQL data authority, Appwrite identity, durable workflows, newsroom, search, and other commodity services have independent rollback boundaries. This runbook covers PostgreSQL data and auth sequencing only; it does not authorize activation of Trigger.dev, Crawl4AI, Directus, Meilisearch, Langfuse, Valkey, S3, Lago, or Stripe.

## Blocking prerequisites

Production cutover must not start until all items are true:

- Phase 22 commit is deployed to a non-production environment and the complete test suite passes there.
- A production-ready V2 PostgreSQL provider exists for reads **and transactional writes**. The Phase 22 adapter is read-only and cannot be used as the production write authority.
- Dual-write or change-capture testing proves jobs, runs, artifacts, sources, publications, saved research, access grants, provenance, and outbox events remain consistent.
- A target PostgreSQL 17+ service is provisioned with encryption, private networking, point-in-time recovery, monitoring, connection pooling, least-privilege roles, and named operational ownership.
- Backup retention, restore testing, RPO/RTO, incident escalation, and rollback decision owners are approved.
- The final legacy export method and maintenance window are approved. The current empty hosted Supabase `public` schema is not accepted as a source.
- Appwrite endpoint/project, allowed origins, server API key, email sender/templates, session-cookie design, and rollback project exist in an isolated staging environment.
- The exact Appwrite deployment version proves either bcrypt import for the 12 legacy hash format or the password-reset alternative.
- A secrets manager contains all credentials; none is placed in repository files, shell history, CI logs, generated reports, or issue trackers.
- Product/editorial owners approve the 14 published artifacts and the one active plus one pending institutional access mapping.
- Legal/privacy review approves handling of user emails and auth hashes during the authorized identity step.
- A final go/no-go checklist, incident channel, named migration operator, database operator, auth operator, application operator, and rollback authority are scheduled.

## Required credentials and access

Use separate, short-lived credentials with the narrowest possible scopes:

- read-only export access to the authoritative legacy source or custody of an encrypted final dump;
- target PostgreSQL migration-owner role for schema application/import;
- target PostgreSQL read-only validation role;
- application runtime role with no schema-owner privileges;
- Appwrite server API key scoped to user creation/update only during identity import;
- deployment access for environment-variable and release changes;
- email delivery access for password recovery if selected;
- monitoring/logging access for migration health;
- DNS access only if the application origin actually changes.

Never reuse the legacy Supabase service role as a V2 PostgreSQL or Appwrite credential.

## Backup requirements

Before any write freeze or target mutation:

1. Create an encrypted, immutable final legacy backup and record UTC time, source identifier, PostgreSQL version, byte size, SHA-256, and custodian.
2. Store two independently accessible copies under the approved retention policy.
3. Verify gzip/archive integrity and perform a read-only test extraction.
4. Export aggregate counts for all eight application tables plus `auth.users` and `auth.identities`.
5. Create and verify a target PostgreSQL snapshot immediately before import.
6. Export current deployment configuration and provider flags without secret values.
7. Preserve the existing Supabase application and database unchanged for the full rollback window.

The backup may contain personal data and auth secrets. Access must be audited; generated staging SQL must use mode `0600` and be securely removed after reconciliation.

## Pre-cutover rehearsal

Run the repository rehearsal with the final encrypted export in a secure, isolated environment:

```sh
LEGACY_BACKUP_PATH=/secure/path/final.backup.gz \
DEEPTECHLY_PG_BIN=/approved/postgresql-17/bin \
pnpm migration:rehearse
```

Required result:

- two clean equivalent runs;
- every expected table discovered;
- zero malformed/duplicate primary IDs;
- zero unexpected orphans;
- zero unexplained loss;
- reconciled publication and access states;
- successful application model, Markdown, and HTTP checks;
- reports reviewed without exposing user data.

If final source counts differ from the Phase 22 baseline, explain every difference. Do not assume drift is benign.

## Planned production sequence

### 1. Deploy dormant code

Deploy the application version containing migrations and provider boundaries with all current compatibility selectors unchanged:

- Supabase auth remains selected;
- compatibility research store remains selected;
- local workflow and local search remain selected unless independently approved;
- V2 PostgreSQL connection is available only to shadow validation, not public traffic.

Verify health, existing auth, current public routes, queue operations, admin review, and protected-content exclusion.

### 2. Shadow reads and dual writes

Implement and enable a reviewed write path before the final window:

1. Write new mutable records to the current store first, then the V2 transactional/outbox path.
2. Compare IDs, owners, timestamps, stages, artifacts, source links, and publication state continuously.
3. Serve a controlled percentage of internal reads from V2 and compare application view models.
4. Alert on any mismatch; do not auto-heal without retaining evidence.
5. Prove fallback to compatibility reads without data loss.

Do not continue until the agreed soak period has zero unexplained divergence.

### 3. Begin maintenance / write freeze

**Operator approval required.** Announce maintenance and disable new research submissions, saved-research mutations, invite redemption, profile/access changes, and editorial publication. Existing public read traffic may continue on the old store.

Record the freeze timestamp and confirm there are no active jobs or uncommitted editorial changes. If active work cannot drain within the approved window, abort and reschedule.

### 4. Create the final export

**Operator approval required.** Produce a new read-consistent legacy dump. Do not restore it into the hosted Supabase project. Calculate its checksum and rerun inventory. Compare it with pre-freeze counts and the last shadow-write checkpoint.

Abort on:

- missing expected tables or COPY sections;
- malformed JSON/URLs/IDs;
- unknown auth ownership;
- unexpected new enum/status values;
- orphaned job/output/source/saved-research relationships;
- row-count regression not explained by authorized deletion.

### 5. Prepare target PostgreSQL

**Operator approval required.** Snapshot the target, create an empty deployment-specific database/schema, and apply the ordered migrations through the approved migration runner:

1. `0001_v2_core.sql`
2. `0002_v2_aperture.sql`
3. `0003_legacy_import_ledger.sql`
4. `0004_newsroom_metadata.sql`
5. `0005_billing_entitlements.sql`
6. `0006_legacy_relationships.sql`

Verify checksums, the migration ledger, owner roles, grants, RLS/service authorization strategy, and every constraint. Application runtime credentials must not own the schema.

### 6. Generate redacted staging data

On a restricted migration host, run the parser against the final dump:

```sh
pnpm exec tsx scripts/migration/legacy-supabase-dump.ts \
  --backup /secure/path/final.backup.gz \
  --output /secure/ephemeral/staging.sql \
  --inventory /secure/reports/inventory.json
```

Confirm staging SQL contains no password hashes, auth tokens, phone fields, raw provider identity payloads, or cleartext invite codes. Do not print or upload staging SQL.

### 7. Transform and import

**Operator approval required.** In a controlled transaction with `ON_ERROR_STOP`, apply the generated staging SQL and `scripts/migration/transform-legacy-supabase.sql`. Capture SQL exit status and aggregate-only logs. Do not use the local rehearsal shell script against production because it initializes and destroys local clusters.

The import must fail closed on duplicate IDs, missing references, invalid required values, constraint violations, or unknown transformations. Never disable target constraints to force completion.

### 8. Reconcile before traffic

Run `scripts/migration/verify-rehearsal.sql` using a read-only validator adapted to the production connection. Review:

- every source and target count;
- all 150-style identity mappings adjusted to the final source count;
- source deduplication mappings;
- account/profile/auth linkages;
- job/output/provenance links;
- published/draft/withdrawn states;
- institutional active/pending grants;
- timestamps and checksum results;
- null/required fields and unique constraints;
- foreign keys and polymorphic artifact links;
- application view-model and Markdown reconstruction.

Any mismatch without a signed remediation record is a no-go.

### 9. Migrate identity

Do not copy Supabase sessions, refresh tokens, MFA internals, recovery tokens, or email-confirmation tokens.

Choose one approved path after Appwrite staging validation:

**Path A — bcrypt import**

- Use the server-side Appwrite bcrypt-user endpoint supported by the exact deployed version.
- Preserve internal account IDs in PostgreSQL and create a recorded Supabase-to-Appwrite identity mapping.
- Use deterministic valid Appwrite IDs where supported; otherwise record a separate provider ID.
- Transfer only bcrypt hashes through memory/secure transport. Never place them in staging SQL, ledgers, logs, or reports.
- Set verified email state only from confirmed legacy evidence.
- Test successful login and Appwrite's documented rehash-on-login behavior on non-production accounts first.

**Path B — forced password recovery**

- Create Appwrite users with preserved email/profile/account mappings but no migrated credential.
- Mark accounts as recovery-required in a non-public migration control.
- Send approved recovery communications after cutover using configured templates and allowed redirect origins.
- Rate-limit, audit, and support the recovery process.

If Path A cannot be proven for the exact version/hash parameters, use Path B. Auth uncertainty must not block PostgreSQL data reconciliation, but it does block identity cutover.

### 10. Application canary

Deploy a canary with:

- V2 PostgreSQL read/write provider;
- Supabase auth still active initially;
- private comparison logging with content redaction;
- no commodity-service changes beyond the approved scope.

Validate representative real records on homepage, article, profile, dossier, archives, queue/history, saved research, Markdown, related research, search, admin review, and entitlement gating. Test the verified and pending institutional accounts without exposing institutional content to signed-out users.

### 11. Data authority switch

**Operator approval required.** Change only the research/data provider to V2 PostgreSQL. Keep the compatibility store read-only and available for rollback. Monitor errors, latency, reconciliation drift, outbox backlog, new job persistence, publication updates, and saved-research writes.

After the agreed soak period, independently switch auth to Appwrite if its own readiness gate passes. Do not combine data and auth switches in the same irreversible step.

### 12. Resume writes

Re-enable writes gradually: admin/editorial first, then saved research, then research submissions. Verify each creates consistent PostgreSQL rows, provenance, relationships, and outbox events before enabling the next class.

## Expected downtime

A dual-write/shadow-read rollout can keep public read-only pages available. The final source freeze and authoritative switch require a planned write-maintenance window. For a dataset of this observed size, the SQL import is short, but the window must be sized from the final rehearsal, auth checks, deployment propagation, and rollback decision time—not from row count alone.

Initial planning assumption: 15–30 minutes of write unavailability, with public reads remaining on the compatibility store. This is an estimate, not an SLA; replace it with measured final-rehearsal timings.

## DNS and deployment sequencing

No DNS change is required when the existing public origin remains in place. Deploy application/provider configuration independently of DNS.

If an origin change is required:

1. lower TTL at least one full existing TTL before the window;
2. validate TLS, allowed Appwrite origins, auth redirects, canonical URLs, email recovery URLs, CSP, and cookies on the new origin;
3. switch DNS only after application/database/auth canaries pass;
4. keep the old origin and certificate serving a safe redirect or rollback target through the rollback window;
5. restore TTL only after the soak period.

## Validation checklist

- [ ] Final dump checksum and inventory recorded.
- [ ] Source counts reconciled for every application/auth-planning table, including zeros.
- [ ] Target counts, identity maps, and transformed/derived counts explained.
- [ ] Zero unexpected orphans, duplicates, malformed records, and constraint failures.
- [ ] All timestamps and publication states preserved or explicitly derived.
- [ ] User/profile/job/saved-research ownership verified.
- [ ] Institutional active/pending mappings verified.
- [ ] Password strategy tested in an isolated Appwrite project.
- [ ] Homepage, article, profile, dossier, archives, queue, saved research, Markdown, related research, search, and admin review validated.
- [ ] Signed-out users cannot receive institutional HTML, JSON, Markdown, or search documents.
- [ ] New writes and outbox events persist transactionally in V2.
- [ ] Monitoring, backup, and rollback owners are active.

## Rollback

Rollback is provider-based unless target corruption requires restore.

1. Stop new writes and research dispatch immediately.
2. Record the rollback timestamp and target transaction/outbox watermark.
3. Switch reads and writes back to the compatibility provider using the previously tested flag/release.
4. If Appwrite had switched, restore Supabase auth selection while the legacy project remains intact. Existing Appwrite sessions must be invalidated according to the approved session plan.
5. Export all V2-only writes since the cutover watermark; do not discard them. Reconcile or replay them into the recovered authority before resuming writes.
6. Verify public pages, auth, queue/history, saved research, admin, publication, and institutional gating on the rollback provider.
7. Keep the failed V2 database isolated for forensic analysis.

**Destructive rollback step — separate operator approval required:** restore the target PostgreSQL snapshot or drop/recreate the target database only after V2-only writes are exported, checksum-verified, and the exact target is independently confirmed. Never run a broad recursive filesystem deletion or drop against an unresolved environment variable.

## Explicit destructive/external approval gates

The following steps are not authorized by this document and require a named operator's explicit approval at execution time:

- freezing or disabling production writes;
- creating the final production export;
- applying migrations to production PostgreSQL;
- importing or updating real user/data records;
- importing bcrypt hashes or sending password-recovery email;
- changing provider flags, secrets, deployment traffic, or DNS;
- revoking sessions/keys;
- restoring snapshots, dropping databases/schemas/tables, truncating, or deleting records;
- removing Supabase or its backups;
- enabling any additional commodity service.

No production Supabase removal is part of this cutover. Keep it available through the approved retention and rollback period, then plan decommissioning as a separate audited project.
