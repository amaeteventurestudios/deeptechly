# Phase 23 — Supabase exit and Appwrite/PostgreSQL cutover

## Outcome

DeepTechly V2 no longer uses Supabase in its normal runtime. Appwrite is the only authentication architecture, and PostgreSQL is the only application-data authority when configured. With neither service configured, public development pages continue to use the existing deterministic fixtures; authentication and persistent writes fail closed with provider-neutral messages.

No production service was configured or changed during Phase 23. The repository now requires genuine Appwrite and PostgreSQL credentials before authenticated production use.

## Remaining-reference audit

| Previous dependency | Classification | Phase 23 result |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Remove from runtime | Removed from application code, package manifests, lockfile, and `.env.example`. |
| `@supabase/ssr`, `@supabase/supabase-js` | Remove | Removed from `apps/web/package.json` and `pnpm-lock.yaml`. |
| Browser, route, server, middleware, and admin clients under `apps/web/lib/supabase` | Replace with Appwrite | Removed. Appwrite server REST adapters now own identity and sessions. |
| Supabase auth provider adapter/default selector | Replace with Appwrite | Removed. `configuredAuthProvider()` always selects Appwrite. |
| Profile, access, invite, saved-research, and admin persistence | Replace with PostgreSQL | Converted to normalized PostgreSQL repositories and transactions. |
| Whole research-store reads/writes and Redis/KV authority fallback | Replace with PostgreSQL | PostgreSQL is selected whenever its connection is configured; the compatibility providers are not runtime fallbacks. |
| Legacy SQL under `supabase/` | Retain as archived schema knowledge | Not imported by or required for runtime. Do not execute for V2 activation. |
| Phase 22 dump parser, transformation SQL, legacy identity labels, and recovered-backup documentation | Retain as migration tooling/history | Required for traceable migration and reconciliation only. |
| `apps/web/package-lock.legacy.json` | Retain as historical dependency snapshot | Not used by pnpm, builds, or runtime. |

`pnpm verify:supabase-exit` scans active web/runtime/configuration files and fails if the former provider name, environment variables, or packages return. Migration tooling and historical documentation are deliberately outside that active-runtime rule.

## Appwrite authentication architecture

The server-only contract is:

1. Sign-in posts email/password to the DeepTechly route.
2. The route creates an Appwrite email/password session using a scoped server API key.
3. The returned session secret is stored in an HTTP-only, same-site cookie named `a_session_<project-id>` by default.
4. Every server-rendered identity read sends that secret to Appwrite and validates the current account.
5. DeepTechly resolves the Appwrite user through `deeptechly.external_identities` and uses the stable `deeptechly.accounts.id` for all application ownership.
6. Sign-out deletes the current Appwrite session and expires the DeepTechly-hosted cookie.

The API key must have only the Appwrite scopes needed by these flows: `users.read`, `users.write`, and `sessions.write`. It is never browser-exposed. The implementation follows Appwrite's documented [SSR session flow](https://appwrite.io/docs/products/auth/server-side-rendering) and [Users API](https://appwrite.io/docs/references/cloud/server-rest/users).

Implemented flows:

- email/password sign-in and sign-up;
- HTTP-only session persistence and server validation;
- sign-out;
- password-recovery request and recovery completion;
- account/profile linkage;
- profile/email updates;
- institutional pending/verified grants;
- database-backed admin grants with `ADMIN_EMAILS` retained only as a bootstrap allow-list;
- protected account, queue, saved-research, dossier, and admin surfaces through `getAuthSession()`.

When Appwrite is unconfigured, auth mutations return a provider-neutral configuration error. Public fixtures do not create pretend sessions.

## PostgreSQL authority

Migration `0007_runtime_cutover.sql` adds cutover indexes and a non-secret invite-code hint. The existing V2 tables remain authoritative for:

- accounts and external identities;
- access grants, invite codes, and invite redemptions;
- research jobs, runs, search records, workflow state, and outbox events;
- entities, sources, claims, evidence, and claim/evidence links;
- articles, profiles, dossiers, publications, and provenance-compatible snapshots;
- saved research;
- Aperture, newsroom, billing, and other V2 domains already defined by migrations `0001`–`0006`.

The research adapter now performs writes inside a transaction protected by a PostgreSQL advisory transaction lock. It upserts normalized records and compatibility snapshots together, maps legacy compatibility entity IDs to normalized target IDs, preserves existing slug-based IDs, and emits an idempotent outbox event. Valkey/Redis is not an application-data fallback; it remains a future cache/coordination capability only.

