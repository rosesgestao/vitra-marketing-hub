# Changelog — Ferramenta Operacional Vitra Premium

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
