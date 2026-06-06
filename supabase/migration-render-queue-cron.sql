-- Processador de fila: pg_cron chama drain_render_queue a cada minuto,
-- que dispara a Edge Function render-asset (via pg_net) em lotes pequenos.
create extension if not exists pg_cron;
-- pg_net deve estar habilitado: create extension if not exists pg_net;

create or replace function public.drain_render_queue(p_limit int default 4)
returns void language plpgsql security definer
set search_path = public, net, extensions
as $$
declare
  cid uuid;
  v_key text;
begin
  -- Recicla orfaos 'rendering' travados antes de drenar, devolvendo-os a 'queued' (ou
  -- dead-letter 'error'). Assim campanhas cujo unico pendente e um orfao voltam a ser
  -- selecionadas e o fluxo nao pendura mesmo com o navegador fechado.
  perform public.reap_stale_render_assets(3, 10);

  -- So drena canais que a Edge renderiza (meta_ads). whatsapp/email nascem 'planned'.
  select campaign_id into cid
  from premium_campaign_assets
  where status = 'queued' and channel = 'meta_ads'
  group by campaign_id order by min(created_at) asc limit 1;
  if cid is null then return; end if;

  -- Chave lida do Vault (sem segredo versionado). A Edge aceita SERVICE_KEY ou ANON_KEY;
  -- IMPORTANTE: a SUPABASE_ANON_KEY injetada na Edge e a chave PUBLISHABLE (sb_publishable_...),
  -- NAO a anon legada (JWT). Pre-requisito (rodar uma vez, fora do versionamento):
  --   select vault.create_secret('<publishable_ou_service_role_key>', 'render_asset_invoke_key');
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

-- Lockdown: drain so e chamado pelo cron (owner postgres); revoga de PUBLIC/anon/authenticated.
revoke execute on function public.drain_render_queue(int) from public, anon, authenticated;

-- Agendar a cada minuto (rodar uma vez, APOS aplicar esta migration, a do claim atomico e
-- criar o secret no Vault; e apos publicar a nova Edge render-asset).
-- Aplicado em producao em 2026-06-06 (cron.job jobid 1):
-- select cron.schedule('drain-render-queue', '* * * * *', $$ select public.drain_render_queue(4); $$);
