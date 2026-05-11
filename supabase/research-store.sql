-- DeepTechly durable research store.
-- Run this once in the Supabase SQL editor for:
-- https://euqywyxplgkjkrnxmpln.supabase.co
--
-- The application writes to this table only from server-side code with
-- SUPABASE_SERVICE_ROLE_KEY. Do not expose the service-role key in the browser.

create table if not exists public.deeptechly_research_store (
  id text primary key,
  data jsonb not null default jsonb_build_object(
    'jobs', jsonb_build_array(),
    'entities', jsonb_build_array(),
    'articles', jsonb_build_array(),
    'dossiers', jsonb_build_array(),
    'searchEvents', jsonb_build_array()
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deeptechly_research_store enable row level security;

create or replace function public.set_deeptechly_research_store_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deeptechly_research_store_updated_at
  on public.deeptechly_research_store;

create trigger deeptechly_research_store_updated_at
before update on public.deeptechly_research_store
for each row
execute function public.set_deeptechly_research_store_updated_at();

grant usage on schema public to service_role;
grant select, insert, update, delete on public.deeptechly_research_store to service_role;
