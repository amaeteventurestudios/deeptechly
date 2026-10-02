-- DeepTechly V2 core schema. Additive and idempotent by design.
-- Application-generated text identifiers preserve legacy UUID and prefixed IDs.

create schema if not exists deeptechly;

create table if not exists deeptechly.schema_migrations (
  id text primary key,
  description text not null,
  checksum text,
  applied_at timestamptz not null default now()
);

create table if not exists deeptechly.accounts (
  id text primary key,
  primary_email text,
  display_name text,
  organization text,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists accounts_primary_email_unique
  on deeptechly.accounts (lower(primary_email)) where primary_email is not null;

create table if not exists deeptechly.external_identities (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  provider text not null,
  provider_user_id text not null,
  provider_email text,
  email_verified boolean not null default false,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table if not exists deeptechly.access_grants (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  capability text not null,
  source text not null,
  status text not null default 'active' check (status in ('pending', 'active', 'expired', 'revoked')),
  starts_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, capability, source)
);

create table if not exists deeptechly.invite_codes (
  id text primary key,
  code_hash text not null unique,
  organization text,
  capability text not null default 'institutional',
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.invite_redemptions (
  id text primary key,
  invite_code_id text not null references deeptechly.invite_codes(id),
  account_id text not null references deeptechly.accounts(id),
  redeemed_at timestamptz not null default now(),
  unique (invite_code_id, account_id)
);

create table if not exists deeptechly.entities (
  id text primary key,
  slug text not null unique,
  name text not null,
  entity_type text not null,
  sector text,
  region text,
  stage text,
  summary text,
  official_domain text,
  resolution_status text,
  confidence_label text check (confidence_label is null or confidence_label in ('HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'LIMITED_PUBLIC_DATA', 'LOW_CONFIDENCE')),
  confidence_score numeric(5,4) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.entity_aliases (
  entity_id text not null references deeptechly.entities(id),
  alias text not null,
  alias_type text not null default 'name',
  source_id text,
  primary key (entity_id, alias, alias_type)
);

create table if not exists deeptechly.entity_domains (
  entity_id text not null references deeptechly.entities(id),
  domain text not null,
  status text not null default 'candidate' check (status in ('candidate', 'official', 'rejected')),
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  evidence_note text,
  primary key (entity_id, domain)
);

create table if not exists deeptechly.research_jobs (
  id text primary key,
  account_id text references deeptechly.accounts(id),
  requested_entity text not null,
  research_mode text,
  status text not null,
  current_stage text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  idempotency_key text not null unique,
  workflow_provider text,
  workflow_run_id text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  next_retry_at timestamptz,
  heartbeat_at timestamptz,
  entity_id text references deeptechly.entities(id),
  public_error text,
  internal_error jsonb,
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists research_jobs_account_updated_idx on deeptechly.research_jobs(account_id, updated_at desc);
create index if not exists research_jobs_status_retry_idx on deeptechly.research_jobs(status, next_retry_at);

create table if not exists deeptechly.research_runs (
  id text primary key,
  research_job_id text not null references deeptechly.research_jobs(id),
  run_number integer not null check (run_number > 0),
  status text not null,
  methodology_version text not null,
  trace_provider text,
  trace_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (research_job_id, run_number)
);

create table if not exists deeptechly.workflow_events (
  id text primary key,
  research_run_id text not null references deeptechly.research_runs(id),
  stage text not null,
  event_type text not null,
  attempt integer not null default 1,
  public_message text,
  internal_detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (research_run_id, stage, event_type, attempt)
);

create table if not exists deeptechly.search_events (
  id text primary key,
  research_run_id text references deeptechly.research_runs(id),
  legacy_job_id text,
  query text not null,
  provider text not null,
  result_count integer not null default 0,
  provider_request_id text,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.sources (
  id text primary key,
  canonical_url text not null,
  original_url text not null,
  title text,
  publisher text,
  source_type text,
  authority_tier text,
  published_at timestamptz,
  retrieved_at timestamptz not null,
  content_hash text,
  object_key text,
  acquisition_provider text,
  acquisition_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists sources_url_hash_unique on deeptechly.sources(canonical_url, coalesce(content_hash, ''));

create table if not exists deeptechly.entity_sources (
  entity_id text not null references deeptechly.entities(id),
  source_id text not null references deeptechly.sources(id),
  research_run_id text references deeptechly.research_runs(id),
  relevance numeric(5,4) check (relevance is null or (relevance >= 0 and relevance <= 1)),
  relationship text not null default 'evidence',
  primary key (entity_id, source_id)
);

create table if not exists deeptechly.claims (
  id text primary key,
  entity_id text references deeptechly.entities(id),
  research_run_id text references deeptechly.research_runs(id),
  claim_type text not null,
  claim_text text not null,
  normalized_value jsonb,
  state text not null check (state in ('CONFIRMED', 'INFERRED', 'UNVERIFIED', 'CONFLICTING_SOURCES')),
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  methodology_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.evidence (
  id text primary key,
  source_id text not null references deeptechly.sources(id),
  research_run_id text references deeptechly.research_runs(id),
  excerpt text,
  locator text,
  extraction_method text,
  extraction_version text not null,
  content_hash text,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.claim_evidence (
  claim_id text not null references deeptechly.claims(id),
  evidence_id text not null references deeptechly.evidence(id),
  support_type text not null check (support_type in ('supports', 'contradicts', 'context')),
  weight numeric(5,4) check (weight is null or (weight >= 0 and weight <= 1)),
  rationale text,
  primary key (claim_id, evidence_id)
);

create table if not exists deeptechly.contradictions (
  id text primary key,
  claim_id text not null references deeptechly.claims(id),
  resolution_status text not null default 'open' check (resolution_status in ('open', 'resolved', 'accepted_uncertainty')),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.technologies (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  taxonomy_version text,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.patents (
  id text primary key,
  publication_number text not null unique,
  title text not null,
  abstract text,
  assignee text,
  filing_date date,
  publication_date date,
  source_id text references deeptechly.sources(id),
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.labs (
  id text primary key,
  slug text not null unique,
  name text not null,
  organization text,
  official_domain text,
  summary text,
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.entity_technologies (
  entity_id text not null references deeptechly.entities(id),
  technology_id text not null references deeptechly.technologies(id),
  relationship text not null,
  confidence numeric(5,4),
  primary key (entity_id, technology_id, relationship)
);

create table if not exists deeptechly.entity_patents (
  entity_id text not null references deeptechly.entities(id),
  patent_id text not null references deeptechly.patents(id),
  relationship text not null,
  claim_id text references deeptechly.claims(id),
  primary key (entity_id, patent_id, relationship)
);

create table if not exists deeptechly.taxonomy_terms (
  id text primary key,
  vocabulary text not null,
  slug text not null,
  label text not null,
  parent_id text references deeptechly.taxonomy_terms(id),
  version text not null,
  unique (vocabulary, slug, version)
);

create table if not exists deeptechly.entity_taxonomy (
  entity_id text not null references deeptechly.entities(id),
  term_id text not null references deeptechly.taxonomy_terms(id),
  source text not null,
  primary key (entity_id, term_id)
);

create table if not exists deeptechly.articles (
  id text primary key,
  entity_id text references deeptechly.entities(id),
  slug text not null unique,
  title text not null,
  dek text,
  body_markdown text not null,
  structured_body jsonb not null default '[]'::jsonb,
  author_name text,
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.profiles (
  id text primary key,
  entity_id text not null references deeptechly.entities(id),
  slug text not null unique,
  public_markdown text not null,
  structured_content jsonb not null default '{}'::jsonb,
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.dossiers (
  id text primary key,
  entity_id text not null references deeptechly.entities(id),
  slug text not null unique,
  public_markdown text not null,
  public_content jsonb not null default '{}'::jsonb,
  institutional_markdown text,
  institutional_content jsonb,
  compatibility_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.publications (
  id text primary key,
  artifact_type text not null check (artifact_type in ('article', 'profile', 'dossier', 'patent', 'signal', 'problem', 'opportunity')),
  artifact_id text not null,
  state text not null check (state in ('draft', 'review', 'eligible', 'published', 'withdrawn')),
  eligibility jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (artifact_type, artifact_id)
);

create table if not exists deeptechly.publication_events (
  id text primary key,
  publication_id text not null references deeptechly.publications(id),
  from_state text,
  to_state text not null,
  actor_account_id text references deeptechly.accounts(id),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.saved_research (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  item_id text not null,
  item_type text not null,
  title text not null,
  href text not null,
  sector text,
  entity_name text,
  source text not null default 'deeptechly',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, item_id)
);

create table if not exists deeptechly.provenance_events (
  id text primary key,
  research_run_id text references deeptechly.research_runs(id),
  subject_type text not null,
  subject_id text not null,
  operation text not null,
  input_ids jsonb not null default '[]'::jsonb,
  methodology_version text not null,
  model_provider text,
  model_name text,
  prompt_version text,
  output_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists deeptechly.outbox_events (
  id text primary key,
  topic text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null,
  idempotency_key text not null unique,
  available_at timestamptz not null default now(),
  delivered_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists outbox_delivery_idx on deeptechly.outbox_events(delivered_at, available_at);

insert into deeptechly.schema_migrations (id, description)
values ('0001', 'Create identity, research, evidence, and publishing domains')
on conflict (id) do nothing;
