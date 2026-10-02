"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/invite-codes";
import { verifyInstitutionalAccess, revokeInstitutionalAccess } from "@/lib/admin/users";

const ADMIN_ROUTE = "/admin/users";

export async function verifyUserAction(formData: FormData) {
  await requireAdminAccess();
  const authUserId = getField(formData, "authUserId");
  if (!isUuid(authUserId)) redirectWithError("invalid");

  const result = await verifyInstitutionalAccess(authUserId);
  if (!result.ok) redirectWithError(result.reason);

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?verified=${encodeURIComponent(authUserId)}`);
}

export async function revokeUserAction(formData: FormData) {
  await requireAdminAccess();
  const authUserId = getField(formData, "authUserId");
  if (!isUuid(authUserId)) redirectWithError("invalid");

  const result = await revokeInstitutionalAccess(authUserId);
  if (!result.ok) redirectWithError(result.reason);

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?revoked=${encodeURIComponent(authUserId)}`);
}

async function requireAdminAccess() {
  const session = await getAuthSession();
  if (!session) redirect(`/sign-in?redirectTo=${encodeURIComponent(ADMIN_ROUTE)}`);
  if (!isAdminEmail(session.email)) forbidden();
}

function redirectWithError(error: string): never {
  redirect(`${ADMIN_ROUTE}?error=${encodeURIComponent(error)}`);
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
