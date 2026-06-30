# Onda 2 (P1.1, fatia 1) — Drawer + cards acionáveis no Kanban/Calendário (2026-06-26)

Avanço do roadmap da auditoria com a skill `ui-ux-pro-max` (drawer/sheet, focus-trap, aria, focus-ring).
Os quadros Kanban e Calendário eram **read-only** (espelhos da mesma tabela, sem ação). Agora o card
**abre um detalhe** com ações reais — primeira fatia do P1.1, sem tocar o monolito.

## Entregue
- **Primitivo `Drawer`** (`components/ui/Drawer.jsx`, no barrel): painel lateral com o mesmo rigor do
  Modal — role=dialog + aria-modal, **foco preso**, Esc, **foco volta ao gatilho**, scroll travado, scrim
  fecha; em telas estreitas vira folha (largura cheia). É o componente "Drawer" que a auditoria pediu para
  padronizar (extrair o PostDetailDrawer do monolito).
- **`PostDetailDrawer`** (`components/PostDetailDrawer.jsx`): consome o Drawer; mostra visual, gancho,
  legenda, hashtags, agendamento e status; **ações**: "Copiar legenda" (clipboard + toast) e "Ver na
  Produção" (deep-link da marca via roteador da Onda 1).
- **Kanban e Calendário**: cards viraram **botões acessíveis** (role=button, tabIndex, Enter/Espaço,
  aria-label) que abrem o drawer. Queries ganharam `caption/hashtags/brand_scope` (alimentam o detalhe).
  De quebra, o Calendário trocou loading/empty inline pelos primitivos (consistência).

## Verificação (DOM real, preview)
- Kanban: **69 cards clicáveis**; clicar abre o drawer com `aria-modal=true`, **foco dentro**, ações
  (Copiar legenda / Ver na Produção) e seção Legenda; **Esc fecha** e **foco volta ao card** ✓.
- Ação "Ver na Produção": navega `#/imobiliaria` e fecha o drawer ✓.
- lint limpo · **182 testes** · build OK.

## Escopo / próximos
Esta fatia entrega **inspecionar + agir (copiar/navegar)** — a metade de "telas acionáveis". A **edição/
mudança de status no lugar** (drag/menu) fica para a próxima fatia do P1.1 (precisa de patch de status).
Sem mudança de back-end (só leitura ampliada) e sem mudança de identidade.

## Estado do roadmap
Onda 1 (P0) ✅. Onda 2: P1.7 ✅ · **P1.1 (fatia 1) ✅**. Restam: P1.1 (edição in-place), P1.2 (geradores
órfãos), P1.3 (copy IA unificada), P1.4 (monolito), P1.5 (responsividade tablet), P1.6 (loop de métricas).

Commit: Drawer (primitivo) + PostDetailDrawer + Kanban/Calendário (cards acionáveis) + App (onNavigate).
