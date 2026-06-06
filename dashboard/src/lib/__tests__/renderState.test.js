import { describe, it, expect } from 'vitest'
import {
  isVitraImobiliariaApprovedTemplateAsset,
  needsVitraImobiliariaApprovedTemplateRender,
} from '../premiumData.js'

// Baseline da deteccao de pendencia de render dos templates aprovados da
// Imobiliaria. Documenta que HOJE so 'financiamento-orla' tem render-version
// (cache-busting), problema enderecado na Fase 3.

describe('isVitraImobiliariaApprovedTemplateAsset', () => {
  it('reconhece asset meta_ads de template aprovado da Imobiliaria', () => {
    expect(isVitraImobiliariaApprovedTemplateAsset({
      channel: 'meta_ads',
      template_key: 'vitra-imobiliaria-dual-photo-offer-feed',
    })).toBe(true)
  })
  it('rejeita asset Premium e asset fora de meta_ads', () => {
    expect(isVitraImobiliariaApprovedTemplateAsset({
      channel: 'meta_ads',
      template_key: 'premium-editorial-feed',
    })).toBe(false)
    expect(isVitraImobiliariaApprovedTemplateAsset({
      channel: 'carousel',
      template_key: 'vitra-imobiliaria-dual-photo-offer-feed',
    })).toBe(false)
  })
})

describe('needsVitraImobiliariaApprovedTemplateRender', () => {
  it('asset Premium nunca precisa deste render (mesmo queued)', () => {
    expect(needsVitraImobiliariaApprovedTemplateRender({
      channel: 'meta_ads',
      template_key: 'premium-editorial-feed',
      status: 'queued',
    })).toBe(false)
  })

  it('asset aprovado da Imobiliaria em queued precisa renderizar', () => {
    expect(needsVitraImobiliariaApprovedTemplateRender({
      channel: 'meta_ads',
      template_key: 'vitra-imobiliaria-dual-photo-offer-feed',
      status: 'queued',
      metadata: {},
    })).toBe(true)
  })

  it('dual-photo ja gerado e consistente NAO precisa re-render (sem render-version)', () => {
    expect(needsVitraImobiliariaApprovedTemplateRender({
      channel: 'meta_ads',
      template_key: 'vitra-imobiliaria-dual-photo-offer-feed',
      status: 'generated',
      public_url: 'https://x/y.png',
      metadata: {
        visual_template: { family: 'vitra-imobiliaria-dual-photo-offer' },
        rendered_template_family: 'vitra-imobiliaria-dual-photo-offer',
      },
    })).toBe(false)
  })

  it('BASELINE: financiamento-orla com versao antiga PRECISA re-render (so esta family tem version)', () => {
    expect(needsVitraImobiliariaApprovedTemplateRender({
      channel: 'meta_ads',
      template_key: 'vitra-imobiliaria-financiamento-orla-feed',
      status: 'generated',
      public_url: 'https://x/y.png',
      metadata: {
        visual_template: { family: 'vitra-imobiliaria-financiamento-orla' },
        rendered_template_family: 'vitra-imobiliaria-financiamento-orla',
        rendered_template_version: 'versao-antiga',
      },
    })).toBe(true)
  })
})
