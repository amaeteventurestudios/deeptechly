# Browser visual QA

From the repository root, install dependencies and the Chromium browser once:

```bash
pnpm install
pnpm --filter @deeptechly/web exec playwright install chromium
```

Run the signed-out browser smoke and responsive suite from the repository root with `pnpm test:visual`, or use `pnpm test:visual:headed` to watch Chromium. The suite starts the Next.js app at `http://localhost:3000` and reuses that server outside CI when it is already running. Set `BASE_URL` when port 3000 belongs to another local service.

Tests discover real published article and profile links from the local `/news` and `/startups` archives. The repository's deterministic public seed records keep artifact coverage available when persistent development data is unavailable. If an environment has no public records, the discovery assertion fails rather than fabricating coverage.

The suite intentionally covers signed-out behavior. It does not use credentials, cookies, service-role keys, or authentication bypasses. The signed-out queue's handled 401 from its user-scoped API is excluded from runtime-error assertions; all other failed page responses, uncaught exceptions, and console errors fail the suite. Institutional dossier tests verify the public lock state only; authorized institutional rendering is not covered until a safe environment-provided test account exists.

Reports, traces, failure screenshots, and evidence screenshots are written to `playwright-report/` and `test-results/`; both are ignored by Git. The tests use reduced motion, Chromium, DOM overflow assertions, console/page-error checks, and a focused responsive matrix. No image baselines are committed.
