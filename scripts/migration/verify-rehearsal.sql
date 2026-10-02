\set ON_ERROR_STOP on

do $$
declare
  expected jsonb;
  expected_count integer;
  actual_count integer;
  invalid_count integer;
begin
  select expected_counts into expected from legacy_source.import_metadata;

  select (expected ->> 'auth.users')::integer into expected_count;
  select count(*) into actual_count from deeptechly.accounts;
  if actual_count <> expected_count then
    raise exception 'Account reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;
  select count(*) into actual_count from deeptechly.external_identities;
  if actual_count <> expected_count then
    raise exception 'External identity reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select count(*) into expected_count
  from legacy_source.records
  where source_table = 'public.users_profile'
    and (
      (payload ->> 'is_institutional_verified')::boolean
      or (payload ->> 'institutional_request_pending')::boolean
      or coalesce(payload ->> 'access_tier', 'free') <> 'free'
    );
  select count(*) into actual_count from deeptechly.access_grants;
  if actual_count <> expected_count then
    raise exception 'Access grant reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select (expected ->> 'public.entities')::integer into expected_count;
  select count(*) into actual_count from deeptechly.entities;
  if actual_count <> expected_count then
    raise exception 'Entity reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;
  select count(*) into actual_count from deeptechly.profiles;
  if actual_count <> expected_count then
    raise exception 'Derived profile reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select (expected ->> 'public.articles')::integer into expected_count;
  select count(*) into actual_count from deeptechly.articles;
  if actual_count <> expected_count then
    raise exception 'Article reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select (expected ->> 'public.dossiers')::integer into expected_count;
  select count(*) into actual_count from deeptechly.dossiers;
  if actual_count <> expected_count then
    raise exception 'Dossier reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select (expected ->> 'public.research_jobs')::integer into expected_count;
  select count(*) into actual_count from deeptechly.research_jobs;
  if actual_count <> expected_count then
    raise exception 'Research job reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;
  select count(*) into actual_count from deeptechly.research_runs;
  if actual_count <> expected_count then
    raise exception 'Research run reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select (expected ->> 'public.saved_research_items')::integer into expected_count;
  select count(*) into actual_count from deeptechly.saved_research;
  if actual_count <> expected_count then
    raise exception 'Saved research reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select (inventory -> 'sourceUrls' ->> 'canonicalTargets')::integer into expected_count
  from legacy_source.import_metadata;
  select count(*) into actual_count from deeptechly.sources;
  if actual_count <> expected_count then
    raise exception 'Canonical source reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select count(*) into expected_count
  from legacy_source.records
  where source_table = 'public.research_jobs'
    and payload ->> 'article_id' is not null;
  select expected_count + count(*) into expected_count
  from legacy_source.records
  where source_table = 'public.research_jobs'
    and payload ->> 'entity_id' is not null;
  select expected_count + count(*) into expected_count
  from legacy_source.records
  where source_table = 'public.research_jobs'
    and payload ->> 'dossier_id' is not null;
  select count(*) into actual_count from deeptechly.research_job_outputs;
  if actual_count <> expected_count then
    raise exception 'Research output reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select count(*) into expected_count
  from legacy_source.records
  where source_table in ('public.articles', 'public.entities', 'public.dossiers');
  select count(*) into actual_count from deeptechly.publications;
  if actual_count <> expected_count then
    raise exception 'Publication reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;
  select count(*) into expected_count
  from legacy_source.records
  where source_table in ('public.articles', 'public.entities', 'public.dossiers')
    and (payload ->> 'published')::boolean;
  select count(*) into actual_count from deeptechly.publications where state = 'published';
  if actual_count <> expected_count then
    raise exception 'Published-state reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select selected_row_count into expected_count from legacy_source.import_metadata;
  select count(*) into actual_count from deeptechly.legacy_records;
  if actual_count <> expected_count then
    raise exception 'Legacy ledger reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;
  select count(*) into actual_count from deeptechly.legacy_identity_map;
  if actual_count <> expected_count then
    raise exception 'Identity-map reconciliation failed: expected %, got %', expected_count, actual_count;
  end if;

  select count(*) into invalid_count
  from pg_constraint
  where connamespace = 'deeptechly'::regnamespace
    and contype = 'f'
    and not convalidated;
  if invalid_count <> 0 then
    raise exception 'Found % unvalidated DeepTechly foreign keys', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.research_job_outputs outputs
  left join deeptechly.articles articles
    on outputs.artifact_type = 'article' and articles.id = outputs.artifact_id
  left join deeptechly.profiles profiles
    on outputs.artifact_type = 'profile' and profiles.id = outputs.artifact_id
  left join deeptechly.dossiers dossiers
    on outputs.artifact_type = 'dossier' and dossiers.id = outputs.artifact_id
  where (outputs.artifact_type = 'article' and articles.id is null)
     or (outputs.artifact_type = 'profile' and profiles.id is null)
     or (outputs.artifact_type = 'dossier' and dossiers.id is null);
  if invalid_count <> 0 then
    raise exception 'Found % orphaned research job outputs', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.artifact_sources links
  left join deeptechly.articles articles
    on links.artifact_type = 'article' and articles.id = links.artifact_id
  left join deeptechly.profiles profiles
    on links.artifact_type = 'profile' and profiles.id = links.artifact_id
  left join deeptechly.dossiers dossiers
    on links.artifact_type = 'dossier' and dossiers.id = links.artifact_id
  where (links.artifact_type = 'article' and articles.id is null)
     or (links.artifact_type = 'profile' and profiles.id is null)
     or (links.artifact_type = 'dossier' and dossiers.id is null);
  if invalid_count <> 0 then
    raise exception 'Found % orphaned artifact source links', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.publications publications
  left join deeptechly.articles articles
    on publications.artifact_type = 'article' and articles.id = publications.artifact_id
  left join deeptechly.profiles profiles
    on publications.artifact_type = 'profile' and profiles.id = publications.artifact_id
  left join deeptechly.dossiers dossiers
    on publications.artifact_type = 'dossier' and dossiers.id = publications.artifact_id
  where (publications.artifact_type = 'article' and articles.id is null)
     or (publications.artifact_type = 'profile' and profiles.id is null)
     or (publications.artifact_type = 'dossier' and dossiers.id is null);
  if invalid_count <> 0 then
    raise exception 'Found % orphaned publication records', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.articles articles
  where articles.body_markdown = '' or articles.slug = '' or articles.title = '';
  if invalid_count <> 0 then
    raise exception 'Found % articles without preview/route/markdown backing data', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.profiles profiles
  where profiles.public_markdown = '' or profiles.slug = '';
  if invalid_count <> 0 then
    raise exception 'Found % profiles without preview/route/markdown backing data', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.dossiers dossiers
  where dossiers.public_markdown = '' or dossiers.slug = '';
  if invalid_count <> 0 then
    raise exception 'Found % dossiers without preview/route/markdown backing data', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.research_jobs jobs
  where jobs.status in ('done', 'completed', 'failed', 'cancelled')
    and jobs.completed_at is null;
  if invalid_count <> 0 then
    raise exception 'Found % terminal research jobs without completion timestamps', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.legacy_identity_map maps
  where maps.target_id is null or maps.target_type is null;
  if invalid_count <> 0 then
    raise exception 'Found % incomplete legacy identity mappings', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.reconciliation_results
  where mismatched_count <> 0;
  if invalid_count <> 0 then
    raise exception 'Found % reconciliation domains with mismatches', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.research_jobs jobs
  join legacy_source.records source
    on source.source_table = 'public.research_jobs' and source.legacy_id = jobs.id
  where jobs.account_id is distinct from source.payload ->> 'user_id'
     or jobs.created_at is distinct from (source.payload ->> 'created_at')::timestamptz
     or jobs.updated_at is distinct from (source.payload ->> 'updated_at')::timestamptz;
  if invalid_count <> 0 then
    raise exception 'Found % research jobs with ownership/timestamp drift', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.entities entities
  join legacy_source.records source
    on source.source_table = 'public.entities' and source.legacy_id = entities.id
  where entities.created_at is distinct from (source.payload ->> 'created_at')::timestamptz
     or entities.updated_at is distinct from (source.payload ->> 'updated_at')::timestamptz;
  if invalid_count <> 0 then
    raise exception 'Found % entities with timestamp drift', invalid_count;
  end if;

  select count(*) into invalid_count
  from deeptechly.publications publications
  join legacy_source.records source
    on source.legacy_id = publications.artifact_id
   and source.source_table = 'public.' || publications.artifact_type || 's'
  where (publications.eligibility ->> 'legacy_source_count')::integer
        is distinct from (source.payload ->> 'source_count')::integer;
  if invalid_count <> 0 then
    raise exception 'Found % article/dossier publications with source-count drift', invalid_count;
  end if;
