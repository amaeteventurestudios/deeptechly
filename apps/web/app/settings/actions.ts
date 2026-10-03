"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getAccountRole } from "@/lib/auth/profiles";
import { hasPermission, normalizeApplicationRole, type Permission } from "@/lib/auth/authorization";
import { recordAuthAudit } from "@/lib/auth/audit";
import { setAccountStatus, setUserRole } from "@/lib/admin/users";
import {
  addAiModel,
  addAiProvider,
  cancelUserInvitation,
  createUserInvitation,
  saveAccountPreferences,
  saveSmtpConfiguration,
  getSmtpRuntimeConfiguration,
  recordSmtpTest,
  saveModelAssignment,
  testAiModel,
  updateAiProvider,
  saveSystemSetting
} from "@/lib/settings/store";
import { sendSmtpTestEmail } from "@/lib/settings/smtp";
import { getPocketBaseConfig } from "@/lib/pocketbase/config";
import { pocketBaseRequest } from "@/lib/pocketbase/rest";

const SETTINGS = "/settings";

export async function saveAppearanceAction(formData: FormData) {
  const session = await requirePermission("settings.self");
  await saveAccountPreferences(session.userId, {
    theme: choice(formData, "theme", ["light", "dark", "system"], "system"),
    density: choice(formData, "density", ["comfortable", "compact"], "comfortable"),
    reducedMotion: formData.get("reducedMotion") === "on"
  });
  done("appearance");
}

export async function saveGeneralAction(formData: FormData) {
  const session = await requirePermission("settings.routine");
  await saveSystemSetting("general", {
    applicationName: text(formData, "applicationName", 100),
    canonicalUrl: text(formData, "canonicalUrl", 300),
    timezone: text(formData, "timezone", 80),
    language: text(formData, "language", 20)
  }, session.userId);
  done("general");
}

export async function saveResearchAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  await saveSystemSetting("research", {
    searchDepth: choice(formData, "searchDepth", ["focused", "balanced", "deep"], "balanced"),
    sourceRequirement: integer(formData, "sourceRequirement", 1, 20, 3),
    verificationRequired: checked(formData, "verificationRequired"),
    minimumPublicationConfidence: number(formData, "minimumPublicationConfidence", 0.5, 1, 0.75),
    imageAcquisition: checked(formData, "imageAcquisition"),
    technologyStackMapping: checked(formData, "technologyStackMapping"),
    governmentRelevance: checked(formData, "governmentRelevance"),
    readinessEstimation: checked(formData, "readinessEstimation"),
    gapFilling: checked(formData, "gapFilling"),
    contradictionHandling: choice(formData, "contradictionHandling", ["review", "block"], "review"),
    publicationReviewRequired: checked(formData, "publicationReviewRequired")
  }, session.userId);
  done("research");
}

export async function savePublishingAction(formData: FormData) {
  const session = await requirePermission("settings.routine");
  await saveSystemSetting("publishing", {
    articleDefault: choice(formData, "articleDefault", ["draft", "review"], "draft"),
    profileDefault: choice(formData, "profileDefault", ["draft", "review"], "draft"),
    dossierAvailability: choice(formData, "dossierAvailability", ["gated", "private", "public-eligible"], "gated"),
    reviewRequired: checked(formData, "reviewRequired"),
    homepageEligibility: "policy",
    archiveVisibility: checked(formData, "archiveVisibility"),
    markdownPublication: checked(formData, "markdownPublication"),
    publicArtifactBehavior: "eligibility-policy"
  }, session.userId);
  done("publishing");
}

export async function saveNotificationsAction(formData: FormData) {
  const session = await requirePermission("settings.self");
  await saveAccountPreferences(session.userId, { notifications: {
    researchCompleted: checked(formData, "researchCompleted"), researchFailed: checked(formData, "researchFailed"),
    accountInvites: checked(formData, "accountInvites"), publicationNotices: checked(formData, "publicationNotices"),
    systemAlerts: session.isAdmin && checked(formData, "systemAlerts")
  } });
  done("notifications");
}

