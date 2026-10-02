import type { ExternalIdentity } from "@deeptechly/kernel";
import { cookies } from "next/headers";
import { getAppwriteConfig } from "@/lib/appwrite/config";
import { getAppwriteIdentity } from "./appwrite";

export async function getServerIdentity(): Promise<ExternalIdentity | null> {
  const config = getAppwriteConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  const session = cookieStore.get(config.sessionCookieName)?.value;
  if (!session) return null;
  return getAppwriteIdentity(session);
}
