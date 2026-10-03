import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { hasPermission } from "../apps/web/lib/auth/authorization";
import { decryptServerSecret, encryptServerSecret } from "../apps/web/lib/settings/secrets";

const root = resolve(import.meta.dirname, "..");
const files = [...walk(resolve(root, "apps/web")), resolve(root, ".env.example"), resolve(root, "package.json")];
for (const filename of files) {
  const source = readFileSync(filename, "utf8");
  assert.doesNotMatch(source, /APPWRITE_(?:ENDPOINT|PROJECT_ID|API_KEY|DATABASE_ID)|lib\/appwrite|providers\/appwrite/i, `Active Appwrite runtime reference remains in ${filename}`);
}
const env = readFileSync(resolve(root, ".env.example"), "utf8");
assert.match(env, /POCKETBASE_URL=/);
assert.match(env, /DEEPTECHLY_SETTINGS_ENCRYPTION_KEY=/);
assert.doesNotMatch(env, /NEXT_PUBLIC_(?:POCKETBASE|POSTGRES|SMTP)/);

assert.equal(hasPermission({ role: "SUPER_ADMIN" }, "super_admin.manage"), true);
assert.equal(hasPermission({ role: "ADMIN" }, "settings.routine"), true);
assert.equal(hasPermission({ role: "ADMIN" }, "settings.protected"), false);
assert.equal(hasPermission({ role: "USER" }, "research.submit"), true);
assert.equal(hasPermission({ role: "VIEWER" }, "research.submit"), false);

const previousKey = process.env.DEEPTECHLY_SETTINGS_ENCRYPTION_KEY;
process.env.DEEPTECHLY_SETTINGS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
try {
  const plaintext = "test-only-secret";
  const encrypted = encryptServerSecret(plaintext);
  assert.notEqual(encrypted, plaintext);
  assert.doesNotMatch(encrypted, /test-only-secret/);
  assert.equal(decryptServerSecret(encrypted), plaintext);
} finally {
  if (previousKey === undefined) delete process.env.DEEPTECHLY_SETTINGS_ENCRYPTION_KEY;
  else process.env.DEEPTECHLY_SETTINGS_ENCRYPTION_KEY = previousKey;
}

const settingsPage = readFileSync(resolve(root, "apps/web/app/settings/page.tsx"), "utf8");
for (const section of ["General", "Appearance", "AI & Models", "Research Defaults", "Publishing", "Data", "Notifications", "Email Delivery", "Audit & Retention", "Users & Access", "Invitations", "Sessions", "Authentication Audit"]) assert.match(settingsPage, new RegExp(section.replace("&", "&"), "i"));
assert.match(settingsPage, /overflow-x-auto/, "Settings navigation must remain usable on narrow screens");
assert.match(settingsPage, /lg:sticky/, "Settings navigation must remain visible on desktop");
assert.match(settingsPage, /min-w-0/, "Settings content must be allowed to shrink instead of overflowing");
assert.match(settingsPage, /Blank secret keeps the encrypted credential/, "AI provider edits must explain blank-on-edit semantics");
assert.match(readFileSync(resolve(root, "apps/web/app/settings/actions.ts"), "utf8"), /requirePermission/);
console.log(`Verified PocketBase cutover, four-role policy, encrypted settings secrets, and settings control center across ${files.length} active files.`);

function walk(directory: string): string[] { return readdirSync(directory).flatMap((entry) => { const path = resolve(directory, entry); if (statSync(path).isDirectory()) return [".next", "node_modules"].includes(entry) ? [] : walk(path); return /\.(?:ts|tsx|js|mjs|json)$/.test(path) && !path.endsWith("package-lock.legacy.json") ? [path] : []; }); }
