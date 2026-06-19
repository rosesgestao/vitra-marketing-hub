# Atualizacao 2026-06-19 — Tráfego: auto-seed do painel de publicacao a partir do preset

> Fecha o "Usar preset": aplicar um preset agora SEMEIA o painel "Revisar e publicar". Na `main`.
> Commit: **770cc02**.

## Entregue
- **`MetaPresetsPanel`** ganhou botao **"Usar preset"** por preset salvo (prop `onApply`).
- **`TrafegoPagoSection`** levanta `presetSeed` e passa aos dois paineis (presets `onApply` -> publish `seed`).
- **`PublishMetaPanel`** efeito `seed`: aplica **objetivo** (OUTCOME_LEADS->`leads_form`, OUTCOME_SALES->
  `sales`), **orcamento** (CBO do blueprint) e os **2 conjuntos** como `proposal` a revisar
  (regional `geo=radius` lat/lng+raio; macro `geo=city`). A render dos conjuntos mostra a linha
  **"Geo: raio Nkm (lat,lng)" / "cidade inteira"**. O `targetingFor` (Fase 3a) ja aplica esses geos no build.

## Verificacao (ao vivo)
lint, 157 testes, build OK; console limpo. No preview (Tráfego Pago Imobiliária): "Usar preset" no
**"Padrão Lead Imóvel — Azenha"** -> painel com **Leads (formulário)** + **R$15/dia** + 2 conjuntos
**Regional (raio 2km, -30.0608/-51.2115)** + **Cidade (POA)**, ambos 25-65. Conta Vitra Porto Alegre +
Pagina Vitra Imobiliaria pre-selecionadas.

## Estado do padrao "clonar a vencedora" — COMPLETO
importar (read_campaign_config) -> normalizar (presetBlueprintFromConfig) -> persistir
(premium_meta_presets) -> **aplicar/auto-seed** (Usar preset) -> build com **geo raio** (Fase 3a) -> PAUSED
-> activate com confirm. Tudo verificavel; build real continua PAUSED/credenciado.

## Para a Azenha ir AO VIVO (PAUSED) — passos do operador
1. Criar a campanha do produto Azenha (Nova campanha no Tráfego Pago) com os fatos do imovel.
2. Gerar e APROVAR os criativos (3 x 3 copies).
3. Tráfego Pago -> "Usar preset" (Azenha) -> completar **Destino** (site/WhatsApp) e **Política de
   Privacidade** -> **Criar rascunho na Meta (pausado)** -> revisar -> ativar com confirm (gasta verba).

Ver [[Atualizacao_2026-06-19_Trafego_Painel_Presets_e_Azenha]] e [[meta-ads-publicacao]].
