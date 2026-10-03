# DeepTechly V2 Implementation Status

This file records stable implementation milestones after the architecture audit. It is updated as phases land; `FINAL_BUILD_REPORT.md` will supersede it at completion.

## Phase 24 — PocketBase identity and Settings control center

Status: complete in code and deterministic validation; external PocketBase/PostgreSQL provisioning and operator activation remain.

- Replaced the unprovisioned Appwrite adapter with provider-neutral PocketBase registration, sign-in, token refresh, sign-out, recovery, and verification flows.
- Added PostgreSQL-backed `SUPER_ADMIN`, `ADMIN`, `USER`, and `VIEWER` policy with server-boundary enforcement.
- Added the responsive thirteen-section Settings control center, encrypted AI/SMTP secrets, real service status, invitations, preferences, and authentication audit.
- Added migration `0008`, PocketBase migration/bootstrap tooling, and deterministic auth/role/settings/secret verification.
- Marked Phase 23 Appwrite choices as historical and documented production requirements in `26_POCKETBASE_AUTH_AND_SETTINGS_CONTROL_CENTER.md`.

## Phase 23 — Supabase exit and Appwrite/PostgreSQL cutover

Status: complete in code and isolated validation; external Appwrite/PostgreSQL credentials and operator activation remain.

- Removed active Supabase SDKs, clients, environment variables, provider selection, UI messages, and persistence fallbacks.
- Implemented Appwrite email/password registration, sign-in, HTTP-only sessions, server validation, sign-out, recovery, and account mapping.
- Made normalized PostgreSQL repositories authoritative for accounts, profiles, grants, invites, saved research, admin state, and transactional research persistence.
- Added operator-gated Appwrite account migration and Appwrite/PostgreSQL admin bootstrap tooling.
- Passed two clean real-data rehearsals with equivalent read, HTTP, reconciliation, and transactional-write reports.
- Documented the final runtime contract, external activation prerequisites, and provider-independent rollback in `25_SUPABASE_EXIT_AND_APPWRITE_POSTGRES_CUTOVER.md`.

## Phase 22 — Isolated PostgreSQL migration rehearsal

Status: complete against the recovered August 19, 2026 legacy Supabase cluster dump; no production cutover performed.

- Inventoried all eight DeepTechly application tables plus the minimum auth identity linkage from the real plain-text cluster dump.
- Added privacy-preserving dump parsing, redacted staging, transformation, identity mapping, reconciliation, reset, and two-run rehearsal tooling.
- Added migration `0006` to normalize research-job outputs and artifact-source relationships exposed by the real schema.
- Imported and reconciled 126 application rows plus 24 auth-planning rows into two fresh PostgreSQL 17.11 clusters with zero mismatches or orphans.
- Added an opt-in read-only V2 PostgreSQL store and validated real migrated data through 14 Markdown renders and 11 HTTP surfaces on both runs.
- Preserved Supabase/local as the default and documented the missing transactional write adapter as a production cutover blocker.
- Documented the complete map, rehearsal evidence, Appwrite identity choices, production prerequisites, sequencing, and rollback in `22_POSTGRESQL_MIGRATION_MAP.md` through `24_PRODUCTION_CUTOVER_RUNBOOK.md`.

## Phase 0 — Architecture audit

Status: complete in commit `f7411eb`.

## Phase 1 — Repository/workspace foundation

Status: implemented and validated; commit recorded in Git history after this document lands.

- Converted the repository to a pnpm workspace with a root lockfile.
- Moved the working Next.js product intact to `apps/web`.
- Added `apps/worker` as the durable-workflow process boundary without installing a workflow provider.
- Added compile-safe `ui`, `kernel`, `database`, `research`, `aperture`, and `shared` packages.
- Added initial provider-neutral identity, workflow, search, acquisition, and model interfaces in `packages/kernel`.
- Preserved the npm lock as `apps/web/package-lock.legacy.json` for dependency provenance.
- Preserved Supabase SQL and compatibility behavior unchanged.
- Updated verification scripts and Playwright configuration for workspace paths.

Validation baseline:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `BASE_URL=http://localhost:3017 pnpm test:visual` — 9/9 passed against a dedicated DeepTechly server because port 3000 was occupied by another local project.

## Phase 2 — Shared DeepTechly design system

Status: implemented and validated; commit recorded in Git history after this document lands.

