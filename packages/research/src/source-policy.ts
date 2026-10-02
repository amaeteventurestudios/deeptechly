export type ResearchSourceType =
  | "company_site"
  | "government"
  | "patent"
  | "academic"
  | "press_release"
  | "investor"
  | "database"
  | "news"
  | "jobs"
  | "unknown";

export type SourceQualityTier = "official" | "strong" | "moderate" | "weak";

const trackingPrefixes = ["utm_", "vero_", "ga_"];
const trackingParameters = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "msclkid",
  "ref",
  "ref_src",
  "source",
  "spm"
]);
const placeholderHosts = new Set(["example.com", "example.org", "example.net", "localhost"]);

export function isPublishableSourceUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return /^https?:$/.test(url.protocol) && !placeholderHosts.has(hostname) && !hostname.endsWith(".invalid") && !hostname.endsWith(".test");
  } catch {
    return false;
  }
}

export function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...parsed.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (trackingParameters.has(lower) || trackingPrefixes.some((prefix) => lower.startsWith(prefix))) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    return parsed.pathname === "/" && !parsed.search
      ? `${parsed.protocol}//${parsed.hostname}`
      : parsed.toString();
  } catch {
    return url.trim();
  }
}

export function publisherFromUrl(url: string) {
  try {
    return new URL(normalizeSourceUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function qualityForSourceType(sourceType: ResearchSourceType): SourceQualityTier {
  if (["company_site", "government", "patent", "academic"].includes(sourceType)) return "official";
  if (["press_release", "investor", "database"].includes(sourceType)) return "strong";
  if (sourceType === "news" || sourceType === "jobs") return "moderate";
  return "weak";
}
