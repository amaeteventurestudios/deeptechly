begin;

create schema if not exists deeptechly;

alter table deeptechly.accounts add column if not exists last_login_at timestamptz;

create table if not exists deeptechly.account_roles (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  role text not null,
  assigned_by text references deeptechly.accounts(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, role)
);

create table if not exists deeptechly.account_preferences (
  account_id text primary key references deeptechly.accounts(id),
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  secret_ciphertext text,
  updated_by text references deeptechly.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.ai_providers (
  id text primary key,
  name text not null,
  provider_type text not null,
  base_url text,
  secret_ciphertext text,
  enabled boolean not null default true,
  last_test_status text,
  last_tested_at timestamptz,
  created_by text references deeptechly.accounts(id),
  updated_by text references deeptechly.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.ai_models (
  id text primary key,
  provider_id text not null references deeptechly.ai_providers(id),
  model_key text not null,
  display_name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, model_key)
);

create table if not exists deeptechly.ai_model_assignments (
  role_key text primary key,
  primary_model_id text references deeptechly.ai_models(id),
  fallback_model_id text references deeptechly.ai_models(id),
  enabled boolean not null default true,
  budget_cents integer check (budget_cents is null or budget_cents >= 0),
  timeout_ms integer check (timeout_ms is null or timeout_ms > 0),
  max_retries integer check (max_retries is null or max_retries >= 0),
  updated_by text references deeptechly.accounts(id),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.smtp_configuration (
  id text primary key default 'primary',
  host text,
  port integer check (port is null or (port > 0 and port <= 65535)),
  username text,
  password_ciphertext text,
  security text,
  sender_name text,
  sender_email text,
  reply_to_email text,
  last_test_status text,
  last_tested_at timestamptz,
  updated_by text references deeptechly.accounts(id),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.user_invitations (
  id text primary key,
  email text not null,
  requested_role text not null,
  organization text,
  token_hash text not null unique,
  invited_by text not null references deeptechly.accounts(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  accepted_by text references deeptechly.accounts(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deeptechly.auth_audit_events (
  id text primary key,
  event_type text not null,
  outcome text not null,
  actor_account_id text references deeptechly.accounts(id),
  target_account_id text references deeptechly.accounts(id),
  provider text,
  identifier_hash text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists account_roles_account_idx on deeptechly.account_roles(account_id, role);
create index if not exists user_invitations_status_idx on deeptechly.user_invitations(status, expires_at);
create index if not exists auth_audit_events_occurred_idx on deeptechly.auth_audit_events(occurred_at desc);

insert into deeptechly.schema_migrations (id, description)
values ('0008', 'Add PocketBase identity authorization, settings, invitations, and auth audit domains')
on conflict (id) do nothing;

commit;
