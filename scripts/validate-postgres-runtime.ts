import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { persistUserProfile, getUserProfile, hashInviteCode, resolveInstitutionalInvite } from "../apps/web/lib/auth/profiles";
import { verifyInstitutionalAccess } from "../apps/web/lib/admin/users";
import { setUserRole } from "../apps/web/lib/admin/users";
import { getAccountRole } from "../apps/web/lib/auth/profiles";
import { recordAuthAudit } from "../apps/web/lib/auth/audit";
import { addAiProvider, getAccountPreferences, saveAccountPreferences, saveSmtpConfiguration, saveSystemSetting } from "../apps/web/lib/settings/store";
import { requirePostgres } from "../apps/web/lib/database/postgres";
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
  process.env.DEEPTECHLY_SETTINGS_ENCRYPTION_KEY ||= Buffer.alloc(32, 11).toString("base64");
  const sql = requirePostgres();
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
  assert.equal(await getAccountRole(freeAccountId), "USER");

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

  const inviteCode = "DTLY-RUNTIME-TEST-ONLY";
  await sql`
    insert into deeptechly.invite_codes (
      id, code_hash, code_hint, organization, capability, max_uses, used_count, created_at
    ) values (
      'runtime-test-invite', ${hashInviteCode(inviteCode)}, 'DTLY-RUNT-••••-••••',
      'Runtime test', 'institutional', 1, 0, now()
    ) on conflict (id) do update set used_count = 0, disabled_at = null
  `;
  const resolution = await resolveInstitutionalInvite(inviteCode);
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
  assert.deepEqual(await setUserRole(freeAccountId, "VIEWER", invitedAccountId), { ok: true });
  assert.equal(await getAccountRole(freeAccountId), "VIEWER");

  assert.deepEqual(await saveAccountPreferences(freeAccountId, { theme: "dark", density: "compact" }), { ok: true });
  assert.equal((await getAccountPreferences(freeAccountId)).theme, "dark");
  assert.deepEqual(await saveSystemSetting("general", { applicationName: "DeepTechly Runtime Test" }, invitedAccountId), { ok: true });
  assert.deepEqual(await addAiProvider({ name: "Runtime provider", providerType: "openai-compatible", secret: "runtime-ai-secret", accountId: invitedAccountId }), { ok: true });
  assert.deepEqual(await saveSmtpConfiguration({ host: "smtp.example.test", port: 587, username: "runtime", password: "runtime-smtp-secret", security: "starttls", senderName: "DeepTechly", senderEmail: "runtime@example.test", replyToEmail: "", accountId: invitedAccountId }), { ok: true });
  await recordAuthAudit({ eventType: "runtime_validation", outcome: "success", actorAccountId: invitedAccountId });
  const secrets = await sql<{ ai: string; smtp: string }[]>`select (select secret_ciphertext from deeptechly.ai_providers where name = 'Runtime provider' limit 1) ai, (select password_ciphertext from deeptechly.smtp_configuration where id = 'primary') smtp`;
  assert.ok(secrets[0]?.ai && !secrets[0].ai.includes("runtime-ai-secret"));
  assert.ok(secrets[0]?.smtp && !secrets[0].smtp.includes("runtime-smtp-secret"));

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
    rolePolicyWrites: 1,
    settingsWrites: 4,
    encryptedSecretWrites: 2,
    authAuditWrites: 1,
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
