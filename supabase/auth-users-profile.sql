-- DeepTechly Supabase Auth profile setup.
-- Run this once in the Supabase SQL editor before enabling production auth.
-- The app writes users_profile rows from server-side code with SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  organization text,
  access_tier text not null default 'free',
  is_institutional_verified boolean not null default false,
  institutional_request_pending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users_profile
  add column if not exists institutional_request_pending boolean not null default false;

alter table public.users_profile enable row level security;

create or replace function public.set_users_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_profile_updated_at on public.users_profile;

create trigger users_profile_updated_at
before update on public.users_profile
for each row
execute function public.set_users_profile_updated_at();

drop policy if exists "Users can read own DeepTechly profile"
  on public.users_profile;

create policy "Users can read own DeepTechly profile"
on public.users_profile
for select
to authenticated
using (auth.uid() = auth_user_id);

grant usage on schema public to authenticated, service_role;
grant select on public.users_profile to authenticated;
grant select, insert, update, delete on public.users_profile to service_role;

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  organization text,
  tier text,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invite_codes
  add column if not exists organization text;

alter table public.invite_codes
  add column if not exists disabled_at timestamptz;

alter table public.invite_codes enable row level security;

grant select, insert, update, delete on public.invite_codes to service_role;

create or replace function public.redeem_invite_code(invite_code_input text)
returns table(is_valid boolean, access_tier text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with redeemed as (
    update public.invite_codes
    set used_count = used_count + 1
    where code = invite_code_input
      and disabled_at is null
      and (expires_at is null or expires_at > now())
      and (max_uses is null or used_count < max_uses)
    returning coalesce(tier, 'institutional') as redeemed_tier
  )
  select true, redeemed.redeemed_tier
  from redeemed;

  if not found then
    return query select false, null::text;
  end if;
end;
$$;

revoke all on function public.redeem_invite_code(text) from public, anon, authenticated;
grant execute on function public.redeem_invite_code(text) to service_role;
