# Billing and Entitlements Foundation

Phase 19 introduces billing and entitlement boundaries without choosing public pricing or changing current account access.

## Access policy

The kernel now resolves explicit capabilities:

- `public.read` is available without an account;
- `research.submit` and `research.save` require a signed-in account;
- `dossier.institutional` and `aperture.institutional` require verified institutional access.

The dossier gate delegates to this resolver, but the compatibility profile remains its source. This preserves production behavior exactly. A Stripe payment or Lago subscription never grants access directly: a verified webhook must first produce an audited `access_grants` record in PostgreSQL.

## Provider responsibilities

Lago is the target billing meter and receives customer plus idempotent usage events. Stripe is the payment/hosted-checkout boundary and creates subscription Checkout Sessions with the internal account ID as both client reference and metadata. DeepTechly retains entitlement policy, credit semantics, account identity, and grant/revocation audit decisions.

Both adapters are server-only, bounded by timeouts, and absent unless explicitly configured. No SDK or infrastructure service was installed and no external endpoint was contacted.

## Data ledger

Migration `0005_billing_entitlements.sql` adds:

- provider customer mappings;
- normalized subscription snapshots;
- research credit accounts and an append-only, idempotent credit ledger;
- idempotent usage delivery records;
- webhook inbox records with signature-verification and processing state.

`access_grants` from the core schema remains the sole authorization record. Provider payloads are evidence used to update that record, not authorization by themselves. Credit balance must be computed transactionally from ledger entries; future consumption must lock the credit account and reject a resulting negative balance.

## Activation contract

Optional server variables:

- `LAGO_BASE_URL`, `LAGO_TOKEN` or `LAGO_API_KEY`, `LAGO_TIMEOUT_MS`, `LAGO_HEALTH_PATH`;
- `STRIPE_SECRET_KEY`, optionally `STRIPE_BASE_URL` and `STRIPE_TIMEOUT_MS`;
- future webhook activation also requires separate Lago and Stripe signing secrets.

Activation requires approved plans/prices, webhook endpoints, signature verification, replay protection, customer reconciliation, tax/invoice policy, refund/revocation rules, and an operator-approved database migration. Public pricing is intentionally not coupled to these adapters.

## Verification

`pnpm verify:billing-entitlements` covers anonymous, free, pending, and institutional access; disabled-by-default configuration; Lago customer/usage payloads; positive-quantity enforcement; Stripe form encoding and reconciliation metadata; and credential isolation. Database verification covers all six additive ledger tables.
