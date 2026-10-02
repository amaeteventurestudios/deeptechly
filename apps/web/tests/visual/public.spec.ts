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
      for (const path of ["/", "/research", "/pricing", "/methodology"]) {
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
    await expect(page.locator(":focus")).toHaveAttribute("href", "/");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });
});
