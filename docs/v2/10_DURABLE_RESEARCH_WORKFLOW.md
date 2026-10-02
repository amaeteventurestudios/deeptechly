# Durable Research Workflow

## Phase 12 result

DeepTechly research dispatch now uses the kernel `WorkflowDispatcher` port. `local` remains the compatibility default, preserving current production behavior. Selecting `trigger` dispatches the `deeptechly-research` Trigger.dev v4 task with a 24-hour idempotency key, a concurrency limit of three, bounded exponential retries, a ten-minute task ceiling, and a stored external run ID.

The canonical deterministic stage plan lives in `@deeptechly/research`. Identity resolution precedes acquisition, verification precedes synthesis/publication, public artifacts become ready before the institutional dossier finishes, and terminal publication steps are not automatically replayed as ordinary transient work.

## Execution flow

1. The authenticated web route creates or reuses the persisted research job.
2. The queue atomically reserves a local slot and computes the job fingerprint.
3. The configured dispatcher records provider/run metadata on the job.
4. Trigger.dev invokes a private web callback using a per-environment bearer secret.
5. The callback revalidates job ID, exact query, and idempotency fingerprint against persisted state.
6. The existing pipeline executes with persisted stage/heartbeat/attempt checkpoints.
7. A transient pipeline failure is re-queued and returned as a retryable callback response; Trigger.dev applies its bounded retry policy.
8. Cancellation persists first, then cancels the external Trigger run when present.

The private callback returns `404` for missing/invalid authorization so it does not disclose whether the endpoint or job exists. Secrets must be at least 24 characters and comparisons use constant-time byte comparison.

## Compatibility and truth

- `DEEPTECHLY_WORKFLOW_PROVIDER=local` is the default; no external workflow is contacted unless `trigger` is explicitly selected.
- PostgreSQL/Supabase compatibility persistence remains job truth. Trigger.dev owns durable execution, retries, concurrency, and run observability—not research records or publication state.
- Trigger idempotency supplements, but does not replace, the database job fingerprint and publication guards.
- The legacy watchdog remains a compatibility safety net while local execution exists. It must not independently redispatch an already active Trigger run.

## Activation requirements

Trigger activation requires `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF`, `DEEPTECHLY_INTERNAL_WEB_URL`, and the same `DEEPTECHLY_WORKER_CALLBACK_SECRET` in web and task environments. A self-hosted deployment may also set `TRIGGER_API_URL` according to the Trigger.dev SDK deployment configuration.

Run `pnpm workflow:dev` from the repository root after credentials are configured. The command uses the pinned 4.7.0 CLI through `pnpm dlx`; the runtime SDK is pinned in the web and worker packages.

## Limitations before production cutover

The Trigger task currently drives the proven pipeline through one authenticated callback. Stage state is persisted and whole-task retries are idempotent, but individual acquisition/synthesis stages are not yet separate Trigger child tasks. This avoids duplicating the working pipeline during migration; finer-grained durable child tasks should follow only after PostgreSQL repositories replace the legacy whole-store write model.

No Trigger project, key, or reachable callback URL is available in the repository, so live registration and end-to-end external execution remain an activation blocker. Local behavior and deterministic adapter tests remain operational.

## Verification

`pnpm verify:durable-workflow` verifies provider selection, stage ordering, publication ordering, constant-time callback authorization, dispatch/cancel run handling, task concurrency, retry limits, callback-secret use, and timeout configuration. Existing orchestration, load, quality, build, and browser suites cover the compatibility path.
