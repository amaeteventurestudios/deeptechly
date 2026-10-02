# KEEP / ADAPT / REPLACE / DELETE Register

This register is the canonical classification summary for the 42 mutually exclusive subsystems defined in `00_CURRENT_ARCHITECTURE_AUDIT.md`. “REPLACE” and “DELETE” describe the eventual V2 destination; they do **not** authorize removal during the transition.

## Counts

| Classification | Count | Meaning |
|---|---:|---|
| KEEP | 13 | DeepTechly-specific capability or test/requirements asset that should survive mostly intact. |
| ADAPT | 18 | Valuable product/domain code that should survive behind cleaner boundaries. |
| REPLACE | 9 | Commodity implementation to replace only after parity and migration validation. |
| DELETE | 2 | Production architecture debt to retire only after fixtures/compatibility and rollback requirements are satisfied. |
| **Total** | **42** | Every audited subsystem appears exactly once. |

## Canonical register

| # | Subsystem | Classification | V2 owner |
|---:|---|---|---|
| 1 | Next.js application shell and routing | ADAPT | `apps/web`, `packages/ui`, `packages/kernel` |
| 2 | Public marketing and informational pages | ADAPT | `apps/web` |
| 3 | Public discovery archives | ADAPT | `apps/web`, `packages/kernel`, `packages/database` |
| 4 | Article, profile, and dossier pages | ADAPT | `apps/web`, `packages/ui`, `packages/kernel` |
| 5 | Homepage research feed and signal modules | ADAPT | `apps/web`, `packages/kernel`, `packages/aperture` |
| 6 | Shared visual and layout component library | ADAPT | `packages/ui` |
| 7 | Core research and artifact contracts | KEEP | `packages/kernel`, `packages/research` |
| 8 | Entity resolution | KEEP | `packages/research` |
| 9 | Requested-entity anchor guardrails | KEEP | `packages/research` |
| 10 | Source quality, authority, and deduplication | KEEP | `packages/research` |
| 11 | Government/public-sector recognition | KEEP | `packages/aperture` |
| 12 | Evidence extraction and claim verification | ADAPT | `packages/research` |
| 13 | Article/profile/dossier synthesis | ADAPT | `packages/research`, `apps/worker` |
| 14 | Research image resolution | ADAPT | `packages/research`, `infrastructure` |
| 15 | Markdown artifact serialization | KEEP | `packages/research` |
| 16 | Story metadata and analyst personas | KEEP | `packages/research` |
| 17 | Publication eligibility and public read model | ADAPT | `packages/research`, `packages/kernel`, `packages/database` |
| 18 | Web search and page acquisition adapter | REPLACE | `infrastructure/acquisition`, `apps/worker` |
| 19 | Research pipeline coordination | ADAPT | `packages/research`, `apps/worker` |
| 20 | Process-local queue runtime | REPLACE | `apps/worker`, `infrastructure/workflows` |
| 21 | Retry, timeout, lock, and failure policy | KEEP | `packages/research` |
| 22 | Request-driven watchdog runtime | REPLACE | `apps/worker`, `infrastructure/workflows` |
| 23 | Research persistence repository and whole-store backends | REPLACE | `packages/database` |
| 24 | Deterministic seed entities and homepage fixtures | DELETE | Test fixtures/dev seed only |
| 25 | Saved research service | ADAPT | `packages/kernel`, `packages/database`, `apps/web` |
| 26 | Supabase auth clients and session middleware | REPLACE | `infrastructure/auth`, `packages/kernel` |
| 27 | Authentication routes and forms | REPLACE | `apps/web`, `infrastructure/auth` |
| 28 | Account profile domain and UI | ADAPT | `packages/kernel`, `packages/database`, `apps/web` |
| 29 | Invite-code and admin user management | REPLACE | `infrastructure/auth`, `infrastructure/admin` |
| 30 | Admin content CRUD and pages | REPLACE | `infrastructure/admin`, `apps/worker` |
| 31 | Admin research review intelligence | KEEP | `packages/research` |
| 32 | Research HTTP API and queue UI | ADAPT | `apps/web`, `packages/kernel`, `apps/worker` |
| 33 | Public JSON APIs | ADAPT | `apps/web`, `packages/kernel` |
| 34 | Markdown and machine-readable routes | KEEP | `apps/web`, `packages/research`, `packages/kernel` |
| 35 | Legacy whole-store Supabase schema | DELETE | Compatibility archive only |
| 36 | Normalized research SQL and metadata patch | ADAPT | `packages/database` |
| 37 | Supabase account, invite, and saved-item SQL | REPLACE | `packages/database`, auth/admin adapters |
| 38 | Environment and provider configuration | ADAPT | Per-app typed configuration |
| 39 | Verification and load harnesses | KEEP | Package/integration tests |
| 40 | Playwright public visual suite | KEEP | Web end-to-end tests |
| 41 | Link audit and repository/build tooling | ADAPT | Root workspace tooling |
| 42 | Product/design source documents and static asset | KEEP | Repository docs/public assets |

## KEEP guardrails

KEEP does not mean “freeze the file in place.” It means preserve the behavior and domain decisions while moving code with characterization tests. In particular:

- Entity identity and anchor logic must remain deterministic.
- Source authority, claim support, and publication eligibility must remain explicit policy, not be buried in workflow/CMS configuration.
- Public-sector recognition becomes an Aperture capability, but research may consume it through a stable interface.
- Retry policy stays DeepTechly-owned even when Trigger.dev supplies durable timers and execution.
- Markdown and machine-readable publication remain first-class outputs.

## ADAPT guardrails

- Introduce ports before changing providers or schema.
- Preserve current DTOs as compatibility contracts until callers migrate.
- Split pure policy from I/O, process globals, HTTP, and provider SDKs.
- Do not combine package extraction with a UI redesign.
- Treat current partial-publication and institutional-gating behavior as mandatory parity requirements.

## REPLACE guardrails

- Supabase remains authoritative until identity and data reconciliation pass; no removal is implied by this audit.
- A replacement must run in shadow/read-only or dual-write verification before cutover.
- Only one workflow system may own dispatch/retries at a time.
- Directus must call domain commands and must not bypass publication eligibility.
- Crawl/search replacements must return a normalized evidence envelope so research policy stays provider-independent.

## DELETE guardrails

- Move seed records to explicit test fixtures before removing them from production read paths.
- Back up and checksum the whole-store JSONB before retiring it.
- Do not drop the legacy blob table until normalized reads, rollback, and reconciliation have succeeded for an agreed retention window.
