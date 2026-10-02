# DeepTechly local capability infrastructure

This directory contains opt-in local capability profiles. Domain policy stays in `packages/research` and `packages/aperture`; these services remain replaceable adapters. PostgreSQL is authoritative. Directus, Meilisearch, and caches are projections or operational capabilities.

## Safety and startup

No profile starts as part of `pnpm dev`, tests, imports, or builds. Copy `.env.infrastructure.example` to an untracked `infrastructure/.env`, replace every secret, then opt into only the profile you need:

```sh
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml --profile core up -d
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml --profile discovery up -d
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml --profile coordination up -d
docker compose --env-file infrastructure/.env -f infrastructure/docker-compose.yml --profile newsroom up -d
```

Do not point local profiles at production volumes or credentials. Applying database migrations remains a separate reviewed operator action.

## Included profiles

| Profile | Capability | Authority |
|---|---|---|
| `core` | PostgreSQL | Intended V2 source of truth after approved migration. |
| `newsroom` | Directus + PostgreSQL | Editorial CRUD projection; cannot own research truth or identity. |
| `discovery` | Meilisearch | Derived public discovery index. |
| `coordination` | Valkey | Ephemeral cache/coordination only, never artifact authority. |

The image references are explicit and overrideable so upgrades are reviewed. The initial defaults are conservative compatibility pins, not an instruction to deploy them unchanged to production.

## Deliberately not copied here

- Trigger.dev and current Langfuse self-hosted deployments are multi-service upstream stacks. Use their maintained Compose distributions and connect through the repository's Trigger and Langfuse v4 OTLP adapters instead of copying a stale subset here.
- Crawl4AI activation depends on selecting and pinning a supported server image/API contract. The worker adapter accepts a versioned base URL and path without owning truth evaluation.
- Appwrite and S3-compatible storage require dedicated activation and security configuration. Lago and Stripe now have server adapters and ledger schema, but remain external managed capabilities until accounts, plans, webhooks, and reconciliation are approved.

Relevant upstream documentation: [Directus Docker guide](https://docs.directus.io/self-hosted/docker-guide), [Meilisearch Docker integration](https://www.meilisearch.com/integrations/docker), [Crawl4AI documentation](https://docs.crawl4ai.com/), [Trigger.dev self-hosting](https://trigger.dev/docs/open-source-self-hosting), and [Langfuse self-hosting](https://langfuse.com/self-hosting).
