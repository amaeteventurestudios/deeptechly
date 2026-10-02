begin;

create schema if not exists deeptechly;

create table if not exists deeptechly.editorial_metadata (
  id text primary key,
  artifact_type text not null check (artifact_type in ('article', 'profile', 'dossier', 'patent', 'signal', 'problem', 'opportunity')),
  artifact_id text not null,
  featured boolean not null default false,
  hero_object_key text,
  hero_alt text,
  hero_credit text,
  seo_title text,
  seo_description text,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb,
  updated_by_account_id text references deeptechly.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artifact_type, artifact_id)
);

create index if not exists editorial_metadata_featured_idx
  on deeptechly.editorial_metadata(artifact_type, featured)
  where featured = true;

create table if not exists deeptechly.editorial_reviews (
  id text primary key,
  artifact_type text not null,
  artifact_id text not null,
  reviewer_account_id text references deeptechly.accounts(id),
  disposition text not null check (disposition in ('pending', 'approved', 'changes_requested', 'rejected')),
  notes text,
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_reviews_artifact_idx
  on deeptechly.editorial_reviews(artifact_type, artifact_id, updated_at desc);

insert into deeptechly.schema_migrations (id, description)
values ('0004', 'Add Directus-ready newsroom metadata and editorial review records')
on conflict (id) do nothing;

commit;
