# DeepTechly V2 Current Architecture Audit

Date: 2026-10-01

Branch: `rebuild/deeptechly-v2`

Scope: all 155 tracked files in the repository at audit time

## Executive summary

DeepTechly is currently a single Next.js 16 application. The web UI, HTTP routes, auth, research execution, persistence, publishing, and admin operations share one process and one source tree. The strongest assets are the DeepTechly-specific research rules: entity resolution and anchoring, source normalization and authority tiers, public-sector recognition, claim verification, synthesis schemas, publication eligibility, and artifact rendering. Those rules should become the proprietary `packages/research`, `packages/kernel`, and `packages/aperture` layer.

The principal V2 constraint is not the UI. It is the lack of durable boundaries. Research jobs are started with an in-process, unawaited promise; queue serialization is a `globalThis` promise; the watchdog only runs when requests or queue drains invoke it; persistence rewrites either one JSON document or an in-memory object; and Supabase is simultaneously the auth system, user store, saved-items store, and research database. These mechanisms are suitable compatibility paths during migration, but they are not durable multi-instance primitives.

The repository contains no current Aperture application or data model. Public-sector recognition is the only substantial Aperture precursor. Aperture should be introduced as a package and first-class web product area, not as a second app.

No production behavior, application code, schema, or infrastructure was changed during this audit.

## Current runtime topology

```text
Browser
  -> Next.js app router pages/components
  -> Next.js route handlers and server actions
      -> Supabase Auth + users_profile/invite_codes/saved_research_items
      -> research queue (process-local global promise)
          -> research pipeline (same web process)
              -> OpenAI web search or Tavily
              -> direct fetch + HTML/metadata extraction
              -> DeepTechly resolution/evidence/synthesis rules
              -> Supabase whole-store JSONB (preferred)
                 or Upstash/Vercel KV whole-store JSON
                 or process memory
      -> public-data merge of generated records + deterministic seed records
      -> article/profile/dossier HTML, Markdown, llms.txt, and sitemap
```

## System-wide findings

- Persistence has three implicit backends with different durability: Supabase blob, Redis/KV blob, and memory. The whole store is read-modify-written, so concurrent writers can lose updates.
- `supabase/research-persistence.sql` defines normalized tables, but the preferred runtime path still reads and writes `deeptechly_research_store`. The normalized tables are mirrored on writes, not used as the authoritative read model.
- Job execution is coupled to HTTP process lifetime. `void runResearchJob(...)` cannot guarantee completion on serverless termination, deployment, or process crash.
- Queue capacity checks and slot reservation are non-atomic across instances. `globalThis.__deeptechlyResearchQueueDrain` only serializes one JavaScript process.
- Retry, stall, entity-anchor, and partial-publication rules are valuable domain policy, even though their current trigger mechanism must change.
- Publication is modeled independently for profile, article, and dossier, but some admin operations change all three by slug. Preserve both artifact-level state and current bulk-action semantics.
- Seed entities are merged into production read paths and treated as published complete artifact sets. This is useful for deterministic demos/tests but must not remain hidden production truth in V2.
- Source authority is currently largely type/domain heuristic. The ordering and metadata are valuable; “official” must not be equated with independently corroborated evidence in the future model.
- There is no dedicated LLM trace, prompt version, evidence-to-claim relation, content revision, or workflow event table.

## Complete subsystem inventory

Each numbered record is mutually exclusive and has exactly one classification. Counts are derived from these 42 records.

### 1. Next.js application shell and routing — ADAPT

- **Current paths:** `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx`, `app/forbidden.tsx`, `next.config.mjs`, `proxy.ts`
- **Current purpose:** Root layout, global presentation, error surfaces, rewrites, and request middleware.
- **Dependencies:** Next.js, React, Tailwind, Lucide, Supabase session middleware.
- **Reason:** The web shell remains useful, but middleware and route placement are coupled to Supabase and the single-app layout.
- **Target V2 destination:** `apps/web/app/*`; reusable styling primitives in `packages/ui`; auth middleware behind a kernel/account port.
- **Migration risk:** Medium—auth redirects, caching, dynamic rendering, and `.md` rewrites can regress subtly.
- **Tests to preserve:** Build route manifest; Playwright not-found, responsive, and diagnostic-leak checks.
- **Data/schema dependency:** Session cookies and canonical public URL behavior.

### 2. Public marketing and informational pages — ADAPT

- **Current paths:** `app/page.tsx`, `app/pricing/page.tsx`, `app/methodology/page.tsx`, `app/api-access/page.tsx`, `app/sectors/page.tsx`
- **Current purpose:** Product entry points, positioning, methodology, pricing/API placeholders, and sector navigation.
- **Dependencies:** Page shell, home feed, research form, static copy.
- **Reason:** Product semantics survive, but links, availability claims, and data access must follow V2 modules; this audit does not authorize a redesign.
- **Target V2 destination:** `apps/web/app/*` with content/query ports from `packages/kernel`.
- **Migration risk:** Low to medium—SEO and navigation contracts are public.
- **Tests to preserve:** Playwright viewport matrix, header/footer, single-H1, keyboard navigation.
- **Data/schema dependency:** None beyond published-content query results.

### 3. Public discovery archives — ADAPT

