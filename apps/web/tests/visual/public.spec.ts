import { expect, test, type Page } from "@playwright/test";

const viewports = {
  mobile320: { width: 320, height: 800 },
  mobile375: { width: 375, height: 812 },
  mobile390: { width: 390, height: 844 },
  mobile430: { width: 430, height: 932 },
  tablet: { width: 768, height: 1024 },
  compactDesktop: { width: 1024, height: 900 },
  desktop: { width: 1440, height: 1000 },
  wide: { width: 1728, height: 1100 },
  fullHd: { width: 1920, height: 1080 }
} as const;

const internalDiagnosticPattern = /(?:supabase|postgres|stack trace|internal server error|error code)/i;
const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

async function installRuntimeGuards(page: Page) {
  const errors: string[] = [];
  const onConsole = (message: { type: () => string; text: () => string }) => {
    const text = message.text();
    if (message.type() === "error" && !text.startsWith("Failed to load resource:")) errors.push(text);
  };
  const onPageError = (error: Error) => errors.push(error.message);
  const onResponse = (response: { status: () => number; url: () => string }) => {
    const url = response.url();
    // The signed-out queue intentionally receives no user-scoped jobs. Its 401 is
    // handled in the client and does not represent a page runtime failure.
    if (response.status() >= 400 && !/\/api\/research(?:\?|$)/.test(url)) {
      errors.push(`${response.status()} ${url}`);
    }
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  return {
    errors,
    dispose: () => {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("response", onResponse);
    }
  };
}

async function assertPublicPage(page: Page, errors: string[]) {
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText(internalDiagnosticPattern);
  await expect(page.locator("body")).not.toContainText(uuidPattern);
  await expect(page.locator("img:not([alt])")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
  expect(errors, `Unexpected browser runtime errors: ${errors.join(" | ")}`).toEqual([]);
}

async function openPublicPage(page: Page, path: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  const guard = await installRuntimeGuards(page);
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.ok(), `${path} should return a successful response`).toBeTruthy();
  await assertPublicPage(page, guard.errors);
  guard.dispose();
  return guard.errors;
}

async function discoverArtifactPaths(page: Page) {
  await page.goto("/news", { waitUntil: "domcontentloaded" });
  const articlePaths = await page.locator('a[href^="/article/"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href))
  );
  expect(articlePaths, "news archive should expose published articles").not.toHaveLength(0);
  let articlePath: string | undefined;
  for (const candidate of articlePaths) {
    const slug = candidate.split("/").pop();
    if (!slug) continue;
    const dossier = await page.request.get(`/dossier/${slug}`);
    if (dossier.ok()) {
      articlePath = candidate;
      break;
    }
  }
  expect(articlePath, "a published article with a published dossier should be available").toMatch(/^\/article\/[^/]+$/);
  const slug = articlePath!.split("/").pop()!;

  await page.goto("/startups", { waitUntil: "domcontentloaded" });
  const profilePath = await page.locator(`a[href="/startup/${slug}"]`).count()
    ? `/startup/${slug}`
    : await page.locator('a[href^="/startup/"]').first().getAttribute("href");
  expect(profilePath, "profile archive should expose a published profile").toMatch(/^\/startup\/[^/]+$/);

  return { articlePath: articlePath!, profilePath: profilePath!, dossierPath: `/dossier/${slug}` };
}

test.describe("public visual QA", () => {
  test("shared public surfaces fit every required viewport", async ({ page }) => {
    for (const viewport of Object.values(viewports)) {
      for (const path of ["/", "/aperture", "/research", "/pricing", "/methodology"]) {
        await openPublicPage(page, path, viewport);
      }
    }
  });

  test("archives render responsively and expose only public links", async ({ page }) => {
    for (const viewport of [viewports.mobile375, viewports.mobile390, viewports.tablet, viewports.desktop]) {
      for (const path of ["/news", "/startups"]) {
        await openPublicPage(page, path, viewport);
        await expect(page.locator('a[href^="/article/"], a[href^="/startup/"]')).not.toHaveCount(0);
      }
    }
  });

  test("published article, profile, and dossier meet the rendered matrix", async ({ page }, testInfo) => {
    const artifacts = await discoverArtifactPaths(page);
    for (const [name, path] of Object.entries(artifacts)) {
      for (const [viewportName, viewport] of Object.entries({
        mobile320: viewports.mobile320,
        mobile390: viewports.mobile390,
        tablet: viewports.tablet,
        desktop: viewports.desktop,
        fullHd: viewports.fullHd
      })) {
        await openPublicPage(page, path, viewport);
        await expect(page.locator("h1")).toHaveCount(1);
        if (viewportName === "mobile390" || viewportName === "desktop") {
          await page.screenshot({ path: testInfo.outputPath(`${name}-${viewportName}.png`), fullPage: true });
        }
      }
    }
  });

  test("captures representative homepage, queue, and archive evidence", async ({ page }, testInfo) => {
    for (const [label, path] of Object.entries({ homepage: "/", research: "/research", news: "/news", profiles: "/startups" })) {
      for (const [viewportName, viewport] of Object.entries({ mobile390: viewports.mobile390, desktop: viewports.desktop })) {
        await openPublicPage(page, path, viewport);
        await page.screenshot({ path: testInfo.outputPath(`${label}-${viewportName}.png`), fullPage: true });
      }
    }
  });

  test("machine-readable routes are healthy", async ({ page }) => {
    for (const path of ["/llms.txt", "/llms-full.txt", "/sitemap.xml"]) {
      const response = await page.goto(path);
      expect(response?.ok(), `${path} should return successfully`).toBeTruthy();
      await expect(page.locator("body")).toContainText(/\S/);
      await expect(page.locator("body")).not.toContainText(internalDiagnosticPattern);
    }
  });

  test("invalid artifact routes preserve not-found behavior without diagnostics", async ({ page }) => {
    for (const path of ["/article/not-a-real-deeptechly-slug", "/startup/not-a-real-deeptechly-slug", "/dossier/not-a-real-deeptechly-slug"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} should return 404`).toBe(404);
      await expect(page.locator("body")).not.toContainText(internalDiagnosticPattern);
      await expect(page.locator("a[href='/']")).not.toHaveCount(0);
    }
  });

  test("invalid research job routes show the queue without leaking internal details", async ({ page }) => {
    const response = await page.goto("/research/not-a-real-job-id", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).not.toContainText(internalDiagnosticPattern);
    await expect(page.locator("body")).not.toContainText(uuidPattern);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("signed-out dossier keeps institutional content gated", async ({ page }) => {
    const { dossierPath } = await discoverArtifactPaths(page);
    const errors = await openPublicPage(page, dossierPath, viewports.mobile390);
    await expect(page.getByText("Institutional section locked").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("No gated content serialized publicly");
    await expect(page.locator("body")).not.toContainText("The revenue model remains gated");
    expect(errors).toEqual([]);
  });

  test("keyboard navigation reaches named controls", async ({ page }) => {
    await openPublicPage(page, "/", viewports.mobile390);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveCount(1);
    await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("href", "/");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("mobile navigation exposes every primary destination", async ({ page }) => {
    await openPublicPage(page, "/", viewports.mobile320);
    await page.getByLabel("Open navigation menu").click();
    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(navigation).toBeVisible();
    for (const label of ["News", "Explore", "Aperture", "Research", "Sign in", "Join"]) {
      await expect(navigation.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("homepage exposes the complete editorial hierarchy and evidence context", async ({ page }) => {
    await openPublicPage(page, "/", viewports.desktop);
    for (const heading of [
      "Top Stories",
      "Also Reading",
      "Recent Research",
      "Your Research",
      "Intelligence",
      "Research Newsstand",
      "Browse by Sector"
    ]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByText(/public sources/i).first()).toBeVisible();
    await expect(page.getByText(/confidence/i).first()).toBeVisible();
  });

  test("article provides editorial sections, provenance, and machine-readable access", async ({ page }) => {
    const { articlePath, profilePath, dossierPath } = await discoverArtifactPaths(page);
    await openPublicPage(page, articlePath, viewports.desktop);
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Article sections" })).toBeVisible();
    await expect(page.getByText("Research Snapshot", { exact: true })).toBeVisible();
    await expect(page.getByText("Evidence Quality", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sources", exact: true })).toBeVisible();
    await expect(page.locator(`a[href="${profilePath}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="${dossierPath}"]`).first()).toBeVisible();
    const markdownPath = `${articlePath}.md`;
    await expect(page.locator(`a[href="${markdownPath}"]`)).toBeVisible();
    const markdown = await page.request.get(markdownPath);
    expect(markdown.ok()).toBeTruthy();
    expect(await markdown.text()).toContain("# ");
  });

  test("profile renders as an evidence-backed institutional fact sheet", async ({ page }) => {
    const { profilePath, articlePath, dossierPath } = await discoverArtifactPaths(page);
    await openPublicPage(page, profilePath, viewports.desktop);
    await expect(page.getByText(/Public Research Profile \/ DT-/)).toBeVisible();
    await expect(page.getByRole("img", { name: /technical research visual/i })).toBeVisible();
    for (const heading of [
      "Overview",
      "Technical summary",
      "Market position",
      "Competitive landscape",
      "Key signals",
      "Open questions",
      "Technology tags",
      "Sources",
      "Accuracy and confidence"
    ]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.locator(`a[href="${articlePath}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="${dossierPath}"]`).first()).toBeVisible();
    const markdownPath = `${profilePath}.md`;
    await expect(page.locator(`a[href="${markdownPath}"]`)).toBeVisible();
    const markdown = await page.request.get(markdownPath);
    expect(markdown.ok()).toBeTruthy();
    expect(await markdown.text()).toContain("# ");
  });

  test("dossier provides a public research layer without serializing institutional analysis", async ({ page }) => {
    const { dossierPath } = await discoverArtifactPaths(page);
    await openPublicPage(page, dossierPath, viewports.desktop);
    await expect(page.getByRole("navigation", { name: "Dossier index" })).toBeVisible();
    for (const heading of [
      "Executive summary",
      "Taxonomy snapshot",
      "Overview",
      "Technical summary",
      "Market position",
      "Competitive landscape",
      "Company positioning",
      "Opportunity",
      "Evidence and readiness cards",
      "Sources",
      "Accuracy and confidence",
      "Institutional diligence layer"
    ]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Institutional section locked", exact: true })).toHaveCount(1);
    await expect(page.locator('a[href^="https://example.com"]')).toHaveCount(0);
    const markdownPath = `${dossierPath}.md`;
    await expect(page.locator(`a[href="${markdownPath}"]`)).toBeVisible();
    const markdown = await page.request.get(markdownPath);
    expect(markdown.ok()).toBeTruthy();
    const markdownBody = await markdown.text();
    expect(markdownBody).toContain("# ");
    expect(markdownBody).not.toContain("The revenue model remains gated");
    expect(markdownBody).not.toContain("example.com");
  });
});
