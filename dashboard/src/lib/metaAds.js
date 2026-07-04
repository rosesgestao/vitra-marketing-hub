// Agrupamento de assets Meta em anúncios (cada anúncio = grupo dos 3 cortes 1:1/9:16/1.91:1).
// Puro e autocontido (sem React/deps). Extraído de PremiumDashboard.jsx (Onda 4) e coberto por Vitest.

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
