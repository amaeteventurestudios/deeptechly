import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { databaseMigrations } from "../packages/database/src/migrations";

const repositoryRoot = resolve(import.meta.dirname, "..");
const requiredCoreTables = [
  "accounts",
  "external_identities",
  "access_grants",
  "entities",
  "research_jobs",
  "research_runs",
  "sources",
  "claims",
  "evidence",
  "claim_evidence",
  "articles",
  "profiles",
  "dossiers",
  "patents",
  "labs",
  "technologies",
  "taxonomy_terms",
  "saved_research",
  "publications",
  "provenance_events",
  "outbox_events"
];
const requiredApertureTables = [
  "agencies",
  "government_documents",
  "government_signals",
  "problem_statements",
  "opportunity_maps",
  "evidence_packs",
  "technical_requirements",
  "demand_clusters",
  "capability_matches"
];
const prohibitedStatements = [
  /\bdrop\s+(?:table|schema|column|database)\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i
];

assert.deepEqual(
  databaseMigrations.map((migration) => migration.id),
  ["0001", "0002", "0003", "0004", "0005", "0006", "0007"],
  "Migration ledger must remain ordered"
);

const migrationSql = new Map(
  databaseMigrations.map((migration) => {
    assert.equal(migration.destructive, false);
    const filename = resolve(repositoryRoot, "packages/database", migration.file);
    const sql = readFileSync(filename, "utf8");
    assert.match(sql, /create schema if not exists deeptechly/i);
    for (const prohibited of prohibitedStatements) {
      assert.doesNotMatch(sql, prohibited, `${migration.id} must remain additive`);
    }
    assert.match(sql, new RegExp(`values \\('${migration.id}'`, "i"));
    return [migration.id, sql] as const;
  })
);

for (const table of requiredCoreTables) {
  assert.match(
    migrationSql.get("0001")!,
    new RegExp(`create table if not exists deeptechly\\.${table}\\b`, "i"),
    `Core migration is missing ${table}`
  );
}

for (const table of requiredApertureTables) {
  assert.match(
    migrationSql.get("0002")!,
    new RegExp(`create table if not exists deeptechly\\.${table}\\b`, "i"),
    `Aperture migration is missing ${table}`
  );
}

for (const table of [
  "legacy_import_batches",
  "legacy_records",
  "legacy_identity_map",
  "import_findings",
  "reconciliation_results"
]) {
  assert.match(
    migrationSql.get("0003")!,
    new RegExp(`create table if not exists deeptechly\\.${table}\\b`, "i"),
    `Import migration is missing ${table}`
  );
}

for (const table of ["research_job_outputs", "artifact_sources"]) {
  assert.match(
    migrationSql.get("0006")!,
    new RegExp(`create table if not exists deeptechly\\.${table}\\b`, "i"),
    `Legacy relationship migration is missing ${table}`
  );
}

for (const table of ["editorial_metadata", "editorial_reviews"]) {
  assert.match(
    migrationSql.get("0004")!,
    new RegExp(`create table if not exists deeptechly\\.${table}\\b`, "i"),
    `Newsroom migration is missing ${table}`
  );
}

for (const table of [
  "billing_customers",
  "billing_subscriptions",
  "credit_accounts",
  "credit_ledger_entries",
  "usage_events",
  "billing_webhook_events"
]) {
  assert.match(
    migrationSql.get("0005")!,
    new RegExp(`create table if not exists deeptechly\\.${table}\\b`, "i"),
    `Billing migration is missing ${table}`
  );
}

console.log(
  `Verified ${databaseMigrations.length} additive database migrations and ${requiredCoreTables.length + requiredApertureTables.length + 10} required domain tables.`
);
