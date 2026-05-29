-- ============================================================
-- VITRA PREMIUM - FERRAMENTA OPERACIONAL
-- Fase 1: campanhas, assets, publicacoes e metricas reais
-- Executar no Supabase SQL Editor do projeto:
-- https://birxcfkyuzqnhyvetbjv.supabase.co
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helper generico para updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Contas sociais conectadas
-- Tokens e secrets devem ficar fora do browser. Use apenas refs.
-- ------------------------------------------------------------
create table if not exists public.social_accounts (
  id uuid default gen_random_uuid() primary key,
  brand_scope text not null default 'vitra_premium',
  provider text not null default 'meta',
  platform text not null,
  account_name text not null,
  username text,
  external_account_id text,
  business_account_id text,
  page_id text,
  token_vault_ref text,
  connection_status text not null default 'pending',
  is_paid_account boolean not null default false,
  last_sync_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_accounts_platform_check
    check (platform in ('instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'site', 'whatsapp')),
  constraint social_accounts_status_check
    check (connection_status in ('pending', 'active', 'expired', 'error', 'disabled'))
);

-- ------------------------------------------------------------
-- Campanhas Premium
-- ------------------------------------------------------------
create table if not exists public.premium_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  product_name text,
  property_type text,
  neighborhood text,
  city text default 'Porto Alegre',
  target_audience text,
  campaign_objective text not null default 'lead_generation',
  offer text,
  tone text not null default 'luxury_editorial',
  status text not null default 'draft',
  start_date date,
  end_date date,
  budget_type text not null default 'organic_and_paid',
  meta_campaign_id text,
  source text not null default 'dashboard_react',
  brief jsonb not null default '{}'::jsonb,
  content_plan jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_campaigns_status_check
    check (status in ('draft', 'planning', 'generation_queued', 'in_production', 'ready', 'active', 'paused', 'completed', 'archived')),
  constraint premium_campaigns_budget_check
    check (budget_type in ('organic', 'paid', 'organic_and_paid'))
);

-- ------------------------------------------------------------
-- Assets planejados/gerados por campanha
-- ------------------------------------------------------------
create table if not exists public.premium_campaign_assets (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid not null references public.premium_campaigns(id) on delete cascade,
  asset_type text not null,
  channel text not null,
  format text not null,
  title text not null,
  headline text,
  copy text,
  cta text,
  status text not null default 'planned',
  aspect_ratio text,
  template_key text,
  storage_bucket text,
  storage_path text,
  public_url text,
  source_image_url text,
  generation_job_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_campaign_assets_status_check
    check (status in ('planned', 'queued', 'rendering', 'generated', 'approved', 'published', 'archived', 'error'))
);

-- ------------------------------------------------------------
-- Conteudos editoriais planejados para redes sociais
-- ------------------------------------------------------------
create table if not exists public.premium_content_posts (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid not null references public.premium_campaigns(id) on delete cascade,
  asset_id uuid references public.premium_campaign_assets(id) on delete set null,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform text not null,
  format text not null,
  editorial_pillar text,
  title text not null,
  hook text,
  caption text,
  hashtags text[] not null default array[]::text[],
  cta text,
  scheduled_for timestamptz,
  status text not null default 'draft',
  approved_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_content_posts_platform_check
    check (platform in ('instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'site', 'whatsapp', 'email')),
  constraint premium_content_posts_status_check
    check (status in ('draft', 'planned', 'in_copy', 'in_design', 'review', 'approved', 'scheduled', 'published', 'archived'))
);

-- ------------------------------------------------------------
-- Publicacoes reais ou mapeadas na plataforma
-- ------------------------------------------------------------
create table if not exists public.premium_publications (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid not null references public.premium_campaigns(id) on delete cascade,
  content_post_id uuid references public.premium_content_posts(id) on delete set null,
  asset_id uuid references public.premium_campaign_assets(id) on delete set null,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform text not null,
  publication_type text not null default 'organic',
  external_post_id text,
  external_media_id text,
  permalink text,
  published_at timestamptz,
  status text not null default 'mapped',
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  utm_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_publications_type_check
    check (publication_type in ('organic', 'paid', 'manual', 'dark_post')),
  constraint premium_publications_status_check
    check (status in ('mapped', 'scheduled', 'published', 'imported', 'paused', 'deleted', 'error'))
);

create unique index if not exists idx_premium_publications_external_post
  on public.premium_publications(platform, external_post_id)
  where external_post_id is not null;

-- ------------------------------------------------------------
-- Snapshots de metricas por publicacao real
-- Organico e pago vivem no mesmo historico, separados por source.
-- ------------------------------------------------------------
create table if not exists public.premium_metrics (
  id uuid default gen_random_uuid() primary key,
  publication_id uuid not null references public.premium_publications(id) on delete cascade,
  campaign_id uuid references public.premium_campaigns(id) on delete cascade,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform text not null,
  source text not null default 'organic',
  metric_date date not null default current_date,
  collected_at timestamptz not null default now(),
  reach integer not null default 0,
  impressions integer not null default 0,
  engagement integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  link_clicks integer not null default 0,
  profile_visits integer not null default 0,
  follows integer not null default 0,
  video_views integer not null default 0,
  spend numeric(12,2) not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  conversions integer not null default 0,
  cpl numeric(12,2) generated always as (
    case when leads > 0 then round(spend / leads, 2) else null end
  ) stored,
  ctr numeric(8,4),
  cpc numeric(12,2),
  cpm numeric(12,2),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint premium_metrics_source_check
    check (source in ('organic', 'paid', 'manual', 'imported'))
);

-- ------------------------------------------------------------
-- Jobs de geracao/render/importacao/sync
-- ------------------------------------------------------------
create table if not exists public.premium_generation_jobs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.premium_campaigns(id) on delete cascade,
  asset_id uuid references public.premium_campaign_assets(id) on delete cascade,
  job_type text not null,
  provider text not null default 'internal',
  status text not null default 'queued',
  progress integer not null default 0,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_generation_jobs_type_check
    check (job_type in ('campaign_generation', 'asset_render', 'storage_upload', 'publication_import', 'metrics_sync', 'brand_review')),
  constraint premium_generation_jobs_status_check
    check (status in ('queued', 'running', 'done', 'error', 'cancelled'))
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'premium_campaign_assets_generation_job_fk'
  ) then
    alter table public.premium_campaign_assets
      add constraint premium_campaign_assets_generation_job_fk
      foreign key (generation_job_id)
      references public.premium_generation_jobs(id)
      on delete set null
      deferrable initially deferred;
  end if;
end $$;

-- ------------------------------------------------------------
-- Snapshots de conta social
-- ------------------------------------------------------------
create table if not exists public.social_metric_snapshots (
  id uuid default gen_random_uuid() primary key,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  platform text not null,
  snapshot_at timestamptz not null default now(),
  followers integer not null default 0,
  following integer not null default 0,
  posts_count integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  profile_views integer not null default 0,
  website_clicks integer not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indices
-- ------------------------------------------------------------
create index if not exists idx_social_accounts_scope_platform
  on public.social_accounts(brand_scope, platform);
create unique index if not exists idx_social_accounts_unique_scope_account
  on public.social_accounts(brand_scope, platform, account_name);
create index if not exists idx_premium_campaigns_status
  on public.premium_campaigns(status);
create index if not exists idx_premium_campaigns_created
  on public.premium_campaigns(created_at desc);
create index if not exists idx_premium_assets_campaign
  on public.premium_campaign_assets(campaign_id, status);
create index if not exists idx_premium_posts_campaign
  on public.premium_content_posts(campaign_id, status);
create index if not exists idx_premium_posts_schedule
  on public.premium_content_posts(scheduled_for);
create index if not exists idx_premium_publications_campaign
  on public.premium_publications(campaign_id, platform, published_at desc);
create index if not exists idx_premium_metrics_publication_date
  on public.premium_metrics(publication_id, metric_date desc);
create index if not exists idx_premium_metrics_campaign_date
  on public.premium_metrics(campaign_id, metric_date desc);
create index if not exists idx_premium_jobs_campaign_status
  on public.premium_generation_jobs(campaign_id, status);
create index if not exists idx_social_metric_snapshots_account_date
  on public.social_metric_snapshots(social_account_id, snapshot_at desc);

-- ------------------------------------------------------------
-- Triggers updated_at
-- ------------------------------------------------------------
drop trigger if exists trg_social_accounts_updated_at on public.social_accounts;
create trigger trg_social_accounts_updated_at
  before update on public.social_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_premium_campaigns_updated_at on public.premium_campaigns;
create trigger trg_premium_campaigns_updated_at
  before update on public.premium_campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists trg_premium_campaign_assets_updated_at on public.premium_campaign_assets;
create trigger trg_premium_campaign_assets_updated_at
  before update on public.premium_campaign_assets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_premium_content_posts_updated_at on public.premium_content_posts;
create trigger trg_premium_content_posts_updated_at
  before update on public.premium_content_posts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_premium_publications_updated_at on public.premium_publications;
create trigger trg_premium_publications_updated_at
  before update on public.premium_publications
  for each row execute function public.set_updated_at();

drop trigger if exists trg_premium_generation_jobs_updated_at on public.premium_generation_jobs;
create trigger trg_premium_generation_jobs_updated_at
  before update on public.premium_generation_jobs
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS permissivo para a Fase 1 do dashboard.
-- Antes de producao publica, substituir por auth/roles.
-- ------------------------------------------------------------
alter table public.social_accounts enable row level security;
alter table public.premium_campaigns enable row level security;
alter table public.premium_campaign_assets enable row level security;
alter table public.premium_content_posts enable row level security;
alter table public.premium_publications enable row level security;
alter table public.premium_metrics enable row level security;
alter table public.premium_generation_jobs enable row level security;
alter table public.social_metric_snapshots enable row level security;

do $$
declare
  rel_name text;
  table_names text[] := array[
    'social_accounts',
    'premium_campaigns',
    'premium_campaign_assets',
    'premium_content_posts',
    'premium_publications',
    'premium_metrics',
    'premium_generation_jobs',
    'social_metric_snapshots'
  ];
begin
  foreach rel_name in array table_names loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = rel_name
        and policyname = 'dashboard_select_' || rel_name
    ) then
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        'dashboard_select_' || rel_name,
        rel_name
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = rel_name
        and policyname = 'dashboard_insert_' || rel_name
    ) then
      execute format(
        'create policy %I on public.%I for insert to anon, authenticated with check (true)',
        'dashboard_insert_' || rel_name,
        rel_name
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = rel_name
        and policyname = 'dashboard_update_' || rel_name
    ) then
      execute format(
        'create policy %I on public.%I for update to anon, authenticated using (true) with check (true)',
        'dashboard_update_' || rel_name,
        rel_name
      );
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Seed opcional das contas Vitra Premium sem tokens
-- ------------------------------------------------------------
insert into public.social_accounts (
  brand_scope,
  provider,
  platform,
  account_name,
  username,
  connection_status,
  is_paid_account,
  metadata
) values
  ('vitra_premium', 'meta', 'instagram', 'Vitra Premium Instagram', '@vitrapremium', 'pending', false, '{"needs_mapping": true}'::jsonb),
  ('vitra_premium', 'meta', 'facebook', 'Vitra Premium Facebook', 'Vitra Premium', 'pending', false, '{"needs_mapping": true}'::jsonb),
  ('vitra_premium', 'meta', 'facebook', 'Vitra Premium Meta Ads', 'Meta Ads', 'pending', true, '{"needs_ads_account": true}'::jsonb)
on conflict do nothing;

-- ------------------------------------------------------------
-- Verificacao rapida
-- ------------------------------------------------------------
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name in (
--     'premium_campaigns',
--     'premium_campaign_assets',
--     'premium_content_posts',
--     'premium_publications',
--     'premium_metrics',
--     'premium_generation_jobs',
--     'social_accounts',
--     'social_metric_snapshots'
--   )
-- order by table_name;
