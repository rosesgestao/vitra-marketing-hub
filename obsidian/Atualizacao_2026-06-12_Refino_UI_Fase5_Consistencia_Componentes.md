# Atualizacao 2026-06-12 — Refino de UI (fase 5): consistencia de componentes

> Continuacao de [[Atualizacao_2026-06-12_Refino_UI_Fase4_Responsividade_Grids]]. Skill
> frontend-design com foco em sistematizacao de cards, modais, filtros e botoes. Na `main`, pushado.
> Commit: **bcf0ea8**. So apresentacao, zero logica.

## Sistema de raio (2 niveis intencionais)
- **Containers (cards/modais) = `rounded-xl` (12px)**; **controles (inputs/botoes/pills) = `rounded-lg`
  (8px)**. Hierarquia clara, nao churn aleatorio.
- `index.css`: `.card` / `.card-sm` / `.card-hover` -> `rounded-xl` (pega EstudioPecas, Pipeline,
  Calendario). O painel de detalhe da campanha e o form de "mapear publicacao" tambem subiram para
  `rounded-xl` (sao vizinhos dos cards de KPI/lista, entao o raio batia diferente).

## Modais num ponto so
Antes os 3 modais repetiam o MESMO markup inline (overlay `fixed inset-0 z-50 ... backdrop-blur` +
painel `rounded-lg border-white/15 bg-surface-1 shadow-2xl`). Agora:
- `.modal-overlay` e `.modal-panel` no `index.css`. O painel usa `rounded-xl`, superficie
  `var(--surface-1)` e **hairline dourado `var(--line)`** (o mesmo dos cards) no lugar da borda
  branca/15. Adotadas em Nova Campanha, Editar anuncio e Editar criativo (so o `max-w`/`max-h` fica
  inline por modal).

## Filtros / inputs unificados
Havia dois estilos concorrentes: o `.form-input` compartilhado (`bg-white/[0.04]` + foco com realce) e
um estilo solto `bg-black/35` repetido em 3 consts `inputClass` locais + 8 selects (Metricas e forms
do PremiumDashboard). Tudo passou a usar **`.form-input`**. Filtro = input = textarea, mesma cara.

## Botoes
Ja padronizados nas fases 2-3: `.btn-gold` (primario solido brand-aware) / `.btn-ghost` (secundario).

## Validacao
Build OK, lint limpo, **151 testes verdes**. Inspecao de DOM (estilo computado) confirmou o modal:
`.modal-overlay` = `position fixed; inset 0; z-index 50; display flex` cobrindo a viewport;
`.modal-panel` = raio **12px** + borda **rgba(196,148,42,0.18)** (hairline dourado) + fundo
`rgb(15,27,46)` (navy surface-1). **Nota:** o screenshot do preview ficou travado nesta sessao
(renderer headless do harness, com Vite saudavel), entao a validacao visual foi pelo DOM/estilo
computado em vez de imagem.

## Estado do refino de UI
Fases 1-5: Central -> header/hero + modal -> vocabulario compartilhado -> responsividade -> consistencia
de componentes. O design-system agora tem: CTA primario/secundario, eyebrow dourado, numero off-white,
card com barra-acento, raio de 2 niveis, modal padrao e input padrao — tudo brand-aware. Camada fina
ainda possivel: cards proprios de Kanban/Pipeline/Calendario/Agentes que ainda tem markup inline.