- **Current paths:** `app/news/page.tsx`, `app/articles/page.tsx`, `app/startups/page.tsx`, `app/explore/page.tsx`, `app/patents/page.tsx`, `app/sector/[slug]/page.tsx`
- **Current purpose:** Browse published research by article, profile, patent, sector, and discovery views.
- **Dependencies:** `lib/research/public-data.ts`, story metadata, layout components.
- **Reason:** These are DeepTechly product surfaces, but their queries currently merge seed and blob-store records and will eventually use PostgreSQL/Meilisearch read models.
- **Target V2 destination:** `apps/web/app/*`; query contracts in `packages/kernel`; discovery adapter in `packages/database` and later Meilisearch infrastructure.
- **Migration risk:** High—visibility filtering or seed precedence mistakes can expose drafts or hide published work.
- **Tests to preserve:** Archive public-link tests, artifact discovery, publication filtering, responsive coverage.
- **Data/schema dependency:** Artifact status, sector/tags, publish timestamps, feature flags, story score inputs.

### 4. Article, profile, and dossier pages — ADAPT

- **Current paths:** `app/article/[slug]/page.tsx`, `app/startup/[slug]/page.tsx`, `app/dossier/[slug]/page.tsx`
- **Current purpose:** Render the three public research artifacts and gate institutional dossier sections.
- **Dependencies:** Public-data access, auth session, article/dossier components, seed fallbacks.
- **Reason:** The artifact experiences are core, but page code directly depends on current entity aggregates and Supabase session shape.
- **Target V2 destination:** `apps/web/app/*`; artifact view models in `packages/kernel`; render components in `packages/ui`.
- **Migration risk:** High—artifact-level publication, gating, canonical URLs, and incomplete records must remain correct.
- **Tests to preserve:** Published artifact matrix, signed-out dossier lock, 404 behavior, no internal diagnostics.
- **Data/schema dependency:** Full article/dossier payloads, access tier, per-artifact status, image attribution, citations.

### 5. Homepage research feed and signal modules — ADAPT

- **Current paths:** `components/home/*`, especially `HomeResearchFeed.tsx`, `LatestArticles.tsx`, `TechnologySignals.tsx`, `GovernmentSignals.tsx`, `PatentIntelligence.tsx`, `WhiteSpaceOpportunities.tsx`, `ResearchNewsstand.tsx`, `MyResearch.tsx`
- **Current purpose:** Homepage editorial feed, research cards, signal rails, patent/government/technology sections, and saved work.
- **Dependencies:** Public data, seed homepage data, saved-research API, story metadata.
- **Reason:** The surface and content concepts survive, but several modules are populated from fixed seed projections and must become explicit query models.
- **Target V2 destination:** `apps/web`; shared card/layout pieces in `packages/ui`; product projections in `packages/kernel` and `packages/aperture`.
- **Migration risk:** Medium—fallback behavior currently masks missing data.
- **Tests to preserve:** Homepage visual evidence, overflow, accessibility, and published-only links.
- **Data/schema dependency:** Story metadata, signal types, favorites/saves, publication eligibility.

### 6. Shared visual and layout component library — ADAPT

- **Current paths:** `components/layout/*`, `components/article/*`, `components/dossier/*`, `components/home/FallbackVisual.tsx`, `components/home/HomeSectionHeader.tsx`, `components/home/HomeTag.tsx`, `components/home/HomeWideContainer.tsx`
- **Current purpose:** Current visual system for navigation, cards, article structures, dossier tables, and fallbacks.
- **Dependencies:** React, Tailwind, Lucide, domain view types.
- **Reason:** Preserve current behavior and appearance, then decouple domain-heavy props from presentation. Do not redesign during extraction.
- **Target V2 destination:** `packages/ui` plus page composition in `apps/web`.
- **Migration risk:** Medium—large components encode institutional gating and domain-specific rendering assumptions.
- **Tests to preserve:** Playwright viewport/overflow, accessible names, image alt text, keyboard controls.
- **Data/schema dependency:** View-model field names for article sections, dossiers, sources, and confidence.

### 7. Core research and artifact contracts — KEEP

- **Current paths:** `lib/types.ts`, `lib/research/types.ts`
- **Current purpose:** Define entities, sources, claims, jobs, articles, dossiers, evidence metadata, and workflow stages.
- **Dependencies:** TypeScript only, with a small cross-import between domain files.
- **Reason:** These capture substantial DeepTechly vocabulary. They should be split into bounded contracts but retained as the compatibility contract during migration.
- **Target V2 destination:** `packages/kernel/src/contracts` and domain-specific types in `packages/research`; Aperture types added in `packages/aperture`.
- **Migration risk:** High—types currently mix domain state, UI feed fields, persistence fields, and orchestration telemetry.
- **Tests to preserve:** Compile-time contract tests and serializer fixtures for legacy records.
- **Data/schema dependency:** Every JSONB key and optionality rule in stored entities/jobs/articles/dossiers.

### 8. Entity resolution — KEEP

- **Current paths:** `lib/research/entity-resolution.ts`
- **Current purpose:** Classify input, normalize names/domains, create slugs, build candidates, score matches, and decide reuse versus creation.
- **Dependencies:** Entity/source contracts and source-quality metadata.
- **Reason:** This is explicitly proprietary DeepTechly capability and already mostly pure.
- **Target V2 destination:** `packages/research/src/entity-resolution`.
- **Migration risk:** High—identity mistakes cause duplicate or conflated entities and unstable URLs.
- **Tests to preserve:** `scripts/verify-entity-resolution.ts`, collision-safe slug and input classification cases.
- **Data/schema dependency:** Normalized name/domain, aliases, input type, confidence, resolution notes, canonical slug.

### 9. Requested-entity anchor guardrails — KEEP

