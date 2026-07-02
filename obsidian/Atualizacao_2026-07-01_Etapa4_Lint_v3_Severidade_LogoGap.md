# Etapa 4 (increment 1) — lint v3: severidade + gap logo↔headline (2026-07-01)

Início da Etapa 4 (as regras que fazem o gate REPROVAR/SINALIZAR o que hoje passa). Increment 1 = a
fundação de **3 níveis de severidade** + a regra concreta que o passo 2 da Etapa 2 revelou.

## Entregue
- **`creativeLint` v3 — 3 níveis:** `LintReport` agora tem `errors` (BLOQUEIA, ok=false) +
  `warnings` + `recommendations` (consultivos, NÃO afetam ok). Estrutura pronta p/ as próximas regras.
- **Regra `logo_crowding` (nível ALERTA):** headline/herói encostando na logo quando estão na MESMA
  coluna (sobreposição horizontal). Logo em coluna oposta (ex.: hero-checklist wide = topo-direito) NÃO
  dispara. Grava a métrica `logo_gap` (auditável). Opt-in via `minLogoGap` no schema.lint das 6 famílias.
- **Por que ALERTA e não ERRO:** o gap "apertado porém ok" varia por peça. Medi os 18 formatos:
  gaps de 24–126, exceto os wide de **oferta/vitrine (15)** — que na revisão do passo 2 ficaram
  visualmente bons. Como o layout virou DADO FIXO (Etapa 3), o gap é determinístico por template/formato
  → limiar **14**: os aprovados (≥15) não alertam, e o caso do bug (~12) alertaria. Promover a ERRO exige
  limiar calibrado por arquétipo/formato (fica p/ depois).

## Verificação
Render (PNG) **inalterado** — a regra só lê geometria e grava no `metadata.lint` (métrica+warnings), não
muda o SVG → sem bump de versão, sem regenerar preview. Medição dos 6×3 formatos: **todos ok=true**,
**zero `logo_crowding`** com limiar 14 (o menor gap real é 15). deno check + **223 testes** (+4: 3 níveis,
logo_crowding alerta, coluna-oposta não dispara, guard minLogoGap) + ESLint OK; deploy CLI.

## Restam na Etapa 4
- **token_conformance** (ALERTA): varre o SVG por cor/fonte fora da paleta — pega `#111111` (priceChip),
  **Poppins**, alphas `rgba(...)`, `weight 900`. É um validador de STRING (diferente do de geometria).
- **contraste WCAG real** (ERRO p/ texto sobre superfície sólida; sobre foto segue via scrim).
- **format_divergence** (ALERTA): compara os 3 formatos por diferenças indevidas.
- Promover `logo_crowding` a ERRO com limiar por arquétipo.
- Front: exibir warnings/recommendations ao operador (hoje só bloqueia por `ok`).

[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
