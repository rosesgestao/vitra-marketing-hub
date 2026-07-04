// Agrupamento e empacotamento de assets Meta em anúncios (cada anúncio = grupo dos 3 cortes 1:1/9:16/1.91:1).
// Puro (sem React/DOM). Extraído de PremiumDashboard.jsx (Onda 4) e coberto por Vitest.

import { AD_FORMAT_ORDER, evaluateMetaAdReadiness } from './metaAdReadiness.js'

// Posicionamentos Meta Ads por formato/aspect ratio (rótulo + dimensão exibida).
export const META_PLACEMENTS = {
  '1:1': { label: 'Quadrado', sub: 'Feed', dim: '1080×1080' },
  '9:16': { label: 'Vertical', sub: 'Stories / Reels', dim: '1080×1920' },
  '1.91:1': { label: 'Horizontal', sub: 'Recomendado', dim: '1200×628' },
}

// Rótulo legível por grupo de anúncio (conceito do funil). Fallback: ad_label do asset, senão o key sem "meta-".
export const AD_GROUP_LABEL = {
  'meta-awareness': 'Awareness',
  'meta-leads': 'Leads',
  'meta-retarget': 'Retargeting',
}

// Agrupa os cortes meta_ads por grupo de anúncio (metadata.ad_group). Ignora canais não-meta_ads.
export function groupMetaAds(assets) {
  const map = new Map()
  for (const a of assets) {
    if (a.channel !== 'meta_ads') continue
    const key = a.metadata?.ad_group || 'meta'
    const label = a.metadata?.ad_label || AD_GROUP_LABEL[key] || key.replace(/^meta-/, '')
    if (!map.has(key)) map.set(key, { key, label, assets: [] })
    map.get(key).assets.push(a)
  }
  return [...map.values()]
}

// Como groupMetaAds, mas a chave inclui a campanha — para listar anúncios de várias campanhas sem colisão.
export function groupMetaAdsByCampaign(assets) {
  const map = new Map()
  for (const asset of assets) {
    if (asset.channel !== 'meta_ads') continue
    const adKey = asset.metadata?.ad_group || 'meta'
    const campaignKey = asset.campaign_id || 'sem-campanha'
    const key = `${campaignKey}:${adKey}`
    const label = asset.metadata?.ad_label || AD_GROUP_LABEL[adKey] || adKey.replace(/^meta-/, '')
    if (!map.has(key)) {
      map.set(key, {
        key,
        campaign_id: asset.campaign_id,
        label,
        assets: [],
      })
    }
    map.get(key).assets.push(asset)
  }
  return [...map.values()]
}

// Contrato do pacote de exportação Meta (JSON que o operador baixa e sobe/valida). PURO — o download
// (blob/DOM) fica no view. `brandProfile` é passado pelo chamador. Cobre os campos que a Meta consome
// por anúncio (nome, texto principal, título, descrição, CTA, UTM) + os placements por corte.
export function buildMetaAdsPackagePayload(campaign, ads, brandProfile) {
  return {
    export_type: brandProfile.metaPackageType,
    generated_at: new Date().toISOString(),
    brand_scope: brandProfile.scope,
    brand_name: brandProfile.name,
    campaign: {
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      product_name: campaign.product_name,
      objective: campaign.campaign_objective,
      audience: campaign.target_audience,
      period: {
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      },
      source_intake: campaign.brief?.source_intake || null,
      qa_policy: campaign.brief?.qa_policy || null,
      creative_validation: campaign.brief?.creative_validation || null,
    },
    human_gate: {
      publish_policy: 'draft_or_manual_upload_first',
      requires_budget_authorization: true,
      requires_final_creative_approval: true,
    },
    ads: ads.map(ad => {
      const ordered = [...ad.assets].sort(
        (a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio),
      )
      const first = ordered[0] || {}
      const meta = first.metadata?.meta_ad || {}
      return {
        group_key: ad.key,
        group_label: ad.label,
        visual_template: first.metadata?.visual_template || null,
        readiness: evaluateMetaAdReadiness(ad),
        meta_fields: {
          ad_name: meta.nome || `${campaign.name} | ${ad.label}`,
          primary_text: meta.texto_principal || first.copy || '',
          headline: first.headline || '',
          description: meta.descricao || '',
          cta: first.cta || '',
          url_params: meta.url_params || '',
        },
        placements: ordered.map(asset => ({
          asset_id: asset.id,
          format: asset.aspect_ratio,
          placement: META_PLACEMENTS[asset.aspect_ratio] || null,
          status: asset.status,
          public_url: asset.public_url,
          storage_path: asset.storage_path,
          template_key: asset.template_key,
          visual_template: asset.metadata?.visual_template || null,
        })),
      }
    }),
  }
}