- **Current paths:** `lib/research/entity-anchor.ts`
- **Current purpose:** Ensure generated content remains centered on the requested entity rather than a source publisher or similarly named entity.
- **Dependencies:** Entity normalization, source summaries.
- **Reason:** This is a DeepTechly-specific pre-publication safety invariant.
- **Target V2 destination:** `packages/research/src/entity-resolution/entity-anchor.ts`.
- **Migration risk:** High—removal can publish content about the wrong entity.
- **Tests to preserve:** Anchor mismatch, publisher confusion, alias and slug cases in quality verification.
- **Data/schema dependency:** Requested entity fields and failure diagnostics on research jobs.

### 10. Source quality, authority, and deduplication — KEEP

- **Current paths:** `lib/research/source-quality.ts`
- **Current purpose:** Normalize URLs, classify source families, rank authority, identify supported claim categories, and deduplicate evidence.
- **Dependencies:** Source types and public-sector recognition.
- **Reason:** The policy is core DeepTechly intellectual property even though acquisition providers will change.
- **Target V2 destination:** `packages/research/src/evidence/source-quality.ts`.
- **Migration risk:** High—ranking changes alter confidence and publication outcomes.
- **Tests to preserve:** URL normalization, tracking removal, classification, quality tier ordering, source mix, claim-support mapping.
- **Data/schema dependency:** Publisher, retrieval time, source type/category, quality tier, supported claims, normalized URL.

### 11. Government/public-sector recognition — KEEP

- **Current paths:** `lib/research/public-sector-recognition.ts`
- **Current purpose:** Detect agencies, patents, SBIR/STTR, government document types, source families, and confidence signals.
- **Dependencies:** Source contracts and heuristic dictionaries.
- **Reason:** This is the seed of Aperture's government-demand intelligence and belongs in the proprietary layer.
- **Target V2 destination:** `packages/aperture/src/evidence/public-sector-recognition.ts`, consumed by `packages/research` through a port.
- **Migration risk:** High—false positives can overstate government relevance.
- **Tests to preserve:** `scripts/verify-public-sector-recognition.ts` and mixed government/patent evidence cases.
- **Data/schema dependency:** Agencies, patent IDs, programs, document types, source families, confidence, and notes.

### 12. Evidence extraction and claim verification — ADAPT

- **Current paths:** `lib/research/extract.ts`
- **Current purpose:** Summarize fetched/search sources, extract entity facts and public-sector signals, then classify claims as confirmed, inferred, or unverified.
- **Dependencies:** Entity anchor, source quality, public-sector recognition, page/search contracts.
- **Reason:** The capability is proprietary, but current extraction is heuristic and treats source summaries as evidence without a first-class claim-evidence graph.
- **Target V2 destination:** `packages/research/src/evidence` and `packages/research/src/claims`.
- **Migration risk:** Critical—semantic drift changes every generated artifact and confidence score.
- **Tests to preserve:** Quality verifier fixtures for claim buckets, source attribution, and entity-bound extraction.
- **Data/schema dependency:** Source summaries, extracted fact fields, claim verification sets, evidence provenance.

### 13. Article/profile/dossier synthesis — ADAPT

- **Current paths:** `lib/research/generate.ts`
- **Current purpose:** Compute confidence, assemble fallback articles/dossiers, call OpenAI for structured text, and produce stored artifacts.
- **Dependencies:** OpenAI Responses API, source summaries, entity resolution, image results, story metadata, store publication rules.
- **Reason:** Synthesis structure is proprietary, but direct provider calls, prompt construction, fallback generation, and publication decisions are combined in one file.
- **Target V2 destination:** `packages/research/src/synthesis`; model provider port in `packages/kernel`; worker activities in `apps/worker`.
- **Migration risk:** Critical—prompt/output schema changes can silently corrupt publication quality.
- **Tests to preserve:** Demo-mode deterministic output, confidence bounds, source preservation, partial completion, artifact status, entity anchor validation.
- **Data/schema dependency:** Complete entity/article/dossier aggregate, prompt/model version (new), generation trace ID (new).

### 14. Research image resolution — ADAPT

- **Current paths:** `lib/research/image-resolution.ts`
- **Current purpose:** Resolve safe representative images from official/source metadata, favicons, Open Graph, Twitter, and page images.
- **Dependencies:** Direct fetch/HTML parsing, entity/source normalization.
- **Reason:** Selection and attribution rules are DeepTechly-specific, but fetching should use the acquisition/object-storage capability layer.
- **Target V2 destination:** Policy in `packages/research/src/media`; acquisition adapter in `infrastructure`; object references in `packages/database`.
- **Migration risk:** High—broken URLs, unsafe schemes, wrong-entity images, and lost attribution create public/copyright risk.
- **Tests to preserve:** Safe URL, same-host, entity mention, metadata priority, attribution, fallback diagnostics.
- **Data/schema dependency:** Hero URL, source URL, alt text, attribution, OG/logo/favicon candidates.

### 15. Markdown artifact serialization — KEEP

- **Current paths:** `lib/research/markdown.ts`
- **Current purpose:** Render article, startup profile, and dossier aggregates as Markdown with sources, confidence, and related pages.
- **Dependencies:** Research entity/source contracts.
- **Reason:** Markdown publishing is an explicit proprietary output capability and is provider-independent.
- **Target V2 destination:** `packages/research/src/publishing/markdown.ts`.
- **Migration risk:** Medium—consumer-facing paths and omission rules are public contracts.
- **Tests to preserve:** Snapshot/golden tests for all three artifact types and missing-field behavior.
- **Data/schema dependency:** Artifact fields, availability flags, source citations, confidence data.