export async function saveRetentionAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  await saveSystemSetting("retention", {
    authAuditDays: integer(formData, "authAuditDays", 30, 2555, 365),
    operationalAuditDays: integer(formData, "operationalAuditDays", 30, 2555, 180),
    researchEventDays: integer(formData, "researchEventDays", 30, 3650, 730)
  }, session.userId);
  done("retention");
}

export async function addAiProviderAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  await addAiProvider({ name: text(formData, "name", 100), providerType: text(formData, "providerType", 50), baseUrl: text(formData, "baseUrl", 300), secret: raw(formData, "secret"), accountId: session.userId });
  await recordAuthAudit({ eventType: "ai_provider_created", outcome: "success", actorAccountId: session.userId });
  done("ai-models");
}

export async function addAiModelAction(formData: FormData) {
  await requirePermission("settings.protected");
  await addAiModel({ providerId: text(formData, "providerId", 128), modelKey: text(formData, "modelKey", 160), displayName: text(formData, "displayName", 160) });
  done("ai-models");
}

export async function updateAiProviderAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  await updateAiProvider({
    id: text(formData, "providerId", 128),
    baseUrl: text(formData, "baseUrl", 300),
    secret: raw(formData, "secret"),
    enabled: checked(formData, "enabled"),
    accountId: session.userId
  });
  await recordAuthAudit({ eventType: "ai_provider_updated", outcome: "success", actorAccountId: session.userId });
  done("ai-models");
}

export async function saveModelAssignmentAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  await saveModelAssignment({
    roleKey: text(formData, "roleKey", 100), primaryModelId: raw(formData, "primaryModelId") || undefined,
    fallbackModelId: raw(formData, "fallbackModelId") || undefined, enabled: checked(formData, "enabled"),
    budgetCents: optionalInteger(formData, "budgetCents", 0, 10_000_000), timeoutMs: optionalInteger(formData, "timeoutMs", 1000, 600_000),
    maxRetries: optionalInteger(formData, "maxRetries", 0, 10), accountId: session.userId
  });
  done("ai-models");
}

export async function testAiModelAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  const result = await testAiModel(text(formData, "modelId", 128));
  await recordAuthAudit({ eventType: "ai_model_tested", outcome: result.ok ? "success" : "failure", actorAccountId: session.userId });
  done("ai-models");
}

export async function saveSmtpAction(formData: FormData) {
  const session = await requirePermission("settings.protected");
  await saveSmtpConfiguration({ host: text(formData, "host", 255), port: integer(formData, "port", 1, 65535, 587), username: text(formData, "username", 255), password: raw(formData, "password"), security: choice(formData, "security", ["starttls", "tls", "none"], "starttls"), senderName: text(formData, "senderName", 160), senderEmail: text(formData, "senderEmail", 255), replyToEmail: text(formData, "replyToEmail", 255), accountId: session.userId });
  await recordAuthAudit({ eventType: "smtp_configuration_updated", outcome: "success", actorAccountId: session.userId });
  done("email");
}

export async function sendSmtpTestAction() {
  const session = await requirePermission("settings.protected");
  const config = await getSmtpRuntimeConfiguration();
  if (!config) { await recordSmtpTest("Not configured"); done("email"); }
  try {
    await sendSmtpTestEmail(config);
    await recordSmtpTest("Passed");
    await recordAuthAudit({ eventType: "smtp_test_sent", outcome: "success", actorAccountId: session.userId });
  } catch (error) {
    await recordSmtpTest(error instanceof Error ? `Failed: ${error.message.slice(0, 160)}` : "Failed");
    await recordAuthAudit({ eventType: "smtp_test_sent", outcome: "failure", actorAccountId: session.userId });
  }
  done("email");
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requirePermission("users.manage");
  const targetId = text(formData, "accountId", 128);
  const role = normalizeApplicationRole(raw(formData, "role"));
  if ((await getAccountRole(targetId)) === "SUPER_ADMIN" && !session.isSuperAdmin) forbidden();
  if ((role === "SUPER_ADMIN" || role === "ADMIN") && !session.isSuperAdmin) forbidden();
  if (targetId === session.userId && role !== "SUPER_ADMIN") forbidden();
  await setUserRole(targetId, role, session.userId);
  await recordAuthAudit({ eventType: "role_changed", outcome: "success", actorAccountId: session.userId, targetAccountId: targetId, metadata: { role } });
  done("users");
}

