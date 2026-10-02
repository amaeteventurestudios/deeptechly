\set ON_ERROR_STOP on

begin;

create function legacy_source.confidence_label(value text) returns text
language sql immutable as $$
  select case upper(replace(coalesce(value, ''), ' ', '_'))
    when 'HIGH' then 'HIGH_CONFIDENCE'
    when 'HIGH_CONFIDENCE' then 'HIGH_CONFIDENCE'
    when 'MODERATE' then 'MODERATE_CONFIDENCE'
    when 'MEDIUM' then 'MODERATE_CONFIDENCE'
    when 'MODERATE_CONFIDENCE' then 'MODERATE_CONFIDENCE'
    when 'LIMITED' then 'LIMITED_PUBLIC_DATA'
    when 'LIMITED_PUBLIC_DATA' then 'LIMITED_PUBLIC_DATA'
    when 'LOW' then 'LOW_CONFIDENCE'
    when 'LOW_CONFIDENCE' then 'LOW_CONFIDENCE'
    else null
  end
$$;

insert into deeptechly.legacy_import_batches (
  id, source_system, source_locator, source_checksum, source_record_count, status, report
)
select
  batch_id, source_system, source_locator, source_checksum, selected_row_count,
  'importing', jsonb_build_object('inventory', inventory)
from legacy_source.import_metadata;

insert into deeptechly.accounts (
  id, primary_email, display_name, organization, status, created_at, updated_at
)
select
  users.legacy_id,
  coalesce(users.payload ->> 'email', profiles.payload ->> 'email'),
  profiles.payload ->> 'full_name',
  profiles.payload ->> 'organization',
  case when users.payload ->> 'deleted_at' is null then 'active' else 'closed' end,
  (users.payload ->> 'created_at')::timestamptz,
  (users.payload ->> 'updated_at')::timestamptz
from legacy_source.records users
left join legacy_source.records profiles
  on profiles.source_table = 'public.users_profile'
 and profiles.payload ->> 'auth_user_id' = users.legacy_id
where users.source_table = 'auth.users';

insert into deeptechly.external_identities (
  id, account_id, provider, provider_user_id, provider_email, email_verified,
  provider_payload, created_at, updated_at
)
select
  'identity:supabase:' || legacy_id,
  legacy_id,
  'supabase',
  legacy_id,
  payload ->> 'email',
  payload ->> 'email_confirmed_at' is not null,
  jsonb_strip_nulls(jsonb_build_object(
    'legacy_aud', payload ->> 'aud',
    'legacy_role', payload ->> 'role',
    'last_sign_in_at', payload ->> 'last_sign_in_at',
    'is_sso_user', (payload ->> 'is_sso_user')::boolean,
    'is_anonymous', (payload ->> 'is_anonymous')::boolean
  )),
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'auth.users';

insert into deeptechly.access_grants (
  id, account_id, capability, source, status, metadata, created_at, updated_at
)
select
  'grant:legacy-profile:' || legacy_id,
  payload ->> 'auth_user_id',
  'institutional',
  case
    when (payload ->> 'is_institutional_verified')::boolean then 'legacy_profile_verified'
    else 'legacy_profile_pending'
  end,
  case
    when (payload ->> 'is_institutional_verified')::boolean then 'active'
    else 'pending'
  end,
  jsonb_build_object(
    'legacy_profile_id', legacy_id,
    'legacy_access_tier', payload ->> 'access_tier'
  ),
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.users_profile'
  and (
    (payload ->> 'is_institutional_verified')::boolean
    or (payload ->> 'institutional_request_pending')::boolean
    or coalesce(payload ->> 'access_tier', 'free') <> 'free'
  );

insert into deeptechly.invite_codes (
  id, code_hash, organization, capability, max_uses, used_count,
  expires_at, disabled_at, created_at
)
select
  legacy_id,
  migration_annotation ->> 'code_hash',
  payload ->> 'organization',
  coalesce(nullif(payload ->> 'tier', ''), 'institutional'),
  (payload ->> 'max_uses')::integer,
  coalesce((payload ->> 'used_count')::integer, 0),
  (payload ->> 'expires_at')::timestamptz,
  (payload ->> 'disabled_at')::timestamptz,
  (payload ->> 'created_at')::timestamptz
from legacy_source.records
where source_table = 'public.invite_codes';

