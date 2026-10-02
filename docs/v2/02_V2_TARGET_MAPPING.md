# DeepTechly V2 Target Mapping

## Target ownership model

```text
apps/web
  HTTP/UI composition only
  -> packages/kernel application ports and queries

apps/worker
  Durable workflow definitions and I/O activities
  -> packages/research policy
  -> packages/aperture policy
  -> packages/kernel ports

packages/ui
  Presentational components and design tokens

packages/kernel
  Cross-product application contracts, commands, identity/access ports,
  artifact queries, events, IDs, errors, and configuration interfaces

packages/database
  PostgreSQL migrations, repositories, transactions, and compatibility importers

packages/research
  DeepTechly proprietary entity/evidence/claim/planning/synthesis/publication logic

packages/aperture
  First-class government-demand intelligence domain consumed by web and research

packages/shared
  Small provider-free utilities only; not a dumping ground for domain logic

infrastructure
  Appwrite, Trigger.dev, Crawl4AI, Directus, Langfuse, Meilisearch,
  Valkey/Redis, object storage, and later Lago/Stripe adapters/configuration
```

## Current-to-target file mapping

| Current paths | Target destination | Boundary to introduce first |
|---|---|---|
| `app/**` public/product pages | `apps/web/app/**` | Query/command services instead of direct store/provider imports |
| `components/layout/**`, reusable article/dossier/home components | `packages/ui/src/**` | View models that do not import persistence/job aggregates |
| `components/research/**` | `apps/web/features/research/**` plus generic controls in `packages/ui` | Research API client and public job DTO |
| `lib/types.ts`, `lib/research/types.ts` | `packages/kernel/src/contracts`, `packages/research/src/types` | Separate domain, persistence, workflow telemetry, and UI projection types |
| `lib/research/entity-resolution.ts`, `entity-anchor.ts` | `packages/research/src/entity-resolution/**` | Provider-free inputs/outputs and repositories as interfaces |
| `lib/research/source-quality.ts`, `extract.ts` | `packages/research/src/evidence/**`, `claims/**` | Immutable evidence records and claim-evidence links |
| `lib/research/public-sector-recognition.ts` | `packages/aperture/src/evidence/**` | Aperture result contract, imported by research through a port |
| `lib/research/generate.ts`, `markdown.ts`, `story-metadata.ts` | `packages/research/src/synthesis`, `publishing`, `editorial` | Model gateway, prompt/version record, artifact repository |
| `lib/research/image-resolution.ts` | Policy in `packages/research/src/media`; fetch/storage adapter in `infrastructure/media` | Image candidate and attribution contract |
| `lib/research/pipeline.ts` | Pure planner/policies in `packages/research`; durable workflow/activity glue in `apps/worker` | Stage command/result envelopes and idempotent activity keys |
| `lib/research/orchestration.ts` | `packages/research/src/workflow-policy` | Pure retry/stall decisions independent of repository writes |
| `lib/research/queue.ts`, `watchdog.ts` | `apps/worker`, `infrastructure/workflows` | Workflow client/dispatcher port; one owner for retry and concurrency |
| `lib/research/store.ts` | `packages/database/src/repositories` plus legacy importer | Repository interfaces and transaction-scoped writes |
| `lib/research/public-data.ts` | `packages/kernel/src/queries` with database/search adapters | Published artifact projection; remove implicit seed merge |
| `lib/admin/research-review.ts` | `packages/research/src/review` | Stable review projection for Directus/read APIs |
| `lib/admin/content.ts`, `overview.ts`, admin content pages | Directus adapter/config under `infrastructure/admin` | Domain command API for publish/feature/recover |
| `lib/admin/users.ts`, `invite-codes.ts`, auth/profile modules | `packages/kernel/src/accounts` plus Appwrite/database adapters | Stable DeepTechly user ID and external identity mapping |
| `lib/saved-research.ts` | `packages/kernel/src/saved-research`, `packages/database` | User-scoped repository interface |
| `supabase/*.sql` | Versioned migrations/importers in `packages/database` | Schema ledger and compatibility mapping; no destructive migration |
| `scripts/verify-*.ts` | Package and integration test suites | Keep fixtures and expected behavior before moving code |
| `tests/visual/**` | Root or `apps/web/tests/e2e` | Explicit seeded test data rather than production fallback |
| Root build/config files | Workspace root plus per-app/package configs | npm workspaces, project references, import boundary rules |

