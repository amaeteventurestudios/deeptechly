export type PocketBaseConfig = {
  url: string;
  collection: string;
  authCookieName: string;
  superuserToken?: string;
  superuserEmail?: string;
  superuserPassword?: string;
};

export function getPocketBaseConfig(): PocketBaseConfig | null {
  const url = process.env.POCKETBASE_URL?.trim().replace(/\/$/, "");
  if (!url) return null;
  return {
    url,
    collection: process.env.POCKETBASE_AUTH_COLLECTION?.trim() || "users",
    authCookieName: process.env.POCKETBASE_AUTH_COOKIE_NAME?.trim() || "deeptechly_auth",
    superuserToken: process.env.POCKETBASE_SUPERUSER_TOKEN?.trim() || undefined,
    superuserEmail: process.env.POCKETBASE_SUPERUSER_EMAIL?.trim() || undefined,
    superuserPassword: process.env.POCKETBASE_SUPERUSER_PASSWORD || undefined
  };
}

export function getSiteUrl(requestUrl?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}