### 16. Story metadata and analyst personas — KEEP

- **Current paths:** `lib/story-metadata.ts`
- **Current purpose:** Select DeepTechly analyst personas and normalize sector, stage, region, and card metadata.
- **Dependencies:** Entity, job, and article contracts.
- **Reason:** These are proprietary editorial taxonomy and presentation rules.
- **Target V2 destination:** `packages/research/src/editorial/story-metadata.ts`, with shared tags in `packages/shared` only if truly cross-domain.
- **Migration risk:** Medium—tagging/persona changes affect discovery and public bylines.
- **Tests to preserve:** Persona selection, taxonomy normalization, job/entity/article projection.
- **Data/schema dependency:** Author persona, sector/stage/region/entity-type tags, publish timestamps, favorites/features.

### 17. Publication eligibility and public read model — ADAPT

- **Current paths:** `lib/research/public-data.ts`, `lib/research/store.ts` functions `isPublishable`, `isCompletedResearchFeedEligible`, `savePublicResearchReady`, `saveResearchOutput`
- **Current purpose:** Decide publishability, support partial article/profile readiness, filter public data, score stories, and merge generated data with seeds.
- **Dependencies:** Store, seed entities, source count/confidence, artifact status, story metadata.
- **Reason:** Eligibility policy is proprietary; repository access, seed merge, and write mechanics must be separated.
- **Target V2 destination:** Policy in `packages/research/src/publishing`; read services in `packages/kernel`; repositories in `packages/database`.
- **Migration risk:** Critical—incorrect migration can publish drafts, suppress valid work, or make partial outputs inconsistent.
- **Tests to preserve:** Minimum source count, public-ready vs done, artifact-level visibility, partial output, seed compatibility during transition.
- **Data/schema dependency:** `publishedStatus`, per-artifact status/error, completion mode, ready/completed times, confidence/source count.

### 18. Web search and page acquisition adapter — REPLACE

- **Current paths:** `lib/research/search.ts`
- **Current purpose:** Use Tavily or OpenAI web search, directly fetch pages, strip HTML, and choose internal links/images.
- **Dependencies:** External provider APIs, global `fetch`, environment variables.
- **Reason:** Crawling/search acquisition is commodity capability. Preserve the `searchWeb`/`fetchReadablePage` contract while replacing implementation with Crawl4AI and later search/index adapters.
- **Target V2 destination:** `infrastructure/acquisition` implementing ports defined in `packages/kernel`; invoked by `apps/worker`.
- **Migration risk:** High—robots/network behavior, page readability, rate limits, and result ordering affect research quality.
- **Tests to preserve:** Provider error redaction, retryability, domain parsing, readable-page schema, internal-link selection.
- **Data/schema dependency:** Search events and immutable acquired-source metadata/content references.

### 19. Research pipeline coordination — ADAPT

- **Current paths:** `lib/research/pipeline.ts`
- **Current purpose:** Resolve entity/domain, plan searches, collect/read pages, fill gaps, verify claims, map relevance/readiness, synthesize outputs, validate anchors, and publish.
- **Dependencies:** Nearly every research module, store, queue, timers, provider env vars.
- **Reason:** The stage plan encodes DeepTechly know-how, but execution is monolithic, stateful, and tied to the web process.
- **Target V2 destination:** Workflow definition/activities in `apps/worker`; pure planning and stage policies in `packages/research`; ports in `packages/kernel`.
- **Migration risk:** Critical—the existing stage semantics, limits, partial publication, and failure diagnostics are observable product behavior.
- **Tests to preserve:** Full quality verifier, stage transitions, search/page limits, cancellation, entity mismatch, insufficient evidence, partial readiness.
- **Data/schema dependency:** Complete research job state, timestamps, diagnostics, search events, artifacts and link IDs.

### 20. Process-local queue runtime — REPLACE

- **Current paths:** `lib/research/queue.ts`
- **Current purpose:** Count active/queued jobs, serialize drains within a process, reserve slots, and start jobs fire-and-forget.
- **Dependencies:** Store, pipeline dynamic import, `globalThis`, concurrency constants.
- **Reason:** This is commodity orchestration and is unsafe across processes or serverless restarts. Trigger.dev should eventually own durable dispatch/concurrency.
- **Target V2 destination:** `apps/worker` plus Trigger.dev adapter in `infrastructure/workflows`.
- **Migration risk:** Critical—duplicate execution, lost work, and over-capacity execution are possible during cutover.
- **Tests to preserve:** FIFO ordering, global/user counts, concurrency maximum, single reservation, duplicate drain behavior.
- **Data/schema dependency:** Queued/active stages, creation order, workflow/external run ID (new), idempotency key.

### 21. Retry, timeout, lock, and failure policy — KEEP

- **Current paths:** `lib/research/orchestration.ts`, `lib/research/limits.ts`
- **Current purpose:** Normalize status, classify transient/permanent failures, calculate retry timing, detect stalls, form lock/fingerprint keys, sanitize errors, and drive safe retry state.
- **Dependencies:** Research job contracts and store mutation callbacks.
- **Reason:** The domain policy should survive even when durable workflow infrastructure enforces it. Separate pure decisions from mutations.
- **Target V2 destination:** `packages/research/src/workflow-policy`; Trigger.dev configuration consumes these decisions.
- **Migration risk:** High—double retries or differing attempt semantics can duplicate cost and publication.
- **Tests to preserve:** `scripts/verify-research-orchestration.ts`, timeout thresholds, retry caps, backoff, fingerprints, sanitized public errors.
- **Data/schema dependency:** Attempt/retry counts, next retry, heartbeat/stage/active timestamps, failure code/type/stage/internal message.

