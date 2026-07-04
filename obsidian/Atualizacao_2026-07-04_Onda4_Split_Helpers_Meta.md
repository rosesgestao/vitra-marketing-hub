# Onda 4 — split do PremiumDashboard: helpers puros do Meta → lib/ com testes — 2026-07-04

Início do desmonte do `PremiumDashboard.jsx` (5.6k linhas, o "epicentro de dívida"). Começamos pelo mais
valioso e seguro: extrair a lógica PURA de Meta para módulos testáveis — blindando justamente o
`adReadiness` criado hoje ([[Atualizacao_2026-07-04_Onda4_adReadiness_FonteUnica]]), que vivia num `.jsx`
sem cobertura.

## Splits (3 commits, refatoração pura, no ar)
1. **`lib/metaAdReadiness.js`** (`766ea5a`) — `AD_FORMAT_ORDER` + `metaCopyChecks`, `assetRenderedApproved`,
   `assetPublishReady`, `evaluateMetaAdReadiness`. Dep única: `needsVitraImobiliariaApprovedTemplateRender`
   (já em premiumData). **21 testes**: cada predicado + a **regressão da descrição** (assetPublishReady
   falha sem descrição) + a **guarda anti-divergência** (o check `description`/`texts` do QA concorda com
   `metaCopyChecks`/`assetPublishReady` — se QA e gate de publicação divergirem de novo, o teste quebra).
2. **`lib/metaAds.js`** (`2855115`) — `groupMetaAds` + `groupMetaAdsByCampaign` + `AD_GROUP_LABEL`
   (autocontido). **11 testes**: agrupamento por ad_group, prioridade do ad_label, fallback, filtro de
   canal, não-colisão entre campanhas.
3. **`lib/metaAds.js`** (`022af10`) — `buildMetaAdsPackagePayload` (contrato do JSON de exportação) +
   `META_PLACEMENTS`. A casca de download (blob/DOM) fica no view. **6 testes**: fallbacks de
   ad_name/primary_text, mapeamento de placements, readiness embutida.

## Fora de escopo (deliberado)
`buildAutomationSteps` fica no view — é *glue* de exibição acoplado a `SOURCE_TYPE_OPTIONS`; extrair daria
muito churn por pouco valor de teste.

## Resultado
- `PremiumDashboard.jsx`: **5.655 → 5.399 linhas** (−256). O que saiu é o núcleo crítico a proteger.
- **240 → 278 testes** (+38 de guarda) sobre lógica antes sem cobertura. build + lint verdes em cada passo.
- Sem ciclo de import: `metaAds → metaAdReadiness → premiumData` (mão única).

## Próximo
Separar os **componentes** grandes em arquivos próprios — maior e mais arriscado (arrasta estado/props;
não validável por teste unitário, depende do teste visual do Leonardo no ar). Um por vez, começando pelo
**`MetaAdCard`** (o mais contido). [[Atualizacao_2026-07-04_Trafego_Pago_100_FECHADO]]
[[deploy-hostinger-vitrapremium]]
