import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import {
  normalizeSourceUrl,
  qualityForSourceType,
  type ResearchSourceType
} from "../../packages/research/src/source-policy";

export const applicationTables = [
  "public.articles",
  "public.dossiers",
  "public.entities",
  "public.invite_codes",
  "public.research_jobs",
  "public.saved_research_items",
  "public.sources",
  "public.users_profile"
] as const;

export const authPlanningTables = ["auth.users", "auth.identities"] as const;
const selectedTables = new Set<string>([...applicationTables, ...authPlanningTables]);

export type CopyRecord = Record<string, string | null>;

export type ParsedLegacyDump = {
  backupFormat: "gzip-wrapped PostgreSQL plain-text cluster dump";
  compressedChecksum: string;
  columns: Map<string, string[]>;
  rows: Map<string, CopyRecord[]>;
  sql: string;
};

type IntegrityFinding = {
  relationship: string;
  orphanCount: number;
};

export type LegacyInventory = {
  backupFormat: ParsedLegacyDump["backupFormat"];
  compressedSha256: string;
  applicationRowCount: number;
  selectedRowCount: number;
  tables: Record<
    string,
    {
      rowCount: number;
      columns: string[];
      nullCounts: Record<string, number>;
      jsonKeys: Record<string, string[]>;
    }
  >;
  distinctValues: Record<string, string[]>;
  sourceUrls: {
    rows: number;
    canonicalTargets: number;
    duplicateRows: number;
    malformedRows: number;
  };
  integrity: IntegrityFinding[];
  applicationObjects: {
    functions: string[];
    triggers: string[];
    indexes: string[];
    policies: string[];
    views: string[];
    enums: string[];
    sequences: string[];
  };
};

export function parseLegacyBackup(backupPath: string): ParsedLegacyDump {
  const compressed = readFileSync(backupPath);
  const sql = gunzipSync(compressed).toString("utf8");
  if (!sql.startsWith("--\n-- PostgreSQL database cluster dump")) {
    throw new Error("Backup is not a PostgreSQL plain-text cluster dump");
  }

  const rows = new Map<string, CopyRecord[]>();
  const columns = new Map<string, string[]>();
  const lines = sql.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^COPY ([a-z_]+\.[a-z_]+) \((.+)\) FROM stdin;$/.exec(lines[index]);
    if (!match) continue;
    const [, table, columnList] = match;
    const tableColumns = columnList.split(", ");
    const tableRows: CopyRecord[] = [];
    index += 1;
    while (index < lines.length && lines[index] !== "\\.") {
      if (selectedTables.has(table)) {
        const values = lines[index].split("\t");
        if (values.length !== tableColumns.length) {
          throw new Error(
            `${table} COPY row has ${values.length} fields; expected ${tableColumns.length}`
          );
        }
        tableRows.push(
          Object.fromEntries(
            tableColumns.map((column, valueIndex) => [
              column,
              decodeCopyValue(values[valueIndex])
            ])
          )
        );
      }
      index += 1;
    }
    if (selectedTables.has(table)) {
      if (rows.has(table)) throw new Error(`Duplicate COPY section for ${table}`);
      rows.set(table, tableRows);
      columns.set(table, tableColumns);
    }
  }

  for (const table of selectedTables) {
    if (!rows.has(table)) throw new Error(`Required COPY section is missing: ${table}`);
  }

  const parsed = {
    backupFormat: "gzip-wrapped PostgreSQL plain-text cluster dump" as const,
    compressedChecksum: createHash("sha256").update(compressed).digest("hex"),
    columns,
    rows,
    sql
  };
  assertLegacyIntegrity(parsed);
  return parsed;
}

