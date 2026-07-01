# Etapa 2 (passo 3) — tokenizar preço/CTA/badge (2026-07-01)

Fecha a Etapa 2. **Decisão do Leonardo: tokenizar, NÃO homogeneizar.**

## Constatação (igual ao achado da logo)
Os helpers de preço/CTA/badge **não são cópias duplicadas** — cada um já é uma função nomeada com
tratamento visual PRÓPRIO e intencional por família (CTA dourado no hero-checklist vs branco-com-seta no
destino; badge círculo-check vs selo dourado; placa dourada vs chip De/Por vs card branco). "Unificar num
componente" homogeneizaria os visuais. Então o passo 3 = **fazer os helpers consumirem os DS tokens**
(cor/fonte/peso/raio/stroke) SEM mudar o visual — mesma disciplina da Etapa 1, agora em preço/CTA/badge.

## Tokenizado (valor idêntico → output inalterado)
- `HC_INK` `#07111F` → `DS_COLORS.navyDeep`.
- `priceChip` (duo-selos + dual-photo): placa `#F5F5F0` → `OFF_WHITE`; divisor `stroke-width 2` →
  `DS_STROKE.frame`. (o `ink="#111111"` é near-black FORA da paleta — deixado literal + comentado p/ a
  regra `token_conformance` da Etapa 4.)
- `duoSelosBadge`: `#FFFFFF` → `DS_COLORS.white`; `weight 700` → `DS_WEIGHT.bold`.
- `destinoCtaPill`: `#FFFFFF`→`DS_COLORS.white`, `#0A1628`→`DS_COLORS.navy`, seta idem; texto
  `family "Inter"`→`DS_FONT.body`, `weight 800`→`DS_WEIGHT.black`.
- `destinoConditionColumn`: `family Anton/Inter`→`DS_FONT.display/body`; `weight 400/600`→
  `DS_WEIGHT.regular/semibold`.
- (`GOLD`/`GOLD_LIGHT`/`OFF_WHITE`/`HC_GOLD_TEXT`/`HC_GOLD_BTN` já apontavam p/ DS_COLORS desde a Etapa 1.)

## Prova de que NADA mudou visualmente
Byte-diff (SHA-1) de render fresco × preview commitado ANTES da mudança, mesmos dados:
`duo-selos 1x1` e `hero-checklist 1x1` → **IDÊNTICO** nos dois. Logo: **sem bump de versão, sem
regenerar preview**. deno check + 213 testes + ESLint OK. Deploy CLI.

## Escopo consciente (fica p/ depois)
- **Preço/CTA INLINE** nos builders (hero-checklist De/Por+CTA, vitrine De/Por+CTA, ficha card, oferta já
  feito) ainda têm literais — serão tokenizados quando os builders forem para SCHEMA/zonas (Etapa 3),
  para não fazer sweep duplo.
- **Poppins** (fonte usada em hero-checklist/vitrine/duo-selos) NÃO está nos tokens (DS_FONT só tem
  Anton/Inter) — é um resíduo de fonte a decidir depois (trocar p/ Inter mudaria o visual). Deixado.
- Valores non-token (`#111111`, alphas `rgba(255,255,255,x)`, `weight 900`, `stroke 2.2`) deixados
  literais — a regra `token_conformance` da Etapa 4 vai SINALIZÁ-los.

## Etapa 2 — COMPLETA
componentes+tokens: passo 1 (logoBlock; oferta+destino), passo 2 (4 SVG → logoBlock; logo unificada nas
6), passo 3 (preço/CTA/badge tokenizados, output idêntico). Próximo: **Etapa 3 — schemas/zonas** (posição
por dado, não por código) + tokenizar o preço/CTA inline de cada builder no mesmo movimento.
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
