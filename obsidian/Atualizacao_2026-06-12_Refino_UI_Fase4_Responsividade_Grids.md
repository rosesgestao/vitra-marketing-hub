# Atualizacao 2026-06-12 — Refino de UI (fase 4): responsividade + grids

> Continuacao de [[Atualizacao_2026-06-12_Refino_UI_Fase3_Vocabulario_Compartilhado]]. Skill
> frontend-design com foco em espacamento, grids, alinhamento e responsividade. Na `main`, pushado.
> Commit: **9f7b038**. So apresentacao, zero logica.

## Bug critico corrigido: sidebar no mobile
A sidebar `w-72` (288px) era SEMPRE estatica. No celular (375px) ela comia a tela quase toda e o
conteudo ficava ilegivel (uma palavra por linha). Agora:
- **< md (768px)**: a sidebar vira **drawer off-canvas** — oculta por padrao, aberta por um
  hamburguer numa **top-bar mobile** (com a logo da marca), com **backdrop** escurecido clicavel e
  botao **X**. Fecha sozinha ao escolher um item (`selectView` zera `mobileNavOpen`).
- **>= md (768px)**: volta a ser estatica como antes.

Decisao de breakpoint: usei `md` (nao `lg`) de proposito — no range 768-1023 a sidebar estatica ja
funcionava bem (288 + ~480 de conteudo), entao colapsar so abaixo de 768 evita regredir tablet/laptop
e conserta so o celular. Implementacao: `aside fixed ... md:static md:translate-x-0` + `-translate-x-full`
quando fechada; backdrop/top-bar/X com `md:hidden`.

## Grids de KPI
`StatTile` (Central) e `MetricTile` (Metricas): progressao **1 -> 2 (sm) -> 4 (lg)** colunas, no lugar
do salto 1 -> 4 no `md` que espremia os cards no tablet/laptop estreito.

## Validacao (preview, 3 ranges)
- **375 (celular)**: drawer abre/fecha (hamburguer, X, backdrop, fecha ao selecionar), conteudo
  full-width legivel, KPIs em 1 coluna.
- **768 (tablet)**: sidebar estatica, KPIs em 2x2.
- **~800/desktop**: sidebar estatica (sem regressao), KPIs 2-4 col.
Lint limpo, build OK.

## Estado do refino de UI
Fases: 1 Central (KPIs/cards/abas) · 2 header/hero + modal · 3 vocabulario compartilhado (header +
CTAs em todas as views) · 4 responsividade do shell + grids. O dashboard agora e usavel do celular ao
desktop, coeso e brand-aware. Camada fina ainda possivel: cards proprios de Kanban/Pipeline/Calendario/
Agentes e o grid interno do modal no mobile.