export async function updateUserStatusAction(formData: FormData) {
  const session = await requirePermission("users.manage");
  const targetId = text(formData, "accountId", 128);
  if (targetId === session.userId) forbidden();
  if ((await getAccountRole(targetId)) === "SUPER_ADMIN" && !session.isSuperAdmin) forbidden();
  const status = choice(formData, "status", ["active", "suspended"], "suspended") as "active" | "suspended";
  await setAccountStatus(targetId, status);
  await recordAuthAudit({ eventType: status === "active" ? "account_reactivated" : "account_suspended", outcome: "success", actorAccountId: session.userId, targetAccountId: targetId });
  done("users");
}

export async function triggerPasswordRecoveryAction(formData: FormData) {
  const session = await requirePermission("users.manage");
  const targetId = text(formData, "accountId", 128);
  if ((await getAccountRole(targetId)) === "SUPER_ADMIN" && !session.isSuperAdmin) forbidden();
  const email = text(formData, "email", 255).toLowerCase();
  const config = getPocketBaseConfig();
  if (config) {
    await pocketBaseRequest(`/api/collections/${encodeURIComponent(config.collection)}/request-password-reset`, {
      method: "POST", body: JSON.stringify({ email })
    });
  }
  await recordAuthAudit({ eventType: "password_recovery_requested_by_admin", outcome: config ? "success" : "failure", actorAccountId: session.userId, targetAccountId: targetId, identifier: email });
  done("users");
}

export async function createInvitationAction(formData: FormData) {
  const session = await requirePermission("users.manage");
  const role = normalizeApplicationRole(raw(formData, "role"));
  if ((role === "ADMIN" || role === "SUPER_ADMIN") && !session.isSuperAdmin) forbidden();
  const email = text(formData, "email", 255).toLowerCase();
  const result = await createUserInvitation({ email, role, organization: text(formData, "organization", 160), invitedBy: session.userId });
  await recordAuthAudit({ eventType: "invitation_created", outcome: result.ok ? "success" : "failure", actorAccountId: session.userId, identifier: email, metadata: { role } });
  done("invitations");
}

export async function cancelInvitationAction(formData: FormData) {
  const session = await requirePermission("users.manage");
  await cancelUserInvitation(text(formData, "invitationId", 128));
  await recordAuthAudit({ eventType: "invitation_cancelled", outcome: "success", actorAccountId: session.userId });
  done("invitations");
}

async function requirePermission(permission: Permission) {
  const session = await getAuthSession();
  if (!session) redirect(`/sign-in?redirectTo=${encodeURIComponent(SETTINGS)}`);
  if (!hasPermission(session, permission)) forbidden();
  return session;
}

function done(section: string): never { revalidatePath(SETTINGS); redirect(`${SETTINGS}?section=${section}&saved=1`); }
function raw(data: FormData, key: string) { const value = data.get(key); return typeof value === "string" ? value.trim() : ""; }
function text(data: FormData, key: string, max: number) { return raw(data, key).slice(0, max); }
function checked(data: FormData, key: string) { return data.get(key) === "on"; }
function choice(data: FormData, key: string, allowed: readonly string[], fallback: string) { const value = raw(data, key); return allowed.includes(value) ? value : fallback; }
function integer(data: FormData, key: string, min: number, max: number, fallback: number) { const value = Number.parseInt(raw(data, key), 10); return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }
function number(data: FormData, key: string, min: number, max: number, fallback: number) { const value = Number.parseFloat(raw(data, key)); return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }
function optionalInteger(data: FormData, key: string, min: number, max: number) { const rawValue = raw(data, key); if (!rawValue) return undefined; const value = Number.parseInt(rawValue, 10); return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined; }