### 22. Request-driven watchdog runtime — REPLACE

- **Current paths:** `lib/research/watchdog.ts`
- **Current purpose:** Scan active jobs when invoked, mark timed-out/stalled work failed, and queue one automatic retry.
- **Dependencies:** Orchestration policy, whole-store job listing, queue dynamic import.
- **Reason:** Watchdog scheduling is commodity workflow infrastructure. Its current request-triggered execution is not durable.
- **Target V2 destination:** Trigger.dev schedules/workflow recovery in `apps/worker` and `infrastructure/workflows`.
- **Migration risk:** High—both old and new watchdogs running concurrently can race.
- **Tests to preserve:** Stale detection, one automatic retry, cancellation exclusion, timeout vs stalled diagnostics.
- **Data/schema dependency:** Heartbeats, lease/run IDs, retry/failure audit events.

### 23. Research persistence repository and whole-store backends — REPLACE

- **Current paths:** `lib/research/store.ts` persistence/read/write implementation
- **Current purpose:** Persist a single `ResearchStoreData` object to Supabase JSONB, Redis/KV, or memory; mirror normalized Supabase rows; mutate jobs/artifacts.
- **Dependencies:** Supabase REST, Upstash/Vercel KV REST, process memory, seed entities.
- **Reason:** Persistence mechanics are commodity and the whole-store rewrite pattern is unsafe. Keep repository behavior as a compatibility adapter while moving to transactional PostgreSQL repositories.
- **Target V2 destination:** `packages/database` repositories and migrations; compatibility reader during cutover.
- **Migration risk:** Critical—lost updates, ID mismatches, incomplete mirror rows, and dual-write divergence.
- **Tests to preserve:** Round-trip every legacy field, concurrent job updates, idempotent artifact upserts, cancel/remove, entity reuse, backend precedence.
- **Data/schema dependency:** Entire JSONB aggregate plus normalized IDs, URLs, search events, statuses, timestamps, and source relationships.

### 24. Deterministic seed entities and homepage fixtures — DELETE

- **Current paths:** `lib/data.ts`, `lib/seed-homepage.ts`
- **Current purpose:** Supply polished fake entities/articles/dossiers/signals and keep public pages/tests populated without persistence.
- **Dependencies:** Domain types and public-data merge logic.
- **Reason:** Seed-only logic must not remain a production read source. Preserve fixture values in test fixtures or explicit demo imports before eventual deletion; do not delete during current migration.
- **Target V2 destination:** `packages/research/test/fixtures` or a clearly opt-in development seed under `infrastructure/dev-seed`.
- **Migration risk:** High—removing too early empties archives and breaks deterministic visual tests.
- **Tests to preserve:** Replace implicit production fallback with explicit seeded test database/fixtures first.
- **Data/schema dependency:** None as production truth; preserve representative artifact shapes for compatibility tests.

### 25. Saved research service — ADAPT

- **Current paths:** `lib/saved-research.ts`, `app/api/saved-research/route.ts`, `app/dashboard/page.tsx`, `components/saved/SaveResearchButton.tsx`, `components/home/HomeSaveButton.tsx`
- **Current purpose:** Save/list/delete user-scoped research references and update save controls.
- **Dependencies:** Supabase admin client, auth session, `saved_research_items`.
- **Reason:** Saved research is product behavior, but service code is directly tied to Supabase and duplicates current content metadata.
- **Target V2 destination:** Service contract in `packages/kernel`; repository in `packages/database`; controls in `packages/ui`/`apps/web`.
- **Migration risk:** Medium—user ownership, uniqueness, and stale URLs/titles must be preserved.
- **Tests to preserve:** Auth scope, unique `(user,item)`, save/delete idempotency, signed-out behavior.
- **Data/schema dependency:** User ID, item ID/type, title/href, sector/entity, source, metadata, timestamps.

### 26. Supabase auth clients and session middleware — REPLACE

- **Current paths:** `lib/supabase/*`, `proxy.ts`, `lib/auth/session.ts`
- **Current purpose:** Build browser/server/admin/route Supabase clients, refresh cookies, expose user/profile session, and enforce server-side access.
- **Dependencies:** `@supabase/ssr`, `@supabase/supabase-js`, Next cookies/requests.
- **Reason:** Auth/account is commodity capability targeted for Appwrite. Supabase must remain until a compatibility migration is proven.
- **Target V2 destination:** Appwrite adapter in `infrastructure/auth`; account/session ports in `packages/kernel`; web middleware in `apps/web`.
- **Migration risk:** Critical—passwords cannot be copied naively; sessions, user IDs, reset flows, and service credentials change.
- **Tests to preserve:** Session refresh, signed-out access, admin checks, profile association, cookie behavior.
- **Data/schema dependency:** Supabase `auth.users` IDs and every foreign key referencing them.

### 27. Authentication routes and forms — REPLACE