Account/profile, access, invite redemption, saved research, and admin grant updates use normalized tables directly. Invite plaintext is returned only at creation time; PostgreSQL stores its SHA-256 digest and a non-secret masked hint.

## Environment contract

Required for authenticated production runtime:

```dotenv
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
DEEPTECHLY_V2_DATABASE_URL=
```

Optional controls:

```dotenv
APPWRITE_SESSION_COOKIE_NAME=
APPWRITE_DATABASE_ID=
DEEPTECHLY_V2_DATABASE_SSL=require
DEEPTECHLY_V2_DATABASE_POOL_SIZE=8
ADMIN_EMAILS=
```

`APPWRITE_DATABASE_ID` is reserved and is not required by the current architecture because PostgreSQL owns DeepTechly application data. The database URL, component database password, and Appwrite API key are server-only secrets. No privileged credential uses a `NEXT_PUBLIC_` prefix.

The component PostgreSQL variables in `.env.example` may be used instead of the URL. Supabase variables are not part of the runtime contract and must not be added to new deployments.

## Legacy account migration

Phase 22 preserved stable account IDs and legacy identity mappings without copying sessions, tokens, or password hashes into runtime tables. `pnpm migration:appwrite-accounts` now provides an operator-gated account mapping workflow:

- default mode is read-only and reports only the aggregate number of unmapped legacy accounts;
- `DEEPTECHLY_ALLOW_APPWRITE_ACCOUNT_MIGRATION=true` is required for external writes;
- compatible legacy UUID account IDs are preserved as Appwrite user IDs;
- the script creates passwordless Appwrite accounts and writes the corresponding `external_identities` mapping;
- email equality is checked before mapping an already-existing Appwrite user;
- users complete migration through Appwrite password recovery.

The runtime may also attach a signed-in, email-verified Appwrite identity to exactly one existing account with the same unique email. It refuses unverified or ambiguous email matching.

No Supabase password hash, session, refresh token, MFA state, provider payload, or service credential is transferred. A bcrypt import may only replace the recovery path after a separately approved Appwrite sandbox test.

## Verification

Phase 23 validation includes:

- mocked Appwrite sign-in, session-cookie persistence, server identity validation, password recovery, and sign-out;
- active-runtime dependency scanning across 173 files;
- two clean imports of the real Phase 22 backup into PostgreSQL 17.11;
- equivalent reconciliation, model-rendering, HTTP, and transactional runtime reports;
- real PostgreSQL writes for two accounts/profiles, an institutional invite redemption, an admin access update, a saved-research round trip, and the complete research store;
- migrated-data rendering through 11 HTTP surfaces and 14 Markdown artifacts;
- lint, typecheck, deterministic tests, production build, and Playwright.

The isolated runtime-write report preserved 30 jobs, 5 entities, 5 articles, and 4 dossiers across the write/read round trip.

## External activation prerequisites

Before production authenticated traffic:

1. provision an Appwrite project and register the production and recovery domains;
2. create a least-privilege server key with `users.read`, `users.write`, and `sessions.write`;
3. configure email delivery and recovery templates;
4. provision managed PostgreSQL, apply migrations `0001`–`0007`, and verify encrypted backup/restore;
5. execute the final Phase 22 import against the write-frozen export and reconcile it;
6. run the Appwrite account-mapping command in dry-run mode, obtain operator approval, then apply it;
7. canary sign-in, profile ownership, queue writes, saved research, admin grants, public artifacts, Markdown, and Aperture;
8. enable traffic only after the canary and aggregate reconciliation pass.

## Rollback

Rollback does not reactivate Supabase. Before activation, retain:

- the previous application release;
- an encrypted PostgreSQL pre-cutover snapshot and point-in-time recovery;
- the Appwrite user/mapping export created for the cutover;
- the final migration and reconciliation reports.

If the canary fails, stop new writes, restore the PostgreSQL pre-cutover snapshot or roll forward the failed transaction, revoke newly created Appwrite sessions if identity behavior is implicated, deploy the previous V2 release in maintenance/read-only mode, and investigate. Provider reversal is not an authorized rollback path.

## Confirmation

Normal DeepTechly runtime no longer imports a Supabase SDK, reads Supabase environment variables, creates Supabase clients, or selects Supabase/Redis as a persistence fallback. Remaining mentions are confined to legacy migration tooling, archived SQL/dependency knowledge, and historical migration documentation.
