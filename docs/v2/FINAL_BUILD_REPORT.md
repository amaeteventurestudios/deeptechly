# DeepTechly V2 Final Build Report

Date: 2026-10-02

Branch: `rebuild/deeptechly-v2`

Implementation head before this report: `f45546b` (`Validate DeepTechly V2 golden paths`)

## Executive summary

DeepTechly V2 now has the requested modular workspace, a rebuilt evidence-first product experience, extracted proprietary research policy, first-class Aperture product and intelligence domains, PocketBase identity architecture, PostgreSQL authorization and Settings control plane, and authoritative transactional PostgreSQL persistence. Public development fixtures remain available without external credentials, but authenticated and persistent operations fail closed; the runtime has no legacy identity or persistence fallback.

No production database was accessed or migrated and PocketBase was not provisioned. No external capability was represented as live without credentials. Phase 24 verification includes the complete deterministic suite, production build, dependency audit, and production-rendered Playwright scenarios.

## What was built

### Workspace and product structure

- A pnpm monorepo with `apps/web`, `apps/worker`, `packages/ui`, `packages/kernel`, `packages/database`, `packages/research`, `packages/aperture`, `packages/shared`, and `infrastructure`.
- A Next.js 16.3.8 public and account application with an editorial shell, responsive navigation, shared design primitives, accessible interactions, and security headers.
- A worker boundary with Trigger.dev v4 task definitions, durable callbacks, retry/cancellation policy, provider adapters, and observability hooks.
- Additive, offline-verifiable PostgreSQL migrations and provider-neutral persistence contracts.

### Public research and discovery

- Evidence-first homepage, article, public profile, institutional dossier, research queue, archive, Explore, patent brief, and Aperture experiences.
- Stable public Markdown routes, machine-readable discovery, sitemap, robots, LLM guidance, canonical metadata, and JSON-LD.
- Public-only local search with a Meilisearch acceleration path and reconciliation back to the current public corpus.
- Publication eligibility, placeholder-source filtering, signed-out institutional-content exclusion, and availability-aware artifact linking.

### DeepTechly proprietary capabilities

- Extracted entity identity, official-domain anchoring, source classification/ranking, confidence, publication, workflow-state, retry, limits, and redaction policy.
- Preserved research planning, acquisition, evidence/claim processing, synthesis, image resolution, and persistence behind compatibility façades where a safe stateless extraction was not yet possible.
- Aperture intelligence for government document reading, signal detection, repeated-demand analysis, problem statements, technical requirements, opportunity maps, and evidence packs.
- Entitlement resolution that separates account access grants from payment-provider state.

### Commodity capability boundaries

- PocketBase HTTP-only token identity boundary with PostgreSQL account and role mapping.
- PostgreSQL-backed Settings control center for roles, application settings, AI/model configuration, SMTP delivery, invitations, preferences, and authentication audit.
- Local/Trigger.dev workflow provider boundary.
- Compatibility/Directus newsroom provider boundary.
- Local/Meilisearch discovery provider boundary.
- Crawl4AI acquisition, Langfuse OTLP tracing, Valkey/Redis cache, S3-compatible object storage, Lago billing, and Stripe checkout adapters.
- Opt-in local Compose profiles for PostgreSQL, Directus, Meilisearch, and Valkey. None starts as part of development, tests, or builds.

## Final architecture

```text
apps/web
  UI, routes, server actions, public delivery, account/admin compatibility façades
        |
        +--> packages/ui          shared accessible visual primitives
        +--> packages/kernel      provider-neutral ports and entitlements
        +--> packages/research    proprietary research policy
        +--> packages/aperture    proprietary government-demand intelligence
        +--> packages/database    schema contracts and ordered migrations
        +--> packages/shared      safe cross-runtime utilities and redaction

apps/worker
  durable workflow tasks, capability adapters, indexing and tracing
        |
        +--> external capabilities through explicit adapters

infrastructure
  opt-in local PostgreSQL / Directus / Meilisearch / Valkey profiles
```

