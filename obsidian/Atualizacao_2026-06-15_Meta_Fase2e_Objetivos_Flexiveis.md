# Atualizacao 2026-06-15 — Meta fase 2e: objetivos flexiveis (playbook)

> O operador agora escolhe o **objetivo da campanha** (Reconhecimento, Trafego, Engajamento, Leads,
> Vendas) em linguagem simples; o sistema deriva todo o resto de um **playbook** (fonte unica). Sem
> encher a UI e sem quebrar a padronizacao. Tudo segue PAUSED + gate + CBO. Na `main`, pushado.
> Commit: **6996c32**.

## O principio
Objetivo = 1 escolha; optimization_goal / destino / CTA / billing / pre-requisitos / foco do funil sao
DERIVADOS de `_shared/objectivePlaybook.ts`. Na Meta o objetivo e da CAMPANHA (nao se mistura entre
conjuntos), entao "testar objetivos" = campanhas paralelas com os mesmos criativos (comparaveis pelo
sync de metricas da 2a).

## Entregue
- **`_shared/objectivePlaybook.ts`** (puro TS, importado por Deno E Vite — fonte unica). Por objetivo:
  `objective / optimization_goal / billing_event / destination_type / cta / needs / available / funnel`.
  - **Disponiveis ja:** Reconhecimento (REACH), Trafego (LANDING_PAGE_VIEWS), Engajamento
    (POST_ENGAGEMENT), Leads-clique (LINK_CLICKS) — sem pre-requisito.
  - **Bloqueados (destravaveis):** Leads-formulario (LEAD_GENERATION, precisa **ToS** — hook da 2d) e
    Vendas (OFFSITE_CONVERSIONS, precisa **pixel**). Aparecem com 🔒 + hint.
- **`publish-meta-ads/build_draft`**: deriva campanha (objective), conjunto (optimization_goal/billing/
  destination_type) e CTA do playbook; bloqueia objetivo `available:false` com mensagem acionavel.
- **`suggest-meta-audiences`**: recebe o objetivo e ajusta o publico ao funil (topo amplo -> fundo
  intencao).
- **Front**: `buildMetaDraft`/`suggestMetaAudiences` aceitam `objective`; `PublishMetaPanel` ganha o
  seletor "Objetivo da campanha" (pilulas), com os indisponiveis em 🔒.

## Verificacao
deno check (2 edges) OK, lint limpo, build OK, 151 testes; edges deployadas (boot OK, gate ativo). No
preview o seletor renderiza com Reconhecimento/Trafego/Engajamento/Leads ativos e Leads-formulario/
Vendas bloqueados (🔒). Build real depende do `META_ACCESS_TOKEN` + pre-requisito do objetivo.

## UX / padronizacao
Um seletor so, defaults por objetivo, jargao da Meta escondido. O playbook e a padronizacao: todo
objetivo segue o mesmo caminho gated/PAUSED/brand-safe. Pre-requisito vira orientacao (🔒 + hint), nao
erro cru.

## Resta
2d completo (formulario instantaneo: ao aceitar o ToS, virar `leads_form.available=true` + criar
`/{page_id}/leadgen_forms` e usar destination ON_AD) e Vendas (pixel). Continuacao de
[[Atualizacao_2026-06-15_Meta_Fase2c_Audiences]]. Ver [[meta-ads-publicacao]].
