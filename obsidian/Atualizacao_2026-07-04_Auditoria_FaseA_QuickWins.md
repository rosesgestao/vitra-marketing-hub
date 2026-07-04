# Auditoria do Sistema — Fase A (quick wins P0) — 2026-07-04

Primeira leva da auditoria do sistema ([[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]): os 4 P0 de
UX, independentes e de alto impacto. Tudo front, sem back, sem dependência.

## Feito (2 commits, no ar)
- **P0.1 — ConfirmModal** (`6f4beaf`): novo primitivo `components/ui/ConfirmModal.jsx` (sobre `Modal` +
  `Button`) — herda foco-preso/Esc/scrim/scroll-lock, descreve o que acontece, confirmar com tom de perigo,
  e o botão destrutivo **não** recebe foco automático. Convertidos os 2 `window.confirm` DESTRUTIVOS:
  **excluir campanha** e **excluir preset** (estado declarativo + `confirm*`).
- **P0.2/P0.3/P0.4** (`64366a3`): tabela de **Métricas** rolável (`overflow-x-auto` + `min-w-[640px]` +
  tabular-nums); **Agentes** `grid-cols-1 sm:grid-cols-2` (não quebra em 320px); **selo de MODO** no header
  do PremiumDashboard — Tráfego Pago (dourado sólido) × Conteúdo orgânico (discreto) + marca ativa, para o
  operador não agir no modo errado.

## Transparência (olhe antes de afirmar)
- **Biblioteca já usava `Modal` acessível** para excluir mídia — a auditoria estava com info defasada; não
  havia `window.confirm` lá. Convertidos só os 2 destrutivos que restavam.
- **Intocados de propósito:** `window.confirm` de "Ativar (gastar) na Meta" (guarda de gasto) e o discard do
  wizard (`NewCampaignModal` — modal-sobre-modal; anotado para tratar na Fase B com o padrão certo).

## Verificação
build 1558+ módulos + 278 testes + lint em cada passo. Visual = teste do Leonardo no ar.

## Próximo — Fase B
Criar os primitivos que faltam (`Tabs`, `Toggle/Segmented`, `StatTile`, `DataTable`, `Chip`) — pré-requisito
da Fase C (adoção em lote: `.btn`→`Button`, `Field`→`FormField`, select nativo→`Select`).
[[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]
