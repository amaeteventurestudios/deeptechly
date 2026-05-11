-- Optional structured-table metadata migration for future normalized storage.
-- The current DeepTechly app stores research data in deeptechly_research_store.data JSONB.
-- Run this only if you later add normalized public.articles or public.entities tables.

do $$
begin
  if to_regclass('public.articles') is not null then
    alter table public.articles
      add column if not exists author_persona text,
      add column if not exists sector_tags jsonb default '[]'::jsonb,
      add column if not exists stage_tag text,
      add column if not exists region_tag text,
      add column if not exists is_favorite boolean default false;
  end if;

  if to_regclass('public.entities') is not null then
    alter table public.entities
      add column if not exists stage_tag text,
      add column if not exists region_tag text,
      add column if not exists sector_tags jsonb default '[]'::jsonb;
  end if;
end
$$;
