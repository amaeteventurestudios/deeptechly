import "server-only";

import type { Source } from "@/lib/types";
import type { SourceSummary } from "./types";
import { normalizeEntityName } from "./entity-resolution";
import { normalizeSourceUrl, publisherFromUrl } from "./source-quality";

export type ResearchImageResolution = {
  heroImageUrl: string | null;
  heroImageSourceUrl: string | null;
  heroImageAlt: string;
  imageAttribution: string | null;
  sourceOgImageUrl?: string | null;
  entityLogoUrl?: string | null;
  faviconUrl?: string | null;
  resolvedSources: Array<{
    url: string;
    ogImageUrl?: string | null;
    faviconUrl?: string | null;
  }>;
  diagnostics?: string[];
};

type PageImageMetadata = {
  sourceUrl: string;
  canonicalUrl: string;
  title: string;
  description: string;
  publisher: string | null;
  ogImageUrl: string | null;
  twitterImageUrl: string | null;
  faviconUrl: string | null;
  thumbnailUrl: string | null;
  mentionsTarget: boolean;
};

const metadataTimeoutMs = 3500;
const maxSourceMetadataFetches = 5;

export async function resolveResearchImage({
  entityName,
  entityWebsite,
  sector,
  sources
}: {
  entityName: string;
  entityWebsite?: string | null;
  sector: string;
  sources: Array<SourceSummary | Source>;
}): Promise<ResearchImageResolution> {
  const diagnostics: string[] = [];
  const sourceUrls = uniqueUrls(sources.map((source) => source.url)).slice(
    0,
    maxSourceMetadataFetches
  );
  const websiteUrl = entityWebsite ? pageUrl(entityWebsite) : null;
  const urls = uniqueUrls([
    ...sourceUrls,
    ...(websiteUrl ? [websiteUrl] : [])
  ]);
  const metadata = (
    await Promise.all(
      urls.map(async (url) => {
        try {
          return await fetchPageImageMetadata(url, entityName);
        } catch (error) {
          diagnostics.push(
            `Image metadata fetch failed for ${safeUrlForDiagnostic(url)}: ${
              error instanceof Error ? error.name : "unknown"
            }`
          );
          return null;
        }
      })
    )
  ).filter((item): item is PageImageMetadata => Boolean(item));

  const websiteMetadata = websiteUrl
    ? metadata.find((item) => sameUrlHost(item.sourceUrl, websiteUrl))
    : null;
  const sourceMetadata = metadata.filter(
    (item) => !websiteUrl || !sameUrlHost(item.sourceUrl, websiteUrl)
  );
  const sourceOgCandidate = sourceMetadata
    .filter((item) => item.mentionsTarget)
    .map((item) => candidateFromMetadata(item, "og"))
    .find(isResolvedCandidate);
  const websiteOgCandidate = websiteMetadata
    ? candidateFromMetadata(websiteMetadata, "og")
    : null;
  const websiteLogoCandidate = websiteMetadata
    ? candidateFromMetadata(websiteMetadata, "favicon")
    : null;
  const sourceFaviconCandidate = sourceMetadata
    .map((item) => candidateFromMetadata(item, "favicon"))
    .find(isResolvedCandidate);
  const sourceThumbnailCandidate = sourceMetadata
    .map((item) => candidateFromMetadata(item, "thumbnail"))
    .find(isResolvedCandidate);
  const selected =
    sourceOgCandidate ??
    (isResolvedCandidate(websiteOgCandidate) ? websiteOgCandidate : null) ??
    (isResolvedCandidate(websiteLogoCandidate) ? websiteLogoCandidate : null) ??
    sourceThumbnailCandidate ??
    sourceFaviconCandidate ??
    null;

  return {
    heroImageUrl: selected?.url ?? null,
    heroImageSourceUrl: selected?.sourceUrl ?? null,
    heroImageAlt: selected
      ? `${entityName} research image`
      : `${sector || "DeepTechly"} fallback visual`,
    imageAttribution: selected?.publisher
      ? `Image via ${selected.publisher}`
      : selected
        ? "Image via public source"
        : null,
    sourceOgImageUrl:
      sourceOgCandidate?.url ??
      sourceMetadata.map((item) => item.ogImageUrl).find(Boolean) ??
      null,
    entityLogoUrl: websiteLogoCandidate?.url ?? null,
    faviconUrl: websiteLogoCandidate?.url ?? sourceFaviconCandidate?.url ?? null,
    resolvedSources: sourceMetadata.map((item) => ({
      url: item.sourceUrl,
      ogImageUrl: item.ogImageUrl,
      faviconUrl: item.faviconUrl
    })),
    diagnostics: diagnostics.length ? diagnostics.slice(0, 6) : undefined
  };
}