- **Current paths:** `app/api/auth/*`, `app/sign-in/page.tsx`, `app/join/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/*`, `components/auth/*`
- **Current purpose:** Join with invite code, sign in/out, password reset/recovery, and password suggestion UI.
- **Dependencies:** Supabase Auth, invite code RPC, site URL, route cookies.
- **Reason:** Flow implementation belongs to the Appwrite auth capability. Preserve UX and contracts until cutover.
- **Target V2 destination:** `apps/web` account routes/components backed by the `packages/kernel` account port and Appwrite adapter.
- **Migration risk:** Critical—account takeover, redirect leakage, invite double-spend, and reset-session bugs.
- **Tests to preserve:** Invite redemption atomicity, redirect validation, recovery flow, generic error messaging, sign-out.
- **Data/schema dependency:** Auth identity, email, invite tier, profile creation, verification/access status.

### 28. Account profile domain and UI — ADAPT

- **Current paths:** `lib/auth/profiles.ts`, `app/api/account/profile/route.ts`, `app/account/page.tsx`, `components/account/ProfileSettings.tsx`
- **Current purpose:** Read/update profile, email change workflow, institutional status, and account/admin entry points.
- **Dependencies:** Supabase auth/admin clients, `users_profile`, session and site URL.
- **Reason:** DeepTechly account fields and access semantics survive; provider calls must move behind a port.
- **Target V2 destination:** `packages/kernel/src/accounts`, repository in `packages/database`, Appwrite identity adapter, UI in `apps/web`.
- **Migration risk:** High—identity/profile dual-write and editable/protected-field separation.
- **Tests to preserve:** Only full name/organization self-editable, email confirmation, protected access flags, ownership.
- **Data/schema dependency:** Auth user ID, email, organization, access tier, verification/pending flags, timestamps.

### 29. Invite-code and admin user management — REPLACE

- **Current paths:** `lib/admin/invite-codes.ts`, `lib/admin/users.ts`, `app/admin/invite-codes/*`, `app/admin/users/*`, `components/admin/CopyInviteCodeButton.tsx`, `scripts/bootstrap-admin.ts`
- **Current purpose:** Create/disable/redeem invite codes, bootstrap admins, list users, verify/revoke institutional access.
- **Dependencies:** Supabase service role/Auth Admin, `users_profile`, `invite_codes`, `ADMIN_EMAILS`.
- **Reason:** This is commodity identity/admin CRUD and should move to Appwrite plus Directus-administered records. DeepTechly access rules remain as policy in kernel.
- **Target V2 destination:** Appwrite/Directus adapters in `infrastructure`; access policy in `packages/kernel`; web links only where needed.
- **Migration risk:** Critical—admin authorization and invite redemption must remain atomic and auditable.
- **Tests to preserve:** `verify:admin-access`, admin email normalization, disabled/expired/max-use codes, verify/revoke behavior.
- **Data/schema dependency:** Invite code state and usage, access tier, verification/pending status, admin allowlist.

### 30. Admin content CRUD and pages — REPLACE

- **Current paths:** `lib/admin/content.ts`, `lib/admin/overview.ts`, `app/admin/page.tsx`, `app/admin/content/*`, `components/admin/AdminNavigation.tsx`, `AdminOverviewCharts.tsx`, `AdminToolsPanel.tsx`
- **Current purpose:** Dashboard metrics, list content/jobs, publish/unpublish/feature, and initiate recovery actions.
- **Dependencies:** Whole research store, queue/watchdog, session/admin-email authorization, Recharts.
- **Reason:** Internal newsroom/admin CRUD is targeted to Directus. Recovery commands must call workflow/domain services rather than mutate storage from a CMS.
- **Target V2 destination:** Directus in `infrastructure/admin`; thin operational actions in `apps/web` or `apps/worker`; policies in `packages/research`.
- **Migration risk:** High—Directus permissions must not bypass publication eligibility or retry rules.
- **Tests to preserve:** Admin authorization, publish state transitions, feature toggle, recovery action eligibility, dashboard counts.
- **Data/schema dependency:** Content status, feature flag, job recovery state, access roles, audit log (new).

### 31. Admin research review intelligence — KEEP

- **Current paths:** `lib/admin/research-review.ts`
- **Current purpose:** Produce review records, warnings, source evidence rows, failure summaries, and recommended admin actions.
- **Dependencies:** Research/artifact types, source quality, public-sector signals, orchestration error sanitization.
- **Reason:** This translates DeepTechly research state into editorial decisions and should power Directus views rather than be discarded.
- **Target V2 destination:** `packages/research/src/review` with Directus/read-model adapters.
- **Migration risk:** High—losing warnings or action constraints can enable unsafe publication.
- **Tests to preserve:** `verify:admin-review`, PII/diagnostic sanitation, evidence tiers, action recommendations, partial output.
- **Data/schema dependency:** Failure diagnostics, source metadata, artifact status, completion mode, public-sector signals.

### 32. Research HTTP API and queue UI — ADAPT

- **Current paths:** `app/api/research/route.ts`, `app/api/research/[jobId]/route.ts`, `app/research/*`, `components/research/ResearchSubmitForm.tsx`, `components/research/ResearchQueueClient.tsx`, `lib/research/display.ts`
- **Current purpose:** Submit/list/get/cancel/retry/remove jobs and show detailed queue/progress states.
- **Dependencies:** Auth session, store, queue, watchdog, orchestration, display mappings.
- **Reason:** Product behavior and stage language survive; endpoints must issue durable workflow commands and read query projections.
- **Target V2 destination:** Routes/UI in `apps/web`; application commands in `packages/kernel`; worker workflows in `apps/worker`.
- **Migration risk:** High—polling, ownership, retry/cancel semantics, and partial artifact links are user-visible.
- **Tests to preserve:** Multi-job UI, status/progress mapping, 401 handling, invalid job route, cancel/retry/remove, no internal failure leakage.
- **Data/schema dependency:** Job ownership, complete status/stage/telemetry, artifact URLs, public-safe errors.

