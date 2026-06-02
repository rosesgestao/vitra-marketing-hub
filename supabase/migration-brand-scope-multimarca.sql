-- ============================================================
-- VITRA - PLATAFORMA OPERACIONAL MULTI-MARCA
-- Adiciona brand_scope derivado para isolar Vitra Premium e
-- Vitra Imobiliaria no mesmo modelo operacional.
-- ============================================================

alter table public.premium_campaigns
  add column if not exists brand_scope text generated always as (
    coalesce(
      brief ->> 'brand_scope',
      brief #>> '{qa_policy,brand_scope}',
      content_plan ->> 'brand_scope',
      'vitra_premium'
    )
  ) stored;

alter table public.premium_campaign_assets
  add column if not exists brand_scope text generated always as (
    coalesce(metadata ->> 'brand_scope', 'vitra_premium')
  ) stored;

alter table public.premium_content_posts
  add column if not exists brand_scope text generated always as (
    coalesce(metadata ->> 'brand_scope', 'vitra_premium')
  ) stored;

alter table public.premium_publications
  add column if not exists brand_scope text generated always as (
    coalesce(metadata ->> 'brand_scope', 'vitra_premium')
  ) stored;

alter table public.premium_generation_jobs
  add column if not exists brand_scope text generated always as (
    coalesce(
      input_payload ->> 'brand_scope',
      output_payload ->> 'brand_scope',
      'vitra_premium'
    )
  ) stored;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_campaigns_brand_scope_check'
  ) then
    alter table public.premium_campaigns
      add constraint premium_campaigns_brand_scope_check
      check (brand_scope in ('vitra_premium', 'vitra_imobiliaria'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_campaign_assets_brand_scope_check'
  ) then
    alter table public.premium_campaign_assets
      add constraint premium_campaign_assets_brand_scope_check
      check (brand_scope in ('vitra_premium', 'vitra_imobiliaria'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_content_posts_brand_scope_check'
  ) then
    alter table public.premium_content_posts
      add constraint premium_content_posts_brand_scope_check
      check (brand_scope in ('vitra_premium', 'vitra_imobiliaria'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_publications_brand_scope_check'
  ) then
    alter table public.premium_publications
      add constraint premium_publications_brand_scope_check
      check (brand_scope in ('vitra_premium', 'vitra_imobiliaria'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_generation_jobs_brand_scope_check'
  ) then
    alter table public.premium_generation_jobs
      add constraint premium_generation_jobs_brand_scope_check
      check (brand_scope in ('vitra_premium', 'vitra_imobiliaria'));
  end if;
end $$;

create index if not exists idx_premium_campaigns_brand_scope
  on public.premium_campaigns(brand_scope, created_at desc);

create index if not exists idx_premium_campaign_assets_brand_scope
  on public.premium_campaign_assets(brand_scope, campaign_id, status);

create index if not exists idx_premium_content_posts_brand_scope
  on public.premium_content_posts(brand_scope, campaign_id, status);

create index if not exists idx_premium_publications_brand_scope
  on public.premium_publications(brand_scope, campaign_id, platform);

create index if not exists idx_premium_generation_jobs_brand_scope
  on public.premium_generation_jobs(brand_scope, campaign_id, status);
