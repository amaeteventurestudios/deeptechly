import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");
moduleLoader._resolveFilename = function resolveServerOnly(
  request: string,
  parent: unknown,
  isMain: boolean,
  options?: unknown
) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

async function verify() {
  const newsroom = await import("../apps/web/lib/admin/newsroom");

  assert.equal(newsroom.selectedNewsroomProvider(undefined), "compatibility");
  assert.equal(newsroom.selectedNewsroomProvider("directus"), "directus");
  assert.throws(() => newsroom.selectedNewsroomProvider("custom"), /Unsupported/);

  assert.deepEqual(newsroom.getNewsroomConfiguration({}), {
    provider: "compatibility",
    configured: true,
    studioUrl: null,
    detail: "DeepTechly review console with compatibility persistence"
  });

  const configured = newsroom.getNewsroomConfiguration({
    DEEPTECHLY_NEWSROOM_PROVIDER: "directus",
    DIRECTUS_BASE_URL: "https://newsroom.example.test",
    DIRECTUS_STUDIO_URL: "https://studio.example.test/admin/",
    DIRECTUS_TOKEN: "server-secret"
  });
  assert.equal(configured.configured, true);
  assert.equal(configured.studioUrl, "https://studio.example.test/admin");
  assert.equal(JSON.stringify(configured).includes("server-secret"), false);

  const unconfigured = newsroom.getNewsroomConfiguration({
    DEEPTECHLY_NEWSROOM_PROVIDER: "directus",
    DIRECTUS_BASE_URL: "file:///tmp/newsroom",
    DIRECTUS_TOKEN: "server-secret"
  });
  assert.equal(unconfigured.configured, false);
  assert.equal(unconfigured.studioUrl, null);

  const adminPage = readFileSync("apps/web/app/admin/content/page.tsx", "utf8");
  assert.match(adminPage, /getNewsroomConfiguration/);
  assert.match(adminPage, /Open Directus/);
  assert.doesNotMatch(adminPage, /DIRECTUS_TOKEN/);

  console.log("Newsroom integration verification passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
