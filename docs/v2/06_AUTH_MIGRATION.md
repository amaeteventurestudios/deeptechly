# Authentication and Account Migration

> Historical Phase 6 plan. Phase 23 first superseded this plan; Phase 24 then superseded the unprovisioned Appwrite choice with PocketBase. See `26_POCKETBASE_AUTH_AND_SETTINGS_CONTROL_CENTER.md` for the active architecture.

## Current production path

`DEEPTECHLY_AUTH_PROVIDER` defaults to `supabase`. Join, sign in, sign out, password-reset requests, and server session reads now call the provider-neutral identity interfaces exported by `@deeptechly/kernel` and the web adapter factory in `apps/web/lib/auth/providers`.

Supabase remains active for:

- identity and session cookies through the compatibility adapter;
- `users_profile` and institutional-access state;
- invite-code redemption;
- editable account-profile persistence;
- the browser-side reset-password exchange and account email change;
- saved research, admin access, and research persistence.

These compatibility islands are deliberate. Removing them before the PostgreSQL import and Appwrite account mapping are proven would break working accounts and institutional entitlements.

## Appwrite boundary

The Appwrite adapter is present but fail-closed. Selecting `DEEPTECHLY_AUTH_PROVIDER=appwrite` without a completed integration returns configuration/provider-unavailable outcomes and treats server requests as signed out. It never silently creates a local or privileged identity.

Activation requires:

1. an authorized Appwrite endpoint and project;
2. allowed web origins for every environment;
3. a reviewed HTTP-only session-cookie strategy for Next.js server rendering;
4. email verification and recovery templates/redirects;
5. an immutable mapping from Appwrite user IDs to imported DeepTechly account/profile IDs;
6. dual-read validation and a rollback window;
7. verified institutional-entitlement parity before cutover.

No Appwrite SDK or service was installed in this phase.

## Environment variables

| Variable | Purpose | Required now |
|---|---|---|
| `DEEPTECHLY_AUTH_PROVIDER` | Selects `supabase` or the fail-closed `appwrite` adapter. | No; defaults to `supabase` |
| `APPWRITE_ENDPOINT` | Future Appwrite API endpoint. | Only for Appwrite activation |
| `APPWRITE_PROJECT_ID` | Future Appwrite project identifier. | Only for Appwrite activation |
| `NEXT_PUBLIC_SUPABASE_URL` | Current identity/session and compatibility data endpoint. | Current production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Current public session key. | Current production |
| `SUPABASE_SERVICE_ROLE_KEY` | Current server-only profile, invite, admin, and persistence access. | Current production |

## Cutover invariant

The provider user ID is an external identity key, not the long-term DeepTechly account primary key. Phase 9 must introduce stable internal account IDs and an external-identity mapping before any Appwrite cutover.
