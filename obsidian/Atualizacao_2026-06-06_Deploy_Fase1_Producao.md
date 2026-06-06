# Atualizacao 2026-06-06 - Deploy da Fase 1 em Producao

## Contexto

Deploy autorizado da Fase 1 (estabilizacao do fluxo automatico de render) no projeto Supabase
ativo `Marketing Vitra Imobiliaria` (`birxcfkyuzqnhyvetbjv`, Postgres 17). Branching nao usado
(exige Pro); a validacao previa foi por dry-run transacional. Ver
[[Ferramenta Operacional Premium/09 - Plano de Consolidacao da Geracao de Criativos]].

## Passos aplicados (na ordem)

1. **Migration claim + reaper** (`render_queue_claim_and_reaper`): funcoes `claim_render_assets`
   e `reap_stale_render_assets` criadas (SECURITY DEFINER). Sem ALTER TABLE.
2. **Secret no Vault** `render_asset_invoke_key`.
3. **Funcao do cron** (`render_queue_drain_cron_function`): `drain_render_queue` (reaper + drena
   meta_ads + le a chave do Vault).
4. **Edge `render-asset` v36** publicada via Supabase CLI (`npx supabase functions deploy`,
   verify_jwt=false preservado pelo config.toml).
5. **Cron agendado**: `cron.schedule('drain-render-queue','* * * * *', ...)` — jobid 1, ativo.

## Verificacao em producao

- Edge v36 ACTIVE. Smoke tests: chave valida -> HTTP 200 `{"rendered":0,...,"message":"nenhum asset queued"}`; chave invalida -> HTTP 401.
- Caminho do cron testado via `net.http_post` com a chave do Vault -> HTTP 200 (pg_net), `error_msg` null.
- `cron.job_run_details`: execucoes consecutivas `succeeded` (22:58, 22:59, 23:00 UTC).
- Producao tinha 0 `meta_ads` queued; o cron fica ocioso ate novas campanhas (sem render disparado no deploy).

## Aprendizado importante (corrigido)

A `SUPABASE_ANON_KEY` injetada na Edge e a chave **publishable** (`sb_publishable_...`), NAO a anon
legada (JWT). O primeiro smoke test (com a anon legada) deu 401 e revelou que o secret do Vault
estava com a chave errada. Corrigido com `vault.update_secret` para a publishable; revalidado 200.
Registrado nos comentarios da migration do cron.

## Seguranca

- As 3 funcoes da Fase 1 foram travadas: `revoke execute ... from public, anon, authenticated` e
  `grant execute ... to service_role` (a Edge usa service_role). Confirmado:
  anon/authenticated nao executam; service_role sim; Edge segue 200.
- Pendencia pre-existente (NAO introduzida agora, hardening separado): RLS permissivo (`using(true)`)
  em todas as tabelas premium e bucket `cards` publico/listavel. Itens do advisor de seguranca a
  enderecar na fase de endurecimento (ver nota 08, Passo C).

## Pendente

- **Frontend NAO deployado** nesta sessao (sem config de deploy no repo; host manual). O frontend
  novo e retrocompativel: a Edge nova ja funciona com o frontend atual. Deploy do dashboard
  (`dashboard/`, `npm run build` -> publicar `dist/`) fica a cargo do dono, sem urgencia.

## Efeito liquido

A geracao de cortes meta_ads agora roda automaticamente no servidor (cron a cada minuto, com
reaper de orfaos e claim atomico), sem depender do navegador aberto. Proximas campanhas terao os
N x 3 cortes gerados sozinhos.
