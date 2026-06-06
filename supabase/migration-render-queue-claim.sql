-- Fase 1 - Estabilizacao do fluxo automatico de render.
-- Duas funcoes, sem ALTER TABLE (tentativas e timestamp ficam em metadata; o enum
-- de status ja inclui 'rendering' e 'error'):
--   1) claim_render_assets  - reivindica atomicamente assets para render.
--   2) reap_stale_render_assets - recicla orfaos 'rendering' travados (crash/OOM)
--      consumindo orcamento de tentativas, garantindo TERMINACAO (sem retry infinito
--      nem job pendurado) e recuperacao server-side mesmo com o navegador fechado.
--
-- Aplicar uma vez no projeto Supabase ativo (birxcfkyuzqnhyvetbjv) ANTES de publicar
-- a nova versao da Edge Function render-asset (que chama estas funcoes).

-- 1) CLAIM ATOMICO -----------------------------------------------------------------
-- FOR UPDATE SKIP LOCKED garante que dois processos (cron, dashboard) nao reivindiquem
-- o mesmo asset. Dois modos:
--   - drain (p_asset_ids null): reivindica apenas 'queued' da campanha.
--   - explicito (p_asset_ids preenchido): reivindica os ids pedidos em estado
--     renderizavel (queued/generated/error), permitindo re-render de template aprovado
--     desatualizado e retry manual; NUNCA toca 'approved' nem 'rendering' ativo.
create or replace function public.claim_render_assets(
  p_campaign uuid default null,
  p_asset_ids uuid[] default null,
  p_limit int default 3
)
returns setof premium_campaign_assets
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update premium_campaign_assets a
  set status = 'rendering',
      metadata = jsonb_set(
        coalesce(a.metadata, '{}'::jsonb),
        '{last_render_attempt_at}',
        to_jsonb(now()),
        true
      ),
      updated_at = now()
  where a.id in (
    select c.id
    from premium_campaign_assets c
    where c.channel = 'meta_ads'
      and (p_campaign is null or c.campaign_id = p_campaign)
      and (
        (p_asset_ids is null and c.status = 'queued')
        or (p_asset_ids is not null and c.id = any(p_asset_ids)
            and c.status in ('queued', 'generated', 'error'))
      )
    order by c.created_at asc
    limit greatest(p_limit, 1)
    for update skip locked
  )
  returning a.*;
end;
$$;

-- 2) REAPER DE ORFAOS ---------------------------------------------------------------
-- Assets 'rendering' parados ha mais de p_orphan_minutes (Edge morreu antes de gravar
-- 'generated'): incrementa render_attempts e volta para 'queued' (se ainda ha orcamento)
-- ou 'error' (dead-letter). Isso da TERMINACAO ao caso de crash/OOM e devolve o asset
-- ao estado 'queued', que o cron e o claim ja sabem drenar.
create or replace function public.reap_stale_render_assets(
  p_max_attempts int default 3,
  p_orphan_minutes int default 10
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  with stale as (
    select c.id, coalesce((c.metadata->>'render_attempts')::int, 0) as attempts
    from premium_campaign_assets c
    where c.channel = 'meta_ads'
      and c.status = 'rendering'
      and coalesce(
            (c.metadata->>'last_render_attempt_at')::timestamptz,
            c.updated_at,
            'epoch'::timestamptz
          ) < now() - make_interval(mins => p_orphan_minutes)
    for update skip locked
  )
  update premium_campaign_assets a
  set status = case when s.attempts + 1 < p_max_attempts then 'queued' else 'error' end,
      metadata = jsonb_set(
        jsonb_set(coalesce(a.metadata, '{}'::jsonb), '{render_attempts}', to_jsonb(s.attempts + 1), true),
        '{last_render_error}', to_jsonb('render orfao (timeout/crash) reciclado pelo reaper'::text), true
      ),
      updated_at = now()
  from stale s
  where a.id = s.id;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Lockdown: so o service_role (Edge) executa. Funcoes recebem EXECUTE de PUBLIC por
-- padrao, entao revogar de PUBLIC (anon/authenticated herdam dai) e conceder ao service_role.
revoke execute on function public.claim_render_assets(uuid, uuid[], int) from public, anon, authenticated;
grant execute on function public.claim_render_assets(uuid, uuid[], int) to service_role;
revoke execute on function public.reap_stale_render_assets(int, int) from public, anon, authenticated;
grant execute on function public.reap_stale_render_assets(int, int) to service_role;
