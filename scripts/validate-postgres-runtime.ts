import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { persistUserProfile, getUserProfile, resolveInstitutionalInvite } from "../apps/web/lib/auth/profiles";
import { createInviteCode } from "../apps/web/lib/admin/invite-codes";
import { verifyInstitutionalAccess } from "../apps/web/lib/admin/users";
import {
  deleteSavedResearchItem,
  listSavedResearchItems,
  saveResearchItem
} from "../apps/web/lib/saved-research";
import {
  readV2PostgresStore,
  writeV2PostgresStore
} from "../apps/web/lib/research/postgres-store";

const outputIndex = process.argv.indexOf("--output");
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
if (!outputPath) throw new Error("Pass --output <aggregate.json>");
const aggregateOutputPath = outputPath;

void main();

async function main() {
  const freeAccountId = "runtime-test-account";
  const invitedAccountId = "runtime-invited-account";
  assert.deepEqual(
    await persistUserProfile({
      authUserId: freeAccountId,
      fullName: "Runtime Test",
      email: "runtime@example.test",
      organization: "Test Only",
      accessPath: "research",
      inviteResolution: {
        accessTier: "free",
        isInstitutionalVerified: false,
        institutionalRequestPending: false,
        inviteStatus: "not_provided"
      }
    }),
    { ok: true }
  );
  const profile = await getUserProfile(freeAccountId);
  assert.equal(profile?.id, freeAccountId);
  assert.equal(profile?.access_tier, "free");

  const saved = await saveResearchItem({
    authUserId: freeAccountId,
    itemId: "runtime-test-item",
    itemType: "profile",
    title: "Runtime persistence test",
    href: "/startup/runtime-test",
    metadata: { synthetic: true }
  });
  assert.equal(saved.ok, true);
  assert.equal((await listSavedResearchItems(freeAccountId)).count, 1);
  assert.deepEqual(await deleteSavedResearchItem(freeAccountId, "runtime-test-item"), { ok: true });
  assert.equal((await listSavedResearchItems(freeAccountId)).count, 0);

  const invite = await createInviteCode({
    label: "Runtime test",
    accessTier: "institutional",
    maxUses: 1,
    expiresAt: null
  });
  assert.equal(invite.ok, true);
  if (!invite.ok) throw new Error("Synthetic invite creation failed");
  const resolution = await resolveInstitutionalInvite(invite.inviteCode.code);
  assert.equal(resolution.inviteStatus, "verified");
  assert.deepEqual(
    await persistUserProfile({
      authUserId: invitedAccountId,
      fullName: "Invited Runtime Test",
      email: "runtime-invited@example.test",
      organization: "Test Only",
      accessPath: "institutional",
      inviteResolution: resolution
    }),
    { ok: true }
  );
  assert.equal((await getUserProfile(invitedAccountId))?.is_institutional_verified, true);
  assert.deepEqual(await verifyInstitutionalAccess(freeAccountId), { ok: true });
  assert.equal((await getUserProfile(freeAccountId))?.is_institutional_verified, true);

  const store = await readV2PostgresStore();
  await writeV2PostgresStore(store);
  const persisted = await readV2PostgresStore();
  assert.deepEqual(
    {
      jobs: persisted.jobs.length,
      entities: persisted.entities.length,
      articles: persisted.articles.length,
      dossiers: persisted.dossiers.length
    },
    {
      jobs: store.jobs.length,
      entities: store.entities.length,
      articles: store.articles.length,
      dossiers: store.dossiers.length
    }
  );

  const report = {
    status: "pass",
    accountProfileWrites: 2,
    savedResearchRoundTrips: 1,
    inviteRedemptions: 1,
    adminGrantUpdates: 1,
    transactionalResearchStoreWrites: 1,
    persistedCounts: {
      jobs: persisted.jobs.length,
      entities: persisted.entities.length,
      articles: persisted.articles.length,
      dossiers: persisted.dossiers.length
    }
  };
  writeFileSync(resolve(aggregateOutputPath), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log("Validated transactional PostgreSQL account, access, saved research, invite, and research-store writes.");
}
