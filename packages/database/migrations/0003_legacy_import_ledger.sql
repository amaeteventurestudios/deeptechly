-- Append-only ledger for dry-run exports, imports, reconciliation, and rollback evidence.
-- Legacy payloads remain immutable; importers write normalized records separately.

create schema if not exists deeptechly;

create table if not exists deeptechly.legacy_import_batches (
  id text primary key,
  source_system text not null,
  source_locator text not null,
  source_checksum text not null,
  source_record_count integer not null check (source_record_count >= 0),
  status text not null check (status in ('exported', 'validated', 'importing', 'reconciled', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  report jsonb not null default '{}'::jsonb,
  unique (source_system, source_locator, source_checksum)
);

create table if not exists deeptechly.legacy_records (
  import_batch_id text not null references deeptechly.legacy_import_batches(id),
  legacy_table text not null,
  legacy_id text not null,
  payload jsonb not null,
  payload_checksum text not null,
  legacy_created_at timestamptz,
  legacy_updated_at timestamptz,
  imported_at timestamptz,
  primary key (import_batch_id, legacy_table, legacy_id)
);

create table if not exists deeptechly.legacy_identity_map (
  import_batch_id text not null references deeptechly.legacy_import_batches(id),
  legacy_provider text not null,
  legacy_id text not null,
  target_type text not null,
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (import_batch_id, legacy_provider, legacy_id, target_type)
);

create table if not exists deeptechly.import_findings (
  id text primary key,
  import_batch_id text not null references deeptechly.legacy_import_batches(id),
  severity text not null check (severity in ('info', 'warning', 'error')),
  legacy_table text,
  legacy_id text,
  code text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.reconciliation_results (
  id text primary key,
  import_batch_id text not null references deeptechly.legacy_import_batches(id),
  domain text not null,
  source_count integer not null,
  target_count integer not null,
  matched_count integer not null,
  mismatched_count integer not null,
  source_checksum text,
  target_checksum text,
  detail jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);

insert into deeptechly.schema_migrations (id, description)
values ('0003', 'Create legacy import and reconciliation ledger')
on conflict (id) do nothing;
