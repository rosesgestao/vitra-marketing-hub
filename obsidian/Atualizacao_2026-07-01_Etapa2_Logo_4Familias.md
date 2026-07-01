# Etapa 2 (passo 2) — 4 SVG selecionáveis → logoBlock (2026-07-01)

Fecha a unificação da logo nas **6 famílias selecionáveis**. As 4 que usavam **SVG inline**
(hero-checklist, duo-selos, vitrine, ficha) passaram para o **PNG oficial via `logoBlock`** (decisão de
marca do passo 1), com largura CANÔNICA por formato.

## Componente estendido
`logoBlock` ganhou `rightEdge` — alinha a DIREITA da logo num x fixo (borda-direita constante), para a
logo topo-direito do hero-checklist no wide.

## Migração + placement preservado
- **hero-checklist**: feed/story à esquerda (margem); wide topo-DIREITO (`rightEdge`).
- **duo-selos**: feed/story centrada (cx); wide à esquerda.
- **vitrine / ficha**: à esquerda (coluna navy). Já estavam ~canônicas (158-168), mudança mínima.

## BUG visual pego na inspeção (não pelo gate)
No **hero-checklist feed**, a logo canônica (120→162) **encostou na headline** — o template tinha uma
logo-canto pequena (120) a só ~18px da headline; ao crescer, colou. **O gate NÃO pegou** (não há overlap
>6% entre as caixas) — foi a **inspeção visual** que pegou. Fix estrutural: a logo do feed **sobe**
(`y 120→90`) e o respiro volta a ~42px (alinhado com ficha/duo-selos). Prova de que **falta regra de
gap mínimo logo↔headline no lint** (candidata para a Etapa 4). Story/wide já tinham folga.

## Verificação
deno check limpo; **213 testes** (+1 do `rightEdge`) + ESLint OK. Deploy CLI. Harness **4 famílias ×
3 formatos = 12/12** verdes. **Inspeção visual**: hero-checklist feed (pós-fix)/story/wide, duo-selos
feed, vitrine story, ficha feed — todas com logo equilibrada, sem colisão/corte. Versões bumpadas:
hero-checklist v5→v6, duo-selos v2→v3, vitrine v2→v3, ficha v2→v3 (+ asserts do teste). **24 previews
regenerados**. Assets de teste removidos.

## Estado
Logo unificada nas **6 selecionáveis** (oferta, destino, hero-checklist, duo-selos, vitrine, ficha) — todas
no `logoBlock`/PNG canônico. Os 3 ocultos (hero-panel, lancamento, oportunidade) seguem no SVG inline
(`VITRA_WORDMARK_WHITE` só sai do código quando eles migrarem).

## Aprendizados p/ a spec
1. **Largura de logo única** funciona p/ logos centradas e p/ esquerdas com folga vertical; onde a logo
   fica colada à headline (hero-checklist feed) precisa de ajuste de zona — reforça a Etapa 3 (zonas) e a
   Etapa 4 (regra de **gap mínimo logo↔headline**).
2. Vitrine/ficha já estavam no tamanho certo → o resíduo era concentrado (hero-checklist 120, o outlier).

## Próximo
Etapa 2 passo 3 — extrair `priceBlock`/`ctaPill`/`badgePill` (2 sistemas de preço: priceChip/ofertaBox;
2 de badge: heroChecklistBadge/duoSelosBadge). Depois Etapa 3 (schemas/zonas). [[render-asset-deploy-e-limites]]
[[validacao-criativo-arquitetura]]
