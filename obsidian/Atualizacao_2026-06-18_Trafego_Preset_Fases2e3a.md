# Atualizacao 2026-06-18 — Tráfego: preset de campanha (Fases 2 + 3a)

> Continuacao do padrao "campanha de referencia -> preset". Fase 2 = persistencia; Fase 3a = geo RAIO
> por conjunto no build. Na `main`. Commits: **9d1f92f** (Fase 2), **89ab518** (Fase 3a).

## Fase 2 — camada de dados (commit 9d1f92f)
- **Tabela** `premium_meta_presets` (brand_scope, name, source_meta_campaign_id, blueprint jsonb) + RLS
  permissiva + indice por marca. Migration `migration-meta-campaign-presets.sql`.
- **Helpers** (premiumData): `readMetaCampaignConfig(metaCampaignId)` (chama a edge read-only);
  `presetBlueprintFromConfig(config)` (normaliza com as decisoes de gestor: **age 25-65**, **raio 2km**
  regional + **cidade** macro, **FB+IG**, generos todos, **3 criativos x 3 copies**, `lead_form_quality`
  por ticket); `saveMetaPreset` / `listMetaPresets` / `deleteMetaPreset`.
- Verificado: tabela aceita insert/select/delete com jsonb path (raio 2km, QUALITY_LEAD). lint/test/build OK.

## Fase 3a — geo RAIO no build (commit 89ab518)
- `publish-meta-ads/targetingFor` aceita **geo por conjunto**: `spec.geo='radius'` (custom_locations
  lat/lng + `radius_km`, clamp 1-80km) = REGIONAL; `spec.geo='city'` (`city_key`) = MACRO. Sobrepoe o geo
  base. deno check + deploy OK. Read-safe (so afeta builds que enviarem geo por conjunto). Build segue PAUSED/confirm.

## Estado do padrao
Backend do "clonar a vencedora" COMPLETO e verificavel: **importar** (Fase 1, read_campaign_config) ->
**normalizar** (presetBlueprintFromConfig) -> **persistir** (Fase 2) -> **aplicar com geo raio** (Fase 3a,
build aceita os 2 conjuntos geo). 

## Resta (UI + build ao vivo)
- **Painel de presets** no Tráfego Pago: importar campanha de referencia (input meta_campaign_id) ->
  salvar; listar; **"Usar preset"** -> semeia o PublishMetaPanel (objetivo/otimizacao/orcamento/2
  conjuntos geo/3x3/form). UI verificavel no preview (import/save/list nao dependem de build).
- **Build PAUSED ao vivo** para o produto da Azenha (em frente ao Olimpico): precisa de inputs do
  operador — **endereco -> lat/lng** do empreendimento (geocode) + **>=1 criativo aprovado** + a
  campanha no banco. Mesmo padrao seguro (PAUSED -> activate com confirm).

## Blueprint padrao a aplicar (derivado da 30.05, validado)
`OUTCOME_LEADS` + `QUALITY_LEAD` + `LOWEST_COST_WITHOUT_CAP` + **CBO R$15/dia** · FB+IG · generos todos ·
**age 25-65** · **3 criativos x 3 copies** · Conj.1 REGIONAL raio **2km** (lat/lng da Azenha) · Conj.2
MACRO cidade **Porto Alegre (key 264859)** · Form: ticket alto = **mais volume / sem SMS**
(`is_optimized_for_quality=false`); ticket menor = **maior intencao / com SMS**.

Ver [[Atualizacao_2026-06-18_Trafego_Preset_Campanha_Referencia_Fase1]] e [[meta-ads-publicacao]].
