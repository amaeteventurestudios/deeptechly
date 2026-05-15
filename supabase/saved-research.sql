-- DeepTechly saved research queue.
-- Run this once in the Supabase SQL editor after Phase 3 auth is configured.
-- Saved items are scoped to the authenticated Supabase user.

create extension if not exists pgcrypto;

create table if not exists public.saved_research_items (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
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
  unique (auth_user_id, item_id)
);

alter table public.saved_research_items
  add column if not exists entity_name text;

alter table public.saved_research_items
  add column if not exists source text not null default 'deeptechly';

alter table public.saved_research_items
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.saved_research_items enable row level security;

create or replace function public.set_saved_research_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_research_items_updated_at
  on public.saved_research_items;

create trigger saved_research_items_updated_at
before update on public.saved_research_items
for each row
execute function public.set_saved_research_items_updated_at();

drop policy if exists "Users can read own saved research"
  on public.saved_research_items;

create policy "Users can read own saved research"
on public.saved_research_items
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "Users can insert own saved research"
  on public.saved_research_items;

create policy "Users can insert own saved research"
on public.saved_research_items
for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Users can update own saved research"
  on public.saved_research_items;

create policy "Users can update own saved research"
on public.saved_research_items
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "Users can delete own saved research"
  on public.saved_research_items;

create policy "Users can delete own saved research"
on public.saved_research_items
for delete
to authenticated
using (auth.uid() = auth_user_id);

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.saved_research_items to authenticated;
grant select, insert, update, delete on public.saved_research_items to service_role;
