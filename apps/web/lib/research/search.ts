import "server-only";

import { normalizeSearchResults } from "./source-quality";
import type { ReadablePage, SearchResult } from "./types";

const provider = process.env.SEARCH_PROVIDER ?? "openai";
const defaultOpenAIModel = "gpt-5.4-mini";
const openAIWebSearchEnabled = process.env.OPENAI_ENABLE_WEB_SEARCH === "true";

export class ResearchSearchError extends Error {
  code: string;
  provider: "openai" | "tavily";
  retryable: boolean;
  status?: number;

  constructor(input: {
    code: string;
    provider: "openai" | "tavily";
    message: string;
    retryable?: boolean;
    status?: number;
  }) {
    super(input.message);
    this.name = "ResearchSearchError";
    this.code = input.code;
    this.provider = input.provider;
    this.retryable = input.retryable ?? false;
    this.status = input.status;
  }
}

const searchResultsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          snippet: { type: "string" }
        },
        required: ["title", "url", "snippet"]
      }
    }
  },
  required: ["results"]
};

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(content: string, pattern: RegExp) {
  return pattern.exec(content)?.[1]?.trim() ?? "";
}

function absolutize(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return "";
  }
}

function isRetryableSearchStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function readProviderError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return response.statusText || "No response body";
  }

  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; type?: string; code?: string };
      message?: string;
    };
    return [parsed.error?.message, parsed.error?.type, parsed.error?.code, parsed.message]
      .filter(Boolean)
      .join(" ");
  } catch {
    return text;
  }
}

function redactProviderError(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/gi, "sk-[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-token]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

export function isProbableDomain(query: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(
    query.replace(/^https?:\/\//, "").trim()
  );
}

export function domainToUrl(query: string) {
  const trimmed = query.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function fetchReadablePage(url: string): Promise<ReadablePage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "DeepTechlyResearchBot/0.1 (+https://deeptechly.local/research)"
      },
      signal: controller.signal
    });
    const finalUrl = response.url || url;
    const html = await response.text();
    const title =
      attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
      attr(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) ||
      finalUrl;
    const description =
      attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) ||
      attr(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
    const ogImage = attr(
      html,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i
    );
    const twitterImage = attr(
      html,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i
    );
    const canonicalUrl = attr(
      html,
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i
    );
    const faviconUrl =
      attr(html, /<link[^>]+rel=["'][^"']*(?:icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)/i) ||
      "/favicon.ico";
    const links = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi))
      .map((match) => absolutize(match[1], finalUrl))
      .filter(Boolean)
      .filter((link, index, all) => all.indexOf(link) === index)
      .slice(0, 80);
    const images = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi))
      .map((match) => absolutize(match[1], finalUrl))
      .filter(Boolean)
      .filter((image, index, all) => all.indexOf(image) === index)
      .slice(0, 40);

    return {
      url: finalUrl,
      title: stripTags(title).slice(0, 180),
      description: stripTags(description).slice(0, 400),
      canonicalUrl: canonicalUrl ? absolutize(canonicalUrl, finalUrl) : finalUrl,
      faviconUrl: faviconUrl ? absolutize(faviconUrl, finalUrl) : null,
      text: stripTags(html).slice(0, 14000),
      links,
      images,
      ogImage: ogImage ? absolutize(ogImage, finalUrl) : null,
      twitterImage: twitterImage ? absolutize(twitterImage, finalUrl) : null
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWithTavily(query: string): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    throw new ResearchSearchError({
      code: "tavily_api_key_missing",
      provider: "tavily",
      message: "SEARCH_PROVIDER is tavily but TAVILY_API_KEY is not configured.",
      retryable: false
    });
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false
    })
  });

  if (!response.ok) {
    const detail = redactProviderError(await readProviderError(response));
    throw new ResearchSearchError({
      code: "tavily_search_failed",
      provider: "tavily",
      status: response.status,
      message: `Tavily search failed (${response.status}): ${detail}`,
      retryable: isRetryableSearchStatus(response.status)
    });
  }

  let body: { results?: { title?: string; url?: string; content?: string }[] };
  try {
    body = (await response.json()) as typeof body;
  } catch (error) {
    throw new ResearchSearchError({
      code: "tavily_search_parse_failed",
      provider: "tavily",
      message:
        error instanceof Error
          ? `Tavily search response could not be parsed: ${error.message}`
          : "Tavily search response could not be parsed.",
      retryable: false
    });
  }

  return (body.results ?? [])
    .filter((item) => item.url)
    .map((item) => ({
      title: item.title ?? item.url!,
      url: item.url!,
      snippet: item.content
    }));
}

