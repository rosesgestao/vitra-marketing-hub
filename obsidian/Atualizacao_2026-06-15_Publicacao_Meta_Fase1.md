# Atualizacao 2026-06-15 — Publicacao Meta no dashboard (fase 1)

> Agente de campanhas Meta dentro do dashboard: o operador monta e publica uma campanha Meta sem sair
> da ferramenta. O agente estrutura tudo AUTONOMAMENTE e cria na conta real **PAUSED**; **ativar
> (gastar) e acao separada, com confirmacao — nunca automatica**. Na `main`, pushado. Commit: **b9a76d9**.

## Como chegamos
1. Decidimos caminho B (feature nativa) vs caminho A (eu via MCP). Antes, fiz um **spike via MCP** que
   provou a sequencia da Graph API ponta a ponta na conta real (campanha->conjunto->criativo->anuncio,
   tudo PAUSED). Objetos do spike na conta Vitra Porto Alegre (122035585232240): campanha
   `120252558563730221` (pausada, pode apagar quando quiser).
2. Exploramos o codigo: o modelo de dados **ja tinha** as colunas Meta (`premium_campaigns.
   meta_campaign_id`, `premium_publications.meta_campaign_id/adset_id/ad_id`, `social_accounts.*`), e o
   `downloadMetaAdsPackage` ja montava quase a estrutura.

## O que foi entregue (fase 1, MVP)
- **Edge `publish-meta-ads`** (Deno) — acoes `build_draft` / `activate` / `status`. Replica o spike:
  OUTCOME_LEADS (CBO com o **teto** do operador) -> conjunto LINK_CLICKS (destino site/WhatsApp) ->
  criativo (`image_url` = `public_url` do render pipeline) -> anuncio, **tudo PAUSED**. Reusa
  `_shared/edgeAuth` (gate COPILOT_GATE) e `_shared/copyValidation` (bloqueia copy fora da marca antes
  de publicar). Grava os `meta_*` IDs. `activate` exige `confirm:true` e liga os 3 niveis.
- **Front** (`premiumData.js`): `buildMetaDraft` / `activateMetaCampaign` / `getMetaCampaignStatus` +
  `META_AD_ACCOUNTS` (conta por marca). **UI**: painel "Revisar e publicar" no Trafego Pago — teto de
  orcamento, pagina, destino; gate de QA (`evaluateMetaAdReadiness`) que **desabilita o botao** ate ter
  anuncio aprovado; botao "Criar rascunho (pausado)" + botao separado "Publicar (ativar)" com confirm.

## Decisoes
- **Orcamento**: operador define o teto, agente distribui (CBO).
- **Fronteira de seguranca**: build autonomo = PAUSED; ativar = clique explicito + window.confirm.
  O agente nunca ativa/gasta sozinho.

## Verificacao
deno check OK, lint limpo, build OK, 151 testes. Edge deployada via **Supabase CLI** e protegida
(`forbidden_gate` confirma a auth). Painel renderiza no preview com a conta pre-preenchida e o gate
desabilitando o botao sem QA. A sequencia Graph API ja foi provada no spike.

## Para ATIVAR de verdade (pendencia do operador)
1. Setar o secret `META_ACCESS_TOKEN` (token de system user da Meta com `ads_management`):
   `npx supabase secrets set META_ACCESS_TOKEN=...`.
2. No painel, informar a **Página** (ID), o **destino** e o **teto**; aprovar ao menos 1 anuncio (QA).
3. "Criar rascunho (pausado)" -> revisar no Ads Manager -> "Publicar (ativar)".

## Fora de escopo (fase 2+)
Multiplos conjuntos + publicos/posicionamentos por IA; formulario instantaneo (exige ToS de Lead);
custom/lookalike; sync de metricas de volta; pixel/conversoes. Ver [[render-asset-deploy-e-limites]]
(deploy via CLI) e o spike registrado aqui.
