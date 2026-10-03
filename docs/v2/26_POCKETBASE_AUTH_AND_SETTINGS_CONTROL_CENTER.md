# Phase 24 — PocketBase auth and Settings control center

## Outcome

DeepTechly V1 now uses PocketBase only for authentication and identity. PostgreSQL remains the sole authority for DeepTechly accounts, roles, organizations, ownership, access, settings, research, publication, Aperture, audits, and provenance. Appwrite was never provisioned and is superseded as the V1 identity decision.

Public development surfaces still boot without identity or database credentials. Authentication and persistent mutations fail closed with provider-neutral messages. No production service was provisioned and no production migration was run.

## PocketBase architecture

The provider-neutral `IdentityProvider` boundary remains intact. The PocketBase adapter implements email/password registration and sign-in, HTTP-only token persistence, server validation through PocketBase `auth-refresh`, local sign-out, password recovery, verification-email requests, and disabled-record handling where that optional field is configured. PostgreSQL account suspension is enforced independently of PocketBase rules.

PocketBase tokens are never exposed through application JSON or browser JavaScript. PocketBase uses stateless signed tokens and cannot honestly enumerate active sessions. The Settings Sessions view says so explicitly. Completing password recovery invalidates previously issued tokens; normal sign-out discards the current token.

The production PocketBase `users` auth collection must allow the server-mediated create, password-auth, auth-refresh, recovery, and verification operations used by DeepTechly. Elevated administration and migration use a server-only superuser token or operator-only superuser credentials.

## PostgreSQL relationship and identity mapping

`deeptechly.accounts.id` remains the durable DeepTechly account identifier. `deeptechly.external_identities` maps it to a PocketBase record using `provider = pocketbase`, `provider_user_id`, and `provider_email`. Email is not a foreign key. An email-verified PocketBase identity may attach to exactly one legacy account with the same unique email. New accounts receive an account row, identity mapping, and `USER` role transactionally.

## Role and policy model

Migration `0008_pocketbase_settings_control.sql` adds extensible `account_roles` assignments. Roles are text values rather than a database enum, allowing future `ANALYST`, `EDITOR`, `INSTITUTIONAL`, and `TEAM_ADMIN` roles without redesign.

| Role | Authority |
|---|---|
| `SUPER_ADMIN` | Protected configuration, administrators, security/email/model controls, users, research, publishing, and audits. |
| `ADMIN` | Routine configuration, non-protected user management, research/editorial operations, and audit visibility. |
| `USER` | Normal product access, own queue, saved research, permitted dossiers, preferences, and research submission. |
| `VIEWER` | Authenticated read-only access and personal preferences; research submission and shared-state mutation are denied. |

Every Settings server action revalidates session and permission. UI hiding is convenience only. An `ADMIN` cannot assign administrator roles or modify a `SUPER_ADMIN`, even with a forged request.

## Settings architecture

`/settings` provides persistent desktop navigation and a horizontally scrollable mobile equivalent using the orange, black, off-white, hard-border DeepTechly design system. Its thirteen sections cover General, Appearance, AI & Models, Research Defaults, Publishing, Data, Notifications, Email Delivery, Audit & Retention, Users & Access, Invitations, Sessions, and Authentication Audit.

The AI control plane stores providers, models, primary/fallback role assignments, enabled state, budgets, timeouts, and retries. Usage is shown only when genuine provider metering exists. Research and publishing controls cannot bypass evidence, source-authority, confidence, contradiction, review, or eligibility policy.

General and Data display live PostgreSQL facts and a PocketBase health probe. Other capabilities distinguish `configured` from live `available`; absent or failed services are reported honestly.

## Secret handling and email

AI provider and SMTP secrets are encrypted with AES-256-GCM before PostgreSQL persistence using `DEEPTECHLY_SETTINGS_ENCRYPTION_KEY`, a base64-encoded 32-byte server-only key. Each value receives a random nonce and authentication tag.

- Secrets are never returned by Settings reads.
- The UI exposes only credential-presence state.
- Blank-on-edit preserves the existing SMTP password.
- SMTP test delivery decrypts only inside the server action, validates TLS certificates, and sends to the configured sender address.
- Audit events never contain passwords, raw auth tokens, or secrets.

The existing environment-based OpenAI adapter remains intact. Persisted providers form an additional provider-neutral control plane.

## Legacy account migration

`pnpm migration:pocketbase-accounts` is dry-run by default. External writes require `DEEPTECHLY_ALLOW_POCKETBASE_ACCOUNT_MIGRATION=true` and approved PocketBase/PostgreSQL credentials.

The workflow finds legacy accounts without a PocketBase mapping, reuses an exact-email PocketBase record or creates one with a random temporary password, preserves the existing DeepTechly account ID, and adds an external-identity mapping. Ownership, saved research, institutional state, research history, and timestamps stay in PostgreSQL. Users must complete password recovery; legacy password hashes, sessions, MFA data, and tokens are not copied.

## Environment contract

```dotenv
POCKETBASE_URL=
POCKETBASE_AUTH_COLLECTION=users
POCKETBASE_AUTH_COOKIE_NAME=deeptechly_auth
POCKETBASE_SUPERUSER_TOKEN=
POCKETBASE_SUPERUSER_EMAIL=
POCKETBASE_SUPERUSER_PASSWORD=
DEEPTECHLY_V2_DATABASE_URL=
DEEPTECHLY_SETTINGS_ENCRYPTION_KEY=
```

Prefer a separately managed nonrenewable PocketBase superuser token for operator tooling. Email/password superuser credentials are an optional operator fallback. None may use `NEXT_PUBLIC_`.

## Future identity migration

Application code depends on `IdentityProvider`, `ExternalIdentity`, `getAuthSession`, PostgreSQL mapping, and DeepTechly authorization policy—not PocketBase SDK objects. A future move to Appwrite or another provider requires a new adapter and identity mapping only. `accounts.id`, roles, settings, ownership, and product data remain unchanged.

## Production provisioning requirements

1. Provision PocketBase with TLS, backups, a `users` auth collection, approved rules, email templates, and optional `name`/`disabled` fields.
2. Provision managed PostgreSQL and apply migrations `0001`–`0008`.
3. Generate the Settings encryption key in the production secret manager and test restore/rotation.
4. Run the final Phase 22 import and reconciliation against the write-frozen legacy export.
5. Dry-run, approve, and execute PocketBase mapping; send recovery instructions through an approved channel.
6. Bootstrap the first `SUPER_ADMIN`, then canary every role, ownership boundary, settings permission, queue write, saved item, public artifact, Markdown route, and Aperture route.
7. Configure and test SMTP before production recovery or invitation delivery.

No production provisioning or migration occurred in Phase 24.

## Verification

Phase 24 deterministic coverage passes for registration, sign-in, token refresh, sign-out, recovery, provider-neutral failure, four-role policy, server-side Settings authorization, encrypted-secret round trips, responsive Settings navigation, migration `0008`, and active Appwrite-runtime removal. The complete lint, typecheck, and verifier suite passes; the isolated Next.js 16.3.8 production build passes; the production-rendered Playwright matrix passes 21/21 scenarios; and the production dependency audit reports no known vulnerabilities.

The isolated PostgreSQL rehearsal applied all eight migrations twice and produced equivalent results. Its expanded runtime validation covered identity mapping, role changes, preferences, system settings, encrypted AI/SMTP persistence, auth auditing, research ownership, saved research, invitation redemption, and admin/research stores. Production credentials were not used.
