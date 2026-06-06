# 08 - Auditoria e Plano de Evolucao

> Nota criada em 2026-06-06 para registrar o estado REAL do projeto (apurado por auditoria
> senior dev + designer + produto) e o plano de evolucao que pretendo executar como mantenedor,
> preservando as decisoes ja tomadas. Complementa [[02 - Diagnostico do Dashboard Atual]]
> (que descreve o prototipo HTML historico) e [[04 - Roadmap de Desenvolvimento]].

## 1. Estado real por fase (auditoria 2026-06-06)

| Fase | Estado real | Observacao |
|---|---|---|
| 1. Fundacao React+Supabase | Concluida | 8 tabelas `premium_*`/`social_*` aplicadas e em uso. |
| 2. Interface React | Concluida | Modal `Nova Campanha` grava no Supabase (sem `localStorage`). |
| 3. Geracao e renderizacao | Concluida | Edge `render-asset` satori->resvg->PNG no bucket `cards`, multi-formato e multi-marca. |
| 4. Publicacao e registro | Parcial | So importacao/mapeamento MANUAL (`createManualPublication`). Publicacao automatica ausente. |
| 5. Metricas | Parcial/ausente | So entrada MANUAL (`createManualMetric`). Integracao Meta (Graph/Ads Insights) 100% ausente. |
| 6. Aprendizado | Nao iniciada | Depende do ciclo de metricas reais. |

## 2. Forcas confirmadas (preservar)

- Nucleo de criativos real e validado: brief -> DB -> geracao -> render server-side -> Storage.
- Contrato de variacao por template (`creativeTemplateCatalog.js`) que trava layout/marca/tipografia
  e so varia copy/preco/fotos/CTA — escala criativo sem desfigurar identidade.
- Identidade visual fiel e centralizada (tokens gold, Playfair+Inter, logos vetoriais).
- Separacao correta de privilegios: service role so server-side; anon so no front.
- Documentacao do cofre como fonte de verdade rastreavel.

## 3. Achados que contrariam a percepcao (corrigir narrativa)

- **Integracao Meta = 100% planejamento.** Zero Graph API / OAuth / leitura de token; o job
  `metrics_sync` fica `queued` sem consumidor. Etapas 6-9 do fluxo sao manuais.
- **Abas Agentes e Pipeline = visao de roadmap, nao operacional.** Consultam tabelas legadas
  (`conteudos`, `calendario_editorial`, `publicacoes`, etc.) que nao existem no schema Premium.
  (Ja sinalizado na UI com banner em 2026-06-06 — ver secao 5.)
- **Geracao de copy e por templates/dicionarios, nao IA generativa** (apesar do rotulo "Ideogram/FLUX").
- **Incompatibilidade de schema de metricas do escopo NAO existe no codigo** — `premium_metrics`
  usa `likes`/`video_views`/`follows` de forma consistente; ja reconciliado em [[06 - Escopo Oficial do Projeto]].

## 4. Riscos tecnicos priorizados

1. **Seguranca de Fase 1 exposta (critico):** RLS `using(true)` para anon em todas as tabelas,
   bucket `cards` publico/gravavel, `verify_jwt=false` aceitando anon key na `render-asset`.
2. **Fila de render (alto):** sem reivindicacao atomica (corrida Edge x worker); mismatch de filtro
   de canal (assets `site` presos); cron `drain_render_queue` com placeholder literal
   `<SUPABASE_PUBLISHABLE_KEY>` -> 401 silencioso; dois renderizadores na mesma fila.
3. **Ausencia de testes/CI (alto):** zero testes sobre `PremiumDashboard.jsx` (~2978 linhas) e
   `premiumData.js` (~1804 linhas) — refator cego.
4. **Dependencias externas no caminho critico (medio):** wasm/fontes via unpkg/jsdelivr em runtime
   sem fallback; SSRF residual em `ingest-source-images`.
5. **`brand_scope` divergente (medio)** entre coluna gerada no DB e logica da Edge Function.

