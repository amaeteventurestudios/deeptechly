import { randomUUID } from "node:crypto";
import { getPostgres } from "@/lib/database/postgres";
import { decryptServerSecret, encryptServerSecret } from "./secrets";
import { createHash, randomBytes } from "node:crypto";

export type SettingValue = Record<string, string | number | boolean | null>;
type JsonValue = null | string | number | boolean | readonly JsonValue[] | { readonly [key: string]: JsonValue | undefined };

export const settingDefaults: Record<string, SettingValue> = {
  general: { applicationName: "DeepTechly", canonicalUrl: "", timezone: "UTC", language: "en" },
  research: { searchDepth: "balanced", sourceRequirement: 3, verificationRequired: true, minimumPublicationConfidence: 0.75, imageAcquisition: true, technologyStackMapping: true, governmentRelevance: true, readinessEstimation: true, gapFilling: true, contradictionHandling: "review", publicationReviewRequired: true },
  publishing: { articleDefault: "draft", profileDefault: "draft", dossierAvailability: "gated", reviewRequired: true, homepageEligibility: "policy", archiveVisibility: true, markdownPublication: true, publicArtifactBehavior: "eligibility-policy" },
  retention: { authAuditDays: 365, operationalAuditDays: 180, researchEventDays: 730 }
};

export async function getSystemSetting(key: string) {
  const sql = getPostgres();
  if (!sql) return settingDefaults[key] || {};
  const rows = await sql<{ value: SettingValue }[]>`select value from deeptechly.system_settings where key = ${key}`;
  return { ...(settingDefaults[key] || {}), ...(rows[0]?.value || {}) };
}

export async function saveSystemSetting(key: string, value: SettingValue, accountId: string) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  await sql`
    insert into deeptechly.system_settings (key, value, updated_by, created_at, updated_at)
    values (${key}, ${sql.json(value)}, ${accountId}, now(), now())
    on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()
  `;
  return { ok: true as const };
}

export async function getAccountPreferences(accountId: string) {
  const sql = getPostgres();
  const defaults = { theme: "system", density: "comfortable", reducedMotion: false, notifications: { researchCompleted: true, researchFailed: true, accountInvites: true, publicationNotices: false, systemAlerts: false } };
  if (!sql) return defaults;
  const rows = await sql<{ preferences: typeof defaults }[]>`select preferences from deeptechly.account_preferences where account_id = ${accountId}`;
  return { ...defaults, ...(rows[0]?.preferences || {}) };
}

export async function saveAccountPreferences(accountId: string, preferences: Record<string, JsonValue>) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  await sql`
    insert into deeptechly.account_preferences (account_id, preferences, updated_at)
    values (${accountId}, ${sql.json(preferences)}, now())
    on conflict (account_id) do update set preferences = deeptechly.account_preferences.preferences || excluded.preferences, updated_at = now()
  `;
  return { ok: true as const };
}

export async function getAiConfiguration() {
  const sql = getPostgres();
  if (!sql) return { providers: [], models: [], assignments: [] };
  const [providers, models, assignments] = await Promise.all([
    sql`select id, name, provider_type as "providerType", base_url as "baseUrl", enabled, (secret_ciphertext is not null) as "credentialSaved", last_test_status as "lastTestStatus", last_tested_at as "lastTestedAt" from deeptechly.ai_providers order by name`,
    sql`select id, provider_id as "providerId", model_key as "modelKey", display_name as "displayName", enabled from deeptechly.ai_models order by display_name`,
    sql`select role_key as "roleKey", primary_model_id as "primaryModelId", fallback_model_id as "fallbackModelId", enabled, budget_cents as "budgetCents", timeout_ms as "timeoutMs", max_retries as "maxRetries" from deeptechly.ai_model_assignments order by role_key`
  ]);
  return { providers: [...providers], models: [...models], assignments: [...assignments] };
}

export async function addAiProvider(input: { name: string; providerType: string; baseUrl?: string; secret?: string; accountId: string }) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const secretCiphertext = input.secret ? encryptServerSecret(input.secret) : null;
  await sql`insert into deeptechly.ai_providers (id, name, provider_type, base_url, secret_ciphertext, created_by, created_at, updated_at) values (${randomUUID()}, ${input.name}, ${input.providerType}, ${input.baseUrl || null}, ${secretCiphertext}, ${input.accountId}, now(), now())`;
  return { ok: true as const };
}

