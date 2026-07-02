# Etapa 6 (increment 3) — baseline de métricas (golden) (2026-07-02)

Fecha a peça que faltava do harness: além do `ok`, **travar os valores golden das métricas** (fill_bar,
logo_gap, contrast_*, price_ratio, axis_spread, max_gap). Pega **regressões SUTIS que não quebram o ok** —
ex.: fill_bar caindo 0.94→0.88, contraste piorando 6.58→4.6, logo_gap encolhendo. O layout é dado fixo
(Etapa 3) → as métricas são determinísticas → dá pra travar com tolerância apertada.

## Entregue (`dashboard/scripts/creative-qa.mjs` + `creative-qa-baseline.json`)
- **`creative-qa-baseline.json`** (novo, versionado): `${fam}/${content}/${format}` → objeto de métricas.
  **75 entradas** (10 famílias, incl. Premium), **60 com métricas golden** + 15 só-`ok` (as duas famílias
  de lançamento não emitem métricas — esperado).
- **Comparação no run normal:** `metricDrift(baseline, atual)` — tolerância **±0.04** (ratios/fills) /
  **±3px** (gaps). Drift em fixture que passaria no `ok` → vira **FAIL** (o CI pega). Chave sem baseline →
  informativo (não falha; rode `--update-baseline`).
- **`--update-baseline`:** regrava o arquivo (após mudança INTENCIONAL). Merge: `--family X` só atualiza X,
  preserva o resto.

## Verificação
- Baseline gerado do Edge atual: run normal `oferta-ancora` **12/12 PASS, zero drift** (bate exato).
- **Prova de que o drift é pego:** corrompi `oferta-ancora/medio/feed.fill_bar` 0.94→0.70 → o harness deu
  **`FAIL — drift de métrica: fill_bar 0.94≠0.7`** (e sai 1). Valor restaurado.
- node --check no harness OK.

## Estado da Etapa 6
increment 1 (curto/vazio + 3 bugs de robustez) ✅ · 2 (Premium no harness) ✅ · **3 (baseline de
métricas) ✅**. A matriz agora cobre curto/médio/vazio + estresse × 3 formatos × Imob+Premium, com
**ok + métricas golden** travados. Falta da E6 (menor): imagem H/V/quadrada como eixo de fixture.

## Spec
Etapas 1-6 (núcleo) ✅ + 8 (guard) ✅. Resta **7** (regressão visual golden pixel-diff no CI) e pendências
menores da E4 (contraste nas outras 5 + foto, format_divergence, promover logo_crowding a erro).
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
