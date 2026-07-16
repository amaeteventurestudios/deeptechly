import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "test-results/visual",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    browserName: "chromium",
    ...devices["Desktop Chrome"],
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "off"
  },
  webServer: {
    command: `npm run dev -- --hostname localhost --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