## 5. Mudancas JA executadas (pass de honestidade — commit 652ba6e, na `main`)

Pass de baixo risco, sem alterar schema/fila/RLS/contratos. Ver
[[../Atualizacao_2026-06-06_Limpeza_Honestidade_UI]].

- Removido o rotulo interno do template (MODEL_LABEL) gravado no PNG final.
- Botoes "Aprovar" migrados do verde fora-de-paleta para a escala gold do brandbook.
- StatTile de Leads: "Ads Insights" -> "entrada manual".
- Banner `RoadmapNotice` em Agentes/Pipeline marcando-as como visao de roadmap.
- Item 6 do escopo reconciliado.

## 6. Mudancas que PRETENDO fazer (plano de evolucao)

Ordem por relacao valor/risco. Cada passo e incremental, reversivel e validado por build.

### Passo A — Rede de seguranca (habilita o resto)
- CI rodando `vite build` (e `deno check` nas Edge Functions) a cada PR.
- Vitest sobre funcoes puras de `premiumData.js` (`buildAssetPayloads`, `brandScopeFor`,
  contratos de variacao) e `creativeTemplateCatalog.js`.
- Teste de integracao do claim/render da fila.
- Esforco: grande. Sem mudanca de comportamento.

### Passo B — Fila de render
- Reivindicacao atomica `UPDATE ... WHERE status='queued' RETURNING` (ou `FOR UPDATE SKIP LOCKED`)
  na Edge e no worker; Edge com `asset_ids` deve checar status.
- Alinhar filtro de canal entre cron, Edge e worker (resolver assets `site`).
- Corrigir o cron (credencial via Vault) ou desativa-lo ate validado; logar falhas de `net.http_post`.
- Eleger UM renderizador canonico (ou contrato claro de divisao por canal).
- Esforco: rapido/medio.

### Passo C — Endurecimento de fundacao (antes de exposicao publica)
- RLS com autenticacao/roles e policies restritivas; bucket nao-publico; `verify_jwt` na Edge.
- Falhar cedo na ausencia de anon key (remover fallback `missing-public-key`).
- Centralizar `brand_scope` numa unica fonte de verdade.
- Empacotar wasm/fontes do render como assets versionados; mitigar SSRF residual.
- Esforco: grande. **Coordenar antes** (decisao deliberada de Fase 1).

### Passo D — Refator dos god-files (apos rede de seguranca)
- Quebrar `PremiumDashboard.jsx` por secao (CampaignsSection, AssetsSection, TrafegoPago,
  Publications, Metrics, NewCampaignModal) sob `views/premium/`.
- Extrair `usePremiumWorkspace`/contexto, eliminando prop drilling.
- Mover geracao de copy/criativos de `premiumData.js` para Edge Function/servico.
- Esforco: grande.

### Passo E — Fatia fina de integracao Meta (fecha o criterio de sucesso)
- Importar metricas organicas por post via Graph API reaproveitando o `external_post_id` ja
  mapeado manualmente — elimina digitacao e fecha o ciclo conteudo->publicacao->metrica.
- Vitra Premium como marca-piloto do loop 1-9 completo antes de escalar a Imobiliaria.
- So entao avaliar publicacao automatica e Ads pagos.
- Esforco: grande.

## 7. Decisoes a confirmar com o dono

- Destino das abas Agentes/Pipeline: manter como roadmap (estado atual, com banner), portar para
  o schema `premium_*`, ou remover da navegacao.
- Momento de endurecer RLS/bucket (Passo C) — impacta acesso atual em desenvolvimento.
- Confirmar Vitra Premium como marca-piloto para o ciclo completo antes de evoluir a Imobiliaria.

## Regra de Marca

Mantida: Vitra Premium (preto+dourado, editorial) e Vitra Imobiliaria (navy `#0A1628`+dourado,
institucional) nao misturam assets, linguagem, CTAs, templates ou estrategia sem validacao do
Brand System Vitra.
