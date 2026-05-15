-- DeepTechly Phase 5 research persistence.
-- Run this once in the Supabase SQL editor.
-- Normalized public tables are used for jobs, generated entities, articles,
-- dossiers, and source citations. JSONB columns preserve the existing v1
-- rendering contract while the public columns stay queryable.

create extension if not exists pgcrypto;

create table if not exists public.research_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  entity_name text not null,
  entity_type text,
  input_query text not null,
  status text not null default 'queued',
  stage text not null default 'Queued',
  progress integer not null default 0,
  source_count integer not null default 0,
  confidence text,
  article_id uuid,
  entity_id uuid,
  dossier_id uuid,
  error_message text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  entity_type text,
  sector text,
  region text,
  stage text,
  summary text,
  technical_summary text,
  market_position text,
  competitive_landscape text,
  confidence text,
  source_count integer not null default 0,
  published boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id) on delete cascade,
  slug text unique not null,
  title text not null,
  dek text,
  body_md text not null,
  sector text,
  author_name text,
  confidence text,
  source_count integer not null default 0,
  hero_image_url text,
  published boolean not null default false,
  published_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id) on delete cascade,
  slug text unique not null,
  public_md text not null,
  institutional_md text,
  confidence text,
  source_count integer not null default 0,
  published boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public.entities(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  dossier_id uuid references public.dossiers(id) on delete cascade,
  title text,
  url text not null,
  publisher text,
  source_type text,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.research_jobs
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.entities
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.articles
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.dossiers
  add column if not exists data jsonb not null default '{}'::jsonb;

create index if not exists research_jobs_user_updated_idx
  on public.research_jobs(user_id, updated_at desc);

create index if not exists research_jobs_status_updated_idx
  on public.research_jobs(status, updated_at desc);

create index if not exists entities_published_updated_idx
  on public.entities(published, updated_at desc);

create index if not exists articles_published_at_idx
  on public.articles(published, published_at desc);

create index if not exists dossiers_published_updated_idx
  on public.dossiers(published, updated_at desc);

create index if not exists sources_entity_idx
  on public.sources(entity_id);

create or replace function public.set_research_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists research_jobs_updated_at on public.research_jobs;
create trigger research_jobs_updated_at
before update on public.research_jobs
for each row execute function public.set_research_updated_at();

drop trigger if exists entities_updated_at on public.entities;
create trigger entities_updated_at
before update on public.entities
for each row execute function public.set_research_updated_at();

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
before update on public.articles
for each row execute function public.set_research_updated_at();

drop trigger if exists dossiers_updated_at on public.dossiers;
create trigger dossiers_updated_at
before update on public.dossiers
for each row execute function public.set_research_updated_at();

alter table public.research_jobs enable row level security;
alter table public.entities enable row level security;
alter table public.articles enable row level security;
alter table public.dossiers enable row level security;
alter table public.sources enable row level security;

drop policy if exists "Users can read own research jobs" on public.research_jobs;
create policy "Users can read own research jobs"
on public.research_jobs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own research jobs" on public.research_jobs;
create policy "Users can create own research jobs"
on public.research_jobs for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Public can read published entities" on public.entities;
create policy "Public can read published entities"
on public.entities for select
to anon, authenticated
using (published = true);

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
on public.articles for select
to anon, authenticated
using (published = true);

drop policy if exists "Public can read published dossiers" on public.dossiers;
create policy "Public can read published dossiers"
on public.dossiers for select
to anon, authenticated
using (published = true);

drop policy if exists "Public can read published sources" on public.sources;
create policy "Public can read published sources"
on public.sources for select
to anon, authenticated
using (
  exists (
    select 1 from public.entities e
    where e.id = sources.entity_id and e.published = true
  )
);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.entities, public.articles, public.dossiers, public.sources to anon, authenticated;
grant select, insert on public.research_jobs to authenticated;
grant select, insert, update, delete on public.research_jobs to service_role;
grant select, insert, update, delete on public.entities to service_role;
grant select, insert, update, delete on public.articles to service_role;
grant select, insert, update, delete on public.dossiers to service_role;
grant select, insert, update, delete on public.sources to service_role;