- Added a shadcn/ui-compatible New York configuration and the minimal Radix/CVA composition dependencies.
- Defined semantic color, focus, border, shadow, typography, and reduced-motion tokens without changing the established orange/black/warm-paper identity.
- Added reusable square-cornered `Button`, `Badge`, `Panel`, `Input`, `Progress`, evidence metadata, confidence, and editorial section-heading primitives in `@deeptechly/ui`.
- Kept 44px minimum interactive targets, visible keyboard focus, semantic progress state, and reduced-motion behavior in the shared foundation.
- Added Framer Motion as the approved motion layer; no page motion was introduced in this phase.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `BASE_URL=http://127.0.0.1:3017 pnpm test:visual` — 9/9 passed across the existing required viewport matrix.

## Phase 3 — Global shell, navigation, and footer

Status: implemented and validated; commit recorded in Git history after this document lands.

- Rebuilt the primary shell around the target `NEWS / EXPLORE / APERTURE / RESEARCH / SIGN IN / JOIN` information architecture.
- Added a no-JavaScript mobile disclosure menu, consistent authenticated account controls, semantic navigation labels, and a keyboard-visible skip link.
- Reduced the sector row to major sectors with a deliberate `MORE +` route instead of overcrowding the header.
- Added the DeepTechly brand statement and improved AI-readable discovery links in the footer.
- Added a stable Aperture entry route so the primary navigation does not point to an unfinished 404; deeper Aperture surfaces remain scheduled for Phases 16–17.
- Added Playwright coverage for the Aperture shell route, skip navigation, mobile menu, and all primary destinations.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Responsive Playwright matrix at 320, 375, 390, 430, 768, 1024, 1440, 1728, and 1920 pixels.

## Phase 4 — Homepage rebuild

Status: implemented and validated; commit recorded in Git history after this document lands.

- Preserved and refined the working editorial homepage instead of replacing its production-aware feed assembly.
- Completed the required hierarchy: research hero, Today’s Edition, Top Stories, Also Reading, Recent Research, Your/My Research, Intelligence, Research Newsstand, Browse by Sector, and the global brand statement.
- Added a formal Intelligence introduction spanning technology, government, patent, and white-space signals.
- Clarified the hero output promise as profile, article, and institutional dossier without implying unsupported investor conclusions.
- Integrated the shared V2 UI package on the public homepage and improved evidence-first labeling.
- Raised all interactive homepage controls to at least 44px and added an announced form-error state.
- Added browser assertions for the complete editorial hierarchy, source counts, and confidence context.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Responsive Playwright matrix including homepage screenshots at mobile and desktop sizes.

## Phase 5 — Premium article experience

Status: implemented and validated; commit recorded in Git history after this document lands.

- Preserved the existing evidence-backed article contract and its omission behavior rather than inventing new content fields.
- Added entity context to breadcrumbs, distinct published/updated metadata, an editorial serif headline, and direct public markdown access.
- Added a sticky desktop report index generated from the article’s actual sections, plus anchors for open questions, evidence quality, and sources.
- Kept the readable 760px body measure while widening only the desktop frame needed for the report index.
- Exposed source-to-claim support counts when provenance data is present.
- Corrected footer artifact availability logic so profile and dossier actions render independently and never rely on the wrong availability flag.
- Added browser coverage for article navigation, research snapshot, evidence quality, bibliography, related artifacts, and markdown output.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Responsive Playwright rendering for the article at 320, 390, 768, 1440, and 1920 pixels.

## Phase 6 — Public research profile experience

Status: implemented and validated; commit recorded in Git history after this document lands.

- Upgraded the public profile masthead into an institutional research-file layout with a stable profile identifier, source count, confidence, update state, taxonomy, and technical visual.
- Added resilient image fallback treatment and retained attribution when available.
- Added direct public profile markdown access alongside availability-aware article and dossier actions.
- Preserved the existing overview, technical summary, market position, competitive landscape, key signals, open questions, evidence, sources, and confidence sections.
- Continued to omit unavailable optional facts through the existing public-value checks and explicit unconfirmed states.
- Applied editorial typography to shared profile/dossier section frames and added browser coverage for the full profile fact-sheet hierarchy.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Responsive Playwright rendering for the profile at 320, 390, 768, 1440, and 1920 pixels.