## Proprietary capability allocation

### `packages/research`

- Entity resolution and official-domain resolution policy
- Research planning and gap detection
- Source authority/ranking and evidence normalization
- Evidence and claim extraction
- Claim verification and contradiction handling
- Confidence logic
- Technology, readiness, competitive, patent, and commercialization mapping
- Article/profile/dossier synthesis
- Publication eligibility and Markdown publishing
- Editorial review projections

Not all target capabilities exist today. Contradiction graphs, explicit research plans, technology/patent/competitive mapping, and gap-follow-up records are currently implicit or shallow; add them as new domain modules, not as more branches inside `pipeline.ts`.

### `packages/aperture`

Current reusable seed: `public-sector-recognition.ts` and government-related source metadata. Required new bounded contexts:

- `signals`: normalized government demand observations
- `problems`: problem statements extracted from solicitations and documents
- `opportunities`: opportunity maps linking repeated demand to technical responses
- `agencies`: agencies, offices, programs, and aliases
- `evidence`: government documents and evidence packs
- `methodology`: explicit scoring/version rules
- `matching`: companies, patents, labs, and technologies matched to requirements

Aperture is exposed through `apps/web` routes/navigation and uses `apps/worker` workflows. It is not a separate application and must not fork identity, evidence, or publishing infrastructure.

## Commodity capability interfaces

The first implementation should define interfaces without installing providers:

| Port | Current implementation | Eventual adapter |
|---|---|---|
| `IdentityProvider` | Supabase auth | Appwrite |
| `AccountRepository` | `users_profile` via Supabase | PostgreSQL + Appwrite identity mapping |
| `WorkflowDispatcher` | process-local queue + watchdog | Trigger.dev |
| `SearchProvider` | OpenAI/Tavily | Crawl/search adapters; Meilisearch for indexed discovery |
| `ContentAcquirer` | direct `fetch` + HTML stripping | Crawl4AI |
| `ResearchRepository` | whole-store Supabase/Redis/memory | PostgreSQL repositories |
| `EditorialAdmin` | custom admin pages | Directus |
| `ModelGateway` | direct OpenAI fetch | Provider adapter instrumented by Langfuse |
| `SearchIndex` | in-memory sort/filter | Meilisearch |
| `CacheCoordinator` | optional Upstash/Vercel KV blob | Valkey/Redis |
| `ObjectStore` | remote image URLs only | S3-compatible storage |
| `BillingProvider` | static pricing only | Lago + Stripe later |

## Safe migration sequence

1. **Characterize and freeze contracts.** Promote current verification scripts and Playwright suite to CI. Add golden serialization fixtures for all legacy aggregates.
2. **Create package boundaries without behavior change.** Establish the V2 directories/workspaces, move or re-export pure types and policies, and enforce dependency direction. Continue using Supabase and current routes.
3. **Introduce repository and provider ports.** Wrap the current store, auth, search, fetch, model, and queue implementations as legacy adapters. No provider installation yet.
4. **Normalize PostgreSQL storage.** Build versioned schema/importer, dual-write with reconciliation, then shadow-read. Keep the legacy blob and Supabase intact.
5. **Extract the worker boundary.** Make activities idempotent and persist workflow/run IDs. Only then replace dispatch/watchdog with Trigger.dev.
6. **Split acquisition and observability.** Introduce Crawl4AI/object storage and Langfuse behind the existing evidence/model contracts.
7. **Move editorial operations.** Configure Directus against safe projections/commands; it must not write publication invariants directly.
8. **Migrate identity.** Map stable internal user IDs to Supabase and Appwrite identities, prove account/reset/access behavior, then cut over sessions.
9. **Add Meilisearch and Aperture projections.** Index published data via an outbox; expand Aperture domain and web surfaces.
10. **Retire compatibility paths.** Only after reconciliation and rollback windows: stop seed fallback, blob writes, old queue/watchdog, and finally Supabase dependencies.

## Recommended first implementation step

Create the workspace/package skeleton and a behavior-preserving `packages/kernel` contract layer with repository/provider interfaces, then wrap the existing Supabase store, Supabase auth, OpenAI/Tavily search, and process-local queue as `legacy` adapters. This produces an architectural seam without changing production behavior or installing any new infrastructure.
