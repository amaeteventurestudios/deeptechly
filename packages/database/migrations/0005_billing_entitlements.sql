-- Additive billing, credit, and entitlement ledger. No provider is activated by this migration.

create schema if not exists deeptechly;

create table if not exists deeptechly.billing_customers (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  provider text not null check (provider in ('lago', 'stripe')),
  external_customer_id text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_customer_id),
  unique (account_id, provider)
);

create table if not exists deeptechly.billing_subscriptions (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  provider text not null check (provider in ('lago', 'stripe')),
  external_subscription_id text not null,
  plan_code text,
  status text not null check (status in ('pending', 'active', 'paused', 'canceled', 'expired')),
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  provider_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_subscription_id)
);

create index if not exists billing_subscriptions_account_status_idx
  on deeptechly.billing_subscriptions(account_id, status);

create table if not exists deeptechly.credit_accounts (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  credit_type text not null default 'research',
  unit text not null default 'credit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, credit_type)
);

create table if not exists deeptechly.credit_ledger_entries (
  id text primary key,
  credit_account_id text not null references deeptechly.credit_accounts(id),
  delta numeric(18,6) not null check (delta <> 0),
  entry_type text not null check (entry_type in ('grant', 'consume', 'refund', 'expire', 'adjustment')),
  idempotency_key text not null unique,
  reference_type text,
  reference_id text,
  note text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_account_time_idx
  on deeptechly.credit_ledger_entries(credit_account_id, occurred_at desc);

create table if not exists deeptechly.usage_events (
  id text primary key,
  account_id text not null references deeptechly.accounts(id),
  event_code text not null,
  quantity numeric(18,6) not null check (quantity > 0),
  idempotency_key text not null unique,
  occurred_at timestamptz not null,
  provider text,
  provider_event_id text,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'delivered', 'failed', 'ignored')),
  properties jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists usage_events_delivery_idx
  on deeptechly.usage_events(delivery_status, occurred_at);

create table if not exists deeptechly.billing_webhook_events (
  id text primary key,
  provider text not null check (provider in ('lago', 'stripe')),
  external_event_id text not null,
  event_type text not null,
  signature_verified boolean not null default false,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processed', 'ignored', 'failed')),
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

insert into deeptechly.schema_migrations (id, description)
values ('0005', 'Add billing customers, subscriptions, usage, credits, and webhook ledgers')
on conflict (id) do nothing;