## Phase 7 — Institutional dossier experience

Status: implemented and validated; commit recorded in Git history after this document lands.

- Added a sticky desktop dossier index and stable anchors across the public research layer.
- Added existing taxonomy, positioning, and opportunity modules to the public dossier without synthesizing new facts.
- Replaced the non-functional save icon with the working saved-research control.
- Added availability-aware profile/article actions and an explicit public markdown action in the masthead.
- Consolidated fifteen repetitive signed-out lock panels into one server-rendered institutional gate; verified accounts still receive the complete institutional section set.
- Preserved server-side entitlement evaluation and verified that locked analysis is absent from public HTML and public markdown.
- Filtered placeholder `example.com` links from the public external-link rail while retaining verified HTTP(S) links.
- Added browser coverage for dossier hierarchy, the index, single-gate behavior, placeholder-link filtering, and public markdown safety.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Responsive Playwright rendering and signed-out gating checks for the dossier at 320, 390, 768, 1440, and 1920 pixels.

## Phase 8 — Authentication/account abstraction

Status: implemented as a non-breaking migration boundary; Appwrite activation is externally blocked and documented.

- Expanded the kernel identity port to cover session reads, registration, sign-in, sign-out, password recovery, verified email state, and provider-neutral failure outcomes.
- Routed join, sign-in, sign-out, password-reset requests, and server session reads through provider adapters.
- Preserved Supabase as the default compatibility provider, including its existing cookie behavior and production account flow.
- Added a fail-closed Appwrite adapter boundary without installing an SDK or pretending unconfigured authentication works.
- Kept profiles, institutional entitlements, invite codes, browser reset exchange, and account email changes as explicit Supabase compatibility islands pending the data/import phase.
- Documented environment variables, identity mapping invariants, cutover prerequisites, rollback requirements, and the external Appwrite blocker.
- Added a verification script proving default, explicit Appwrite, and unsupported-provider selection behavior.

