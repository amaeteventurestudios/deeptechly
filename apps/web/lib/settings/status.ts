import { getPostgres } from "@/lib/database/postgres";
import { getPocketBaseConfig } from "@/lib/pocketbase/config";

export type ServiceState = "available" | "unavailable" | "unconfigured" | "configured";

export async function getSettingsSystemStatus() {
  const sql = getPostgres();
  let postgres: { state: ServiceState; detail: string; version?: string; counts?: Record<string, number>; lastMigration?: string; lastReconciliation?: string } = { state: "unconfigured", detail: "No PostgreSQL connection configured." };
  if (sql) {
    try {
      const versionRows = await sql<{ version: string }[]>`show server_version`;
      const countRows = await sql<{ accounts: number; jobs: number; entities: number; publications: number }[]>`
        select (select count(*)::int from deeptechly.accounts) accounts,
          (select count(*)::int from deeptechly.research_jobs) jobs,
          (select count(*)::int from deeptechly.entities) entities,
          (select count(*)::int from deeptechly.publications) publications
      `;
      const migrationRows = await sql<{ id: string }[]>`select id from deeptechly.schema_migrations order by id desc limit 1`;
      const reconciliationRows = await sql<{ completedAt: Date | string }[]>`select completed_at as "completedAt" from deeptechly.legacy_import_batches where status = 'reconciled' order by completed_at desc nulls last limit 1`;
      postgres = { state: "available", detail: "Connection check passed.", version: versionRows[0]?.version, counts: countRows[0], lastMigration: migrationRows[0]?.id, lastReconciliation: reconciliationRows[0]?.completedAt ? new Date(reconciliationRows[0].completedAt).toISOString() : undefined };
    } catch { postgres = { state: "unavailable", detail: "Configured, but the health query failed." }; }
  }

  const pocketbaseConfig = getPocketBaseConfig();
  let pocketbase: { state: ServiceState; detail: string } = { state: "unconfigured", detail: "No identity endpoint configured." };
  if (pocketbaseConfig) {
    try {
      const response = await fetch(`${pocketbaseConfig.url}/api/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      pocketbase = response.ok ? { state: "available", detail: "Health endpoint responded successfully." } : { state: "unavailable", detail: `Health endpoint returned ${response.status}.` };
    } catch { pocketbase = { state: "unavailable", detail: "Configured, but the health check failed." }; }
  }

  return {
    applicationVersion: process.env.npm_package_version || "0.2.0",
    environment: process.env.NODE_ENV || "development",
    postgres,
    pocketbase,
    workflow: configuredState("TRIGGER_SECRET_KEY", "Durable workflow credentials"),
    search: configuredState("MEILISEARCH_BASE_URL", "Search service"),
    objectStorage: configuredState("S3_ENDPOINT", "Object storage")
  };
}

function configuredState(variable: string, label: string) {
  return process.env[variable]?.trim()
    ? { state: "configured" as const, detail: `${label} is configured; no live health probe is implemented.` }
    : { state: "unconfigured" as const, detail: `${label} is not configured.` };
}
