import { describe, it, expect } from 'vitest'
import { AD_GROUP_LABEL, groupMetaAds, groupMetaAdsByCampaign, META_PLACEMENTS, buildMetaAdsPackagePayload } from '../metaAds.js'

const asset = (over = {}) => ({ channel: 'meta_ads', campaign_id: 'c1', metadata: {}, ...over })

describe('groupMetaAds', () => {
  it('agrupa por metadata.ad_group', () => {
    const groups = groupMetaAds([
      asset({ metadata: { ad_group: 'meta-leads' } }),
      asset({ metadata: { ad_group: 'meta-leads' } }),
      asset({ metadata: { ad_group: 'meta-awareness' } }),
    ])
    expect(groups).toHaveLength(2)
    expect(groups.find(g => g.key === 'meta-leads').assets).toHaveLength(2)
  })
  it('ignora assets de outros canais', () => {
    const groups = groupMetaAds([
      asset({ metadata: { ad_group: 'meta-leads' } }),
      asset({ channel: 'whatsapp', metadata: { ad_group: 'meta-leads' } }),
    ])
    expect(groups[0].assets).toHaveLength(1)
  })
  it('label vem do AD_GROUP_LABEL quando não há ad_label', () => {
    const [g] = groupMetaAds([asset({ metadata: { ad_group: 'meta-retarget' } })])
    expect(g.label).toBe(AD_GROUP_LABEL['meta-retarget'])
    expect(g.label).toBe('Retargeting')
  })
  it('ad_label do asset tem prioridade sobre o mapa', () => {
    const [g] = groupMetaAds([asset({ metadata: { ad_group: 'meta-leads', ad_label: 'Custom' } })])
    expect(g.label).toBe('Custom')
  })
  it('sem ad_group → key "meta", label sem prefixo', () => {
    const [g] = groupMetaAds([asset({ metadata: {} })])
    expect(g.key).toBe('meta')
    expect(g.label).toBe('meta')
  })
  it('key desconhecido → fallback tira o prefixo meta-', () => {
    const [g] = groupMetaAds([asset({ metadata: { ad_group: 'meta-custom' } })])
    expect(g.label).toBe('custom')
  })
  it('lista vazia → []', () => {
    expect(groupMetaAds([])).toEqual([])
  })
})

describe('groupMetaAdsByCampaign', () => {
  it('mesma chave de anúncio em campanhas diferentes NÃO colide', () => {
    const groups = groupMetaAdsByCampaign([
      asset({ campaign_id: 'c1', metadata: { ad_group: 'meta-leads' } }),
      asset({ campaign_id: 'c2', metadata: { ad_group: 'meta-leads' } }),
    ])
    expect(groups).toHaveLength(2)
    expect(groups.map(g => g.key).sort()).toEqual(['c1:meta-leads', 'c2:meta-leads'])
  })
  it('preserva campaign_id no grupo', () => {
    const [g] = groupMetaAdsByCampaign([asset({ campaign_id: 'c9', metadata: { ad_group: 'meta-leads' } })])
    expect(g.campaign_id).toBe('c9')
  })
  it('sem campaign_id → prefixo "sem-campanha"', () => {
    const [g] = groupMetaAdsByCampaign([asset({ campaign_id: null, metadata: { ad_group: 'meta-leads' } })])
    expect(g.key).toBe('sem-campanha:meta-leads')
  })
  it('ignora canais não-meta_ads', () => {
    const groups = groupMetaAdsByCampaign([asset({ channel: 'email', metadata: { ad_group: 'meta-leads' } })])
    expect(groups).toEqual([])
  })
})

describe('buildMetaAdsPackagePayload (contrato de exportação)', () => {
  const brandProfile = { metaPackageType: 'meta_ads_premium', scope: 'vitra_premium', name: 'Vitra Premium' }
  const campaign = {
    id: 'c1', name: 'Campanha X', slug: 'campanha-x', product_name: 'Apto', campaign_objective: 'leads',
    target_audience: 'compradores', start_date: '2026-01-01', end_date: '2026-02-01',
    brief: { source_intake: { url: 'https://x' } },
  }
  const corte = (over = {}) => ({
    id: 'a1', aspect_ratio: '1:1', status: 'approved', public_url: 'https://cdn/a.png', storage_path: 'p/a.png',
    template_key: 'tpl', headline: 'Título forte', cta: 'Saiba mais',
    metadata: { brand_scope: 'vitra_premium', visual_template: { key: 'v1' }, meta_ad: { texto_principal: 'Corpo', descricao: 'desc reforço', url_params: 'utm=1', nome: '' } },
    ...over,
  })
  const adOf = (assets, over = {}) => ({ key: 'meta-leads', label: 'Leads', assets, ...over })

  it('cabeçalho vem do brandProfile e da campanha', () => {
    const p = buildMetaAdsPackagePayload(campaign, [adOf([corte()])], brandProfile)
    expect(p.export_type).toBe('meta_ads_premium')
    expect(p.brand_scope).toBe('vitra_premium')
    expect(p.campaign.slug).toBe('campanha-x')
    expect(p.human_gate.requires_budget_authorization).toBe(true)
  })
  it('ad_name cai no fallback "Campanha | Grupo" quando meta.nome está vazio', () => {
    const p = buildMetaAdsPackagePayload(campaign, [adOf([corte()])], brandProfile)
    expect(p.ads[0].meta_fields.ad_name).toBe('Campanha X | Leads')
  })
  it('ad_name usa meta.nome quando presente', () => {
    const c = corte({ metadata: { meta_ad: { nome: 'Meu anúncio', texto_principal: 'Corpo' } } })
    const p = buildMetaAdsPackagePayload(campaign, [adOf([c])], brandProfile)
    expect(p.ads[0].meta_fields.ad_name).toBe('Meu anúncio')
  })
  it('primary_text cai em copy quando texto_principal está vazio', () => {
    const c = corte({ copy: 'Legenda alternativa', metadata: { meta_ad: { texto_principal: '' } } })
    const p = buildMetaAdsPackagePayload(campaign, [adOf([c])], brandProfile)
    expect(p.ads[0].meta_fields.primary_text).toBe('Legenda alternativa')
  })
  it('placements mapeiam asset_id, format e o placement do META_PLACEMENTS', () => {
    const p = buildMetaAdsPackagePayload(campaign, [adOf([corte()])], brandProfile)
    const pl = p.ads[0].placements[0]
    expect(pl.asset_id).toBe('a1')
    expect(pl.format).toBe('1:1')
    expect(pl.placement).toEqual(META_PLACEMENTS['1:1'])
    expect(pl.public_url).toBe('https://cdn/a.png')
  })
  it('inclui readiness por anúncio', () => {
    const p = buildMetaAdsPackagePayload(campaign, [adOf([corte()])], brandProfile)
    expect(p.ads[0].readiness).toHaveProperty('checks')
  })
})
