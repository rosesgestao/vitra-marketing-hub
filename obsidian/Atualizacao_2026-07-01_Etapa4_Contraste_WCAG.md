# Etapa 4 (increment 3) — contraste WCAG real (2026-07-01)

Fecha a **última regra ERRO** do checklist da spec ("contraste insuficiente"). Diferente do scrim
(presença), aqui é o **ratio WCAG de verdade** entre duas cores sólidas.

## Constatação técnica (escopo)
A maioria dos textos está sobre **foto** (full-bleed) — contraste real exigiria amostrar a imagem
rasterizada (fica p/ um increment futuro; o scrim/`contrast_no_scrim` cobre por heurística). Mas os
textos sobre **superfície sólida** (placa/chip/pílula/painel/card) têm cor determinística → dá pra
computar o ratio WCAG exato. É esse o alvo deste increment.

## Entregue
- **`contrastRatio(fg, bg)`** em `creativeLint.ts`: luminância relativa sRGB → `(hi+0.05)/(lo+0.05)`
  (WCAG). Puro.
- **`LintElement.textColor`/`bgColor`** (#hex sólido) + **regra ERRO**: onde ambas as cores são
  declaradas, `ratio < min` reprova (`contrast:role:ratio<min`). Limiar **4.5** (texto normal) / **3.0**
  (grande/display ≥24px). Grava `contrast_{role}`. Texto sobre foto NÃO entra (usa scrim).
- **Fiado no oferta** (prova): barra (navy sobre off-white) e placa de preço (navy sobre gold).

## Verificação
Harness oferta **12/12 verde** (a regra não quebra — os pares passam). Ratios reais medidos:
`contrast_bar = 16.58` (navy/off-white), `contrast_price = 6.58` (navy/gold) — ambos ≫ mínimo. Render
**inalterado** (a regra só lê cores declaradas e grava no `metadata.lint`) → sem bump de versão, sem
regenerar preview. deno check + **229 testes** (+3: contrastRatio WCAG, reprova ratio baixo, aprova
navy/gold) + ESLint OK. Deploy CLI.

## Restam na Etapa 4
- **Estender o contraste** às superfícies sólidas das outras 5 famílias (CTAs em pílula, cards de preço,
  selos, painéis) — mecânico, mesma via (`textColor`/`bgColor` nos lint els). O oferta foi a prova.
- **contraste sobre FOTO** (amostragem de luminância da imagem) — increment separado (precisa do raster).
- **format_divergence** (ALERTA).
- Promover `logo_crowding` a erro por arquétipo.
- **Front exibir warnings/recommendations** (hoje só bloqueia por `ok`; os alertas de token/crowding já
  estão gravados no `metadata.lint`).

Débito de marca a decidir: Poppins→Inter, near-whites→offWhite, #111111→navyDeep.
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