Validation:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` including `verify:auth-adapters`
- `pnpm build`
- Existing signed-out/auth-adjacent Playwright regression suite.

## Phase 9 — PostgreSQL/data layer cleanup and migration

Status: implemented as additive schema and offline migration controls; no live database was changed.

- Added an ordered, idempotent PostgreSQL migration ledger under `packages/database/migrations` using an isolated `deeptechly` schema.
- Added stable internal accounts with provider identity mappings so Supabase and future Appwrite identities can coexist during migration.
- Normalized research jobs/runs/events, sources, claims, evidence, contradictions, publishing, patents, labs, technologies, taxonomy, saved research, provenance, and transactional outbox domains.
- Added first-class Aperture data domains that reuse core evidence instead of duplicating it.
- Kept lossless compatibility snapshots for rich legacy aggregates while separating public and institutional dossier content.
- Added immutable legacy import, identity-map, finding, and reconciliation ledgers plus a field-level migration runbook.
- Added offline migration verification to the standard test suite. No script connects to `DATABASE_URL` or applies SQL automatically.

## Phase 10 — DeepTechly proprietary kernel extraction

Status: implemented as a behavior-preserving package boundary.

- Extracted production-used entity identity, source policy, confidence, publication eligibility, research limits, workflow-state, retry, and error-redaction rules into `@deeptechly/research`.
- Kept provider and framework dependencies outside the package; it has no runtime dependency on Next.js, Supabase, UI, or environment variables.
- Retained existing web module exports as compatibility façades while routing policy decisions through the shared package.
- Added direct kernel verification and kept the existing research quality/orchestration suites as compatibility regression coverage.
- Documented ownership, invariants, and intentionally deferred stateful/provider-bound modules in `08_RESEARCH_KERNEL.md`.

## Phase 11 — Open-source capability integrations

Status: adapter foundation implemented; external services remain opt-in and unconfigured.

- Added provider-neutral source acquisition, search index, newsroom, trace, cache, object-store, and health ports.
- Added bounded worker adapters for Crawl4AI, Directus, and Meilisearch with explicit configuration and no web-runtime coupling.
- Added opt-in local Compose profiles for PostgreSQL, Directus, Meilisearch, and Valkey; no service starts during application development or tests.
- Kept source evaluation, confidence, publication, and research truth in DeepTechly code and PostgreSQL boundaries.
- Documented why Trigger.dev and Langfuse should use their maintained upstream deployment stacks rather than copied partial configurations.
- Added deterministic adapter verification; no external endpoint was contacted.

## Phase 12 — Durable research orchestration

Status: Trigger.dev task and dispatch cutover implemented behind an explicit provider flag; live activation is externally blocked.

- Added a canonical deterministic research stage plan in `@deeptechly/research`.
- Replaced direct queue-to-pipeline coupling with the kernel workflow dispatcher and preserved `local` as the compatibility default.
- Added a pinned Trigger.dev v4 task with idempotency, concurrency, timeout, retry, and external run tracking.
- Added an authenticated internal execution callback that revalidates persisted job/query/fingerprint state and converts transient pipeline failures into bounded durable retries.
- Connected user cancellation to persisted cancellation and external Trigger run cancellation.
- Added direct durable-workflow verification and documented activation, security, and incremental-migration limitations.

## Phase 13 — Research queue

Status: implemented as a user-facing single stack with existing persistence and workflow behavior preserved.

- Replaced separate status panels and the full internal-looking workflow checklist with one ordered queue and a compact completed/current/next summary.
- Kept active work first, waiting work in submission order, completed work below it, and unsuccessful requests last.
- Added clear elapsed and completion timing, source/confidence context, readiness icons, progress, and direct article/profile/dossier actions.
- Removed capacity diagnostics and developer-oriented copy from the public experience while retaining cancellation, bounded retry, saved research, polling, and notifications.
- Clarified that research continues after navigation and persisted queue state refreshes when the user returns.
- Added a deterministic queue UI verification to the standard test suite.

## Phase 14 — Directus newsroom/admin integration

Status: provider boundary and schema are implemented; live activation is externally blocked and remains opt-in.

- Expanded the provider-neutral newsroom contract and Directus REST adapter from read-only access to bounded create/update CRUD.
- Preserved the custom DeepTechly content console for source quality, claim audit, confidence, publication eligibility, and recovery decisions.
- Added additive PostgreSQL editorial metadata and review tables suitable for Directus collection registration.
- Added a fail-closed `compatibility` / `directus` newsroom selector and an admin-only Data Studio link that never exposes the server token.
- Documented collection ownership, least-privilege requirements, staged cutover, and why Directus does not own research truth.
- Kept compatibility persistence as the default, so current production behavior is unchanged.

## Phase 15 — Search and discovery

Status: complete with deterministic local search; Meilisearch acceleration is implemented but opt-in and externally blocked.

- Rebuilt Explore as a unified editorial search/archive with shareable queries, type filters, evidence metadata, and responsive results.
- Added a public-only search document policy for articles, profiles, and deduplicated patent evidence, ready for Aperture/lab/technology kinds.
- Added a bounded `/api/search` contract for machine-readable public discovery.
- Added a server-side Meilisearch query path that reconciles every hit against current public artifacts and degrades to local search when unavailable.
- Extended the search-index port and Meilisearch adapter with settings configuration, plus a worker synchronization utility that rejects non-public documents.
- Added unit/integration and responsive browser coverage while leaving local search as the production-safe default.

## Phase 16 — Aperture UI foundation

Status: complete as an evidence-safe public product surface; Phase 17 will connect intelligence workflows and persistence.

- Added the complete Aperture landing, signals, problems, opportunities, agencies, evidence, methodology, detail, and Markdown route family.
- Added a dedicated Aperture sub-navigation and an institutional editorial visual system consistent with DeepTechly.
- Added provider-neutral agency, signal, problem, opportunity, source, confidence, and publication contracts in `@deeptechly/aperture`.
- Built evidence-first detail templates with source bibliography, confidence, requirement maps, repeated demand, matches, and omission of unknown optional sections.
- Enforced public publication/source thresholds and 404 behavior for missing or unpublished HTML and Markdown artifacts.
- Deliberately published no fake government findings; archive empty states explain the evidence threshold until Phase 17 supplies reviewed records.
- Connected eligible Aperture records to the unified Explore document builder and added deterministic/unit plus responsive browser coverage.

## Phase 17 — Aperture intelligence and workflows

Status: proprietary analysis kernel, durable task, and first evidence-backed public artifact family implemented; live automated ingestion/persistence remains externally blocked.

- Added deterministic agency-ask, problem, requirement, repeated-demand, evidence-pack, capability-match, confidence, and publication-eligibility modules to `@deeptechly/aperture`.
- Preserved provenance on extracted statements and required supporting evidence before any company/patent/lab/technology match can be emitted.
- Added a bounded Trigger.dev Aperture task with concurrency, retry, duration, document-size, source-count, target-count, and HTTPS controls.
- Kept workflow output in candidate state; publication still requires review and does not happen automatically.
- Published one curated DoD Replicator intelligence family from five official DoD/DIU/DIB sources, with explicit limits on vendor and procurement inference.
- Added a public evidence pack, agency page, problem statement, opportunity map, signal brief, Markdown, and unified Explore indexing.
- Added deterministic intelligence verification and expanded browser coverage to the evidence-backed artifacts.

## Phase 18 — Archives, Explore, Markdown, SEO, and AI-readable routes

Status: complete with publication-safe discovery and no gated-content leakage.

- Completed stable patent source-brief HTML and Markdown routes without converting generic search sources into unsupported patent ownership claims.
- Routed patent results through internal evidence briefs and retained direct original-source plus related-profile links.
- Expanded the sitemap across public patent, Aperture, agency, archive, and Markdown routes.
- Expanded `llms.txt`, `llms-full.txt`, API access guidance, and robots policy for patent and government-demand intelligence.
- Added canonical metadata and citation-bearing JSON-LD to articles, profiles, dossiers, patent briefs, and Aperture briefs.
- Preserved one publication-filtered data path for HTML, Markdown, local search, optional Meilisearch, and sitemap output.
- Added deterministic public-discovery checks and end-to-end browser coverage for patent and Aperture machine-readable discovery.

## Phase 19 — Billing and entitlements foundation

Status: adapter and ledger foundation complete; commercial activation is externally blocked and current access behavior is unchanged.

- Added one explicit capability resolver for public reading, account research/saving, and institutional DeepTechly/Aperture access.
- Routed the existing server-side dossier gate through the resolver while retaining verified profile state as the compatibility authority.
- Added provider-neutral billing-meter and hosted-checkout contracts plus bounded Lago and Stripe adapters.
- Added additive customer, subscription, credit-ledger, usage-event, and webhook-inbox schema with idempotency and audit state.
- Prevented provider state or a Checkout redirect from becoming authorization; only a verified PostgreSQL access grant may unlock gated research.
- Kept adapters disabled by default, installed no billing infrastructure, selected no final pricing, and contacted no live service.
- Added deterministic entitlement, adapter-payload, configuration, credential-isolation, and migration verification.

## Phase 20 — System hardening

Status: complete for repository-owned controls; external service activation remains isolated.

- Added public security headers, disabled framework fingerprinting, and exposed only a minimal no-store liveness endpoint.
- Bounded the private durable-workflow callback by declared payload size and field length while retaining fail-closed authorization.
- Added supported Langfuse v4 OTLP tracing for workflow roots, research stages, LLM model/latency/token/error metadata, and explicit content-capture opt-in.
- Added recursive secret/PII redaction, cycle/depth/string/payload bounds, and fail-open observability behavior.
- Implemented lazy Valkey/Redis cache and S3-compatible private object-store adapters behind existing kernel ports.
- Added cache key/TTL constraints, object-key validation, server-side encryption, and one-hour signed-read limits.
- Added deterministic hardening checks and live browser assertions for headers and health-data minimization.

## Phase 21 — Golden-path validation

Status: repository-owned V2 scope complete; live external cutovers are explicitly blocked on credentials, infrastructure, and authorized data migration.

- Added a seven-case golden-path matrix covering established and early-stage companies, NASA technology identity, patents, obscure entities, government demand, and the verification-to-discovery chain.
- Proved identity anchoring, official-domain normalization, confidence degradation, publication withholding, patent/government claim boundaries, source provenance, workflow ordering, search, and public Markdown policy.
- Re-ran all deterministic, migration, load, security, adapter, production-build, and responsive Playwright checks.
- Upgraded the vulnerable Next.js/PostCSS/WebSocket graph to patched compatible releases and finished with a clean production dependency audit.
- Preserved the no-credential compatibility path and documented the inherited demonstration corpus as non-production data pending reconciled PostgreSQL cutover.
- Consolidated architecture, operations, environment, deployment, limitations, blockers, and test evidence in `FINAL_BUILD_REPORT.md`.
