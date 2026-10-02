# DeepTechly V2 Implementation Status

This file records stable implementation milestones after the architecture audit. It is updated as phases land; `FINAL_BUILD_REPORT.md` will supersede it at completion.

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
