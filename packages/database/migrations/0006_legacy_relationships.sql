-- Preserve normalized relationships exposed by the recovered legacy database.
-- These tables are additive and retain polymorphic artifact links without
-- weakening the foreign keys on concrete research and source records.

create schema if not exists deeptechly;

create table if not exists deeptechly.research_job_outputs (
  research_job_id text not null references deeptechly.research_jobs(id),
  artifact_type text not null check (artifact_type in ('article', 'profile', 'dossier')),
  artifact_id text not null,
  relationship text not null default 'produced',
  created_at timestamptz not null default now(),
  primary key (research_job_id, artifact_type, artifact_id)
);

create index if not exists research_job_outputs_artifact_idx
  on deeptechly.research_job_outputs(artifact_type, artifact_id);

create table if not exists deeptechly.artifact_sources (
  artifact_type text not null check (artifact_type in ('article', 'profile', 'dossier', 'patent', 'signal', 'problem', 'opportunity')),
  artifact_id text not null,
  source_id text not null references deeptechly.sources(id),
  relationship text not null default 'evidence',
  legacy_source_id text,
  created_at timestamptz not null default now(),
  primary key (artifact_type, artifact_id, source_id)
);

create index if not exists artifact_sources_source_idx
  on deeptechly.artifact_sources(source_id);

insert into deeptechly.schema_migrations (id, description)
values ('0006', 'Preserve research output and artifact source relationships')
on conflict (id) do nothing;