export async function updateAiProvider(input: { id: string; baseUrl?: string; secret?: string; enabled: boolean; accountId: string }) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const secretCiphertext = input.secret ? encryptServerSecret(input.secret) : null;
  const rows = await sql<{ id: string }[]>`
    update deeptechly.ai_providers set
      base_url = ${input.baseUrl || null},
      secret_ciphertext = coalesce(${secretCiphertext}, secret_ciphertext),
      enabled = ${input.enabled},
      updated_by = ${input.accountId},
      updated_at = now()
    where id = ${input.id}
    returning id
  `;
  return rows[0] ? { ok: true as const } : { ok: false as const, reason: "not_found" };
}

export async function addAiModel(input: { providerId: string; modelKey: string; displayName: string }) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  await sql`insert into deeptechly.ai_models (id, provider_id, model_key, display_name, created_at, updated_at) values (${randomUUID()}, ${input.providerId}, ${input.modelKey}, ${input.displayName}, now(), now()) on conflict (provider_id, model_key) do update set display_name = excluded.display_name, updated_at = now()`;
  return { ok: true as const };
}

export async function getSmtpConfiguration() {
  const sql = getPostgres();
  if (!sql) return { configured: false, credentialSaved: false };
  const rows = await sql`select host, port, username, security, sender_name as "senderName", sender_email as "senderEmail", reply_to_email as "replyToEmail", (password_ciphertext is not null) as "credentialSaved", last_test_status as "lastTestStatus", last_tested_at as "lastTestedAt" from deeptechly.smtp_configuration where id = 'primary'`;
  const row = rows[0];
  return row ? { ...row, configured: Boolean(row.host && row.senderEmail) } : { configured: false, credentialSaved: false };
}

export async function saveSmtpConfiguration(input: { host: string; port: number; username: string; password: string; security: string; senderName: string; senderEmail: string; replyToEmail: string; accountId: string }) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const passwordCiphertext = input.password ? encryptServerSecret(input.password) : null;
  await sql`
    insert into deeptechly.smtp_configuration (id, host, port, username, password_ciphertext, security, sender_name, sender_email, reply_to_email, updated_by, updated_at)
    values ('primary', ${input.host}, ${input.port}, ${input.username || null}, ${passwordCiphertext}, ${input.security}, ${input.senderName}, ${input.senderEmail}, ${input.replyToEmail || null}, ${input.accountId}, now())
    on conflict (id) do update set host = excluded.host, port = excluded.port, username = excluded.username,
      password_ciphertext = coalesce(excluded.password_ciphertext, deeptechly.smtp_configuration.password_ciphertext),
      security = excluded.security, sender_name = excluded.sender_name, sender_email = excluded.sender_email,
      reply_to_email = excluded.reply_to_email, updated_by = excluded.updated_by, updated_at = now()
  `;
  return { ok: true as const };
}

export async function getSmtpRuntimeConfiguration() {
  const sql = getPostgres();
  if (!sql) return null;
  const rows = await sql<{ host: string | null; port: number | null; username: string | null; passwordCiphertext: string | null; security: string | null; senderName: string | null; senderEmail: string | null; replyToEmail: string | null }[]>`
    select host, port, username, password_ciphertext as "passwordCiphertext", security,
      sender_name as "senderName", sender_email as "senderEmail", reply_to_email as "replyToEmail"
    from deeptechly.smtp_configuration where id = 'primary'
  `;
  const row = rows[0];
  if (!row?.host || !row.port || !row.senderEmail) return null;
  return {
    host: row.host,
    port: row.port,
    username: row.username,
    password: row.passwordCiphertext ? decryptServerSecret(row.passwordCiphertext) : "",
    security: row.security,
    senderName: row.senderName,
    senderEmail: row.senderEmail
  };
}

export async function recordSmtpTest(status: string) {
  const sql = getPostgres();
  if (!sql) return;
  await sql`update deeptechly.smtp_configuration set last_test_status = ${status}, last_tested_at = now(), updated_at = now() where id = 'primary'`;
}

