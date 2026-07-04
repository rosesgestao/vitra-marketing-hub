// Prontidão de publicação de anúncios Meta — FONTE ÚNICA (extraído de PremiumDashboard.jsx, Onda 4).
//
// Antes existiam duas listas de verificação paralelas, mantidas à mão: o QA do card
// (evaluateMetaAdReadiness) e o gate de publicação (publishableAssets). Já divergiram uma vez
// — o QA não checava `descricao` e o gate sim, então o card dizia "pronto" e o "Criar rascunho"
// travava. Estes predicados são a fonte única: ambos os consumidores passam por aqui, então os
// campos exigidos para publicar não podem mais divergir. Puro (sem React) e coberto por Vitest.

import { needsVitraImobiliariaApprovedTemplateRender } from './premiumData.js'

// Ordem canônica dos 3 cortes Meta (1:1 feed, 9:16 story/reels, 1.91:1 wide).
export const AD_FORMAT_ORDER = ['1:1', '9:16', '1.91:1']

// Textos Meta de um corte, granular (para o QA mostrar QUAL falta).
export function metaCopyChecks(asset) {
  const meta = asset?.metadata?.meta_ad || {}
  return {
    texts: Boolean(asset?.headline) && Boolean(meta.texto_principal || asset?.copy) && Boolean(asset?.cta),
    description: Boolean((meta.descricao || '').trim()),
  }
}

// Corte renderizado E aprovado (contrato de status do build_draft: publica APROVADO + com public_url).
export function assetRenderedApproved(asset) {
  return Boolean(asset?.public_url) &&
    ['approved', 'published'].includes(asset?.status) &&
    !needsVitraImobiliariaApprovedTemplateRender(asset)
}

// Prontidão de publicação de UM corte = status + textos completos. O gate de publicação conta
// quantos cortes satisfazem ISTO; é exatamente o que o edge publish-meta-ads aceita.
export function assetPublishReady(asset) {
  const copy = metaCopyChecks(asset)
  return assetRenderedApproved(asset) && copy.texts && copy.description
}

// QA operacional por anúncio (grupo dos 3 cortes). `ok` = exportável; `qaReady` = pronto para revisão
// (tudo menos a aprovação humana). É mais estrito que assetPublishReady: também exige os 3 cortes,
// foto de origem, lint e destino/UTM.
export function evaluateMetaAdReadiness(ad) {
  const ordered = [...(ad.assets || [])].sort(
    (a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio),
  )
  const first = ordered[0] || {}
  const meta = first.metadata?.meta_ad || {}
  const formats = new Set(ordered.map(asset => asset.aspect_ratio))
  const hasPropertyImage = ordered.every(asset => Boolean(asset.source_image_url))
  const rendered = ordered.every(asset => (
    Boolean(asset.public_url) &&
    ['generated', 'approved'].includes(asset.status) &&
    !needsVitraImobiliariaApprovedTemplateRender(asset)
  ))
  const approved = ordered.every(asset => asset.status === 'approved' && !needsVitraImobiliariaApprovedTemplateRender(asset))
  const hasDestination = Boolean(meta.url_params || first.metadata?.source_intake?.landing_url || first.metadata?.source_intake?.whatsapp_url)
  // Validação visual objetiva (Creative Lint): um corte com lint reprovado não pode ser publicado.
  // Cortes de templates sem lint (metadata.lint ausente) passam — só reprova quando há lint e ele falhou.
  const lintOk = ordered.every(asset => asset.metadata?.lint?.ok !== false)
  // Textos/descrição pela FONTE ÚNICA (metaCopyChecks) — mesmo predicado do gate de publicação.
  const copy = metaCopyChecks(first)
  const checks = [
    { id: 'formats', label: '3 cortes Meta', ok: AD_FORMAT_ORDER.every(format => formats.has(format)) },
    { id: 'property_image', label: 'Foto do imovel', ok: hasPropertyImage },
    { id: 'render', label: 'Imagens renderizadas', ok: rendered },
    { id: 'design_lint', label: 'Validação visual (lint)', ok: lintOk },
    { id: 'texts', label: 'Textos + CTA', ok: copy.texts },
    { id: 'description', label: 'Descrição', ok: copy.description },
    { id: 'destination', label: 'Destino / UTM', ok: hasDestination },
    { id: 'approval', label: 'Aprovacao humana', ok: approved },
  ]

  return {
    ok: checks.every(check => check.ok),
    qaReady: checks.filter(check => check.id !== 'approval').every(check => check.ok),
    checks,
  }
}
