"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import {
  createInviteCode,
  disableInviteCode,
  isAdminEmail
} from "@/lib/admin/invite-codes";

const ADMIN_ROUTE = "/admin/invite-codes";
const ACCESS_TIERS = new Set(["institutional", "enterprise", "research"]);

export async function createInviteCodeAction(formData: FormData) {
  await requireAdminAccess();

  const organization = getField(formData, "organization");
  const accessTier = getAccessTier(getField(formData, "accessTier"));
  const maxUses = getMaxUses(getField(formData, "maxUses"));
  const expiresAt = getExpiresAt(getField(formData, "expiresAt"));

  if (!organization || !accessTier || !maxUses || !expiresAt) {
    redirectWithError("invalid");
  }

  const result = await createInviteCode({
    organization,
    accessTier,
    maxUses,
    expiresAt
  });

  if (!result.ok) {
    redirectWithError(result.reason);
  }

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?created=${encodeURIComponent(result.inviteCode.code)}`);
}

export async function disableInviteCodeAction(formData: FormData) {
  await requireAdminAccess();

  const inviteCodeId = getField(formData, "inviteCodeId");

  if (!isUuid(inviteCodeId)) {
    redirectWithError("invalid");
  }

  const result = await disableInviteCode(inviteCodeId);

  if (!result.ok) {
    redirectWithError(result.reason);
  }

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?disabled=${encodeURIComponent(result.code)}`);
}

async function requireAdminAccess() {
  const session = await getAuthSession();

  if (!session) {
    redirect(`/sign-in?redirectTo=${encodeURIComponent(ADMIN_ROUTE)}`);
  }

  if (!isAdminEmail(session.email)) {
    forbidden();
  }
}

function redirectWithError(error: string): never {
  redirect(`${ADMIN_ROUTE}?error=${encodeURIComponent(error)}`);
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getAccessTier(value: string) {
  const normalizedValue = value.toLowerCase();
  return ACCESS_TIERS.has(normalizedValue) ? normalizedValue : "";
}

function getMaxUses(value: string) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

function getExpiresAt(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const expirationDate = new Date(`${value}T23:59:59.999Z`);

  if (Number.isNaN(expirationDate.getTime())) {
    return null;
  }

  return expirationDate.toISOString();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
