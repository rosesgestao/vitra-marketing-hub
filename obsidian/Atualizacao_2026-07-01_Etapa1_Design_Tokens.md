# Etapa 1 — Design Tokens (fundação) + oferta-ancora token-driven (2026-07-01)

Primeira etapa da [[Spec_Sistema_Deterministico_Criativos|spec do sistema determinístico]]. A fundação
que remove a fonte da deriva: **token é a única fonte** de tipografia/peso/stroke/padding/sombra/imagem/
logo. Deliberadamente **NÃO repeti o playbook por família** — foi ele que deixou resíduo (logos de
tamanhos distintos, pesos soltos, cores fora do token). Aqui o oferta-ancora vira a PROVA de que o motor
consome tokens.

## Entregue
- **`_shared/designTokens.ts`** (novo): `DS_TYPE` (papel→family/weight/min/max/lh/tracking: hero,
  headline, price, subtitle, label, body, cta, footnote, badge), `DS_WEIGHT`, `DS_STROKE`, `DS_PADDING`,
  `DS_SHADOW` (sintética — Resvg tem filter limitado), `DS_IMAGE` (ratio por formato + minLumaContrast),
  `DS_LOGO` (widthRatio canônico + aspect) com helper **`logoDims(W, kind)`**, `DS_GRID`, `DS_ICON`,
  `DS_VERSION` (= `ds-2026-07`). Reexporta os tokens de `creativeDesign.ts` → uma superfície de import.
- **`creativeDesign.ts`**: `DS_RADII` ganhou `bar: 10` (aditivo).
- **`render-asset` (oferta-ancora + ofertaBox)**: reconciliado com tokens — cores (DS_COLORS), famílias
  (DS_FONT), pesos (DS_WEIGHT), stroke (DS_STROKE.frame), raio da barra (DS_RADII.bar), piso de fonte da
  barra (DS_TYPE.label.min) e a **LOGO por ratio canônico** (`logoDims`), não mais px por template.
  Constantes de topo `GOLD/GOLD_LIGHT/OFF_WHITE` agora **referenciam `DS_COLORS`** (fonte única p/ TODAS
  as famílias, sem mudança de valor).

## Decisão: ratio de logo CANÔNICO (não preservar px)
A logo era px por template (oferta 170/184/150; destino 156/168/138…) — resíduo típico. Escolhido um
ratio único e coerente por formato: **feed .150 / story .160 / wide .120** → oferta agora 162/173/144
(um pouco menor, mais limpo). Inspeção visual feed+story: logo equilibrada, dentro da safe-zone do story,
eixo único intacto, sem colisão/corte. As outras famílias convergem a este mesmo ratio na Etapa 2.

## Escopo consciente (o que ficou p/ etapas seguintes)
- **Zonas/coordenadas** (headY, barY, INSET 24/34, boxH…) seguem no builder — viram **schema** na Etapa 3.
  O INSET divergente por formato é resíduo conhecido, reconciliado quando a zona virar dado.
- Regras novas de lint (contraste WCAG real, token_conformance, logo_ratio, format_divergence) são a
  **Etapa 4** — só então o gate REPROVA cor/fonte fora do token e logo desproporcional.

## Verificação
`oferta-ancora-approved` v5→v6 (arte mudou; espelhado em renderVersions + catálogo). deno check limpo;
**208 testes** (+6 de invariante de token: min≤max, pesos válidos, logoDims determinístico, ratios em
faixa, cor/fonte/raio fonte única) + ESLint OK. Deploy CLI. Harness oferta **12/12** (4 fixtures ×3
formatos: curto/médio/preço-grande ok, headline-longa reprova por char_limit — gate funcionando; fill_bar
0.94, fill_price 1, axis 0, price ≥2.8). Feed+story inspecionados. **6 previews regenerados**. Assets de
teste removidos.

## Próximo
Etapa 2 — `components.ts` (priceBlock/ctaPill/badge/card/logo únicos) e migração família a família p/ o
ratio/token canônico (agora contra um alvo objetivo, não "no olho"). [[render-asset-deploy-e-limites]]
[[validacao-criativo-arquitetura]]
