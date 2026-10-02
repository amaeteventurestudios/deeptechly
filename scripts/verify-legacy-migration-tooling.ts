import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  buildLegacyInventory,
  parseLegacyBackup,
  renderStagingSql
} from "./migration/legacy-supabase-dump";

const userId = "00000000-0000-4000-8000-000000000001";
const entityId = "00000000-0000-4000-8000-000000000002";
const articleId = "00000000-0000-4000-8000-000000000003";
const dossierId = "00000000-0000-4000-8000-000000000004";
const jobId = "00000000-0000-4000-8000-000000000005";
const now = "2026-01-01 00:00:00+00";

const sections = [
  copy("auth.users", [
    "instance_id", "id", "aud", "role", "email", "encrypted_password",
    "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
    "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
    "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
    "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
    "phone_change", "phone_change_token", "phone_change_sent_at",
    "email_change_token_current", "email_change_confirm_status", "banned_until",
    "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at",
    "is_anonymous"
  ], [[
    "instance", userId, "authenticated", "authenticated", "fixture@example.test",
    "password_hash_fixture", now, null, "confirm-secret", null, "recovery-secret", null,
    null, null, null, now, "{}", "{\"name\":\"Fixture\"}", null, now, now,
    "+15555550100", null, null, null, null, null, "0", null, null, null, "false",
    null, "false"
  ]]),
  copy("auth.identities", [
    "provider_id", "user_id", "identity_data", "provider", "last_sign_in_at",
    "created_at", "updated_at", "id"
  ], [[userId, userId, "{\"secret\":\"identity-fixture\"}", "email", now, now, now,
    "00000000-0000-4000-8000-000000000006"]]),
  copy("public.articles", [
    "id", "entity_id", "slug", "title", "dek", "body_md", "sector", "author_name",
    "confidence", "source_count", "hero_image_url", "published", "published_at", "data",
    "created_at", "updated_at"
  ], [[articleId, entityId, "fixture", "Fixture article", "Dek", "Line one\nLine two\tcell",
    "Space", "DeepTechly", "HIGH_CONFIDENCE", "2", null, "true", now, "{}", now, now]]),
  copy("public.dossiers", [
    "id", "entity_id", "slug", "public_md", "institutional_md", "confidence",
    "source_count", "published", "data", "created_at", "updated_at"
  ], [[dossierId, entityId, "fixture", "# Public", "# Institutional", "HIGH_CONFIDENCE",
    "2", "true", "{}", now, now]]),
  copy("public.entities", [
    "id", "slug", "name", "entity_type", "sector", "region", "stage", "summary",
    "technical_summary", "market_position", "competitive_landscape", "confidence",
    "source_count", "published", "data", "created_at", "updated_at"
  ], [[entityId, "fixture", "Fixture Labs", "company", "Space", "US", "Seed", "Summary",
    "Technical", "Position", "Landscape", "HIGH_CONFIDENCE", "2", "true", "{}", now, now]]),
  copy("public.invite_codes", [
    "id", "code", "tier", "max_uses", "used_count", "expires_at", "created_at",
    "organization", "disabled_at"
  ], [["00000000-0000-4000-8000-000000000007", "TEST-INVITE", "institutional", "1", "0",
    null, now, "Fixture Org", null]]),
  copy("public.research_jobs", [
    "id", "user_id", "entity_name", "entity_type", "input_query", "status", "stage",
    "progress", "source_count", "confidence", "article_id", "entity_id", "dossier_id",
    "error_message", "data", "created_at", "updated_at"
  ], [[jobId, userId, "Fixture Labs", "company", "Fixture Labs", "completed", "Complete",
    "100", "2", "HIGH_CONFIDENCE", articleId, entityId, dossierId, null, "{}", now, now]]),
  copy("public.saved_research_items", [
    "id", "auth_user_id", "item_id", "item_type", "title", "href", "sector",
    "entity_name", "source", "metadata", "created_at", "updated_at"
  ], [["00000000-0000-4000-8000-000000000008", userId, entityId, "profile", "Fixture",
    "/profile/fixture", "Space", "Fixture Labs", "deeptechly", "{}", now, now]]),
  copy("public.sources", [
    "id", "entity_id", "article_id", "dossier_id", "title", "url", "publisher",
    "source_type", "retrieved_at", "created_at"
  ], [
    ["00000000-0000-4000-8000-000000000009", entityId, articleId, dossierId, "Source one",
      "https://example.test/evidence/", "Official", "company_site", now, now],
    ["00000000-0000-4000-8000-000000000010", entityId, articleId, dossierId, "Source duplicate",
      "https://example.test/evidence", "Official", "company_site", now, now]
  ]),
  copy("public.users_profile", [
    "id", "auth_user_id", "full_name", "email", "organization", "access_tier",
    "is_institutional_verified", "institutional_request_pending", "created_at", "updated_at"
  ], [["00000000-0000-4000-8000-000000000011", userId, "Fixture User",
    "fixture@example.test", "Fixture Org", "institutional", "true", "false", now, now]])
];

const fixture = `--\n-- PostgreSQL database cluster dump\n--\n${sections.join("\n")}`;
const directory = mkdtempSync(join(tmpdir(), "deeptechly-migration-test-"));
const backupPath = join(directory, "fixture.backup.gz");

try {
  writeFileSync(backupPath, gzipSync(fixture));
  const dump = parseLegacyBackup(backupPath);
  const inventory = buildLegacyInventory(dump);
  const sql = renderStagingSql(dump, inventory);

  assert.equal(inventory.applicationRowCount, 9);
  assert.equal(inventory.selectedRowCount, 11);
  assert.equal(inventory.sourceUrls.canonicalTargets, 1);
  assert.equal(inventory.sourceUrls.duplicateRows, 1);
  assert.ok(inventory.integrity.every((finding) => finding.orphanCount === 0));
  assert.equal(dump.rows.get("public.articles")?.[0].body_md, "Line one\nLine two\tcell");
  assert.doesNotMatch(sql, /password_hash_fixture/);
  assert.doesNotMatch(sql, /confirm-secret|recovery-secret|identity-fixture|TEST-INVITE/);
  assert.match(sql, /code_hash/);
  assert.match(sql, /targetId/);
  assert.match(sql, /"duplicate":true/);
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log("Verified legacy dump parsing, redaction, relationship checks, and source deduplication.");

function copy(table: string, columns: string[], rows: Array<Array<string | null>>) {
  const data = rows
    .map((row) => {
      assert.equal(row.length, columns.length, `${table} fixture field count`);
      return row.map(encodeCopyValue).join("\t");
    })
    .join("\n");
  return `COPY ${table} (${columns.join(", ")}) FROM stdin;\n${data}${data ? "\n" : ""}\\.\n`;
}

function encodeCopyValue(value: string | null) {
  if (value === null) return "\\N";
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\t", "\\t")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r");
}
