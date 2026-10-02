import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";
import { createAppwriteIdentityProvider } from "../apps/web/lib/auth/providers/appwrite";
import { configuredAuthProvider } from "../apps/web/lib/auth/providers/index";

async function verify() {
  const previous = {
    endpoint: process.env.APPWRITE_ENDPOINT,
    project: process.env.APPWRITE_PROJECT_ID,
    apiKey: process.env.APPWRITE_API_KEY,
    fetch: globalThis.fetch
  };
  try {
    assert.equal(configuredAuthProvider(), "appwrite", "Appwrite must be the only runtime identity provider");
    delete process.env.APPWRITE_ENDPOINT;
    delete process.env.APPWRITE_PROJECT_ID;
    delete process.env.APPWRITE_API_KEY;
    const unconfigured = createAppwriteIdentityProvider(
      new NextRequest("http://localhost/sign-in") as unknown as Parameters<typeof createAppwriteIdentityProvider>[0]
    );
    assert.deepEqual(await unconfigured.signIn("test@example.test", "not-a-real-password"), { ok: false, reason: "configuration" });
    assert.equal(await unconfigured.getCurrentIdentity(), null);

    process.env.APPWRITE_ENDPOINT = "https://appwrite.example.test/v1";
    process.env.APPWRITE_PROJECT_ID = "deeptechly-test";
    process.env.APPWRITE_API_KEY = "test-only-api-key";
    const calls: Array<{ path: string; method: string; session?: string }> = [];
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      calls.push({ path: url.pathname, method: init?.method ?? "GET", session: headers.get("X-Appwrite-Session") ?? undefined });
      if (url.pathname.endsWith("/account/sessions/email")) {
        return Response.json({ $id: "session-test", userId: "user-test", expire: "2030-01-01T00:00:00.000Z", secret: "session-secret" }, { status: 201 });
      }
      if (url.pathname.endsWith("/account") && (init?.method ?? "GET") === "GET") {
        return Response.json({ $id: "user-test", $createdAt: "2026-01-01T00:00:00.000Z", $updatedAt: "2026-01-01T00:00:00.000Z", name: "Test User", email: "test@example.test", emailVerification: true, status: true });
      }
      if (url.pathname.endsWith("/account/sessions/current")) return new Response(null, { status: 204 });
      if (url.pathname.endsWith("/account/recovery")) return Response.json({}, { status: 201 });
      throw new Error(`Unexpected Appwrite test request: ${url.pathname}`);
    };

    const provider = createAppwriteIdentityProvider(
      new NextRequest("http://localhost/sign-in") as unknown as Parameters<typeof createAppwriteIdentityProvider>[0]
    );
    const result = await provider.signIn("test@example.test", "correct-password");
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.identity?.provider, "appwrite");
    const response = provider.applyCookies(
      NextResponse.json({ ok: true }) as unknown as Parameters<typeof provider.applyCookies>[0]
    );
    assert.equal(response.cookies.get("a_session_deeptechly-test")?.value, "session-secret");
    assert.ok(response.cookies.get("a_session_deeptechly-test")?.httpOnly);
    assert.equal(calls[0].path, "/v1/account/sessions/email");
    assert.equal(calls[1].session, "session-secret");

    const authenticated = createAppwriteIdentityProvider(
      new NextRequest("http://localhost/account", { headers: { cookie: "a_session_deeptechly-test=session-secret" } }) as unknown as Parameters<typeof createAppwriteIdentityProvider>[0]
    );
    assert.equal((await authenticated.getCurrentIdentity())?.providerUserId, "user-test");
    assert.deepEqual(await authenticated.requestPasswordReset("test@example.test", "http://localhost/reset-password"), { ok: true });
    assert.deepEqual(await authenticated.signOut(), { ok: true });
    const signedOut = authenticated.applyCookies(
      NextResponse.json({ ok: true }) as unknown as Parameters<typeof authenticated.applyCookies>[0]
    );
    assert.equal(signedOut.cookies.get("a_session_deeptechly-test")?.value, "");

    console.log("Appwrite auth and server-session verification passed.");
  } finally {
    restore("APPWRITE_ENDPOINT", previous.endpoint);
    restore("APPWRITE_PROJECT_ID", previous.project);
    restore("APPWRITE_API_KEY", previous.apiKey);
    globalThis.fetch = previous.fetch;
  }
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

verify().catch((error) => { console.error(error); process.exitCode = 1; });