async function fetchPageImageMetadata(
  url: string,
  entityName: string
): Promise<PageImageMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), metadataTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "DeepTechlyResearchBot/0.1 (+https://deeptechly.local/research)"
      },
      signal: controller.signal
    });
    const sourceUrl = response.url || url;
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().includes("text/html")) {
      throw new Error("non_html_metadata_response");
    }

    const html = await response.text();
    const title =
      metaContent(html, "property", "og:title") ||
      tagText(html, "title") ||
      sourceUrl;
    const description =
      metaContent(html, "name", "description") ||
      metaContent(html, "property", "og:description") ||
      "";
    const canonical =
      linkHref(html, "canonical") ??
      sourceUrl;
    const ogImage = firstSafeImage(
      [
        metaContent(html, "property", "og:image"),
        metaContent(html, "property", "og:image:url"),
        metaContent(html, "property", "og:image:secure_url")
      ],
      sourceUrl
    );
    const twitterImage = firstSafeImage(
      [
        metaContent(html, "name", "twitter:image"),
        metaContent(html, "name", "twitter:image:src")
      ],
      sourceUrl
    );
    const favicon =
      firstSafeImage(
        [
          linkHref(html, "apple-touch-icon"),
          linkHref(html, "icon"),
          linkHref(html, "shortcut icon"),
          "/favicon.ico"
        ],
        sourceUrl
      ) ?? null;
    const thumbnail = firstSafeImage(imageSources(html).slice(0, 8), sourceUrl);

    return {
      sourceUrl,
      canonicalUrl: absolutize(canonical, sourceUrl) || sourceUrl,
      title: cleanText(title).slice(0, 180),
      description: cleanText(description).slice(0, 400),
      publisher: publisherFromUrl(sourceUrl) ?? null,
      ogImageUrl: ogImage,
      twitterImageUrl: twitterImage,
      faviconUrl: favicon,
      thumbnailUrl: thumbnail,
      mentionsTarget: mentionsTarget(`${title} ${description}`, entityName)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function candidateFromMetadata(
  metadata: PageImageMetadata,
  kind: "og" | "favicon" | "thumbnail"
) {
  const url =
    kind === "og"
      ? metadata.ogImageUrl ?? metadata.twitterImageUrl
      : kind === "favicon"
        ? metadata.faviconUrl
        : metadata.thumbnailUrl;

  if (!url || !isSafeImageUrl(url, metadata.sourceUrl)) return null;

  return {
    url,
    sourceUrl: metadata.canonicalUrl || metadata.sourceUrl,
    publisher: metadata.publisher
  };
}

function isResolvedCandidate(
  candidate: ReturnType<typeof candidateFromMetadata> | null | undefined
): candidate is NonNullable<ReturnType<typeof candidateFromMetadata>> {
  return Boolean(candidate?.url);
}

function firstSafeImage(values: Array<string | null | undefined>, baseUrl: string) {
  return values
    .map((value) => (value ? absolutize(value, baseUrl) : ""))
    .find((value) => value && isSafeImageUrl(value, baseUrl)) ?? null;
}

function isSafeImageUrl(value: string, baseUrl: string) {
  const url = absolutize(value, baseUrl);
  if (!url || /^data:/i.test(value)) return false;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const lowered = `${parsed.pathname} ${parsed.search}`.toLowerCase();
    if (/\b(?:pixel|spacer|blank|transparent|tracking|1x1)\b/.test(lowered)) {
      return false;
    }
    const width = parsed.searchParams.get("w") ?? parsed.searchParams.get("width");
    const height = parsed.searchParams.get("h") ?? parsed.searchParams.get("height");
    if (Number(width) > 0 && Number(width) <= 2) return false;
    if (Number(height) > 0 && Number(height) <= 2) return false;
    return true;
  } catch {
    return false;
  }
}

function mentionsTarget(text: string, entityName: string) {
  const normalizedTarget = normalizeEntityName(entityName);
  const normalizedText = normalizeEntityName(text);
  if (!normalizedTarget || !normalizedText) return false;
  return normalizedText.includes(normalizedTarget);
}

function metaContent(html: string, key: "name" | "property", value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<meta[^>]+${key}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  return pattern.exec(html)?.[1]?.trim() ?? null;
}

function linkHref(html: string, rel: string) {
  const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exact = new RegExp(
    `<link[^>]+rel=["']${escaped}["'][^>]+href=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const loose = new RegExp(
    `<link[^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`,
    "i"
  );
  return exact.exec(html)?.[1]?.trim() ?? loose.exec(html)?.[1]?.trim() ?? null;
}

function tagText(html: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  return cleanText(pattern.exec(html)?.[1] ?? "");
}

function imageSources(html: string) {
  return Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(
    (match) => match[1]
  );
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absolutize(url: string, base: string) {
  try {
    return new URL(url.trim(), base).toString();
  } catch {
    return "";
  }
}

function pageUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return "";
  }
}

function uniqueUrls(urls: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      urls
        .map((url) => (url ? normalizeSourceUrl(url) : ""))
        .filter((url) => {
          try {
            const parsed = new URL(url);
            return ["http:", "https:"].includes(parsed.protocol);
          } catch {
            return false;
          }
        })
    )
  );
}

function sameUrlHost(a: string, b: string) {
  try {
    return new URL(a).hostname.replace(/^www\./, "") ===
      new URL(b).hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

function safeUrlForDiagnostic(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "unknown";
  }
}
