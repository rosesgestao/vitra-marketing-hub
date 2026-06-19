# Atualizacao 2026-06-19 — Tráfego: seletor "Criativos por conjunto" no painel

> Expoe na UI o controle do multi-criativo (3×3) que o build_draft ja aplica. Na `main`. Commit: **0987652**.

## Entregue
- **`PublishMetaPanel`** ("Revisar e publicar"): novo seletor **"Criativos por conjunto"** (VitraSelect
  1–4, **padrão 3** = 3×3 da vencedora) com microcopy "1 anúncio por criativo aprovado em cada conjunto".
- **`buildMetaDraft`** (premiumData) estendido com `creativesPerAdset` -> envia `creatives_per_adset` ao
  `build_draft`, que cria N anuncios por conjunto (feature do commit 1d9a8be).

## Verificacao (ao vivo)
lint, 157 testes, build OK; console limpo. No preview (Tráfego Pago): seletor presente, default
"3 criativos (padrão)", microcopy visivel. O fluxo build (N anuncios/conjunto) ja fora validado
(2 conjuntos × 3 = 6 ads).

## Estado do ciclo "clonar a vencedora" (completo)
importar (dropdown de campanha) → preset → auto-seed → **seletor de criativos/conjunto** → build
(2 conjuntos geo × N criativos) → PAUSED → ativar com confirm. Ver
[[Atualizacao_2026-06-19_Trafego_Build_Multi_Criativo_3x3]] e [[meta-ads-publicacao]].
