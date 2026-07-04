import { describe, it, expect } from 'vitest'
import { AD_GROUP_LABEL, groupMetaAds, groupMetaAdsByCampaign } from '../metaAds.js'

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
