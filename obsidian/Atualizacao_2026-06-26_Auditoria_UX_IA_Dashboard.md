# Auditoria de UX / IA / Front-end — Vitra Marketing Hub (2026-06-26)

Diagnóstico (sem alterar código) feito como Dev Sênior + PO + Diretor de Design, usando a skill
`ui-ux-pro-max` como lente de UX/IA/design-system (padrão "Operations dashboard"; cores/fontes genéricas
dela descartadas — identidade fica no brandbook Vitra). Ancorado em mapeamento real do código (3 agentes
de exploração: navegação/IA, módulos/fluxos, componentes/estados/a11y).

## Diagnóstico geral
A ferramenta é **funcionalmente densa e bem temática** (multi-marca via CSS vars + `data-brand`, gate de
qualidade no Tráfego, copy IA, render pipeline). Mas a **experiência ainda se comporta como sistema
tradicional**: navegação por accordion sem URL, telas que **mostram mas não deixam agir**, um **monolito**
(PremiumDashboard 5.634 linhas) e **primitivos de feedback ad-hoc**. O trabalho do operador é fragmentado
entre telas que espelham a mesma tabela. O teto não é estética — é **produtividade, consistência e escala**.

## Achados estruturais (fatos do código)
- **Navegação:** accordion de 6 seções; roteamento por `useState` + localStorage, **sem URL / sem
  deep-link** (App.jsx ~132–232). Sem footer. Copilot flutuante onipresente.
- **Perfis:** **NÃO existe sistema de perfis** (Diretor/Gestor/Corretor). App é single-role, **sem
  autenticação** (Supabase anon key). `role:'gestor'` é só contexto do LLM do Copilot. → o pedido assume
  perfis que o produto não tem (decisão de produto em aberto).
- **Módulos (9 views → 5 módulos):** PremiumDashboard é mega-hub (modo duplo `focusMode='trafego'`, 3–4
  abas). Kanban e Calendário são **espelhos read-only** de `premium_content_posts`. Agentes/Pipeline são
  **roadmap** (não operacionais). Dois geradores de criativo (EstudioPecas via HTML em nova aba;
  EstudioCriativos por formulário) **órfãos** do pipeline de assets.
- **Fluxos longos:** Campanha→Assets→Meta = **15–18 passos**; Conteúdo→Agendar→Publicar→Medir = **12–14
  passos em 4 telas**.
- **Componentes:** fortes — `PremiumPageHeader`, `VitraSelect` (a11y exemplar), `PremiumBrand`, `Copilot`,
  classes `.card/.btn-gold/.form-input/.badge`. Faltam primitivos: **Loading/Empty/Error/Toast/Modal/Table
  /Tooltip** (3+ spinners diferentes, ~15 divs de erro ad-hoc).
- **A11y:** ~150 inputs **sem `<label htmlFor>`**; modais **sem `role="dialog"`/aria-modal/focus trap/Esc**;
  `sr-only` 1x; sem focus trap no Copilot. Bom: `prefers-reduced-motion` respeitado; contraste dourado/navy
  ~7.2:1 (mas bordas `white/40` falham AA).
- **Responsivo:** desktop-first; sidebar mobile OK; **Kanban força scroll horizontal**; grids 2-col; tablet
  fraco.
- **Tema/tokens:** forte (CSS vars semânticas + Tailwind theme; hex só nos logos). **Sem** tokens de
  espaço/raio/sombra/motion formalizados, sem Storybook/biblioteca.

---

## Recomendações classificadas (P0 / P1 / P2)
Cada item: problema real → ação (front) → impacto back → critério de aceite.

### P0 — críticos de usabilidade/funcionamento
**P0.1 — Primitivos de feedback (Loading/Empty/Error/Toast).** Problema: 3+ spinners e ~15 divs de erro
ad-hoc; views sem try/catch (Pipeline/Agentes/EstudioCriativos = 0) quebram em branco na falha. Ação:
criar `<LoadingState>`, `<EmptyState>`, `<ErrorAlert retry>`, `<Toast aria-live>`; envolver cargas com
error boundary. Back: nenhum (mensagens já vêm das edges). Aceite: toda view usa os 4 primitivos; falha
mostra erro acionável + retry; zero spinner/erro inline; nenhuma tela em branco.
**P0.2 — Acessibilidade de formulário.** Problema: ~150 inputs sem label associado → leitor de tela/clique
no label falham. Ação: `<FormField label hint error>` com `id` auto + `htmlFor`. Aceite: todo input tem
label; clicar o label foca; axe sem violação de label.
**P0.3 — Semântica de modal.** Problema: 6 modais sem `role="dialog"`, aria-modal, focus trap, Esc. Ação:
`<Modal>` (scrim, focus trap, Esc, foco volta ao gatilho). Aceite: Tab preso no modal; Esc fecha; foco
restaurado; anunciado pelo leitor.
**P0.4 — URL / deep-link.** Problema: nav só em estado+localStorage → não dá pra compartilhar, abrir direto
ou usar "voltar" do browser; suporte não consegue apontar uma tela. Ação: roteador leve mapeando view↔URL
(hash ou react-router) preservando o estado atual. Back: nenhum. Aceite: cada view/campanha tem URL;
refresh e link abrem a mesma tela; voltar/avançar do browser funciona.

