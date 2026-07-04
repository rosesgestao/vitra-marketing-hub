# Auditoria UX/UI + Arquitetura do Dashboard (ui-ux-pro-max) — 2026-07-04

Análise READ-ONLY completa (4 investigações paralelas: navegação/IA, fluxos Conteúdo+Tráfego, estúdios/views,
design system/tokens), ancorada nas heurísticas da skill `ui-ux-pro-max` mas mantendo a identidade Vitra
(precedência de marca). Doc navegável (Artifact) publicado à parte.

## Veredito
Não falta fundação — falta **adoção** dela. Bases boas já existem (hash routing+deep-link, drawer mobile,
`focus-visible` global, kit de primitivos `src/components/ui/`, tema por marca). O problema: a view dominante
**PremiumDashboard.jsx (5.655 linhas)** foi escrita AO LADO do kit e concentra a dívida, + **5 tratamentos
divergentes de "marca ativa"** (um vaza a marca-mãe) + telas que duplicam função. Modernizar = **CONVERGIR**.

## P0 (críticos — marca/funcionamento)
- **Estúdio de Criativos fixa Imobiliária** (item de menu neutro + logo fixo `EstudioCriativos.jsx:13`,
  `App.jsx:63-123`) → no contexto Premium gera com a marca-mãe. Fere a hard rule de separação.
- **Kanban + Calendário misturam as 2 marcas** sem filtro/badge (`Kanban.jsx:30`, `Calendario.jsx:31`) →
  risco de publicar a marca errada.

## P1 (principais)
- Fluxo Nova Campanha: 25–40 interações; modal-monólito 1.100+ linhas sem etapas; validação só no submit
  sem foco no 1º erro (`PremiumDashboard.jsx:4451-5565,4813`).
- **Contraste WCAG reprova**: `text-white/40-50` sobre navy < 4.5:1 (190 usos; `index.css:202,209`).
- **Erros de query engolidos** (Calendário/Pipeline/Agentes) → "vazio" enganoso quando o back cai.
- Design system subutilizado: `Modal`/`FormField`/`ErrorAlert` existem, mas 12 modais e 34 inputs à mão.
- Perda de trabalho: sem confirm ao fechar modal com IA, sem autosave; `window.prompt` p/ publicar.
- Métricas sem gráfico e sem `<table>` semântica.

## P2
Telas-fantasma no menu (Pipeline≡Agentes), rota morta `#/pipeline`, 17 emojis-ícone, reduced-motion parcial,
tipo/z-index/sombra não tokenizados (311 `text-[Npx]`, 152 hex crus), constantes copy-paste (Kanban≡Calendário).

## Números da dívida (grep)
5.655 linhas em 1 arquivo · 311 `text-[Npx]` (222 nele) · 152 hex crus (#C4942A 40×) · 190 `text-white/≤50` ·
34 `<label>` sem `htmlFor` · 12 overlays fora do `<Modal>` · 0 componente `<Button>` React · 5 formas de "marca ativa".

## Roadmap (ondas)
1. **P0+quick wins** (dias, sem dep.): marca em Criativos+Kanban+Calendário; `ErrorAlert` nos 3 fetches;
   `aria-current`+foco no erro; recalibrar token "muted" (contraste); remover rota/itens fantasma.
2. **Tokens & primitivos** (1-2 sem): tipo/cor-estado/z/sombra → `<Button>/<Card>/<Input>/<Select>` + adoção do kit.
3. **Fluxos** (2-3 sem): wizard Nova Campanha; colapsar "Avançado"; CTA por estado; autosave/confirm; modal in-app.
4. **Convergência** (3-5 sem): split do PremiumDashboard; `adReadiness()`/`useAsyncAction` únicos; unificar Produção
   de Conteúdo (toggle de visão); hub de criação visual; Métricas com gráfico.

## Impacto back-end
Quase tudo é front. Pontos: métrica no card (join posts×metrics), gráfico (série já em `premium_metrics`),
telas-fantasma leem tabelas inexistentes (decidir criar ou remover). Edges de IA/render: nenhum impacto.

**Execução:** Onda 1 iniciada nesta sessão (P0 de marca + quick wins). [[deploy-hostinger-vitrapremium]]
[[validacao-criativo-arquitetura]]
