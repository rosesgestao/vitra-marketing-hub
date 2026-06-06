# Changelog — Ferramenta Operacional Vitra Premium

## Sessao 2026-06-06 — Limpeza de honestidade da UI (sem mudanca de comportamento)

Pass de baixo risco que alinha a interface ao que esta de fato implementado. Nenhuma
alteracao de schema, fila de render, RLS ou contrato de Edge Function.

### supabase/functions/render-asset
- index.ts: removido o no que imprimia o rotulo interno do template (MODEL_LABEL) no
  canto da peca final — era texto de debug baked no PNG entregue. A constante MODEL_LABEL
  permanece (ainda usada por modelKey); o rastreio interno continua em metadata.visual_template.

### dashboard/ (React)
- src/views/PremiumDashboard.jsx: botoes "Aprovar" (AssetCard, CarouselCard, MetaAdCard)
  migrados do verde esmeralda fora de paleta (rgba(29,158,117)/#6ee7b7) para a escala gold
  do brandbook (#C4942A solido + texto #0A0A0A). Logica de estados preservada.
- src/views/PremiumDashboard.jsx: StatTile de Leads com sub "Ads Insights" (decorativo)
  trocado por "entrada manual", refletindo que as metricas hoje sao digitadas a mao.
- src/components/PremiumShell.jsx: novo componente reutilizavel RoadmapNotice.
- src/views/Agentes.jsx e Pipeline.jsx: banner RoadmapNotice deixando explicito que o squad
  de agentes / pipeline e visao de roadmap, ainda nao implementada (consultam tabelas fora
  do schema operacional Premium). Comportamento e queries inalterados.

### docs/
- escopo-oficial.md: item 6 (incompatibilidade de schema de metricas) reconciliado com o
  codigo — a incompatibilidade nao existe no repositorio; item mantido so como historico.

## Sessao 2026-06-01 — Pipeline de criativos (Fase 3) + UI de Producao

### dashboard/ (React)
- index.html: corrigida tag <link> do favicon truncada que quebrava o build.
- src/lib/premiumData.js: helpers updateAsset/approveAsset/approveAssets/requeueAsset/
  saveAssetEdit/renderCampaignAssets; CAROUSEL_LIMITS (IG 2-20, Meta Ads 2-10); phaseForBlueprint
  e gravacao de campaign_phase no metadata.
- src/views/PremiumDashboard.jsx: aba Producao virou vitrine de criativos (preview, filtros,
  badges, contadores, progresso, Aprovar/Editar, carrossel agrupado com pager+validacao,
  agrupamento por fase, trigger automatico de render ao criar campanha).

### supabase/
- functions/render-asset: Edge Function satori->resvg (post/story/carrossel, logo aprovado,
  paleta 100% brandbook) que sobe ao bucket cards e atualiza assets/jobs.
- migration-cards-storage-bucket.sql / migration-render-queue-cron.sql.

### render-worker/ (novo)
- Worker Node+Puppeteer dedicado para render full-res, consumindo a mesma fila.