### P1 — produtividade e consistência
**P1.1 — Telas que mostram mas não agem.** Problema: Kanban/Calendário read-only; para editar/mudar status
o operador volta ao Dashboard (4 telas no ciclo). Ação: abrir o `PostDetailDrawer` a partir do card; mudar
status por drag/menu; um **drawer único de post** acessível de qualquer tela. Back: endpoint/patch de
status (tabela já existe). Aceite: do card dá pra abrir, editar e mudar status sem sair da tela.
**P1.2 — Geradores órfãos integrados.** Problema: EstudioCriativos/Peças não puxam dados da campanha nem
gravam a saída como asset → retrabalho e perda de rastreio. Ação: "usar dados da campanha" (pré-preenche) +
"salvar como asset"/Biblioteca. Back: persistir em `premium_campaign_assets`/`cards`. Aceite: peça criada a
partir de campanha nasce pré-preenchida; saída vira asset rastreável.
**P1.3 — Copy IA unificada.** Problema: geração em 3 lugares; `copyValidation` só no asset → risco de voz
fora de marca no orgânico. Ação: um serviço de copy único com o guard em todos os pontos. Aceite: toda
geração passa pelo mesmo validador; vocabulário não cruza marcas em nenhum ponto.
**P1.4 — Quebrar o monolito.** Problema: PremiumDashboard 5.634 linhas, 18 sub-componentes internos não
exportados → manutenção/escala/risco. Ação: extrair seções (ContentProduction, PaidTraffic, PostDetailDrawer,
CampaignsSection…) em arquivos/componentes próprios. Back: nenhum. Aceite: arquivo < ~800 linhas; seções
isoladas com teste de render.
**P1.5 — Responsividade tablet/mobile.** Problema: Kanban scroll horizontal forçado; grids 2-col; corretor
em campo usa tablet. Ação: lanes empilháveis/colapsáveis; grids fluidos; auditar 375/768/1024/1440. Aceite:
768px sem scroll horizontal indevido; conteúdo legível nos 4 breakpoints.
**P1.6 — Loop de otimização nas Métricas.** Problema: métrica não vira ação; KPIs duplicados (Métricas +
stats do Dashboard); anti-pattern "slow updates + no automation". Ação: "replicar top asset/campanha" semeia
nova campanha; consolidar a fonte de KPI. Back: leitura `premium_metrics`. Aceite: da Métrica dá pra criar
campanha a partir do vencedor; um número, uma fonte.
**P1.7 — Busca global / command palette (⌘K).** Problema: só accordion → muitos cliques. Ação: palette de
navegação + busca de campanha/post. Aceite: achar qualquer view/campanha/post em ≤2 ações.

### P2 — refinamentos
**P2.1** Tabelas semânticas (`<table>` + `aria-sort`) nas grades de dados (hoje divs). **P2.2** Tooltips de
ícone/ação + toasts com `aria-live`. **P2.3** Focus trap no Copilot, skip-link, foco no conteúdo ao trocar
de view. **P2.4** Contraste: substituir bordas `white/40` por token AA; números tabulares em métricas/preço.
**P2.5** Brand switcher explícito + indicador da marca ativa nas views compartilhadas (hoje "default Imob"
silencioso). **P2.6** Tokens de motion/raio/sombra/espaço formalizados; microinterações padronizadas.

---

## Componentes/padrões a padronizar (lacunas do design system)
`FormField` · `Modal` · `Drawer` (extrair PostDetailDrawer) · `Toast/Notification` · `LoadingState` ·
`EmptyState` · `ErrorAlert` · `DataTable` (com sort/aria) · `Tooltip` · `Tabs` (padronizar abas do Dashboard
e Peças) · `StatTile`/`MetricTile` (promover de internos a compartilhados) · `Button` (formalizar variantes
hoje em CSS).

