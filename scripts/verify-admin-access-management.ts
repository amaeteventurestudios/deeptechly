import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (
    request: string,
    parent: unknown,
    isMain: boolean,
    options?: unknown
  ) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");

moduleLoader._resolveFilename = function resolveServerOnly(
  request: string,
  parent: unknown,
  isMain: boolean,
  options?: unknown
) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

let inviteCodes!: typeof import("@/lib/admin/invite-codes");
let adminUsers!: typeof import("@/lib/admin/users");

type InviteRecord = import("@/lib/admin/invite-codes").InviteCodeRecord;

function inviteCode(overrides: Partial<InviteRecord> = {}): InviteRecord {
  return {
    id: "invite_test",
    code: "DTLY-ABCD-EFGH-2345",
    organization: "Phase 15 test",
    tier: "institutional",
    max_uses: 1,
    used_count: 0,
    expires_at: null,
    disabled_at: null,
    created_at: "2026-05-18T00:00:00.000Z",
    ...overrides
  };
}

async function main() {
  inviteCodes = await import("@/lib/admin/invite-codes");
  adminUsers = await import("@/lib/admin/users");

  verifyInviteCodeGenerator();
  verifyInviteCodeStatuses();
  verifyAdminUserFormatting();
  verifyMissingSchemaFallbacks();
  verifyAdminEmailGate();
  verifyServerOnlyInviteGeneration();

  console.log("Admin access-management verification passed.");
}

function verifyInviteCodeGenerator() {
  const generatedCodes = new Set<string>();

  for (let index = 0; index < 100; index += 1) {
    const code = inviteCodes.generateInviteCode();
    assert.match(code, /^DTLY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    generatedCodes.add(code);
  }

  assert.equal(generatedCodes.size, 100);
}

function verifyInviteCodeStatuses() {
  const now = new Date("2026-05-18T12:00:00.000Z");

  assert.deepEqual(
    inviteCodes.getInviteCodeStatus(inviteCode(), now),
    {
      isActive: true,
      label: "Active",
      reason: "Redeemable"
    }
  );

  assert.equal(
    inviteCodes.getInviteCodeStatus(
      inviteCode({ disabled_at: "2026-05-18T00:00:00.000Z" }),
      now
    ).label,
    "Disabled"
  );
  assert.equal(
    inviteCodes.getInviteCodeStatus(
      inviteCode({ expires_at: "2026-05-17T23:59:59.999Z" }),
      now
    ).label,
    "Expired"
  );
  assert.equal(
    inviteCodes.getInviteCodeStatus(inviteCode({ used_count: 1 }), now).label,
    "Maxed out"
  );
}

function verifyAdminUserFormatting() {
  assert.equal(
    adminUsers.getAdminUserInstitutionalStatus({
      isInstitutionalVerified: true,
      institutionalRequestPending: true
    }),
    "Verified"
  );
  assert.equal(
    adminUsers.getAdminUserInstitutionalStatus({
      isInstitutionalVerified: false,
      institutionalRequestPending: true
    }),
    "Pending review"
  );
  assert.equal(
    adminUsers.getAdminUserInstitutionalStatus({
      isInstitutionalVerified: false,
      institutionalRequestPending: false
    }),
    "Not verified"
  );
}

function verifyMissingSchemaFallbacks() {
  const normalized = inviteCodes.normalizeInviteCodeRecord({
    code: "DTLY-ABCD-EFGH-2345"
  });

  assert.equal(normalized.organization, null);
  assert.equal(normalized.tier, null);
  assert.equal(normalized.used_count, 0);
  assert.equal(normalized.redeemed_users, null);
  assert.equal(adminUsers.displayAdminStoredValue(null), "Not stored");
  assert.equal(adminUsers.displayAdminStoredValue(""), "Not stored");
  assert.equal(adminUsers.displayAdminStoredValue(" Example "), " Example ");
}

function verifyAdminEmailGate() {
  const previousAdminEmails = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "phase15-admin.invalid, ops.invalid";

  assert.equal(inviteCodes.isAdminEmail("phase15-admin.invalid"), true);
  assert.equal(inviteCodes.isAdminEmail("OPS.invalid"), true);
  assert.equal(inviteCodes.isAdminEmail("member.invalid"), false);
  assert.equal(inviteCodes.isAdminEmail(null), false);

  if (previousAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = previousAdminEmails;
  }
}

function verifyServerOnlyInviteGeneration() {
  const inviteLibrary = readFileSync("lib/admin/invite-codes.ts", "utf8");
  const inviteActions = readFileSync("app/admin/invite-codes/actions.ts", "utf8");
  const copyButton = readFileSync(
    "components/admin/CopyInviteCodeButton.tsx",
    "utf8"
  );

  assert.match(inviteLibrary, /import "server-only";/);
  assert.match(inviteActions, /"use server";/);
  assert.match(inviteActions, /createInviteCode/);
  assert.doesNotMatch(copyButton, /createInviteCode|generateInviteCode/);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