PostgreSQL is the V2 application authority. Directus and Meilisearch are projections; Valkey is ephemeral coordination; object storage owns binary objects only. PocketBase proves identity, DeepTechly policy in PostgreSQL determines authorization, Trigger.dev owns durable execution, Crawl4AI owns acquisition mechanics, and Langfuse owns trace telemetry. DeepTechly code retains every decision about authorization, entity resolution, evidence authority, claims, confidence, synthesis, publication, and Aperture interpretation.

## Services used and activation state

| Capability | Current state | Safe default / authority |
|---|---|---|
| Next.js web | Implemented and production-built | Public and account delivery |
| Worker / Trigger.dev | Task and callback implemented; live project blocked | `local` workflow |
| Legacy Supabase artifacts | Migration/archive only | Never selected by runtime |
| PostgreSQL | Transactional runtime adapter and real-data rehearsal complete | Authoritative application store |
| PocketBase | Auth/token/recovery architecture complete; external service not provisioned | Sole V1 identity provider |
| Crawl4AI | Worker adapter only; endpoint/image contract blocked | Existing acquisition path |
| Directus | CRUD adapter/schema ready; deployment and roles blocked | Compatibility admin store |
| Meilisearch | Adapter/index policy ready; endpoint and initial index blocked | Complete local search |
| Langfuse | OTLP adapter ready; endpoint and retention approval blocked | Disabled when unconfigured |
| Valkey/Redis | Adapter ready; operational policy blocked | Cache/coordination only |
| S3-compatible storage | Adapter ready; bucket/security policy blocked | Existing image/object paths |
| Lago + Stripe | Adapters and ledgers ready; commercial configuration blocked | Existing verified-institutional flag |

## Legacy code preserved

- Legacy identity IDs, ownership mappings, publication relationships, research history, timestamps, and provenance preserved through migration ledgers and normalized PostgreSQL records.
- The current research pipeline, generation code, search-provider behavior, persistence snapshots, retry/watchdog semantics, and queue recovery behavior.
- Existing article/profile/dossier data contracts, rich compatibility snapshots, source provenance, public Markdown, and visual/image fallback behavior.
- The custom DeepTechly research-review console for source quality, claims, confidence, eligibility, and recovery decisions.
- Existing demonstration fixtures as a credential-free visual-review fallback. Placeholder URLs are filtered from public bibliographies and Markdown.
- The legacy npm lock is retained at `apps/web/package-lock.legacy.json` for dependency provenance.

Archived SQL and the legacy dependency lock remain for historical provenance only; they are not runtime inputs.

## Legacy behavior removed or replaced

No source files or production records were destructively deleted. Replacement work was structural and behavior-preserving:

- Direct queue-to-pipeline dispatch was replaced by a workflow port with the local implementation as default.
- PocketBase replaced the superseded Phase 23 identity adapter before production provisioning. The provider-neutral boundary and PostgreSQL account IDs remain stable.
- PostgreSQL roles now enforce `SUPER_ADMIN`, `ADMIN`, `USER`, and `VIEWER` policy at server boundaries.
- PostgreSQL replaced legacy profile, invite, saved-research, admin, research-store, and Redis/KV authority fallbacks.
- Discovery, newsroom, billing, caching, object storage, tracing, and acquisition now cross explicit adapter boundaries.
- Repetitive dossier lock panels were consolidated into one server-rendered gate; protected content remains absent from public HTML and Markdown.
- The public queue's internal workflow checklist and capacity diagnostics were replaced with user-facing status and recovery information.
- Broken or ambiguous shell navigation and artifact actions were replaced with stable, availability-aware routes.
- Patched vulnerable dependency versions replaced the earlier Next.js, PostCSS, and transitive WebSocket versions.

Temporary demo data was not removed because it remains necessary for safe credential-free review. It is not the production corpus and must be disabled or replaced during the approved PostgreSQL cutover.

## Migrations created

All migrations are additive, ordered, idempotent, isolated under the `deeptechly` schema, and verified offline. None has been applied to production.

