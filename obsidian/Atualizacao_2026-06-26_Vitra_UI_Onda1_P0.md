# Vitra UI — Onda 1 (P0) implementada (2026-06-26)

Primeira onda do roadmap da auditoria ([[Atualizacao_2026-06-26_Auditoria_UX_IA_Dashboard]]), feita com a
lente da skill `ui-ux-pro-max` (regras de forms/modal/navegação/foco) e **identidade no brandbook Vitra**.
Camada **aditiva** `dashboard/src/components/ui/` — não reescreve o existente, constrói sobre os tokens
(CSS vars + `.card/.modal-overlay/.form-input/.btn-*`).

## Entregue (arquivos novos)
- **Primitivos** (`components/ui/`): `LoadingState`, `EmptyState`, `ErrorAlert`, `Toast` (ToastProvider +
  `useToast`), `FormField`, `Modal` + `index.js` (barrel).
- **Roteador** (`lib/hashRoute.js` + teste): deep-link por hash (`#/<viewId>`), puro e testável.

## P0 resolvido
- **P0.1 feedback:** LoadingState (spinner role=status), EmptyState (msg+ação), ErrorAlert (role=alert +
  retry), Toast (fila aria-live, auto-dismiss, ícones SVG).
- **P0.2 FormField:** `<label htmlFor>` + id automático + hint/erro via aria-describedby + aria-invalid.
- **P0.3 Modal:** role=dialog + aria-modal + **foco preso** (Tab cicla) + Esc + **foco volta ao gatilho** +
  scroll travado + clique no scrim fecha. Reusa `.modal-overlay/.modal-panel`.
- **P0.4 roteador:** hash dirige a view; localStorage vira fallback. Deep-link, refresh e voltar/avançar do
  browser funcionam. Integrado no `App.jsx` (sem dependência nova — sem react-router).

## Adoção (prova em superfícies reais, baixo risco)
- `main.jsx`: `<ToastProvider>` no topo. `App.jsx`: roteador por hash (substitui setView por `navigate`).
- `Kanban.jsx`: LoadingState + ErrorAlert (a carga falhava **em silêncio** — agora erro acionável + retry).
- `Biblioteca.jsx`: showcase de 5 — LoadingState, EmptyState, ErrorAlert, **Modal** (exclusão, no lugar do
  `window.confirm`), **Toast** (upload/remoção).
- `Metricas.jsx`: o wrapper local `Field` passou a **delegar ao FormField** (associa label em todos os
  campos do formulário de entrada manual, de uma vez).

## Verificação (DOM real, preview)
- Roteador: deep-link `#/metricas` troca a view ✓; navegação ✓; **history.back** `#/metricas`→`#/agentes`
  troca a view ✓.
- Modal: `dialogOpen` + `aria-modal=true` + **foco dentro do diálogo** + título associado ✓; Esc fecha ✓;
  **foco restaurado ao gatilho** (caminho real: focar→abrir→Esc) ✓.
- ToastProvider montado (região aria-live) ✓.
- Qualidade: lint limpo · **177 testes** (5 novos do hashRoute) · build OK.

## Não-objetivos desta onda (próximas)
- O **sweep amplo** de FormField (~150 inputs no PremiumDashboard) e a troca dos modais/erros legados
  restantes são mecânicos — Onda 2. Esta onda entrega a **base** + adoção de referência.
- Sem mudança de back-end. Sem mudança de identidade (marca no brandbook).

## Critérios de aceite (atingidos)
Build + 177 testes verdes; lint limpo; cada view tem URL/deep-link; modais com foco preso/Esc/restauração;
formulário com label associado; feedback (loading/empty/error/toast) padronizado nas views adotadas;
nenhuma regressão funcional observada no preview.

Commit: Vitra UI (6 primitivos + barrel) + roteador (hashRoute + teste) + adoção (App/main/Kanban/
Biblioteca/Metricas).
