import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";
import { completePocketBasePasswordRecovery, createPocketBaseIdentityProvider } from "../apps/web/lib/auth/providers/pocketbase";
import { configuredAuthProvider } from "../apps/web/lib/auth/providers/index";

async function verify() {
  const previous = { url: process.env.POCKETBASE_URL, collection: process.env.POCKETBASE_AUTH_COLLECTION, fetch: globalThis.fetch };
  try {
    assert.equal(configuredAuthProvider(), "pocketbase", "PocketBase must be the only runtime identity provider");
    delete process.env.POCKETBASE_URL;
    const unconfigured = createPocketBaseIdentityProvider(new NextRequest("http://localhost/sign-in") as unknown as Parameters<typeof createPocketBaseIdentityProvider>[0]);
    assert.deepEqual(await unconfigured.signIn("test@example.test", "not-a-real-password"), { ok: false, reason: "configuration" });
    assert.equal(await unconfigured.getCurrentIdentity(), null);

    process.env.POCKETBASE_URL = "https://identity.example.test";
    process.env.POCKETBASE_AUTH_COLLECTION = "users";
    const calls: Array<{ path: string; method: string; authorization?: string }> = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      calls.push({ path: url.pathname, method: init?.method ?? "GET", authorization: headers.get("Authorization") ?? undefined });
      const record = { id: "pbuser000000001", email: "test@example.test", name: "Test User", verified: true, disabled: false, created: "2026-01-01 00:00:00Z", updated: "2026-01-01 00:00:00Z" };
      if (url.pathname.endsWith("/auth-with-password")) return Response.json({ token: "pocketbase-token", record }, { status: 200 });
      if (url.pathname.endsWith("/auth-refresh")) return Response.json({ token: "refreshed-token", record }, { status: 200 });
      if (url.pathname.endsWith("/records")) return Response.json(record, { status: 200 });
      if (url.pathname.endsWith("/request-password-reset") || url.pathname.endsWith("/request-verification") || url.pathname.endsWith("/confirm-password-reset")) return new Response(null, { status: 204 });
      throw new Error(`Unexpected PocketBase test request: ${url.pathname}`);
    };

    const provider = createPocketBaseIdentityProvider(new NextRequest("http://localhost/sign-in") as unknown as Parameters<typeof createPocketBaseIdentityProvider>[0]);
    const result = await provider.signIn("test@example.test", "correct-password");
    assert.equal(result.ok && result.identity?.provider, "pocketbase");
    const response = provider.applyCookies(NextResponse.json({ ok: true }) as unknown as Parameters<typeof provider.applyCookies>[0]);
    assert.equal(response.cookies.get("deeptechly_auth")?.value, "pocketbase-token");
    assert.ok(response.cookies.get("deeptechly_auth")?.httpOnly);

    const authenticated = createPocketBaseIdentityProvider(new NextRequest("http://localhost/account", { headers: { cookie: "deeptechly_auth=pocketbase-token" } }) as unknown as Parameters<typeof createPocketBaseIdentityProvider>[0]);
    assert.equal((await authenticated.getCurrentIdentity())?.providerUserId, "pbuser000000001");
    assert.equal(calls.at(-1)?.authorization, "pocketbase-token");
    assert.deepEqual(await authenticated.requestPasswordReset("test@example.test", "http://localhost/reset-password"), { ok: true });
    assert.deepEqual(await completePocketBasePasswordRecovery({ token: "reset-token", password: "new-password" }), { ok: true });

    const registration = createPocketBaseIdentityProvider(new NextRequest("http://localhost/join") as unknown as Parameters<typeof createPocketBaseIdentityProvider>[0]);
    const registered = await registration.register({ email: "test@example.test", password: "correct-password", emailRedirectTo: "http://localhost/research", metadata: { full_name: "Test User" } });
    assert.equal(registered.ok && registered.identity?.providerUserId, "pbuser000000001");

    assert.deepEqual(await authenticated.signOut(), { ok: true });
    const signedOut = authenticated.applyCookies(NextResponse.json({ ok: true }) as unknown as Parameters<typeof authenticated.applyCookies>[0]);
    assert.equal(signedOut.cookies.get("deeptechly_auth")?.value, "");
    console.log("PocketBase auth, registration, recovery, and server-session verification passed.");
  } finally {
    restore("POCKETBASE_URL", previous.url); restore("POCKETBASE_AUTH_COLLECTION", previous.collection); globalThis.fetch = previous.fetch;
  }
}
function restore(name: string, value: string | undefined) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
verify().catch((error) => { console.error(error); process.exitCode = 1; });
