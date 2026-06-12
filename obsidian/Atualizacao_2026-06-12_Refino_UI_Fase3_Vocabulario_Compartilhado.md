# Atualizacao 2026-06-12 — Refino de UI (fase 3): vocabulario compartilhado

> Continuacao de [[Atualizacao_2026-06-12_Refino_UI_Fase2_Header_Modal]]. Espalha o vocabulario das
> fases 1-2 para os demais paineis (Estudios, Pipeline, Kanban, Calendario, Agentes, Metricas).
> Na `main`, pushado. Commit: **080c2ac**. So apresentacao, zero logica.

## A sacada: consistencia por componente compartilhado
As views nao foram refinadas uma a uma no bracco — a maioria usa o **header compartilhado**
(`PremiumPageHeader` -> classes `premium-*` no `index.css`) e a **classe `.btn-gold`**. Refinando esses
pontos unicos, as 7 views melhoraram juntas e brand-aware.

## `index.css` (pega as 7 views de PremiumPageHeader + .btn-gold)
- `.premium-title`: Playfair com `tracking-tight` e leading mais justo, um tico maior (alinha ao hero
  da Central).
- `.premium-subtitle`: `text-gray-500` -> `text-white/50` (mais legivel/quente no escuro).
- `.btn-gold`: CTA primario agora **solido** (`bg-gold-500`, tinta via `--surface-0` = navy na
  Imobiliaria / preto na Premium), no lugar do outline-tint. Padroniza "Gerar criativos", "Abrir
  gerador", "Mapear publicacao" etc.
- `.btn-ghost`: `text-gray-400` -> `text-white/65` (unifica o secundario).

## `Metricas.jsx`
- `MetricTile` alinhado ao `StatTile` da Central: numero off-white (#F4EFE3), icone em chip, barrinha
  de acento dourada no hover, label uppercase. **KPIs identicos entre as telas.**

## Armadilha registrada (CSS @apply)
`text-white/52` quebra dentro de `@apply` (a opacidade /52 nao esta na escala padrao; em JSX o JIT
gera, mas no `@apply` nao). Usar um passo da escala (`/50`). Valores arbitrarios como `text-[2.6rem]`
e `text-[color:var(--surface-0)]` funcionam no `@apply`.

## Validacao
Preview em Estudio de Criativos, Estudio de Pecas, Metricas e Pipeline: header Playfair + eyebrow
dourado, CTAs solidos coesos, KPIs do Metricas iguais aos da Central. Lint limpo, build OK. Pipeline e
Kanban nao tem KPIs proprios (so header + cards operacionais), entao ja ficaram cobertos pelo header.

## Estado do refino
Fases 1-3 cobriram: Central (KPIs/cards/abas), header/hero + modal, e o vocabulario compartilhado em
todas as views. Vocabulario consolidado: CTA primario solido brand-aware / secundario ghost / eyebrow
dourado com hairline / numero off-white com dourado de acento / card com barra-acento e hover.
