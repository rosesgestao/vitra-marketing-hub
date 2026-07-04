# Auditoria do Sistema — Fase B (primitivos do design system) — 2026-07-04

Segunda leva da auditoria ([[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]): criar os primitivos que
faltavam e que hoje viviam bespoke/inline em várias telas. **Pré-requisito da Fase C** (adoção em lote).
Puramente aditivo — nenhuma tela alterada.

## Feito (`cfc7bd5`, no ar)
5 primitivos em `components/ui/`, on-brand (tokens existentes) e acessíveis, exportados no `index.js`:
- **`Tabs`** — tablist acessível: `role=tablist/tab`, `aria-selected`, setas ←/→/↑/↓ + Home/End navegam e
  ativam, roving tabindex. O consumidor renderiza o painel (`role=tabpanel`/`aria-labelledby`).
- **`Segmented`** — seleção única (filtro de marca, segmento de métricas): `role=group` + botões com
  `aria-pressed`; o ativo fica dourado. Substitui os button-groups feitos à mão.
- **`StatTile`** — promoção do cartão de indicador (número em tabular-nums, ícone opcional).
- **`DataTable`** — tabela responsiva por grid: `overflow-x-auto` + `min-width` + tabular-nums **por
  padrão**. Canonicaliza o padrão que quebrava no tablet e que já refiz à mão 2x (P1.9 e P0.2).
- **`Chip`** — pílula de filtro/tag/contagem (distinta do `Badge`, que é rótulo de STATUS em maiúsculas);
  presentational, vira botão com `aria-pressed` quando recebe `onClick`.

## Verificação
lint (cobre todos os arquivos) + build (o `index.js` puxa os primitivos ao grafo → compilam) + 278 testes.
Sem mudança de comportamento (os primitivos ainda não são consumidos).

## Próximo — Fase C (adoção em lote)
Migrar as telas para os primitivos: `.btn-*`→`Button`, abas manuais→`Tabs`, filtros de marca→`Segmented`,
`StatTile` inline→`ui/StatTile`, tabelas grid→`DataTable`, `StatusBadge` bespoke→`StatusPill`,
`Field`→`FormField`, `<select>`→`Select`. É o maior ganho de consistência real. Feito por tela, verificando.
[[Atualizacao_2026-07-04_Auditoria_FaseA_QuickWins]] [[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]