### 33. Public JSON APIs — ADAPT

- **Current paths:** `app/api/articles/route.ts`, `app/api/entities/route.ts`, `app/api/startup/[slug]/route.ts`
- **Current purpose:** Return published article/entity/profile data.
- **Dependencies:** Public-data service and current aggregate shapes.
- **Reason:** APIs are product contracts but need versioned DTOs and repository-independent queries.
- **Target V2 destination:** `apps/web/app/api`; contracts in `packages/kernel`; later backed by database/search read models.
- **Migration risk:** Medium—unversioned shape changes can break consumers.
- **Tests to preserve:** Published-only filtering, 404s, response-schema contract tests, caching headers.
- **Data/schema dependency:** Public artifact DTO fields and canonical slugs.

### 34. Markdown and machine-readable routes — KEEP

- **Current paths:** `app/api/markdown/*`, `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts`, `app/sitemap.xml/route.ts`, `app/robots.txt/route.ts`, `lib/site.ts`, `.md` rewrites in `next.config.mjs`
- **Current purpose:** Publish markdown artifacts, AI-readable indexes, sitemap, and crawler policy.
- **Dependencies:** Markdown serializers, public-data queries, site URL.
- **Reason:** These are explicit DeepTechly publishing/discovery capabilities. Route adapters may move, but behavior should remain.
- **Target V2 destination:** Route handlers in `apps/web`; serializers and discovery assembly in `packages/research`/`packages/kernel`.
- **Migration risk:** High—draft leakage and URL breakage have SEO and data-distribution impact.
- **Tests to preserve:** Machine routes healthy/nonempty, invalid markdown 404, only eligible artifacts listed, canonical URLs.
- **Data/schema dependency:** Artifact availability, slugs, timestamps, citations, site URL.

### 35. Legacy whole-store Supabase schema — DELETE

- **Current paths:** `supabase/research-store.sql`
- **Current purpose:** Define one `deeptechly_research_store` row containing all research JSON arrays.
- **Dependencies:** Supabase/PostgreSQL service-role writes.
- **Reason:** The blob schema is architecture debt with contention and no relational integrity. Retain read compatibility and backup until migration validation; do not drop it during V2 build.
- **Target V2 destination:** No runtime destination; archived migration evidence after normalized cutover.
- **Migration risk:** Critical—premature removal destroys the authoritative current store.
- **Tests to preserve:** Blob-to-normalized import counts, checksums, field round-trip, rollback export.
- **Data/schema dependency:** Entire `data` JSON document and store key/table override.

### 36. Normalized research SQL and metadata patch — ADAPT

- **Current paths:** `supabase/research-persistence.sql`, `supabase/story-metadata.sql`
- **Current purpose:** Define normalized jobs/entities/articles/dossiers/sources tables and optional editorial metadata columns.
- **Dependencies:** PostgreSQL, Supabase auth/RLS roles, JSONB compatibility payloads.
- **Reason:** The domain tables are a useful starting map, but migrations are non-versioned scripts, foreign keys are incomplete, auth IDs are Supabase-bound, and evidence/claims/workflow events/Aperture are missing.
- **Target V2 destination:** Versioned PostgreSQL migrations in `packages/database`.
- **Migration risk:** Critical—runtime mirror rows may be partial and must not be assumed authoritative.
- **Tests to preserve:** Migration on empty and representative legacy data, constraints/indexes, artifact/source relations, rollback/backup drill.
- **Data/schema dependency:** All columns/JSONB compatibility fields; current generated UUID relationships.

### 37. Supabase account, invite, and saved-item SQL — REPLACE

- **Current paths:** `supabase/auth-users-profile.sql`, `supabase/user-profile-self-update.sql`, `supabase/saved-research.sql`
- **Current purpose:** Define profile/invite/saved tables, triggers, RLS policies, grants, and invite redemption RPC.
- **Dependencies:** Supabase `auth.users`, `auth.uid()`, Supabase roles.
- **Reason:** SQL implementation is provider-specific commodity infrastructure. Preserve business data and invariants while replacing auth integration.
- **Target V2 destination:** Account/content migrations in `packages/database`; Appwrite identity adapter; Directus configuration.
- **Migration risk:** Critical—foreign keys and RLS currently enforce ownership/security.
- **Tests to preserve:** Owner isolation, editable-column grants, cascade semantics, atomic invite redemption, unique saves.
- **Data/schema dependency:** All profile, invite, and saved-item rows plus original Supabase auth ID mapping.

### 38. Environment and provider configuration — ADAPT

- **Current paths:** `.env.example`, `lib/supabase/env.ts`, provider constants in `lib/research/search.ts`, `generate.ts`, `pipeline.ts`, `store.ts`, scripts
- **Current purpose:** Configure OpenAI/search, site URL, Supabase, Redis/KV, admin bootstrap, store table/key, delays, and load-test opt-in.
- **Dependencies:** Deployment environment and multiple direct `process.env` reads.
- **Reason:** Configuration remains necessary, but names/validation/ownership should be centralized per app and old variables supported through a deprecation window.
- **Target V2 destination:** Typed config in `apps/web`, `apps/worker`, and `infrastructure`; documented compatibility map.
- **Migration risk:** High—silent defaults select memory/demo paths and can hide misconfiguration.
- **Tests to preserve:** Config validation, secret/client separation, old-to-new mapping, production refusal of memory/demo modes.
- **Data/schema dependency:** See `03_DATA_AND_SCHEMA_MIGRATION_RISKS.md` for the complete variable inventory.

