import type { ExternalIdentity } from "@deeptechly/kernel";
import { cookies } from "next/headers";
import { getPocketBaseConfig } from "@/lib/pocketbase/config";
import { refreshPocketBaseIdentity } from "./pocketbase";

export async function getServerIdentity(): Promise<ExternalIdentity | null> {
  const config = getPocketBaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  const session = cookieStore.get(config.authCookieName)?.value;
  if (!session) return null;
  const auth = await refreshPocketBaseIdentity(session);
  return auth
    ? {
        provider: "pocketbase",
        providerUserId: auth.record.id,
        email: auth.record.email || null,
        displayName: auth.record.name || null,
        emailVerified: Boolean(auth.record.verified)
      }
    : null;
}
