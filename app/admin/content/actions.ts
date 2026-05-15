"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/invite-codes";
import {
  publishContent,
  unpublishContent,
  toggleArticleFeatured
} from "@/lib/admin/content";

const ADMIN_ROUTE = "/admin/content";

export async function publishContentAction(formData: FormData) {
  await requireAdminAccess();
  const slug = getField(formData, "slug");
  if (!slug) redirectWithError("invalid");

  const result = await publishContent(slug);
  if (!result.ok) redirectWithError(result.reason);

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?published=${encodeURIComponent(slug)}`);
}

export async function unpublishContentAction(formData: FormData) {
  await requireAdminAccess();
  const slug = getField(formData, "slug");
  if (!slug) redirectWithError("invalid");

  const result = await unpublishContent(slug);
  if (!result.ok) redirectWithError(result.reason);

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?unpublished=${encodeURIComponent(slug)}`);
}

export async function featureContentAction(formData: FormData) {
  await requireAdminAccess();
  const slug = getField(formData, "slug");
  const featured = getField(formData, "featured") === "true";
  if (!slug) redirectWithError("invalid");

  const result = await toggleArticleFeatured(slug, featured);
  if (!result.ok) redirectWithError(result.reason);

  revalidatePath(ADMIN_ROUTE);
  redirect(`${ADMIN_ROUTE}?featured=${encodeURIComponent(slug)}&value=${featured}`);
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
