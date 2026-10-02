# DeepTechly

DeepTechly is an AI-native deep-tech research and intelligence platform. The V2 repository is a pnpm workspace that preserves the working V1 application while proprietary research capabilities and commodity infrastructure are separated behind stable boundaries.

## Workspace

- `apps/web` — Next.js public product, account, research queue, and compatibility server routes.
- `apps/worker` — durable workflow runtime boundary; provider integration follows after activities are idempotent.
- `packages/kernel` — application ports and cross-product contracts.
- `packages/research` — DeepTechly research intelligence.
- `packages/aperture` — government-demand intelligence.
- `packages/database` — PostgreSQL migrations and repositories.
- `packages/ui` — shared DeepTechly design system.
- `packages/shared` — small provider-free utilities.
- `infrastructure` — external capability adapters and local service configuration.
- `supabase` — preserved legacy SQL; do not remove or run destructively during migration.

## Local commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:visual
```

The web app runs on port 3000 by default. If another project already uses that port, start DeepTechly on another port and pass the matching `BASE_URL` to Playwright.

## Migration policy

PostgreSQL is the long-term source of truth, but the current Supabase auth and data paths remain active compatibility adapters until reconciliation and rollback requirements are met. External services are added only when their adapter phase is implemented and tested.
