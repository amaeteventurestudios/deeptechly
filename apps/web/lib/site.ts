export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://deeptechly.vercel.app";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
