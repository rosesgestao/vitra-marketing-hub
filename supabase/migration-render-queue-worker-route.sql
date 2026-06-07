-- Roteamento Premium 9:16 -> render-worker (Puppeteer full-res). PARTICAO POR FLAG.
--
-- Espelha do lado da Edge a particao que o worker ja aplica (render-worker/src/worker.js reivindica
-- SO metadata.render_engine='worker'): aqui, claim/reaper/drain da Edge EXCLUEM esses assets, de modo
-- que Edge e worker operem em conjuntos DISJUNTOS (sem corrida, sem render duplicado, sem divergencia
-- de motor). 'worker' = Premium 9:16, que estoura o satori da Edge em full-res (1080x1920).
--
-- !!! NAO APLICAR ATE QUE: (1) o render-worker esteja DEPLOYADO e rodando, e (2) o front esteja com
-- VITE_WORKER_RENDER_9X16=true (grava a flag nos novos Premium 9:16). Aplicar antes faria os 9:16
-- Premium flagueados ficarem 'queued' sem ninguem renderizando. Enquanto a flag esta off, nenhum
-- asset recebe render_engine='worker' e estas funcoes se comportam IDENTICAS as atuais (no-op).
--
-- Aplicar (quando ativar): via supabase SQL editor ou `apply_migration`. Predicado de exclusao:
--   coalesce(metadata->>'render_engine','edge') <> 'worker'

-- 1) CLAIM ATOMICO (Edge) — exclui o conjunto-worker ------------------------------------------------
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
      and coalesce(c.metadata->>'render_engine', 'edge') <> 'worker'   -- <-- particao: Edge ignora o worker-set
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

-- 2) REAPER DE ORFAOS (Edge) — exclui o conjunto-worker ---------------------------------------------
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
      and coalesce(c.metadata->>'render_engine', 'edge') <> 'worker'   -- <-- o worker tem o proprio reaper/retry
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

-- 3) DRAIN (cron) — nao seleciona campanha cujo pendente e do worker --------------------------------
create or replace function public.drain_render_queue(p_limit int default 4)
returns void language plpgsql security definer
set search_path = public, net, extensions
as $$
declare
  cid uuid;
  v_key text;
begin
  perform public.reap_stale_render_assets(3, 10);

  -- So drena meta_ads que pertencem a EDGE (exclui o conjunto-worker), para nao disparar a Edge
  -- para uma campanha cujo unico pendente e renderizado pelo worker (evita job pendurado).
  select campaign_id into cid
  from premium_campaign_assets
  where status = 'queued' and channel = 'meta_ads'
    and coalesce(metadata->>'render_engine', 'edge') <> 'worker'
  group by campaign_id order by min(created_at) asc limit 1;
  if cid is null then return; end if;

  select decrypted_secret into v_key
  from vault.decrypted_secrets where name = 'render_asset_invoke_key' limit 1;
  if v_key is null then
    raise warning 'drain_render_queue: secret render_asset_invoke_key ausente no Vault; pulando.';
    return;
  end if;

  perform net.http_post(
    url := 'https://birxcfkyuzqnhyvetbjv.supabase.co/functions/v1/render-asset',
    body := jsonb_build_object('campaign_id', cid, 'limit', p_limit),
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization', 'Bearer ' || v_key, 'apikey', v_key),
    timeout_milliseconds := 120000);
end; $$;

-- Lockdown (mantem o da Fase 1).
revoke execute on function public.claim_render_assets(uuid, uuid[], int) from public, anon, authenticated;
grant execute on function public.claim_render_assets(uuid, uuid[], int) to service_role;
revoke execute on function public.reap_stale_render_assets(int, int) from public, anon, authenticated;
grant execute on function public.reap_stale_render_assets(int, int) to service_role;
revoke execute on function public.drain_render_queue(int) from public, anon, authenticated;

-- BACKFILL OPCIONAL (so se quiser rotear os Premium 9:16 JA existentes ao worker; do contrario,
-- apenas os novos — criados com a flag ligada — vao para o worker):
-- update premium_campaign_assets
--   set metadata = jsonb_set(coalesce(metadata,'{}'::jsonb), '{render_engine}', '"worker"', true)
--   where channel='meta_ads' and aspect_ratio='9:16'
--     and coalesce(metadata->>'brand_scope','vitra_premium')='vitra_premium'
--     and status in ('queued','error');
