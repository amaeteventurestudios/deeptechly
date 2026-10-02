export type AppwriteConfig = {
  endpoint: string;
  projectId: string;
  apiKey: string;
  sessionCookieName: string;
};

export function getAppwriteConfig(): AppwriteConfig | null {
  const endpoint = process.env.APPWRITE_ENDPOINT?.trim().replace(/\/$/, "");
  const projectId = process.env.APPWRITE_PROJECT_ID?.trim();
  const apiKey = process.env.APPWRITE_API_KEY?.trim();
  if (!endpoint || !projectId || !apiKey) return null;

  return {
    endpoint,
    projectId,
    apiKey,
    sessionCookieName:
      process.env.APPWRITE_SESSION_COOKIE_NAME?.trim() ||
      `a_session_${projectId}`
  };
}

export function getSiteUrl(requestUrl?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}