insert into deeptechly.entities (
  id, slug, name, entity_type, sector, region, stage, summary,
  official_domain, resolution_status, confidence_label, confidence_score,
  compatibility_snapshot, created_at, updated_at
)
select
  legacy_id,
  payload ->> 'slug',
  payload ->> 'name',
  coalesce(nullif(payload ->> 'entity_type', ''), 'unknown'),
  payload ->> 'sector',
  payload ->> 'region',
  coalesce((payload ->> 'data')::jsonb ->> 'stage', payload ->> 'stage'),
  payload ->> 'summary',
  coalesce(
    (payload ->> 'data')::jsonb ->> 'domain',
    (payload ->> 'data')::jsonb ->> 'website'
  ),
  coalesce((payload ->> 'data')::jsonb ->> 'resolutionStatus', 'legacy_imported'),
  legacy_source.confidence_label(payload ->> 'confidence'),
  case
    when ((payload ->> 'data')::jsonb ->> 'confidenceScore') is null then null
    when (((payload ->> 'data')::jsonb ->> 'confidenceScore')::numeric) > 1
      then (((payload ->> 'data')::jsonb ->> 'confidenceScore')::numeric / 100)
    else ((payload ->> 'data')::jsonb ->> 'confidenceScore')::numeric
  end,
  payload,
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.entities';

insert into deeptechly.research_jobs (
  id, account_id, requested_entity, research_mode, status, current_stage,
  progress, idempotency_key, workflow_provider, workflow_run_id,
  attempt_count, max_attempts, heartbeat_at, entity_id, public_error, internal_error,
  compatibility_snapshot, created_at, started_at, completed_at, updated_at
)
select
  legacy_id,
  payload ->> 'user_id',
  payload ->> 'entity_name',
  coalesce((payload ->> 'data')::jsonb ->> 'mode', payload ->> 'entity_type'),
  payload ->> 'status',
  coalesce((payload ->> 'data')::jsonb ->> 'stage', payload ->> 'stage'),
  coalesce((payload ->> 'progress')::integer, 0),
  'legacy:' || legacy_id,
  'legacy_supabase',
  null,
  coalesce(((payload ->> 'data')::jsonb ->> 'retry_count')::integer, 0) +
    case when payload ->> 'status' = 'queued' then 0 else 1 end,
  3,
  ((payload ->> 'data')::jsonb ->> 'last_heartbeat_at')::timestamptz,
  payload ->> 'entity_id',
  payload ->> 'error_message',
  case
    when payload ->> 'error_message' is null then null
    else jsonb_build_object('legacy_error', payload ->> 'error_message')
  end,
  payload,
  (payload ->> 'created_at')::timestamptz,
  case
    when payload ->> 'status' = 'queued' then null
    else coalesce(
      ((payload ->> 'data')::jsonb ->> 'active_started_at')::timestamptz,
      ((payload ->> 'data')::jsonb ->> 'stage_started_at')::timestamptz,
      (payload ->> 'created_at')::timestamptz
    )
  end,
  case
    when payload ->> 'status' in ('done', 'completed', 'failed', 'cancelled')
      then coalesce(
        ((payload ->> 'data')::jsonb ->> 'completedAt')::timestamptz,
        (payload ->> 'updated_at')::timestamptz
      )
    else null
  end,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.research_jobs';

insert into deeptechly.research_runs (
  id, research_job_id, run_number, status, methodology_version, trace_provider,
  started_at, completed_at
)
select
  'run:legacy:' || legacy_id,
  legacy_id,
  1,
  payload ->> 'status',
  'legacy-supabase-2026-08-19',
  'legacy_supabase',
  (payload ->> 'created_at')::timestamptz,
  case
    when payload ->> 'status' in ('done', 'completed', 'failed', 'cancelled')
      then (payload ->> 'updated_at')::timestamptz
    else null
  end
from legacy_source.records
where source_table = 'public.research_jobs';

insert into deeptechly.sources (
  id, canonical_url, original_url, title, publisher, source_type,
  authority_tier, retrieved_at, acquisition_provider, acquisition_metadata, created_at
)
select distinct on (migration_annotation ->> 'targetId')
  migration_annotation ->> 'targetId',
  migration_annotation ->> 'canonicalUrl',
  payload ->> 'url',
  payload ->> 'title',
  payload ->> 'publisher',
  payload ->> 'source_type',
  migration_annotation ->> 'authorityTier',
  (payload ->> 'retrieved_at')::timestamptz,
  'legacy_supabase',
  jsonb_build_object('representative_legacy_source_id', legacy_id),
  (payload ->> 'created_at')::timestamptz
