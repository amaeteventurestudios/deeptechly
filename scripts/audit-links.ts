/**
 * DeepTechly link audit script.
 *
 * Crawls internal links on key pages of the running local dev server,
 * checks each href for HTTP status, and writes a markdown report.
 *
 * Usage:
 *   npx tsx scripts/audit-links.ts
 *   # or after adding the package.json script:
 *   npm run audit:links
 *
 * Requires the Next.js dev server to be running at BASE_URL (default: http://localhost:3000).
 */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const SEED_PAGES = [
  "/",
  "/news",
  "/articles",
  "/research",
  "/explore",
  "/sector/space",
  "/sector/defense",
  "/sector/robotics",
  "/sector/energy",
  "/sector/semiconductors",
  "/sign-in",
  "/join",
  "/methodology",
  "/llms.txt",
  "/sitemap.xml"
];

type LinkResult = {
  sourcePage: string;
  text: string;
  href: string;
  status: number | "SKIPPED" | "ERROR";
  finalUrl?: string;
  note?: string;
};

function get(url: string): Promise<{ status: number; finalUrl: string; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        get(redirectUrl)
          .then((r) => resolve({ ...r, finalUrl: redirectUrl }))
          .catch(reject);
        res.resume();
        return;
      }

      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        body += chunk;
        if (body.length > 500_000) res.destroy();
      });
      res.on("end", () => {
        resolve({ status: res.statusCode ?? 0, finalUrl: url, body });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

function extractLinks(html: string): Array<{ text: string; href: string }> {
  const links: Array<{ text: string; href: string }> = [];
  const anchorRe = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRe.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, "").trim().slice(0, 80) || "(no text)";

    if (rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:")) {
      continue;
    }

    if (rawHref.startsWith("/")) {
      links.push({ text: rawText, href: rawHref });
    }
  }

  return links;
}

function dedupe(links: Array<{ text: string; href: string; sourcePage: string }>) {
  const seen = new Set<string>();
  return links.filter(({ sourcePage, href }) => {
    const key = `${sourcePage}::${href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function checkLink(href: string): Promise<{ status: number | "ERROR"; finalUrl?: string; note?: string }> {
  const url = BASE_URL + href;
  try {
    const result = await get(url);
    return {
      status: result.status,
      finalUrl: result.finalUrl !== url ? result.finalUrl : undefined
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "ERROR", note: message };
  }
}

function statusCategory(status: number | "SKIPPED" | "ERROR"): "WORKING" | "BROKEN" | "REDIRECT" | "SKIPPED" {
  if (status === "SKIPPED") return "SKIPPED";
  if (status === "ERROR") return "BROKEN";
  if (status >= 200 && status < 300) return "WORKING";
  if (status >= 300 && status < 400) return "REDIRECT";
  return "BROKEN";
}

function suggestFix(href: string): string {
  if (href.startsWith("/startups")) return "Change to /explore";
  if (href.startsWith("/dossier/")) return "Change to /startup/[slug]";
  if (href.startsWith("/patents")) return "Create app/patents/page.tsx or remove link";
  if (href.startsWith("/pricing")) return "Create app/pricing/page.tsx or remove link";
  if (href === "/api") return "Remove link or create /api/page.tsx placeholder";
  return "Create the missing page or redirect to an existing route";
}

function mdTable(headers: string[], rows: string[][]): string {
  const sep = headers.map(() => "---").join(" | ");
  const head = `| ${headers.join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${head}\n| ${sep} |\n${body}`;
}

async function main() {
  console.log(`DeepTechly Link Audit`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Seed pages: ${SEED_PAGES.length}\n`);

  const allLinks: Array<{ text: string; href: string; sourcePage: string }> = [];

  for (const page of SEED_PAGES) {
    process.stdout.write(`Crawling ${page} ... `);
    try {
      const result = await get(BASE_URL + page);
      const links = extractLinks(result.body).map((l) => ({ ...l, sourcePage: page }));
      console.log(`${result.status} · ${links.length} links`);
      allLinks.push(...links);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`ERROR: ${message}`);
    }
  }

  const deduped = dedupe(allLinks);
  console.log(`\nChecking ${deduped.length} unique links...\n`);

  const results: LinkResult[] = [];
  const uniqueHrefs = Array.from(new Set(deduped.map((l) => l.href)));
  const hrefStatus = new Map<string, { status: number | "ERROR"; finalUrl?: string; note?: string }>();

  for (const href of uniqueHrefs) {
    process.stdout.write(`  ${href} ... `);
    const check = await checkLink(href);
    hrefStatus.set(href, check);
    console.log(check.status);
  }

  for (const { sourcePage, text, href } of deduped) {
    const check = hrefStatus.get(href)!;
    results.push({ sourcePage, text, href, ...check });
  }

  const working = results.filter((r) => statusCategory(r.status) === "WORKING");
  const broken = results.filter((r) => statusCategory(r.status) === "BROKEN");
  const redirects = results.filter((r) => statusCategory(r.status) === "REDIRECT");
  const skipped = results.filter((r) => statusCategory(r.status) === "SKIPPED");

  const timestamp = new Date().toISOString();

  const lines: string[] = [
    "# DeepTechly Link Audit",
    "",
    `Generated: ${timestamp}`,
    "",
    "## Summary",
    "",
    `- **Total links checked:** ${results.length}`,
    `- **Working:** ${working.length}`,
    `- **Broken:** ${broken.length}`,
    `- **Redirects:** ${redirects.length}`,
    `- **Skipped:** ${skipped.length}`,
    ""
  ];

  if (working.length > 0) {
    lines.push("## Working Links", "");
    lines.push(
      mdTable(
        ["Source Page", "Link Text", "Href", "Status"],
        working.map((r) => [r.sourcePage, r.text.slice(0, 40), r.href, String(r.status)])
      ),
      ""
    );
  }

  if (broken.length > 0) {
    lines.push("## Broken Links", "");
    lines.push(
      mdTable(
        ["Source Page", "Link Text", "Href", "Status", "Suggested Fix"],
        broken.map((r) => [
          r.sourcePage,
          r.text.slice(0, 40),
          r.href,
          String(r.status),
          r.note ?? suggestFix(r.href)
        ])
      ),
      ""
    );
  }

  if (redirects.length > 0) {
    lines.push("## Redirects", "");
    lines.push(
      mdTable(
        ["Source Page", "Link Text", "Href", "Status", "Final URL"],
        redirects.map((r) => [r.sourcePage, r.text.slice(0, 40), r.href, String(r.status), r.finalUrl ?? ""])
      ),
      ""
    );
  }

  if (skipped.length > 0) {
    lines.push("## Skipped", "");
    lines.push(
      mdTable(
        ["Source Page", "Link Text", "Href", "Reason"],
        skipped.map((r) => [r.sourcePage, r.text.slice(0, 40), r.href, r.note ?? "Skipped"])
      ),
      ""
    );
  }

  const report = lines.join("\n");
  const outPath = path.join(process.cwd(), "link-audit.md");
  fs.writeFileSync(outPath, report, "utf8");

  console.log(`\nReport written to ${outPath}`);
  console.log(`Working: ${working.length}  Broken: ${broken.length}  Redirects: ${redirects.length}`);

  if (broken.length > 0) {
    console.log(`\nBroken links:`);
    for (const r of broken) {
      console.log(`  [${r.status}] ${r.href}  (from ${r.sourcePage})`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
