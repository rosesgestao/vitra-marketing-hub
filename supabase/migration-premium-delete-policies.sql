-- ------------------------------------------------------------
-- Policies de DELETE que faltaram na Fase 1 (migration-premium-operational.sql).
-- Aquela migration criou dashboard_select_/insert_/update_ para as tabelas operacionais,
-- mas NAO criou DELETE. Com RLS habilitado e sem policy de DELETE, toda exclusao pelo
-- dashboard apagava 0 linhas SILENCIOSAMENTE (sem erro) — campanhas/presets/midia nunca
-- eram removidos. Esta migration completa o CRUD, espelhando o mesmo padrao permissivo
-- (to anon, authenticated using(true)). Idempotente.
--
-- Nota de seguranca: mantem a postura permissiva da Fase 1 (anon + authenticated). O acesso
-- ao app e gated pelo AuthGate; a anon key sozinha ja tinha select/insert/update. Antes de
-- endurecer para producao, revisar todo o bloco de RLS (auth/roles), como anota a migration base.
-- ------------------------------------------------------------
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
    'social_metric_snapshots',
    'premium_media_assets',
    'premium_meta_presets'
  ];
begin
  foreach rel_name in array table_names loop
    if to_regclass('public.' || rel_name) is null then
      continue; -- tabela ausente neste projeto: ignora
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = rel_name
        and policyname = 'dashboard_delete_' || rel_name
    ) then
      execute format(
        'create policy %I on public.%I for delete to anon, authenticated using (true)',
        'dashboard_delete_' || rel_name,
        rel_name
      );
    end if;
  end loop;
end $$;
