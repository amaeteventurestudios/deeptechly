# Tests to Preserve for DeepTechly V2

## Current executable baseline

| Command | Audit result | Behavioral scope |
|---|---:|---|
| `npm run lint` | PASS | Repository lint rules. |
| `./node_modules/.bin/tsc --noEmit` | PASS | TypeScript contracts. |
| `npm run build` | PASS | Next.js route compilation and static generation. |
| `npm run verify:research-quality` | PASS | Entity resolution, public-sector recognition, evidence quality, generation/publication behavior. |
| `npm run verify:research-orchestration` | PASS | Retry/stall/locking/status policy. |
| `npm run verify:admin-review` | PASS | Editorial review projections and safe diagnostics. |
| `npm run verify:admin-access` | PASS | Invite/admin/user access behavior. |
| `npm run verify:research-load` | PASS | 204-job simulation, duplicate input handling, source dedupe, review projections. |
| `BASE_URL=http://localhost:3017 npm run test:visual` | PASS (9/9) | Signed-out public UX, publication, machine routes, error handling, gating, responsive/accessibility smoke. |

The load verifier skipped its live Supabase smoke because `DEEPTECHLY_ALLOW_LIVE_LOAD_TEST` was not `true`; this is correct for a non-destructive audit. The first default Playwright attempt attached to an unrelated application already listening on port 3000. It was rerun successfully against a dedicated DeepTechly server and should not be recorded as a DeepTechly failure.

`package.json` has no explicit `typecheck` or general `test` script. V2 should add stable root commands for both and run all characterization suites in CI.

## Preserve before moving code

### Entity identity

Source today: `scripts/verify-entity-resolution.ts`, quality verification.

Preserve and expand:

- Input classification for company, domain, patent, lab, government program, technology, and unknown.
- Name/domain normalization and suffix handling.
- Canonical and collision-safe slugs.
- Alias/domain/type/source-quality candidate scoring.
- Reuse versus create-new thresholds.
- Requested-entity anchoring, including publisher-name contamination.
- Stable identity across repeated and differently formatted input.
- Conflicting authoritative domains and similarly named entities.

Acceptance criterion: the package extraction produces byte-for-byte equivalent normalized identity metadata for the current fixtures.

### Source authority and evidence

Source today: `scripts/verify-research-quality.ts`, `verify-public-sector-recognition.ts`, `verify-research-load.ts`.

Preserve and expand:

- URL normalization, HTTPS/host cleanup, tracking-parameter removal, and deduplication.
- Source classification and exact authority-tier ordering.
- `supportsClaims` mapping and source mix counts.
- Agency, patent, program, SBIR/STTR, tech-transfer, and government document recognition.
- Extraction remains anchored to the requested entity.
- Claim buckets: confirmed, inferred, unverified.
- Evidence provenance survives serialization and database round-trip.
- Contradictory sources are retained and surfaced rather than overwritten (new V2 invariant).

Acceptance criterion: source order, normalized URLs, source mix, and claim verification remain equivalent on legacy fixtures; new evidence IDs/content hashes are additive.

### Confidence and publication eligibility

Source today: quality verifier, admin review verifier, public Playwright suite.

Preserve and expand:

- Confidence score bounds and label thresholds.
- Minimum three-source publication rule.
- Reliable-source mix effects.
- Profile, article, and dossier statuses remain independently representable.
- `public_research_ready` partial output remains visible when allowed while dossier finalization continues.
- A failed job with usable partial artifacts is not treated like a total failure.
- Entity-anchor mismatch and insufficient-source work cannot publish.
- Draft/unpublished records never enter public APIs, archives, Markdown, llms files, sitemap, or search index.
- Admin bulk publish/unpublish behavior remains explicit and tested separately from eligibility.

Acceptance criterion: public artifact availability matches the current implementation for a compatibility fixture set, with no draft leakage.

### Orchestration, retries, and cancellation

Source today: `scripts/verify-research-orchestration.ts`, `verify-research-load.ts`.

Preserve and expand:

- Status normalization and active/terminal sets.
- Stage-specific timeout and worker-heartbeat stall detection.
- Maximum attempts, manual retries, and one automatic watchdog retry.
- Retry backoff/next-retry eligibility.
- Permanent versus transient failure classification.
- Lock key/input fingerprint stability.
- Public-safe error text versus internal diagnostics.
- FIFO queue and maximum three active jobs.
- Cancellation prevents retry and publication.
- New V2 tests: activity idempotency, duplicate delivery, workflow replay, crash/restart, concurrency across two workers, and old/new dispatcher fencing.

Acceptance criterion: Trigger.dev adoption changes durability, not user-visible stage/retry/cancel semantics, and duplicate deliveries create no duplicate artifacts or charges.

### Article, profile, dossier, and Markdown synthesis

Source today: quality verifier, Playwright suite; no dedicated golden serializer suite exists.

Add before refactoring:

- Golden JSON fixtures for a full, partial, limited-data, and failed research output.
- Golden Markdown for article/profile/dossier.
- Required headings, citation order, related links, confidence section, and omission behavior.
- Structured article/dossier database round-trip.
- Prompt input and structured output schema contract without asserting nondeterministic prose.
- Model/provider failure falls back or fails according to current policy.
- Prompt, model, and methodology version recorded on new runs.

