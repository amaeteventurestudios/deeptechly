import "server-only";

import type { ReadablePage, SearchResult } from "./types";

const provider = process.env.SEARCH_PROVIDER ?? "openai";

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
    return [];
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
    return [];
  }

  const body = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };

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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5-mini",
      tools: [{ type: "web_search_preview" }],
      input: `Search the public web for "${query}". Return JSON only with {"results":[{"title":"","url":"","snippet":""}]}. Keep the best 8 public sources.`,
      text: { format: { type: "json_object" } }
    })
  });

  if (!response.ok) {
    return [];
  }

  const body = await response.json();
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
  } catch {
    return [];
  }
}

function demoSearch(query: string): SearchResult[] {
  const safe = encodeURIComponent(query);
  return [
    {
      title: `${query} official website`,
      url: isProbableDomain(query) ? domainToUrl(query) : `https://example.com/search?q=${safe}`,
      snippet: "Homepage or primary public source for the submitted entity."
    },
    {
      title: `${query} patent search`,
      url: `https://patents.google.com/?q=${safe}`,
      snippet: "Patent database search for technical and intellectual property signals.",
      sourceType: "Patent"
    },
    {
      title: `${query} SBIR search`,
      url: `https://www.sbir.gov/search?term=${safe}`,
      snippet: "Government award and program signal search.",
      sourceType: "Government Source"
    }
  ];
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const results =
    provider === "tavily"
      ? await searchWithTavily(query)
      : await searchWithOpenAI(query);

  return results.length > 0 ? results : demoSearch(query);
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