end
$$;

select jsonb_build_object(
  'status', 'pass',
  'source', jsonb_build_object(
    'application_rows', metadata.application_row_count,
    'selected_rows', metadata.selected_row_count,
    'checksum', metadata.source_checksum
  ),
  'target_counts', jsonb_build_object(
    'accounts', (select count(*) from deeptechly.accounts),
    'external_identities', (select count(*) from deeptechly.external_identities),
    'access_grants', (select count(*) from deeptechly.access_grants),
    'entities', (select count(*) from deeptechly.entities),
    'research_jobs', (select count(*) from deeptechly.research_jobs),
    'research_runs', (select count(*) from deeptechly.research_runs),
    'sources', (select count(*) from deeptechly.sources),
    'articles', (select count(*) from deeptechly.articles),
    'profiles', (select count(*) from deeptechly.profiles),
    'dossiers', (select count(*) from deeptechly.dossiers),
    'publications', (select count(*) from deeptechly.publications),
    'saved_research', (select count(*) from deeptechly.saved_research),
    'research_job_outputs', (select count(*) from deeptechly.research_job_outputs),
    'artifact_sources', (select count(*) from deeptechly.artifact_sources),
    'legacy_records', (select count(*) from deeptechly.legacy_records),
    'legacy_identity_map', (select count(*) from deeptechly.legacy_identity_map)
  ),
  'publication_states', (
    select coalesce(jsonb_object_agg(state, count), '{}'::jsonb)
    from (select state, count(*) as count from deeptechly.publications group by state) states
  ),
  'reconciliation', jsonb_build_object(
    'domains', (select count(*) from deeptechly.reconciliation_results),
    'mismatched_domains', (
      select count(*) from deeptechly.reconciliation_results where mismatched_count <> 0
    ),
    'orphaned_polymorphic_links', 0,
    'unvalidated_foreign_keys', 0
  ),
  'application_contract', jsonb_build_object(
    'homepage_published_artifacts', (
      select count(*) from deeptechly.publications where state = 'published'
    ),
    'article_routes', (
      select count(*) from deeptechly.articles articles
      join deeptechly.publications publications
        on publications.artifact_type = 'article' and publications.artifact_id = articles.id
      where publications.state = 'published'
    ),
    'article_preview_records', (select count(*) from deeptechly.articles),
    'profile_routes', (
      select count(*) from deeptechly.profiles profiles
      join deeptechly.publications publications
        on publications.artifact_type = 'profile' and publications.artifact_id = profiles.id
      where publications.state = 'published'
    ),
    'profile_preview_records', (select count(*) from deeptechly.profiles),
    'dossier_routes', (
      select count(*) from deeptechly.dossiers dossiers
      join deeptechly.publications publications
        on publications.artifact_type = 'dossier' and publications.artifact_id = dossiers.id
      where publications.state = 'published'
    ),
    'dossier_preview_records', (select count(*) from deeptechly.dossiers),
    'queue_history_rows', (select count(*) from deeptechly.research_jobs),
    'saved_research_rows', (select count(*) from deeptechly.saved_research),
    'source_relationships', (select count(*) from deeptechly.artifact_sources)
  )
)
from legacy_source.import_metadata metadata;
