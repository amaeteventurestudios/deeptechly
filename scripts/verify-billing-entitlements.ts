import assert from "node:assert/strict";
import { resolveAccountEntitlements } from "../packages/kernel/src/entitlements";
import { loadCapabilityConfig } from "../apps/worker/src/providers/config";
import { LagoBillingAdapter } from "../apps/worker/src/providers/lago";
import { StripeCheckoutAdapter } from "../apps/worker/src/providers/stripe";

async function verify() {
  const signedOut = resolveAccountEntitlements({ signedIn: false });
  assert.equal(signedOut["public.read"].granted, true);
  assert.equal(signedOut["research.submit"].granted, false);
  assert.equal(signedOut["dossier.institutional"].granted, false);

  const free = resolveAccountEntitlements({ signedIn: true, accessTier: "free" });
  assert.equal(free["research.submit"].granted, true);
  assert.equal(free["research.save"].granted, true);
  assert.equal(free["dossier.institutional"].granted, false);

  const pending = resolveAccountEntitlements({ signedIn: true, institutionalPending: true });
  assert.match(pending["dossier.institutional"].reason, /pending review/i);

  const institutional = resolveAccountEntitlements({ signedIn: true, institutionalVerified: true });
  assert.equal(institutional["dossier.institutional"].granted, true);
  assert.equal(institutional["aperture.institutional"].granted, true);

  assert.equal(loadCapabilityConfig({}).lago, undefined);
  assert.equal(loadCapabilityConfig({}).stripe, undefined);
  assert.throws(() => loadCapabilityConfig({ STRIPE_SECRET_KEY: "pk_public" }), /server-side secret key/);

  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const mockFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/health") || url.endsWith("/v1/account")) return Response.json({ ok: true });
    if (url.endsWith("/api/v1/customers")) {
      return Response.json({ customer: { external_id: "account_1" } });
    }
    if (url.endsWith("/api/v1/events")) {
      return Response.json({ event: { lago_id: "event_1" } });
    }
    if (url.endsWith("/v1/checkout/sessions")) {
      return Response.json({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/test" });
    }
    return Response.json({}, { status: 404 });
  }) as typeof fetch;

  const lago = new LagoBillingAdapter({
    provider: "lago",
    baseUrl: "https://billing.internal",
    token: "lago-secret",
    healthPath: "/health",
    timeoutMs: 1_000
  }, mockFetch);
  assert.equal((await lago.health()).status, "available");
  assert.equal((await lago.ensureCustomer({ accountId: "account_1", email: "analyst@example.org" })).externalCustomerId, "account_1");
  assert.equal((await lago.reportUsage({
    idempotencyKey: "usage_1",
    accountId: "account_1",
    code: "research_run",
    quantity: 1,
    occurredAt: "2026-10-01T00:00:00.000Z"
  })).externalEventId, "event_1");
  await assert.rejects(() => lago.reportUsage({
    idempotencyKey: "usage_bad",
    accountId: "account_1",
    code: "research_run",
    quantity: 0,
    occurredAt: "2026-10-01T00:00:00.000Z"
  }), /positive finite/);

  const stripe = new StripeCheckoutAdapter({
    provider: "stripe",
    baseUrl: "https://api.stripe.com",
    token: "sk_test_secret",
    healthPath: "/v1/account",
    timeoutMs: 1_000
  }, mockFetch);
  assert.equal((await stripe.health()).status, "available");
  const checkout = await stripe.createSubscriptionCheckout({
    accountId: "account_1",
    email: "analyst@example.org",
    priceId: "price_123ABC",
    successUrl: "https://deeptechly.com/account?checkout=success",
    cancelUrl: "https://deeptechly.com/pricing"
  });
  assert.equal(checkout.sessionId, "cs_test_1");
  const stripeRequest = requests.find((request) => request.url.endsWith("/v1/checkout/sessions"));
  assert.equal(new Headers(stripeRequest?.init?.headers).get("content-type"), "application/x-www-form-urlencoded");
  assert.match(String(stripeRequest?.init?.body), /client_reference_id=account_1/);
  assert.ok(requests.every((request) => !request.url.includes("secret")));

  console.log("Billing and entitlement foundation verification passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