| Migration | Purpose |
|---|---|
| `0001_v2_core.sql` | Accounts and external identities; access and invites; entities, research jobs/runs/events; sources, claims, evidence, contradictions; publication artifacts; patents, labs, technologies, taxonomy, saved research, provenance, and outbox records. |
| `0002_v2_aperture.sql` | Agencies, government documents/signals, problem statements, requirements, opportunity maps, evidence packs, and their evidence-backed relationships. |
| `0003_legacy_import_ledger.sql` | Immutable import, identity-map, finding, and reconciliation ledgers. |
| `0004_newsroom_metadata.sql` | Directus-ready editorial metadata and reviews. |
| `0005_billing_entitlements.sql` | Billing, subscription, usage, credit, and webhook ledgers. |
| `0006_legacy_relationships.sql` | Research-output and artifact-source relationships. |
| `0007_runtime_cutover.sql` | Phase 23 identity and PostgreSQL runtime indexes plus non-secret invite hints. |
| `0008_pocketbase_settings_control.sql` | PocketBase identity roles, preferences, system settings, AI/model controls, SMTP configuration, invitations, and auth audit. |

The preservation requirements and field-level cutover sequence are documented in `03_DATA_AND_SCHEMA_MIGRATION_RISKS.md` and `07_DATA_MIGRATION_PLAN.md`.

## Verification results

The final suite was rerun after upgrading the patched dependency set.

| Check | Result |
|---|---|
| `pnpm lint` | PASS, no lint errors or warnings |
| `pnpm typecheck` | PASS across the workspace |
| `pnpm test` | PASS, including all kernel, quality, orchestration, workflow, queue, admin, newsroom, search, Aperture, discovery, billing, hardening, load, auth, migration, and adapter verifiers |
| `pnpm build` | PASS, production Next.js 16.3.8 build and workspace builds |
| `pnpm audit --prod` | PASS, no known vulnerabilities |
| Production Playwright on isolated port 3019 | PASS, 21/21 scenarios |

Playwright covered 320, 375, 390, 430, 768, 1024, 1280, and 1440+ widths; provider-neutral identity pages; signed-out Settings gating; public pages and Markdown; navigation and keyboard behavior; 404s; callback failure behavior; security headers; and health output.

Golden-path verification covered an established defense company, an early-stage company, a NASA/government technology, a patent, an obscure entity, a government-demand signal, and the end-to-end verification/publication/discovery order. The load verifier exercised 204 jobs, 25 duplicate inputs, 40 deduplicated variants, and 90 admin records. Live Supabase load testing was deliberately skipped because `DEEPTECHLY_ALLOW_LIVE_LOAD_TEST` was not enabled.

## Production build

The verified production build uses Node.js 20.17 or newer, pnpm 10.34.5, Next.js 16.3.8, TypeScript 5.9.3, and the root `pnpm-lock.yaml`. The build does not start infrastructure, connect to a database, apply migrations, or require optional capability credentials.

## Environment variables

