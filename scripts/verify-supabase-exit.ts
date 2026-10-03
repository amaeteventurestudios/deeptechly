import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const activeFiles = [
  ...walk(
    resolve(root, "apps/web"),
    (path) => /\.(?:ts|tsx|js|mjs|json|md)$/.test(path) && !path.endsWith("package-lock.legacy.json")
  ),
  resolve(root, "proxy.ts"),
  resolve(root, ".env.example")
];

for (const filename of activeFiles) {
  const source = readFileSync(filename, "utf8");
  assert.doesNotMatch(source, /supabase/i, `Active runtime reference remains in ${filename}`);
  assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE_|SUPABASE_SERVICE_ROLE_KEY|@supabase\//, `Legacy runtime contract remains in ${filename}`);
}

for (const manifest of ["package.json", "apps/web/package.json", "pnpm-lock.yaml"]) {
  const source = readFileSync(resolve(root, manifest), "utf8");
  assert.doesNotMatch(source, /@supabase\//, `Legacy package remains in ${manifest}`);
}

const authFactory = readFileSync(resolve(root, "apps/web/lib/auth/providers/index.ts"), "utf8");
assert.match(authFactory, /return "pocketbase"/);
assert.doesNotMatch(authFactory, /process\.env\.DEEPTECHLY_AUTH_PROVIDER/);

const researchStore = readFileSync(resolve(root, "apps/web/lib/research/store.ts"), "utf8");
assert.match(researchStore, /writeV2PostgresStore/);
assert.doesNotMatch(researchStore, /readRedisStore|writeRedisStore|hasRedisStore/);

for (const page of ["sign-in/page.tsx", "join/page.tsx", "forgot-password/page.tsx"]) {
  const source = readFileSync(resolve(root, "apps/web/app", page), "utf8");
  assert.doesNotMatch(source, /supabase|appwrite|postgres/i, `${page} must remain provider-neutral`);
}

console.log(`Verified Supabase exit across ${activeFiles.length} active runtime and configuration files.`);

function walk(directory: string, include: (path: string) => boolean): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) {
      if ([".next", "node_modules"].includes(entry)) return [];
      return walk(path, include);
    }
    return include(path) ? [path] : [];
  });
}