export async function saveModelAssignment(input: { roleKey: string; primaryModelId?: string; fallbackModelId?: string; enabled: boolean; budgetCents?: number; timeoutMs?: number; maxRetries?: number; accountId: string }) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  await sql`
    insert into deeptechly.ai_model_assignments (role_key, primary_model_id, fallback_model_id, enabled, budget_cents, timeout_ms, max_retries, updated_by, updated_at)
    values (${input.roleKey}, ${input.primaryModelId || null}, ${input.fallbackModelId || null}, ${input.enabled}, ${input.budgetCents ?? null}, ${input.timeoutMs ?? null}, ${input.maxRetries ?? null}, ${input.accountId}, now())
    on conflict (role_key) do update set primary_model_id = excluded.primary_model_id,
      fallback_model_id = excluded.fallback_model_id, enabled = excluded.enabled,
      budget_cents = excluded.budget_cents, timeout_ms = excluded.timeout_ms,
      max_retries = excluded.max_retries, updated_by = excluded.updated_by, updated_at = now()
  `;
  return { ok: true as const };
}

export async function testAiModel(modelId: string) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const rows = await sql<{ providerId: string; modelKey: string; baseUrl: string | null; secretCiphertext: string | null }[]>`
    select providers.id as "providerId", models.model_key as "modelKey", providers.base_url as "baseUrl",
      providers.secret_ciphertext as "secretCiphertext"
    from deeptechly.ai_models models join deeptechly.ai_providers providers on providers.id = models.provider_id
    where models.id = ${modelId} and models.enabled and providers.enabled limit 1
  `;
  const row = rows[0];
  if (!row?.secretCiphertext) return { ok: false as const, reason: "credential_missing" };
  const baseUrl = (row.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}/models/${encodeURIComponent(row.modelKey)}`, {
      headers: { Authorization: `Bearer ${decryptServerSecret(row.secretCiphertext)}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    const status = response.ok ? "Passed" : `Failed: HTTP ${response.status}`;
    await sql`update deeptechly.ai_providers set last_test_status = ${status}, last_tested_at = now(), updated_at = now() where id = ${row.providerId}`;
    return response.ok ? { ok: true as const } : { ok: false as const, reason: "request_failed" };
  } catch (error) {
    const status = `Failed: ${error instanceof Error ? error.message.slice(0, 140) : "request error"}`;
    await sql`update deeptechly.ai_providers set last_test_status = ${status}, last_tested_at = now(), updated_at = now() where id = ${row.providerId}`;
    return { ok: false as const, reason: "request_failed" };
  }
}

export async function getAuditEvents(limit = 50) {
  const sql = getPostgres();
  if (!sql) return [];
  return sql`select id, event_type as "eventType", outcome, actor_account_id as "actorAccountId", target_account_id as "targetAccountId", metadata, occurred_at as "occurredAt" from deeptechly.auth_audit_events order by occurred_at desc limit ${limit}`;
}

export async function listUserInvitations() {
  const sql = getPostgres();
  if (!sql) return [];
  return sql`select id, email, requested_role as "requestedRole", organization, invited_by as "invitedBy", status, expires_at as "expiresAt", created_at as "createdAt" from deeptechly.user_invitations order by created_at desc`;
}

export async function createUserInvitation(input: { email: string; role: string; organization?: string; invitedBy: string }) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const id = randomUUID();
  await sql`
    insert into deeptechly.user_invitations (id, email, requested_role, organization, token_hash, invited_by, status, expires_at, created_at, updated_at)
    values (${id}, ${input.email}, ${input.role}, ${input.organization || null}, ${tokenHash}, ${input.invitedBy}, 'pending', now() + interval '7 days', now(), now())
  `;
  return { ok: true as const, invitationId: id, token };
}

export async function cancelUserInvitation(id: string) {
  const sql = getPostgres();
  if (!sql) return { ok: false as const, reason: "configuration" };
  const rows = await sql`update deeptechly.user_invitations set status = 'cancelled', updated_at = now() where id = ${id} and status = 'pending' returning id`;
  return rows[0] ? { ok: true as const } : { ok: false as const, reason: "not_found" };
}
