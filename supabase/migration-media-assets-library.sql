-- Biblioteca (DAM) de midia organica reutilizavel por marca: artes geradas (auto-registradas) e fotos
-- enviadas. Reusa o bucket publico 'cards'. 'path' guarda o caminho no storage (para excluir).
-- Aplicada em 2026-06-18 no projeto birxcfkyuzqnhyvetbjv.
create table if not exists premium_media_assets (
  id          uuid primary key default gen_random_uuid(),
  brand_scope text not null,
  kind        text not null default 'art',   -- art | photo
  title       text,
  url         text not null,
  path        text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists premium_media_assets_brand_idx on premium_media_assets (brand_scope, created_at desc);

alter table premium_media_assets enable row level security;
drop policy if exists media_assets_all on premium_media_assets;
create policy media_assets_all on premium_media_assets
  for all to public using (true) with check (true);