Acceptance criterion: old artifacts render unchanged and new artifacts satisfy the same structural contract.

### Image resolution

No dedicated executable script exists; add unit fixtures before extraction:

- Reject unsafe/non-HTTP URLs.
- Resolve relative metadata URLs.
- Prefer target-relevant official/source images.
- Avoid publisher branding centered on the wrong entity.
- Preserve original source URL, alt text, and attribution.
- Deterministic fallback to OG/Twitter/page image/logo/favicon.
- Remote failure never prevents research publication unless policy explicitly requires it.

### Admin review and access

Source today: `verify:admin-review`, `verify:admin-access`.

Preserve and expand:

- Review warnings for low quality, entity mismatch, failures, and partial artifacts.
- Recommended actions are allowed only for valid job states.
- Internal errors are sanitized before display.
- Admin emails are normalized and authorization enforced server-side.
- Invite disabled/expired/max-use behavior and atomic redemption.
- Verification/revocation updates access state without altering unrelated profile fields.
- New Directus tests: role matrix, audit actor, forbidden field writes, and domain-command enforcement.

### Authentication and account migration

Coverage is currently incomplete; add integration tests before Appwrite work:

- Sign in/out and session refresh.
- Join with valid/invalid/exhausted invite code.
- Forgot/reset password without account enumeration.
- Redirect allowlisting and recovery callback behavior.
- Profile creation linked exactly once to identity.
- Users can update only name and organization.
- Email change confirmation and session consequences.
- Institutional access and admin roles survive identity mapping.
- Supabase-to-internal-to-Appwrite ID reconciliation.
- Existing jobs and saves remain owned by the correct user.

### Persistence migration

New mandatory test suite for `packages/database`:

- Import a captured/redacted whole-store fixture twice with identical result.
- Preserve every legacy field, ID, timestamp, null, and publication state.
- Compare legacy blob and normalized projections field by field.
- Concurrent job updates do not lose changes.
- Artifact/source writes are transactional and idempotent.
- Foreign key, uniqueness, status, and ownership constraints reject invalid records.
- Dual-write failures produce a detectable reconciliation event.
- Rollback export can reconstruct the compatibility document.
- Seed fixtures never appear unless explicit test/dev seeding ran.

### Aperture

New first-class domain tests should cover:

- Agency/program alias resolution.
- Solicitation and government-document classification.
- Problem and technical-requirement extraction with evidence spans.
- Repeated-demand clustering without merging unrelated agencies/problems.
- Signal confidence and methodology versioning.
- Company/patent/lab matching with explainable evidence.
- Evidence-pack completeness and contradiction display.
- Publication/access policy for public versus institutional Aperture outputs.

## Playwright behaviors to preserve

Current `tests/visual/public.spec.ts` contains nine tests that must remain during repository movement:

1. Shared public surfaces fit all nine required viewport sizes.
2. News/startup archives render responsively and contain public links.
3. Published article, profile, and dossier render across the artifact matrix.
4. Representative homepage, research queue, and archive evidence can be captured.
5. `llms.txt`, `llms-full.txt`, and `sitemap.xml` are healthy and nonempty.
6. Invalid article/profile/dossier routes return clean 404s.
7. Invalid job routes show the queue without leaking internal IDs/details.
8. Signed-out dossiers keep institutional content gated.
9. Keyboard navigation reaches named controls.

Keep the runtime guards for console errors, page errors, failed responses, UUID/internal diagnostic leakage, missing image alt text, single H1, header/footer visibility, and horizontal overflow.

Before removing production seed fallback, create an explicit test seed containing at least one published entity with published article and dossier. The test should fail if its fixture setup fails rather than borrowing production fallback data.

## CI test layers for V2

| Layer | Required command/behavior |
|---|---|
| Static | Lint, typecheck, package boundary rules, secret/public-env validation. |
| Unit | Pure research, Aperture, publication, retry, taxonomy, and serializer rules. |
| Contract | Legacy DTO/JSONB compatibility and infrastructure port compliance. |
| Database | Migrations on empty/legacy fixtures, repository transactions, RLS/authorization equivalents. |
| Worker | Workflow replay, duplicate delivery, retry/cancel, crash recovery, concurrency. |
| Integration | Auth/account, research submission through persistence, Directus command permissions, indexing outbox. |
| End-to-end | Current nine Playwright tests plus authenticated account/research/admin paths. |
| Load | Current 204-job deterministic simulation plus opt-in isolated live environment tests. |

## Known coverage gaps to record, not fix in this audit

- No authenticated Playwright coverage.
- No safe live Supabase smoke run in the audit environment.
- No concurrency test against the real whole-store backend.
- No dedicated image-resolution or Markdown golden suite.
- No schema migration runner or deployed-schema version test.
- No API schema/version contract tests.
- No dependency vulnerability gate; `npm ci` reported 10 audit findings during this audit.
- No tests yet for Aperture domain concepts, because those modules do not exist.