async function searchWithOpenAI(query: string): Promise<SearchResult[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return [];
  }
  if (!openAIWebSearchEnabled) {
    throw new ResearchSearchError({
      code: "openai_web_search_disabled",
      provider: "openai",
      message: "OPENAI_ENABLE_WEB_SEARCH must be true when SEARCH_PROVIDER is openai.",
      retryable: false
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? defaultOpenAIModel,
      tools: [{ type: "web_search", external_web_access: true }],
      tool_choice: "auto",
      input: `Search the public web for "${query}". Return JSON only with {"results":[{"title":"","url":"","snippet":""}]}. Keep the best 8 public sources.`,
      text: {
        format: {
          type: "json_schema",
          name: "deeptechly_search_results",
          strict: true,
          schema: searchResultsSchema
        }
      }
    })
  });

  if (!response.ok) {
    const detail = redactProviderError(await readProviderError(response));
    throw new ResearchSearchError({
      code: "openai_web_search_failed",
      provider: "openai",
      status: response.status,
      message: `OpenAI web search failed (${response.status}): ${detail}`,
      retryable: isRetryableSearchStatus(response.status)
    });
  }

  let body: {
    output_text?: string;
    output?: { content?: { text?: string }[] }[];
  };
  try {
    body = (await response.json()) as typeof body;
  } catch (error) {
    throw new ResearchSearchError({
      code: "openai_web_search_parse_failed",
      provider: "openai",
      message:
        error instanceof Error
          ? `OpenAI web search response could not be parsed: ${error.message}`
          : "OpenAI web search response could not be parsed.",
      retryable: false
    });
  }
  const outputText =
    body.output_text ??
    body.output
      ?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? [])
      .map((item: { text?: string }) => item.text ?? "")
      .join("");

  try {
    const parsed = JSON.parse(outputText || "{}") as {
      results?: SearchResult[];
    };
    return (parsed.results ?? []).filter((item) => item.url).slice(0, 8);
  } catch (error) {
    throw new ResearchSearchError({
      code: "openai_web_search_parse_failed",
      provider: "openai",
      message:
        error instanceof Error
          ? `OpenAI web search response could not be parsed: ${error.message}`
          : "OpenAI web search response could not be parsed.",
      retryable: false
    });
  }
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const results =
    provider === "tavily"
      ? await searchWithTavily(query)
      : await searchWithOpenAI(query);

  return normalizeSearchResults(results);
}

export function selectHeroImage(page: ReadablePage | null) {
  if (!page) {
    return null;
  }

  return page.ogImage ?? page.twitterImage ?? page.images[0] ?? null;
}

export function pickImportantInternalLinks(page: ReadablePage) {
  const host = new URL(page.url).host.replace(/^www\./, "");
  const needles = [
    "about",
    "team",
    "founder",
    "career",
    "jobs",
    "blog",
    "news",
    "product",
    "technology",
    "patent",
    "docs"
  ];

  return page.links
    .filter((link) => {
      try {
        const url = new URL(link);
        return url.host.replace(/^www\./, "") === host;
      } catch {
        return false;
      }
    })
    .filter((link) => needles.some((needle) => link.toLowerCase().includes(needle)))
    .slice(0, 8);
}
