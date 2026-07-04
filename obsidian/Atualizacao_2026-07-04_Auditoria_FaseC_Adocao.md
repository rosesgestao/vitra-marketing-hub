# Auditoria do Sistema — Fase C (adoção dos primitivos em lote) — parte 1 — 2026-07-04

Terceira leva da auditoria ([[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]): migrar as telas para os
primitivos criados na Fase B ([[Atualizacao_2026-07-04_Auditoria_FaseB_Primitivos]]). É o **maior ganho de
consistência real** (não estética). Feito **por tela, verificando** — da mais bespoke para a menos. Sem
mudança de comportamento pretendida.

## Feito (5 telas, 4 commits, no ar)
- **Agentes** (`4b0313c`): StatusBadge bespoke → `StatusPill` (+chaves ativo/aguardando no STATUS_STYLES,
  aditivo) · cron → `Chip`. (Sem botões.)
- **Estúdio de Peças** (`caa508e`): BrandToggle → wrapper sobre `Segmented` · StatusBadge → wrapper sobre
  `Badge` · 3 botões `.btn` → `Button`. (Fallback de rota inválida já existia.)
- **Estúdio de Criativos** (`7d2d7f8`): seletor de formato → `Segmented block` (novo prop `block` =
  full-width) · Gerar → `Button` · chips de diferencial → `Chip` · **error boundary** (try/catch + estado
  de erro + `ErrorAlert` no generateAll).
- **Kanban + Calendário** (`d52cbc9`): filtro de marca (button-group manual, um por tela) → `Segmented` nas
  duas · Calendário: filtro de plataforma → `Segmented` · Kanban: Atualizar → `Button`, contador de lane →
  `Chip` · badges `.badge` crus (legenda/visual/#/pilar/status) → `Badge`.

## Amadurecimento dos primitivos com o uso real
- `Segmented` ganhou o modo **`block`** (full-width, segmentos iguais) — usado no seletor de formato.
- `StatusPill` ganhou os **estados de automação** (ativo/aguardando/standby) — aditivo, zero impacto nos usos.

## Verificação
lint (cobre todos os arquivos) + 278 testes + build em cada tela. Visual = teste do Leonardo no ar.

## Restante da Fase C
- **Métricas**: tabela → `DataTable` · segmento (Todos/Orgânico/Pago) → `Segmented` · `StatTile` inline →
  `ui/StatTile`. (Casa também com o P1.6 — gráfico — que fica pra Fase D.)
- **PremiumDashboard** (por último — tela crítica, com validação do Leonardo): `.btn` → `Button`, abas
  (Produção/Publicações/Config) → `Tabs`, `StatTile` inline → `ui/StatTile`, tabelas → `DataTable`.
[[Atualizacao_2026-07-04_Auditoria_FaseB_Primitivos]] [[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]