from legacy_source.records
where source_table = 'public.sources'
order by migration_annotation ->> 'targetId', ordinal;

insert into deeptechly.entity_sources (
  entity_id, source_id, research_run_id, relationship
)
select distinct
  payload ->> 'entity_id',
  migration_annotation ->> 'targetId',
  null,
  'legacy_evidence'
from legacy_source.records
where source_table = 'public.sources'
  and payload ->> 'entity_id' is not null;

insert into deeptechly.articles (
  id, entity_id, slug, title, dek, body_markdown, structured_body,
  author_name, compatibility_snapshot, created_at, updated_at
)
select
  legacy_id,
  payload ->> 'entity_id',
  payload ->> 'slug',
  payload ->> 'title',
  payload ->> 'dek',
  payload ->> 'body_md',
  coalesce((payload ->> 'data')::jsonb -> 'bodySections', '[]'::jsonb),
  payload ->> 'author_name',
  payload,
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.articles';

insert into deeptechly.profiles (
  id, entity_id, slug, public_markdown, structured_content,
  compatibility_snapshot, created_at, updated_at
)
select
  'profile:' || legacy_id,
  legacy_id,
  payload ->> 'slug',
  concat_ws(E'\n\n',
    '# ' || (payload ->> 'name'),
    payload ->> 'summary',
    case when payload ->> 'technical_summary' is not null
      then '## Technical summary' || E'\n\n' || (payload ->> 'technical_summary') end,
    case when payload ->> 'market_position' is not null
      then '## Market position' || E'\n\n' || (payload ->> 'market_position') end,
    case when payload ->> 'competitive_landscape' is not null
      then '## Competitive landscape' || E'\n\n' || (payload ->> 'competitive_landscape') end
  ),
  coalesce((payload ->> 'data')::jsonb, '{}'::jsonb),
  payload,
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.entities';

insert into deeptechly.dossiers (
  id, entity_id, slug, public_markdown, public_content,
  institutional_markdown, institutional_content, compatibility_snapshot,
  created_at, updated_at
)
select
  legacy_id,
  payload ->> 'entity_id',
  payload ->> 'slug',
  payload ->> 'public_md',
  coalesce((payload ->> 'data')::jsonb, '{}'::jsonb),
  payload ->> 'institutional_md',
  case
    when payload ->> 'institutional_md' is null then null
    else coalesce((payload ->> 'data')::jsonb, '{}'::jsonb)
  end,
  payload,
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.dossiers';

