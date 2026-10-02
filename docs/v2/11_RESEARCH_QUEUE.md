# Research Queue

Phase 13 turns the existing research status surface into one user-facing queue without changing job persistence, workflow execution, or publication behavior.

## Experience

- Active research is ordered first, followed by waiting, completed, and unsuccessful requests.
- Each active item shows a state icon, entity name, human-readable status, orange progress, elapsed time, and a compact completed/current/next summary.
- Completed items show completion duration, completion time, source and confidence context when available, and direct article, profile, and dossier actions.
- Waiting items explain their order in plain language and begin automatically.
- Failures are cleaned before display so stack traces and infrastructure details remain private.
- No raw job identifiers, serialized payloads, provider names, or developer-oriented stage panels are rendered.

## Behavior preserved

The queue still uses the existing authenticated `/api/research` contract, three-second polling while work is open, stable monotonic display progress, cancellation, bounded retry eligibility, browser readiness notifications, and saved-research actions. Phase 12 continues to own whether a job is dispatched locally or through Trigger.dev.

Closing the page does not stop durable or server-side research. The queue reloads persisted state when the user returns.

## Ordering

Items are deterministically grouped in this order:

1. active research, newest activity first;
2. queued research, oldest submission first;
3. completed research, newest completion first;
4. failed or cancelled research, newest result first.

The focused job is promoted only while active. Internal identifiers remain React/API keys and are never presented as user-facing metadata.

## Verification

`pnpm verify:research-queue-ui` protects the single-stack structure, compact workflow summary, artifact actions, durable-page copy, and absence of the retired developer-oriented queue panels. The standard browser matrix continues to cover `/research` and focused research status routes.
