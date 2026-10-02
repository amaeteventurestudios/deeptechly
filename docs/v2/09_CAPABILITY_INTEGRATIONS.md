# Open-Source Capability Integration Boundary

## Phase 11 result

DeepTechly now has provider-neutral ports for source acquisition, search indexing, newsroom reads, tracing, cache, object storage, and health reporting. The worker includes bounded REST adapters for Crawl4AI, Directus, and Meilisearch. Adapters are created only when their base URL is configured; importing or starting the web application does not connect to them.

Local Docker Compose profiles cover the stable, independently useful services: PostgreSQL, Directus, Meilisearch, and Valkey. Every profile is opt-in and secrets are required. Trigger.dev and Langfuse retain upstream-owned deployment stacks because copying their multi-service Compose definitions would create immediate operations debt.

## Ownership split

| Capability | Commodity provider | DeepTechly retains |
|---|---|---|
| Acquisition | Crawl4AI | URL discovery, source relevance/authority, entity anchoring, claim support, verification. |
| Newsroom CRUD | Directus | Review commands, publication eligibility, institutional access, retry/publish invariants. |
| Search | Meilisearch | Search document policy, publication outbox, public/gated filtering, ranking inputs. |
| Coordination | Valkey | Idempotency policy, workflow truth, artifact persistence. |
| Durable execution | Trigger.dev (Phase 12) | Deterministic stage plan, research policy, artifact composition. |
| LLM observability | Langfuse | Redaction, trace eligibility, evaluation policy, public privacy boundary. |
| Object storage | S3-compatible | Media/evidence provenance, content hashes, licensing and access policy. |

## Adapter guarantees

- Server credentials are bearer headers and never query parameters.
- Only HTTP(S) base URLs and crawl targets are accepted; acquisition rejects URL credentials, loopback, link-local, private-network, and local/internal hosts before dispatch.
- Requests have bounded timeouts and sanitized provider errors.
- Health checks report availability without throwing credentials into logs.
- Meilisearch caps requested result counts and returns asynchronous task IDs for indexing.
- Directus collection and record identifiers are URL-encoded.
- Crawl4AI returns normalized content only; it does not assign authority, confidence, or truth.
- Missing configuration means disabled, never a silent demo connection.

## Activation blockers

No external endpoints, credentials, image approval, or production network policy are available in the repository. The adapters are therefore tested with deterministic HTTP doubles and are not selected by the current production web path. Each cutover requires provider health, security review, reconciliation, rollback, and a domain-specific phase.

## Verification

`pnpm verify:capability-adapters` covers fail-closed configuration, URL validation, token placement, health, search/index calls, Directus reads, Crawl4AI normalization, and rejection of non-HTTP acquisition targets. Standard typecheck and build verify that ports remain consumable from the worker.

Phase 20 adds production Langfuse v4 OTLP, Valkey/Redis, and S3-compatible adapters plus privacy and bounds verification; see `18_SYSTEM_HARDENING.md`.