insert into deeptechly.publications (
  id, artifact_type, artifact_id, state, eligibility, published_at, updated_at
)
select
  'publication:article:' || legacy_id,
  'article',
  legacy_id,
  case when (payload ->> 'published')::boolean then 'published' else 'draft' end,
  jsonb_build_object(
    'legacy_published', (payload ->> 'published')::boolean,
    'legacy_confidence', payload ->> 'confidence',
    'legacy_source_count', (payload ->> 'source_count')::integer
  ),
  (payload ->> 'published_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.articles'
union all
select
  'publication:profile:' || legacy_id,
  'profile',
  'profile:' || legacy_id,
  case when (payload ->> 'published')::boolean then 'published' else 'draft' end,
  jsonb_build_object(
    'legacy_entity_published', (payload ->> 'published')::boolean,
    'legacy_confidence', payload ->> 'confidence',
    'legacy_source_count', (payload ->> 'source_count')::integer,
    'published_at_derived_from', 'entity.updated_at'
  ),
  case when (payload ->> 'published')::boolean
    then (payload ->> 'updated_at')::timestamptz else null end,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.entities'
union all
select
  'publication:dossier:' || legacy_id,
  'dossier',
  legacy_id,
  case when (payload ->> 'published')::boolean then 'published' else 'draft' end,
  jsonb_build_object(
    'legacy_published', (payload ->> 'published')::boolean,
    'legacy_confidence', payload ->> 'confidence',
    'legacy_source_count', (payload ->> 'source_count')::integer,
    'published_at_derived_from', 'dossier.updated_at'
  ),
  case when (payload ->> 'published')::boolean
    then (payload ->> 'updated_at')::timestamptz else null end,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.dossiers';

insert into deeptechly.saved_research (
  id, account_id, item_id, item_type, title, href, sector, entity_name,
  source, metadata, created_at, updated_at
)
select
  legacy_id,
  payload ->> 'auth_user_id',
  payload ->> 'item_id',
  payload ->> 'item_type',
  payload ->> 'title',
  payload ->> 'href',
  payload ->> 'sector',
  payload ->> 'entity_name',
  payload ->> 'source',
  coalesce((payload ->> 'metadata')::jsonb, '{}'::jsonb),
  (payload ->> 'created_at')::timestamptz,
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.saved_research_items';

insert into deeptechly.research_job_outputs (
  research_job_id, artifact_type, artifact_id, relationship, created_at
)
select legacy_id, 'article', payload ->> 'article_id', 'legacy_output',
       (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.research_jobs' and payload ->> 'article_id' is not null
union all
select legacy_id, 'profile', 'profile:' || (payload ->> 'entity_id'), 'legacy_output',
       (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.research_jobs' and payload ->> 'entity_id' is not null
union all
select legacy_id, 'dossier', payload ->> 'dossier_id', 'legacy_output',
       (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.research_jobs' and payload ->> 'dossier_id' is not null;

insert into deeptechly.artifact_sources (
  artifact_type, artifact_id, source_id, relationship, legacy_source_id, created_at
)
select distinct on (artifact_type, artifact_id, source_id)
  artifact_type, artifact_id, source_id, 'legacy_evidence', legacy_source_id, created_at
from (
  select 'profile'::text as artifact_type,
         'profile:' || (payload ->> 'entity_id') as artifact_id,
         migration_annotation ->> 'targetId' as source_id,
         legacy_id as legacy_source_id,
         (payload ->> 'created_at')::timestamptz as created_at
  from legacy_source.records
  where source_table = 'public.sources' and payload ->> 'entity_id' is not null
  union all
  select 'article', payload ->> 'article_id', migration_annotation ->> 'targetId',
         legacy_id, (payload ->> 'created_at')::timestamptz
  from legacy_source.records
  where source_table = 'public.sources' and payload ->> 'article_id' is not null
  union all
  select 'dossier', payload ->> 'dossier_id', migration_annotation ->> 'targetId',
         legacy_id, (payload ->> 'created_at')::timestamptz
  from legacy_source.records
  where source_table = 'public.sources' and payload ->> 'dossier_id' is not null
  union all
  select 'article', articles.legacy_id, sources.migration_annotation ->> 'targetId',
         sources.legacy_id, (sources.payload ->> 'created_at')::timestamptz
  from legacy_source.records sources
  join legacy_source.records articles
    on articles.source_table = 'public.articles'
   and articles.payload ->> 'entity_id' = sources.payload ->> 'entity_id'
  where sources.source_table = 'public.sources'
    and sources.payload ->> 'entity_id' is not null
  union all
  select 'dossier', dossiers.legacy_id, sources.migration_annotation ->> 'targetId',
         sources.legacy_id, (sources.payload ->> 'created_at')::timestamptz
  from legacy_source.records sources
  join legacy_source.records dossiers
    on dossiers.source_table = 'public.dossiers'
   and dossiers.payload ->> 'entity_id' = sources.payload ->> 'entity_id'
  where sources.source_table = 'public.sources'
    and sources.payload ->> 'entity_id' is not null
) links
order by artifact_type, artifact_id, source_id, legacy_source_id;

insert into deeptechly.provenance_events (
  id, research_run_id, subject_type, subject_id, operation, input_ids,
  methodology_version, metadata, created_at
)
select
  'provenance:legacy-job:' || legacy_id,
  'run:legacy:' || legacy_id,
  'research_job',
  legacy_id,
  'legacy_import',
  jsonb_build_array(legacy_id),
  'legacy-supabase-2026-08-19',
  jsonb_build_object(
    'article_id', payload ->> 'article_id',
    'entity_id', payload ->> 'entity_id',
    'dossier_id', payload ->> 'dossier_id'
  ),
  (payload ->> 'updated_at')::timestamptz
from legacy_source.records
where source_table = 'public.research_jobs';

insert into deeptechly.legacy_records (
  import_batch_id, legacy_table, legacy_id, payload, payload_checksum,
  legacy_created_at, legacy_updated_at, imported_at
)
select
  metadata.batch_id,
  records.source_table,
  records.legacy_id,
  records.payload,
  md5(records.payload::text),
  case when records.payload ->> 'created_at' is not null
    then (records.payload ->> 'created_at')::timestamptz else null end,
  case when records.payload ->> 'updated_at' is not null
    then (records.payload ->> 'updated_at')::timestamptz else null end,
  now()
from legacy_source.records records
cross join legacy_source.import_metadata metadata;

insert into deeptechly.legacy_identity_map (
  import_batch_id, legacy_provider, legacy_id, target_type, target_id
)
select metadata.batch_id, records.source_table, records.legacy_id,
  case records.source_table
    when 'auth.users' then 'account'
    when 'auth.identities' then 'account'
    when 'public.users_profile' then 'account'
    when 'public.research_jobs' then 'research_job'
    when 'public.entities' then 'entity'
    when 'public.articles' then 'article'
    when 'public.dossiers' then 'dossier'
    when 'public.sources' then 'source'
    when 'public.saved_research_items' then 'saved_research'
    when 'public.invite_codes' then 'invite_code'
  end,
  case records.source_table
    when 'auth.users' then records.legacy_id
    when 'auth.identities' then records.payload ->> 'user_id'
    when 'public.users_profile' then records.payload ->> 'auth_user_id'
    when 'public.sources' then records.migration_annotation ->> 'targetId'
    else records.legacy_id
  end
from legacy_source.records records
cross join legacy_source.import_metadata metadata;

insert into deeptechly.import_findings (
  id, import_batch_id, severity, legacy_table, legacy_id, code, detail
)
select
  'finding:source-deduplicated:' || records.legacy_id,
  metadata.batch_id,
  'info',
  records.source_table,
  records.legacy_id,
  'SOURCE_URL_DEDUPLICATED',
  'Mapped the legacy source row to an existing canonical URL while retaining its identity-map entry.'
from legacy_source.records records
cross join legacy_source.import_metadata metadata
where records.source_table = 'public.sources'
  and (records.migration_annotation ->> 'duplicate')::boolean
union all
select
  'finding:profile-derived:' || records.legacy_id,
  metadata.batch_id,
  'info',
  records.source_table,
  records.legacy_id,
  'PROFILE_DERIVED_FROM_ENTITY',
  'Created the V2 profile artifact from the legacy entity record because no separate legacy profile table existed.'
from legacy_source.records records
cross join legacy_source.import_metadata metadata
where records.source_table = 'public.entities'
union all
select
  'finding:credential-redacted:' || records.source_table || ':' || records.legacy_id,
  metadata.batch_id,
  'info',
  records.source_table,
  records.legacy_id,
  'AUTH_SECRET_EXCLUDED',
  'Excluded password hashes, tokens, phone values, and provider identity payloads from the V2 import ledger.'
from legacy_source.records records
cross join legacy_source.import_metadata metadata
where records.source_table in ('auth.users', 'auth.identities');

insert into deeptechly.reconciliation_results (
  id, import_batch_id, domain, source_count, target_count, matched_count,
  mismatched_count, source_checksum, target_checksum, detail
)
select
  'reconciliation:' || replace(expected.table_name, '.', ':'),
  metadata.batch_id,
  expected.table_name,
  expected.source_count,
  count(distinct case when expected.table_name = 'public.sources'
    then records.migration_annotation ->> 'targetId' else records.legacy_id end),
  count(records.legacy_id),
  abs(expected.source_count - count(records.legacy_id))::integer,
  md5(string_agg(records.legacy_id, ',' order by records.legacy_id)),
  md5(string_agg(
    case when expected.table_name = 'public.sources'
      then records.migration_annotation ->> 'targetId' else records.legacy_id end,
    ',' order by records.legacy_id
  )),
  jsonb_build_object(
    'deduplicated_rows', count(records.legacy_id) - count(distinct case
      when expected.table_name = 'public.sources'
        then records.migration_annotation ->> 'targetId'
      else records.legacy_id end)
  )
from legacy_source.import_metadata metadata
cross join lateral (
  select key as table_name, value::integer as source_count
  from jsonb_each_text(metadata.expected_counts)
) expected
left join legacy_source.records records on records.source_table = expected.table_name
group by metadata.batch_id, expected.table_name, expected.source_count;

update deeptechly.legacy_import_batches batches
set status = 'reconciled',
    completed_at = now(),
    report = batches.report || jsonb_build_object(
      'reconciliation_rows', (
        select count(*) from deeptechly.reconciliation_results results
        where results.import_batch_id = batches.id
      )
    );

set constraints all immediate;
commit;
