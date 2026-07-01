# Etapa 2 (passo 1) — components.ts + logoBlock (2026-07-01)

Segunda etapa da [[Spec_Sistema_Deterministico_Criativos|spec]]: componentes únicos que acabam com a
duplicação (cada template tinha seu price/cta/badge/logo). Passo 1 = o componente mais transversal, a
**logo**.

## Achado de marca (resíduo real)
As famílias usavam **DOIS wordmarks diferentes**: oferta e destino no **PNG oficial aprovado**
(aspecto 2538×434); hero-checklist, duo-selos, hero-panel, vitrine e ficha num **SVG inline**
(aspecto 25×136 ≈ 7% mais alto). Decisão do Leonardo: **padronizar no PNG aprovado** (canônico único;
remove o SVG inline). Isso vira o alvo OBJETIVO da migração — não "no olho".

## Entregue (passo 1)
- **`_shared/components.ts`** (novo): `logoBlock(hrefPng, W, kind, {y, centered|x, cx})` — PURO, produz
  markup + box (p/ o lint). Largura CANÔNICA por formato (DS_LOGO/`logoDims`); uma fonte para todas.
- **oferta-ancora** migrado ao `logoBlock` (saída idêntica — já usava logoDims na Etapa 1).
- **destino-bairro** migrado ao `logoBlock`: removidos os `logoW` px por formato (168/138/156) → agora
  canônico (feed 162 / story 173 / wide 144). destino v5→v6, **6 previews regenerados**, feed inspecionado
  (logo equilibrada, sem regressão).
- `logoDims`/`DS_LOGO` saíram do import do render-asset (agora via `logoBlock`).

## Escopo consciente
As **4 SVG selecionáveis** (hero-checklist, duo-selos, vitrine, ficha) trocam de SVG inline → PNG no
**passo 2**: cada uma tem posição/largura de logo por formato (ex.: hero-checklist com logo top-right no
wide) que exige reconciliação cuidadosa + verificação por formato. NÃO empurrei às pressas para não gerar
novo resíduo — é o oposto do que a spec quer. Os 3 ocultos (hero-panel, lancamento, oportunidade) seguem
no SVG inline até serem revelados. O `VITRA_WORDMARK_WHITE` (SVG inline) só sai do código quando todos
migrarem.

## Verificação
deno check limpo; **212 testes** (+4 do `logoBlock`: largura canônica, centragem no cx, âncora à
esquerda, markup determinístico) + ESLint OK. Deploy CLI. Harness **oferta 12/12** + **destino 3/3**
verdes. Assets de teste removidos.

## Próximo
Etapa 2 passo 2 — migrar as 4 SVG selecionáveis ao `logoBlock` (PNG), uma a uma sob o harness; depois
extrair `priceBlock`/`ctaPill`/`badgePill` (há 2 sistemas de preço — priceChip/ofertaBox — e 2 de badge).
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