### 39. Verification and load harnesses — KEEP

- **Current paths:** `scripts/verify-entity-resolution.ts`, `verify-public-sector-recognition.ts`, `verify-research-quality.ts`, `verify-research-orchestration.ts`, `verify-admin-research-review.ts`, `verify-research-load.ts`, `verify-admin-access-management.ts`, `scripts/server-only-stub.cjs`
- **Current purpose:** Deterministically exercise research rules, orchestration, review, access management, and simulated load.
- **Dependencies:** Node assertions, TSX, module stubbing, current module paths.
- **Reason:** These are the primary characterization suite and must guard extraction before implementation changes.
- **Target V2 destination:** Tests colocated with `packages/research`, `packages/kernel`, and `packages/database`, with a small integration suite in `apps/worker`.
- **Migration risk:** Low for code, high if omitted—the rewrite would lose its behavioral oracle.
- **Tests to preserve:** All current cases and output counts; add CI execution.
- **Data/schema dependency:** Fixture shapes reflect legacy JSONB contracts.

### 40. Playwright public visual suite — KEEP

- **Current paths:** `tests/visual/public.spec.ts`, `playwright.config.ts`, `TESTING.md`
- **Current purpose:** Validate signed-out public routes, responsive overflow, artifact publication, machine routes, errors, gating, and keyboard access.
- **Dependencies:** Chromium, local Next server, deterministic public seed records.
- **Reason:** It captures the user-visible behavior explicitly required to remain unchanged.
- **Target V2 destination:** `apps/web/tests/e2e` or root `tests/e2e`, still run against the web app.
- **Migration risk:** Medium—current reliance on production seed fallbacks must be replaced with explicit fixtures.
- **Tests to preserve:** All nine tests; add authenticated/admin paths with safe test accounts later.
- **Data/schema dependency:** At least one explicitly seeded published profile/article/dossier set.

### 41. Link audit and repository/build tooling — ADAPT

- **Current paths:** `scripts/audit-links.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `next-env.d.ts`, `.gitignore`
- **Current purpose:** Build/lint/test scripts, dependencies, compiler/style configuration, and internal/external link checks.
- **Dependencies:** npm, Next.js, TypeScript, ESLint, Tailwind.
- **Reason:** Tooling remains, but V2 needs workspaces, per-package boundaries, worker commands, and CI-safe checks while retaining one lockfile.
- **Target V2 destination:** Root workspace config with `apps/*`, `packages/*`, and `infrastructure/*` package configs.
- **Migration risk:** Medium—path aliases, server-only boundaries, and build output can drift during move.
- **Tests to preserve:** Lint, typecheck, build, link audit, package boundary checks.
- **Data/schema dependency:** None.

### 42. Product/design source documents and static asset — KEEP

- **Current paths:** `00_PROJECT_BRIEF.md`, `01_DESIGN_SYSTEM_AND_LAYOUT.md`, `02_PAGE_ARCHITECTURE.md`, `03_RESEARCH_PIPELINE_AND_DATA_MODEL.md`, `04_COMPONENTS_AND_INTERACTIONS.md`, `05_CONTENT_TEMPLATES.md`, `public/og-image.jpg`
- **Current purpose:** Record product intent, design contracts, research model, interaction patterns, content templates, and social preview asset.
- **Dependencies:** Human process; some details reflect the current architecture.
- **Reason:** These are requirements and provenance, not runtime debt. Mark superseded passages explicitly rather than deleting history.
- **Target V2 destination:** Remain under repository docs/public; link to V2 decision records as architecture evolves.
- **Migration risk:** Low—risk is contradictory guidance, addressed with annotations.
- **Tests to preserve:** Link audit and public metadata/OG checks.
- **Data/schema dependency:** Documented content and field expectations inform compatibility tests.

## Current checks

Checks were run after `npm ci`, which restored the exact lockfile dependencies without changing tracked package files.

| Check | Result | Notes |
|---|---:|---|
| `npm run lint` | PASS | ESLint completed with no findings. |
| `./node_modules/.bin/tsc --noEmit` | PASS | No type errors. There is no dedicated `typecheck` package script. |
| `npm run build` | PASS | Next.js production build completed and generated 25 static pages. |
| `npm run verify:research-quality` | PASS | Entity resolution, public-sector recognition, and demo-mode quality passed. |
| `npm run verify:research-orchestration` | PASS | Retry/stall/orchestration verification passed. |
| `npm run verify:admin-review` | PASS | Review verification passed. |
| `npm run verify:admin-access` | PASS | Access-management verification passed. |
| `npm run verify:research-load` | PASS | 204 simulated jobs, 25 duplicate inputs, 40 deduped source variants, 90 review records; live Supabase smoke intentionally skipped. |
| `BASE_URL=http://localhost:3017 npm run test:visual` | PASS | 9/9 tests passed against a dedicated DeepTechly server. Port 3000 was occupied by an unrelated local application, so the default reuse-server run was invalid and is not a product failure. |

`npm ci` reported 10 dependency audit findings (2 low, 1 moderate, 6 high, 1 critical). They were not remediated because the task prohibits unrelated changes; dependency review belongs in a separate, scoped security task.
