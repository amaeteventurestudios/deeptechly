begin;

create schema if not exists deeptechly;

alter table deeptechly.invite_codes
  add column if not exists code_hint text;

create index if not exists external_identities_account_provider_idx
  on deeptechly.external_identities(account_id, provider);

create index if not exists access_grants_account_capability_status_idx
  on deeptechly.access_grants(account_id, capability, status);

create index if not exists saved_research_account_updated_idx
  on deeptechly.saved_research(account_id, updated_at desc);

insert into deeptechly.schema_migrations (id, description)
values ('0007', 'Finalize Appwrite identity and PostgreSQL runtime indexes')
on conflict (id) do nothing;

commit;
