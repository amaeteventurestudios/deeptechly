-- Aperture is a DeepTechly product domain and reuses core sources, claims, and evidence.

create schema if not exists deeptechly;

create table if not exists deeptechly.agencies (
  id text primary key,
  slug text not null unique,
  name text not null,
  abbreviation text,
  parent_agency_id text references deeptechly.agencies(id),
  official_domain text,
  summary text,
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.government_documents (
  id text primary key,
  agency_id text references deeptechly.agencies(id),
  source_id text not null references deeptechly.sources(id),
  document_type text not null,
  solicitation_number text,
  published_at timestamptz,
  response_deadline timestamptz,
  status text,
  metadata jsonb not null default '{}'::jsonb,
  unique (source_id)
);

create table if not exists deeptechly.government_signals (
  id text primary key,
  slug text not null unique,
  agency_id text references deeptechly.agencies(id),
  title text not null,
  summary text not null,
  signal_type text not null,
  strength numeric(5,4) check (strength is null or (strength >= 0 and strength <= 1)),
  confidence_label text check (confidence_label is null or confidence_label in ('HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'LIMITED_PUBLIC_DATA', 'LOW_CONFIDENCE')),
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  methodology_version text not null,
  public_markdown text not null default '',
  structured_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.signal_documents (
  signal_id text not null references deeptechly.government_signals(id),
  government_document_id text not null references deeptechly.government_documents(id),
  relevance numeric(5,4),
  primary key (signal_id, government_document_id)
);

create table if not exists deeptechly.problem_statements (
  id text primary key,
  slug text not null unique,
  title text not null,
  problem_text text not null,
  agency_id text references deeptechly.agencies(id),
  status text not null default 'draft',
  confidence_label text,
  methodology_version text not null,
  public_markdown text not null default '',
  structured_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.problem_signals (
  problem_statement_id text not null references deeptechly.problem_statements(id),
  signal_id text not null references deeptechly.government_signals(id),
  relationship text not null default 'derived_from',
  primary key (problem_statement_id, signal_id)
);

create table if not exists deeptechly.technical_requirements (
  id text primary key,
  problem_statement_id text not null references deeptechly.problem_statements(id),
  requirement_text text not null,
  requirement_type text,
  priority text,
  claim_id text references deeptechly.claims(id),
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.demand_clusters (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text,
  methodology_version text not null,
  repetition_count integer not null default 0,
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.demand_cluster_signals (
  demand_cluster_id text not null references deeptechly.demand_clusters(id),
  signal_id text not null references deeptechly.government_signals(id),
  similarity numeric(5,4),
  primary key (demand_cluster_id, signal_id)
);

create table if not exists deeptechly.opportunity_maps (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  problem_statement_id text references deeptechly.problem_statements(id),
  demand_cluster_id text references deeptechly.demand_clusters(id),
  confidence_label text,
  methodology_version text not null,
  public_markdown text not null default '',
  institutional_content jsonb,
  structured_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.capability_matches (
  id text primary key,
  opportunity_map_id text not null references deeptechly.opportunity_maps(id),
  target_type text not null check (target_type in ('entity', 'patent', 'lab', 'technology')),
  target_id text not null,
  match_score numeric(5,4) check (match_score is null or (match_score >= 0 and match_score <= 1)),
  rationale text not null,
  evidence_ids jsonb not null default '[]'::jsonb,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  unique (opportunity_map_id, target_type, target_id)
);

create table if not exists deeptechly.evidence_packs (
  id text primary key,
  slug text not null unique,
  title text not null,
  subject_type text not null,
  subject_id text not null,
  confidence_label text,
  methodology_version text not null,
  public_summary jsonb not null default '{}'::jsonb,
  institutional_content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.evidence_pack_items (
  evidence_pack_id text not null references deeptechly.evidence_packs(id),
  evidence_id text not null references deeptechly.evidence(id),
  position integer not null default 0,
  note text,
  primary key (evidence_pack_id, evidence_id)
);

insert into deeptechly.schema_migrations (id, description)
values ('0002', 'Create Aperture government-demand intelligence domains')
on conflict (id) do nothing;