## Proposta de evolução do design system — "Vitra UI" (camada fina, sem reescrever)
1. **Tokens formalizados:** manter as CSS vars de cor/`data-brand`; adicionar tokens de **espaço/raio/sombra
   /motion/tipografia** como vars + Tailwind theme (fonte única). 2. **Primitivos faltantes** (lista acima)
   — resolvem P0.1–P0.3 e destravam os P1. 3. **PageShell** formalizando `PremiumPageHeader` (kicker/title/
   subtitle/actions). 4. **Catálogo vivo** opcional (rota interna `/ui` ou Storybook leve). 5. **Precedência
   de marca preservada:** o DS cuida de estrutura/feedback; **cor/voz de marca continuam no brandbook**
   (`direcao-de-arte`/`frontend-design` são a autoridade). Estratégia: evolução incremental sobre o que já
   é bom (CSS vars + classes semânticas), **não** um rewrite.

## Melhorias por módulo
- **Operação Comercial (PremiumDashboard):** quebrar monolito (P1.4); unificar criação campanha/post;
  encurtar o fluxo campanha→Meta (15–18 passos) com revisão progressiva; estados consistentes (P0.1).
- **Conteúdo:** tornar Kanban/Calendário acionáveis + drawer único (P1.1); 1 fonte de verdade já existe
  (`premium_content_posts`) — falta a edição no lugar.
- **Tráfego Pago:** já robusto (gate, presets, sync). Integrar com Métricas (loop P1.6); deep-link de
  campanha (P0.4); reduzir fragmentação entre abas.
- **Estúdio de Peças:** integrar à campanha (pré-preencher) e ao asset (salvar saída) (P1.2); tirar o "abrir
  HTML em nova aba" rumo a um fluxo in-app consistente.
- **Inteligência & Automação:** hoje roadmap (bem rotulado). Conectar Métricas→ação (P1.6); quando os
  agentes forem reais, ligar gatilhos aos fluxos (auto-seed, auto-reprovar, publicar).

## Quick wins (baixo esforço, alto impacto)
P0.1 (primitivos) · P0.2 (FormField) · P0.3 (Modal) — destravam consistência e a11y de uma vez. P2.4
(contraste/tabular) · P2.5 (indicador de marca ativa) · P1.7 (⌘K) entregam percepção de produto rápido.

## Estruturais (médio/longo)
P0.4 (URL/router) · P1.1 (telas acionáveis) · P1.2 (integração dos geradores) · P1.3 (copy unificada) ·
P1.4 (desmonte do monolito) · P1.6 (loop de métricas). Decisão de produto pendente: **introduzir perfis**
(Diretor/Gestor/Corretor) exige autenticação + RBAC (front+back) — hoje inexistente.

## Impactos no back-end
Maioria é **só front**. Exigem back: P1.1 (patch de status — tabela já existe), P1.2 (persistir saída dos
geradores em assets/Biblioteca), P1.3 (serviço de copy unificado com guard), P1.6 (leitura de
`premium_metrics` para semear campanha). **Perfis/auth** (se aprovado) é o maior item de back (Supabase Auth
+ RLS + RBAC) — fora do escopo "sem comprometer a arquitetura".

## Roadmap por prioridade e dependência
1. **Onda 1 (P0, base):** primitivos de feedback (P0.1) → FormField (P0.2) → Modal (P0.3) → URL/router
   (P0.4). Os 3 primeiros são **dependência** dos P1 (drawer, integração, telas acionáveis usam Modal/Toast/
   FormField). 2. **Onda 2 (P1):** telas acionáveis (P1.1, usa Drawer/Modal/Toast) ‖ responsivo (P1.5) →
   desmonte do monolito (P1.4) → integração dos geradores (P1.2) → copy unificada (P1.3) → loop de métricas
   (P1.6) → ⌘K (P1.7). 3. **Onda 3 (P2):** refinamentos. **Decisão de produto** (paralela): perfis/auth —
   sequenciar só se for meta de negócio (alto custo de back).

## Critérios de aceite
Embutidos por item acima (cada recomendação tem o seu). Transversal: nenhuma regressão funcional; build +
172 testes verdes; a11y sem violações críticas (axe) nas telas tocadas; verificado em 375/768/1024/1440;
identidade de marca preservada (sem cor/fonte fora do brandbook).

Sem alteração de código (diagnóstico). Esta nota é o laudo de referência para priorização.