export function buildLegacyInventory(dump: ParsedLegacyDump): LegacyInventory {
  const tables: LegacyInventory["tables"] = {};
  for (const table of selectedTables) {
    const tableRows = requireRows(dump, table);
    const tableColumns = dump.columns.get(table)!;
    const nullCounts = Object.fromEntries(
      tableColumns.map((column) => [
        column,
        tableRows.filter((row) => row[column] === null).length
      ])
    );
    const jsonKeys: Record<string, string[]> = {};
    for (const column of tableColumns.filter((value) => isJsonColumn(table, value))) {
      const keys = new Set<string>();
      for (const row of tableRows) {
        const raw = row[column];
        if (raw === null) continue;
        const value = parseJson(raw, `${table}.${column}`);
        if (value && typeof value === "object" && !Array.isArray(value)) {
          Object.keys(value).forEach((key) => keys.add(key));
        }
      }
      jsonKeys[column] = [...keys].sort();
    }
    tables[table] = {
      rowCount: tableRows.length,
      columns: tableColumns,
      nullCounts,
      jsonKeys
    };
  }

  const sources = requireRows(dump, "public.sources");
  const canonicalUrls = sources.map((row) => canonicalizeUrl(required(row, "url")));
  const malformedRows = sources.filter((row) => !isHttpUrl(required(row, "url"))).length;
  const canonicalTargets = new Set(canonicalUrls).size;
  const integrity = integrityFindings(dump);

  return {
    backupFormat: dump.backupFormat,
    compressedSha256: dump.compressedChecksum,
    applicationRowCount: applicationTables.reduce(
      (total, table) => total + requireRows(dump, table).length,
      0
    ),
    selectedRowCount: [...selectedTables].reduce(
      (total, table) => total + requireRows(dump, table).length,
      0
    ),
    tables,
    distinctValues: {
      "public.entities.entity_type": distinct(dump, "public.entities", "entity_type"),
      "public.entities.confidence": distinct(dump, "public.entities", "confidence"),
      "public.research_jobs.status": distinct(dump, "public.research_jobs", "status"),
      "public.research_jobs.stage": distinct(dump, "public.research_jobs", "stage"),
      "public.sources.source_type": distinct(dump, "public.sources", "source_type"),
      "public.users_profile.access_tier": distinct(
        dump,
        "public.users_profile",
        "access_tier"
      ),
      "auth.identities.provider": distinct(dump, "auth.identities", "provider")
    },
    sourceUrls: {
      rows: sources.length,
      canonicalTargets,
      duplicateRows: sources.length - canonicalTargets,
      malformedRows
    },
    integrity,
    applicationObjects: {
      functions: collectObjects(dump.sql, /^CREATE FUNCTION public\.([^(]+)\(/gm),
      triggers: collectObjects(
        dump.sql,
        /^CREATE TRIGGER ([^ ]+) .+ ON public\.([a-z_]+)/gm,
        (match) => `${match[2]}.${match[1]}`
      ),
      indexes: collectObjects(
        dump.sql,
        /^CREATE (?:UNIQUE )?INDEX ([^ ]+) ON public\.([a-z_]+)/gm,
        (match) => `${match[2]}.${match[1]}`
      ),
      policies: collectObjects(
        dump.sql,
        /^CREATE POLICY "([^"]+)" ON public\.([a-z_]+)/gm,
        (match) => `${match[2]}.${match[1]}`
      ),
      views: collectObjects(dump.sql, /^CREATE (?:MATERIALIZED )?VIEW public\.([^ ]+)/gm),
      enums: collectObjects(dump.sql, /^CREATE TYPE public\.([^ ]+) AS ENUM/gm),
      sequences: collectObjects(dump.sql, /^CREATE SEQUENCE public\.([^ ]+)/gm)
    }
  };
}

export function renderStagingSql(dump: ParsedLegacyDump, inventory: LegacyInventory) {
  const sourceTargets = sourceTargetMap(requireRows(dump, "public.sources"));
  const statements = [
    "\\set ON_ERROR_STOP on",
    "begin;",
    "create schema legacy_source;",
    `create table legacy_source.import_metadata (
      batch_id text primary key,
      source_system text not null,
      source_locator text not null,
      source_checksum text not null,
      application_row_count integer not null,
      selected_row_count integer not null,
      expected_counts jsonb not null,
      inventory jsonb not null
    );`,
    `create table legacy_source.records (
      source_table text not null,
      legacy_id text not null,
      ordinal integer not null,
      payload jsonb not null,
      migration_annotation jsonb not null default '{}'::jsonb,
      primary key (source_table, legacy_id)
    );`
  ];
  const batchId = `legacy-supabase-${dump.compressedChecksum.slice(0, 16)}`;
  const counts = Object.fromEntries(
    [...selectedTables].map((table) => [table, requireRows(dump, table).length])
  );
  statements.push(
    `insert into legacy_source.import_metadata values (${sqlLiteral(batchId)}, 'legacy-supabase', 'migration/legacy-supabase/db_cluster-19-08-2026@15-19-13.backup.gz', ${sqlLiteral(dump.compressedChecksum)}, ${inventory.applicationRowCount}, ${inventory.selectedRowCount}, ${jsonLiteral(counts)}, ${jsonLiteral(inventory)});`
  );

  for (const table of selectedTables) {
    const tableRows = requireRows(dump, table);
    tableRows.forEach((rawRow, ordinal) => {
      const { payload, annotation } = migrationRecord(table, rawRow, sourceTargets);
      statements.push(
        `insert into legacy_source.records values (${sqlLiteral(table)}, ${sqlLiteral(required(rawRow, "id"))}, ${ordinal + 1}, ${jsonLiteral(payload)}, ${jsonLiteral(annotation)});`
      );
    });
  }
  statements.push("commit;", "");
  return statements.join("\n");
}

