-- Presets de campanha de Trafego Pago por marca: clonar a logica de uma campanha de referencia
-- (vencedora) como padrao inicial. blueprint = config normalizada a aplicar. Aplicada 2026-06-18.
create table if not exists premium_meta_presets (
  id uuid primary key default gen_random_uuid(),
  brand_scope text not null,
  name text not null,
  source_meta_campaign_id text,
  blueprint jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists premium_meta_presets_brand_idx on premium_meta_presets (brand_scope, created_at desc);
alter table premium_meta_presets enable row level security;
drop policy if exists meta_presets_all on premium_meta_presets;
create policy meta_presets_all on premium_meta_presets for all to public using (true) with check (true);
