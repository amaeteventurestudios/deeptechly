import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createAppwriteIdentityProvider } from "../apps/web/lib/auth/providers/appwrite";
import { configuredAuthProvider } from "../apps/web/lib/auth/providers/index";

async function verify() {
  const previousProvider = process.env.DEEPTECHLY_AUTH_PROVIDER;
  const previousEndpoint = process.env.APPWRITE_ENDPOINT;
  const previousProject = process.env.APPWRITE_PROJECT_ID;

  try {
    delete process.env.DEEPTECHLY_AUTH_PROVIDER;
    assert.equal(configuredAuthProvider(), "supabase", "Supabase must remain the compatibility default");

    process.env.DEEPTECHLY_AUTH_PROVIDER = "appwrite";
    assert.equal(configuredAuthProvider(), "appwrite", "Appwrite selection must be explicit");

    delete process.env.APPWRITE_ENDPOINT;
    delete process.env.APPWRITE_PROJECT_ID;
    const appwrite = createAppwriteIdentityProvider(new NextRequest("http://localhost/sign-in"));
    assert.deepEqual(
      await appwrite.signIn("test@example.test", "not-a-real-password"),
      { ok: false, reason: "configuration" },
      "Unconfigured Appwrite must fail closed"
    );
    assert.equal(await appwrite.getCurrentIdentity(), null, "Unconfigured Appwrite must not create an identity");

    process.env.DEEPTECHLY_AUTH_PROVIDER = "unsupported";
    assert.equal(configuredAuthProvider(), "supabase", "Unknown providers must fall back to the working provider");

    console.log("Auth provider abstraction verification passed.");
  } finally {
    restore("DEEPTECHLY_AUTH_PROVIDER", previousProvider);
    restore("APPWRITE_ENDPOINT", previousEndpoint);
    restore("APPWRITE_PROJECT_ID", previousProject);
  }
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
