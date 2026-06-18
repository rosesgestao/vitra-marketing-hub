-- Configuracoes editoriais por marca (governanca da pauta organica): pilares ativos, tom padrao,
-- cadencia alvo e diretrizes que entram no prompt da IA editorial. 1 linha por brand_scope.
-- Aplicada em 2026-06-18 no projeto birxcfkyuzqnhyvetbjv.
create table if not exists premium_editorial_settings (
  brand_scope     text primary key,
  active_pillars  text[] not null default '{}',
  default_tone    text   not null default 'padrao',
  cadence_per_week int   not null default 5,
  guidelines      text   not null default '',
  updated_at      timestamptz not null default now()
);

alter table premium_editorial_settings enable row level security;

-- Postura de dev do projeto: anon (publishable key) le/escreve dados premium. Politica permissiva.
drop policy if exists editorial_settings_all on premium_editorial_settings;
create policy editorial_settings_all on premium_editorial_settings
  for all to public using (true) with check (true);