export function assertLegacyIntegrity(dump: ParsedLegacyDump) {
  const findings = integrityFindings(dump);
  const failures = findings.filter((finding) => finding.orphanCount > 0);
  if (failures.length > 0) {
    throw new Error(
      `Legacy referential integrity failed: ${failures
        .map((finding) => `${finding.relationship}=${finding.orphanCount}`)
        .join(", ")}`
    );
  }
  for (const table of selectedTables) {
    const ids = requireRows(dump, table).map((row) => required(row, "id"));
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate primary IDs in ${table}`);
  }
  const dossierWithoutEntity = requireRows(dump, "public.dossiers").filter(
    (row) => row.entity_id === null
  );
  if (dossierWithoutEntity.length > 0) {
    throw new Error(`V2 requires dossier entities; found ${dossierWithoutEntity.length} null links`);
  }
}

function integrityFindings(dump: ParsedLegacyDump): IntegrityFinding[] {
  const ids = (table: string) =>
    new Set(requireRows(dump, table).map((row) => required(row, "id")));
  const authUsers = ids("auth.users");
  const entities = ids("public.entities");
  const articles = ids("public.articles");
  const dossiers = ids("public.dossiers");
  const checks: Array<[string, string, string, Set<string>]> = [
    ["article.entity", "public.articles", "entity_id", entities],
    ["dossier.entity", "public.dossiers", "entity_id", entities],
    ["research_job.user", "public.research_jobs", "user_id", authUsers],
    ["research_job.entity", "public.research_jobs", "entity_id", entities],
    ["research_job.article", "public.research_jobs", "article_id", articles],
    ["research_job.dossier", "public.research_jobs", "dossier_id", dossiers],
    ["saved_research.user", "public.saved_research_items", "auth_user_id", authUsers],
    ["source.entity", "public.sources", "entity_id", entities],
    ["source.article", "public.sources", "article_id", articles],
    ["source.dossier", "public.sources", "dossier_id", dossiers],
    ["user_profile.auth_user", "public.users_profile", "auth_user_id", authUsers],
    ["auth_identity.user", "auth.identities", "user_id", authUsers]
  ];
  return checks.map(([relationship, table, column, targets]) => ({
    relationship,
    orphanCount: requireRows(dump, table).filter(
      (row) => row[column] !== null && !targets.has(row[column]!)
    ).length
  }));
}

function migrationRecord(
  table: string,
  rawRow: CopyRecord,
  sourceTargets: Map<string, { targetId: string; canonicalUrl: string; duplicate: boolean }>
) {
  const payload = { ...rawRow };
  const annotation: Record<string, unknown> = {};
  if (table === "auth.users") {
    const allowed = [
      "id",
      "aud",
      "role",
      "email",
      "email_confirmed_at",
      "last_sign_in_at",
      "raw_app_meta_data",
      "raw_user_meta_data",
      "is_super_admin",
      "created_at",
      "updated_at",
      "is_sso_user",
      "deleted_at",
      "is_anonymous"
    ];
    for (const key of Object.keys(payload)) if (!allowed.includes(key)) delete payload[key];
    annotation.redacted_fields = [
      "encrypted_password",
      "confirmation_token",
      "recovery_token",
      "email_change_tokens",
      "reauthentication_token",
      "phone"
    ];
  }
  if (table === "auth.identities") {
    delete payload.identity_data;
    annotation.redacted_fields = ["identity_data"];
  }
  if (table === "public.invite_codes" && payload.code) {
    annotation.code_hash = createHash("sha256").update(payload.code).digest("hex");
    delete payload.code;
    annotation.redacted_fields = ["code"];
  }
  if (table === "public.sources") {
    Object.assign(annotation, sourceTargets.get(required(rawRow, "id")));
    const sourceType = rawRow.source_type as ResearchSourceType | null;
    annotation.authorityTier = sourceType ? qualityForSourceType(sourceType) : "weak";
  }
  return { payload, annotation };
}

function sourceTargetMap(rows: CopyRecord[]) {
  const targetByCanonical = new Map<string, string>();
  const result = new Map<
    string,
    { targetId: string; canonicalUrl: string; duplicate: boolean }
  >();
  for (const row of rows) {
    const id = required(row, "id");
    const canonicalUrl = canonicalizeUrl(required(row, "url"));
    const existing = targetByCanonical.get(canonicalUrl);
    const targetId = existing ?? id;
    if (!existing) targetByCanonical.set(canonicalUrl, id);
    result.set(id, { targetId, canonicalUrl, duplicate: Boolean(existing) });
  }
  return result;
}

function canonicalizeUrl(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) return trimmed;
    return normalizeSourceUrl(trimmed);
  } catch {
    return trimmed;
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeCopyValue(raw: string): string | null {
  if (raw === "\\N") return null;
  return raw.replace(/\\(?:x([0-9A-Fa-f]{2})|([0-7]{1,3})|(.))/g, (_, hex, octal, escaped) => {
    if (hex) return String.fromCharCode(Number.parseInt(hex, 16));
    if (octal) return String.fromCharCode(Number.parseInt(octal, 8));
    return (
      {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        v: "\v",
        "\\": "\\"
      } as Record<string, string>
    )[escaped] ?? escaped;
  });
}

function collectObjects(
  sql: string,
  expression: RegExp,
  formatter: (match: RegExpExecArray) => string = (match) => match[1]
) {
  return [...sql.matchAll(expression)].map(formatter).sort();
}

function distinct(dump: ParsedLegacyDump, table: string, column: string) {
  return [
    ...new Set(
      requireRows(dump, table)
        .map((row) => row[column])
        .filter((value): value is string => value !== null)
    )
  ].sort();
}

function isJsonColumn(table: string, column: string) {
  return (
    ["data", "metadata", "raw_app_meta_data", "raw_user_meta_data", "identity_data"].includes(
      column
    ) ||
    (table === "auth.users" && column.endsWith("metadata"))
  );
}

function parseJson(value: string, label: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    throw new Error(`${label} contains malformed JSON`, { cause: error });
  }
}

function requireRows(dump: ParsedLegacyDump, table: string) {
  const rows = dump.rows.get(table);
  if (!rows) throw new Error(`Missing parsed rows for ${table}`);
  return rows;
}

function required(row: CopyRecord, column: string) {
  const value = row[column];
  if (value === null || value === undefined || value === "") {
    throw new Error(`Required legacy field is empty: ${column}`);
  }
  return value;
}

function sqlLiteral(value: string) {
  if (value.includes("\0")) throw new Error("PostgreSQL text cannot contain NUL bytes");
  return `'${value.replaceAll("'", "''")}'`;
}

function jsonLiteral(value: unknown) {
  return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
}

function parseArguments(argv: string[]) {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error(`Invalid argument: ${key ?? ""}`);
    result[key.slice(2)] = value;
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArguments(process.argv.slice(2));
  if (!args.backup || !args.output || !args.inventory) {
    throw new Error("Usage: --backup <backup.gz> --output <staging.sql> --inventory <report.json>");
  }
  const dump = parseLegacyBackup(resolve(args.backup));
  const inventory = buildLegacyInventory(dump);
  const outputPath = resolve(args.output);
  const inventoryPath = resolve(args.inventory);
  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(inventoryPath), { recursive: true });
  writeFileSync(outputPath, renderStagingSql(dump, inventory), { mode: 0o600 });
  writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
  console.log(
    `Inspected ${inventory.applicationRowCount} application rows and ${inventory.selectedRowCount} selected rows; generated a redacted staging import.`
  );
}
