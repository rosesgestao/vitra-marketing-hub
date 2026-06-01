-- Processador de fila: pg_cron chama drain_render_queue a cada minuto,
-- que dispara a Edge Function render-asset (via pg_net) em lotes pequenos.
create extension if not exists pg_cron;
-- pg_net deve estar habilitado: create extension if not exists pg_net;

create or replace function public.drain_render_queue(p_limit int default 4)
returns void language plpgsql security definer
set search_path = public, net, extensions
as $$
declare cid uuid;
begin
  select campaign_id into cid
  from premium_campaign_assets
  where status = 'queued' and channel not in ('whatsapp','email')
  group by campaign_id order by min(created_at) asc limit 1;
  if cid is null then return; end if;
  perform net.http_post(
    url := 'https://birxcfkyuzqnhyvetbjv.supabase.co/functions/v1/render-asset',
    body := jsonb_build_object('campaign_id', cid, 'limit', p_limit),
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer <SUPABASE_PUBLISHABLE_KEY>','apikey','<SUPABASE_PUBLISHABLE_KEY>'),
    timeout_milliseconds := 120000);
end; $$;

-- Agendar (rodar uma vez):
-- select cron.schedule('drain-render-queue', '* * * * *', $$ select public.drain_render_queue(4); $$);