### Web, identity, and PostgreSQL runtime

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin and auth redirects. |
| `POCKETBASE_URL`, `POCKETBASE_AUTH_COLLECTION` | PocketBase endpoint and V1 auth collection. |
| `POCKETBASE_AUTH_COOKIE_NAME` | Optional HTTP-only auth-token cookie override. |
| `POCKETBASE_SUPERUSER_TOKEN` | Preferred server-only operator token for identity migration and administration. |
| `POCKETBASE_SUPERUSER_EMAIL`, `POCKETBASE_SUPERUSER_PASSWORD` | Optional operator-only fallback when no managed token is available. |
| `ADMIN_EMAILS` | Emergency bootstrap Super Admin allowlist; PostgreSQL roles are authoritative. |
| `DEEPTECHLY_BOOTSTRAP_ADMIN_EMAIL`, `DEEPTECHLY_BOOTSTRAP_ADMIN_TEMP_PASSWORD` | Explicit PocketBase/PostgreSQL Super Admin bootstrap command only. |
| `DEEPTECHLY_SETTINGS_ENCRYPTION_KEY` | Base64 32-byte server-only AES key for persisted SMTP and AI provider secrets. |
| `DEEPTECHLY_V2_DATABASE_URL` | Server-only authoritative PostgreSQL connection, never committed. |
| `DEEPTECHLY_V2_DATABASE_HOST`, `DEEPTECHLY_V2_DATABASE_PORT`, `DEEPTECHLY_V2_DATABASE_NAME`, `DEEPTECHLY_V2_DATABASE_USER`, `DEEPTECHLY_V2_DATABASE_PASSWORD` | Component form of the V2 connection for secret-managed deployments and isolated rehearsal. |
| `DEEPTECHLY_V2_DATABASE_SSL`, `DEEPTECHLY_V2_DATABASE_POOL_SIZE` | PostgreSQL transport and pool controls. |
| `RESEARCH_STAGE_DELAY_MS` | Compatibility pipeline pacing. |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_ENABLE_WEB_SEARCH` | Model and optional OpenAI web-search path. Missing key enables the documented demo path. |
| `SEARCH_PROVIDER`, `TAVILY_API_KEY` | Existing research acquisition search selection. |

### Provider selection and worker execution

| Variable | Purpose |
|---|---|
| `DEEPTECHLY_WORKFLOW_PROVIDER` | `local` default or `trigger`. |
| `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` | Trigger.dev project activation. |
| `TRIGGER_API_URL` | Optional self-hosted Trigger.dev API selection. |
| `DEEPTECHLY_INTERNAL_WEB_URL` | HTTPS origin reached by the worker task. |
| `DEEPTECHLY_WORKER_CALLBACK_SECRET` | Shared server-only worker callback secret. |
| `DEEPTECHLY_NEWSROOM_PROVIDER` | `compatibility` default or `directus`. |
| `DIRECTUS_BASE_URL`, `DIRECTUS_TOKEN`, `DIRECTUS_STUDIO_URL` | Directus server CRUD and optional browser-facing Studio link. |
| `DEEPTECHLY_SEARCH_PROVIDER` | `local` default or `meilisearch`. |
| `MEILISEARCH_BASE_URL`, `MEILISEARCH_API_KEY`, `MEILISEARCH_RESEARCH_INDEX`, `MEILISEARCH_TIMEOUT_MS` | Server-only discovery adapter configuration. |

### Worker capability adapters

| Variable | Purpose |
|---|---|
| `CRAWL4AI_BASE_URL`, `CRAWL4AI_TOKEN` or `CRAWL4AI_API_KEY`, `CRAWL4AI_HEALTH_PATH`, `CRAWL4AI_ACQUIRE_PATH`, `CRAWL4AI_TIMEOUT_MS` | Acquisition adapter. |
| `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_CAPTURE_CONTENT`, `LANGFUSE_TIMEOUT_MS` | OTLP trace export; prompt/content capture defaults off. |
| `VALKEY_URL` or `REDIS_URL`, `VALKEY_KEY_PREFIX` | Cache/coordination adapter. |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`, `S3_FORCE_PATH_STYLE` | S3-compatible object storage. |
| `LAGO_BASE_URL`, `LAGO_TOKEN` or `LAGO_API_KEY`, `LAGO_TIMEOUT_MS`, `LAGO_HEALTH_PATH` | Billing adapter. |
| `STRIPE_SECRET_KEY`, `STRIPE_BASE_URL`, `STRIPE_TIMEOUT_MS` | Checkout adapter. |

### Local infrastructure and test-only controls

`infrastructure/.env.infrastructure.example` defines the local-only PostgreSQL, Valkey, Meilisearch, and Directus image, port, password, secret, and admin variables. `BASE_URL` selects the Playwright target and `CI` controls retries/server reuse. The Phase 23 PostgreSQL rehearsal uses only an isolated local cluster and the ignored recovered backup.

