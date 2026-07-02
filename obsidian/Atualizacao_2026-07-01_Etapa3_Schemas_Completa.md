# Etapa 3 (increment 3) — vitrine + hero-checklist + duo-selos ao schema — COMPLETA (2026-07-01)

Fecha a migração de layout/contrato para DADO nas **6 famílias selecionáveis**. As 3 últimas entram com
o mesmo padrão verbatim-function, byte-idêntico.

## Entregue
- `templateSchemas.ts`: `vitrineLayout()`, `heroChecklistLayout(isStory,isWide,priceFrom)`,
  `duoSelosLayout()` (blocos verbatim) + entradas no registro:
  - **vitrine** — left-anchored; headline 40; lint {axisTol 8, requireLogo} (gapCap por-formato no builder).
  - **hero-checklist** — left-anchored; headline 40; lint {axisTol 8, requireLogo} (gapCap por-formato).
  - **duo-selos** — centered (foto-forward); headline 40 + selo1/selo2 30; lint {requireLogo}.
- Builders lêem `L = xLayout(...)` + caps/opts de lint do `S = schemaFor(...)`. Os `L` inline saíram.
- **Detalhe:** o `porY` do hero-checklist depende do preço "De" (runtime) → `heroChecklistLayout` recebe
  `priceFrom` (passei `!!priceFrom`). vitrine/duo-selos são estáticos. duo-selos mantém
  `(L as any).headX || W/2` (só o wide tem headX) — preservado pela inferência.
- Guard novo no teste: as **6 selecionáveis têm schema** (cobertura).

## Prova
Byte-diff SHA-1 render fresco × preview commitado: **vitrine 1:1/9:16 + hero-checklist 1:1/1.91:1 +
duo-selos 1:1/9:16 → IDÊNTICO** (6/6). Sem bump de versão, sem regenerar preview. deno check + 219 testes
(+1 guard) + ESLint OK; deploy CLI.

## Etapa 3 — COMPLETA (6/6 selecionáveis)
oferta ✅ · destino ✅ · ficha ✅ · vitrine ✅ · hero-checklist ✅ · duo-selos ✅. A posição de cada
elemento agora é DADO no `templateSchemas.ts` (o motor lê a zona, não decide) + contrato de campos/lint
por template. Tudo byte-idêntico (refactor puro).

## Pendências mapeadas (não regressões — melhorias futuras)
- **Preço/CTA INLINE** de hero-checklist/vitrine/ficha ainda com literais (não tokenizado) — some quando
  o preço/CTA virar componente ou na varredura de token_conformance.
- **Fonte Poppins** (hero-checklist/vitrine/duo-selos) fora do DS_FONT — decisão a tomar (trocar p/ Inter
  muda o visual).
- **Normalização rel 0..1** do layout (a spec cita) — opcional, depois; hoje é px (byte-idêntico).
- **Guard catálogo↔schema** cruzando a lista selectable do dashboard — o guard atual lista as 6 fixas.
- Ocultas (hero-panel, lancamento, oportunidade) seguem com L inline (não selecionáveis).

## Próximo — Etapa 4 (lint v3)
contraste WCAG real, token_conformance (pega #111111/Poppins/alphas), format_divergence, **gap mínimo
logo↔headline** (achado do passo 2 da Etapa 2), 3 níveis de severidade (erro/alerta/recomendação).
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
