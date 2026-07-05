# Auditoria do Sistema — Fase C (fecho): PremiumDashboard migrado + adoção COMPLETA — 2026-07-04

Fecho da Fase C (adoção dos primitivos, [[Atualizacao_2026-07-04_Auditoria_FaseC_Adocao]]): o epicentro
(`PremiumDashboard.jsx`) migrado em 4 partes, por risco crescente, cada uma com o OK do Leonardo antes do
push. Com isso a **adoção dos primitivos fica COMPLETA em todo o produto**.

## PremiumDashboard — 4 partes (no ar)
1. **StatTile** (`b13ecbd`): remove a função `StatTile` local (duplicada) → `ui/StatTile`. Drop-in; rótulo
   11px (bump de legibilidade da Fase B, consistente com o Métricas).
2. **Botões** (`ea1fc5e`): **24 `.btn-gold`/`.btn-ghost` → `<Button>`** — **0 `.btn` cru restante**.
   loading+icon onde havia spinner; ícone inline nos de 3 estados; overrides via className. Nuances
   cosméticas: 3 micro-botões do funil gap-1.5→2, ícone 14→15 nos loading+icon, cursor-wait→not-allowed.
3. **Abas** (`8046d8c`): barra Produção/Publicações/Config → `<Tabs>` (role=tablist/tab, setas/Home/End).
   O estilo do `Tabs` foi alinhado ao das abas do dashboard (ativo dourado+tint) → adoção visualmente
   idêntica. *Pendência a11y:* os painéis ainda não têm `role=tabpanel` (aria-controls a ligar depois).
4. **Varredura final** (`52dd24c`): mode-selector (Gerar posts/Criar do zero/Importar plano) → `Segmented`;
   tabela do `MetricsSection` → `DataTable`. Grep confirma 0 tabela-grid restante.

## Fase C COMPLETA — placar por tela
- Agentes: StatusPill · Chip · (`4b0313c`)
- Estúdio de Peças: Segmented · Badge · Button · (`caa508e`)
- Estúdio de Criativos: Segmented · Button · Chip · ErrorAlert · (`7d2d7f8`)
- Kanban + Calendário: Segmented · Button · Chip · Badge · (`d52cbc9`)
- Métricas: DataTable · Segmented · StatTile · Button · LoadingState · ErrorAlert · (`5c25ae8`)
- PremiumDashboard: StatTile · Button(24) · Tabs · Segmented · DataTable · (`b13ecbd`→`52dd24c`)

**Critério de aceite da auditoria — "0 `.btn` cru, um só filtro, uma só tabela, um só status" — cumprido
em todo o produto.** Os primitivos amadureceram com o uso: Segmented ganhou `block`, StatusPill os estados
de automação, Tabs o estilo canônico Vitra, DataTable estreou em 2 telas.

## Verificação
lint + 278 testes + build em cada parte. Sem mudança de comportamento pretendida (refatoração de
consistência). Visual = validação do Leonardo no ar. Invariantes intocados (Meta PAUSED+confirm, guards de
marca, guarda de gasto).

## Auditoria PAUSADA aqui (base de consistência feita)
Fases A (quick wins P0) + B (primitivos) + C (adoção) **concluídas e no ar**. O que resta do roadmap é de
outra natureza (produto, não refactor):
- **Fase D — dados & fluxo:** Métricas com gráfico (P1.6); unificar Produção de Conteúdo (Kanban+Calendário
  num workspace); decisão de produto de Agentes (hub real × reabsorver). *Toca back em alguns pontos.*
- **Fase E — estrutural:** convergência dos 2 sistemas de criação visual; documentação viva do DS.
- **Pendências finas anotadas:** painéis com `role=tabpanel` (fechar a a11y das abas); tokenizar cores de
  plataforma (P2.1); breadcrumb (P2.4).

Começar a Fase D num momento dedicado. [[Atualizacao_2026-07-04_Auditoria_FaseC_Adocao]]
[[Atualizacao_2026-07-04_Auditoria_Sistema_Completa]]