Secrets must remain server-only. Do not prefix service-role, callback, model, search, Directus, billing, observability, storage, or provider credentials with `NEXT_PUBLIC_`.

## Local startup

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The web application starts public development surfaces without external credentials. Authentication and durable writes require PocketBase and PostgreSQL and fail closed when unconfigured. To run durable tasks separately after Trigger.dev configuration:

```sh
pnpm workflow:dev
```

Optional local infrastructure is started by an explicit profile, never by application startup:

```sh
cp infrastructure/.env.infrastructure.example infrastructure/.env
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml --profile core up -d
```

Available profiles are `core`, `coordination`, `discovery`, and `newsroom`. Replace every example secret and do not point these profiles at production data.

## Deployment notes

1. Provision managed PostgreSQL and PocketBase with TLS, backups, approved auth-collection rules, server-only operator credentials, and recovery/verification email delivery.
2. Apply migrations `0001`–`0008`, configure the Settings encryption key, import the final write-frozen export, and reconcile counts, checksums, identities, publications, and entitlements.
3. Dry-run then operator-approve PocketBase account mapping; canary all four roles, token refresh, ownership, settings permissions, queue persistence, saved research, public artifacts, Markdown, and Aperture before traffic activation.
4. Configure Trigger.dev and the authenticated callback only after the internal HTTPS route and shared secret exist. Keep local dispatch available during staged rollout.
5. Build Directus and Meilisearch only from reconciled PostgreSQL state. Neither may become an authority for research facts or publication decisions.
6. Review Langfuse sampling/retention before enabling it. Keep content capture off unless explicitly approved.
7. Activate Lago/Stripe only after plan, tax, refund, webhook signature, replay, and reconciliation policy is approved. Payment state must not directly unlock institutional content.
8. Remove or disable demonstration fixtures only after the reconciled production corpus provides equivalent public coverage.

## Known limitations

- External providers were verified with deterministic adapters, not live production calls.
- PocketBase lacks an approved external endpoint, auth collection/rules, operator credential, backups, and email templates; the identity architecture itself is complete.
- Active PocketBase tokens are stateless and cannot be enumerated as server-side sessions; the UI reports that limitation instead of inventing session data.
- PostgreSQL is the runtime authority when configured, but production still requires a managed target, final freeze export, backup/restore proof, and operator-approved activation.
- The real legacy dataset passes repeated PostgreSQL import, rendering, and transactional-write rehearsals.
- OpenAI credentials were absent during final verification, so generation tests used deterministic/demo behavior rather than a live model call.
- Automated Aperture ingestion remains candidate-only until acquisition, workflow, database, schedule, and editorial-review services are activated.
- Demonstration fixtures remain visible in credential-free development; they are not the production publication corpus.
- No live billing, checkout, trace, cache, object-store, CMS, or search service was exercised.

## External blockers

Production activation requires user-authorized accounts, credentials, endpoints, network and backup policy, service ownership, and approved data migration. The exact requirements for PocketBase, PostgreSQL, SMTP, Trigger.dev, Crawl4AI, Directus, Meilisearch, Langfuse, Valkey, S3, Lago, and Stripe are maintained in `BLOCKERS.md`. These blockers do not prevent credential-free public development mode from running; authenticated production operations intentionally fail closed until PocketBase and PostgreSQL are configured.

## Final Git state

- Implementation milestones: `f7411eb` through `f45546b`, one reviewed commit per phase.
- Final implementation commit: `f45546b` (`Validate DeepTechly V2 golden paths`).
- Final documentation commit: the commit containing this report.
- Target branch: `rebuild/deeptechly-v2` tracking `origin/rebuild/deeptechly-v2`.
- Expected handoff state after the report commit: clean worktree with zero commits ahead of or behind the remote.

Phase 24 replaced the unprovisioned Phase 23 identity choice with PocketBase, added PostgreSQL authorization and Settings control, and retained the completed PostgreSQL cutover. The next action is operator-managed PocketBase/PostgreSQL provisioning and canary activation, not a return to a legacy provider.
