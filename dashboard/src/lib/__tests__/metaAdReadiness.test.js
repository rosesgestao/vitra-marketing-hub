import { describe, it, expect } from 'vitest'
import {
  AD_FORMAT_ORDER,
  metaCopyChecks,
  assetRenderedApproved,
  assetPublishReady,
  evaluateMetaAdReadiness,
} from '../metaAdReadiness.js'

// Fixtures Premium (brand_scope=vitra_premium) para que needsVitraImobiliariaApprovedTemplateRender
// retorne false e a lógica de prontidão fique isolada. Um corte "pronto" por padrão; sobrescreva campos.
const corte = (over = {}) => {
  const { meta_ad, metadata, ...rest } = over
  return {
    aspect_ratio: '1:1',
    status: 'approved',
    public_url: 'https://cdn/x.png',
    headline: 'Título forte do anúncio',
    cta: 'Saiba mais',
    source_image_url: 'https://cdn/src.jpg',
    ...rest,
    metadata: {
      brand_scope: 'vitra_premium',
      lint: { ok: true },
      source_intake: { landing_url: 'https://site.com/imovel' },
      ...metadata,
      meta_ad: { texto_principal: 'Corpo do anúncio com benefícios.', descricao: '3 dorm · 2 vagas · lazer', ...(meta_ad || metadata?.meta_ad) },
    },
  }
}

// Anúncio válido: os 3 cortes Meta, todos aprovados/renderizados, lint ok, textos no primeiro.
const adValido = () => ({
  key: 'ad-1',
  assets: AD_FORMAT_ORDER.map(ar => corte({ aspect_ratio: ar })),
})

describe('metaCopyChecks', () => {
  it('todos os campos presentes → texts e description true', () => {
    expect(metaCopyChecks(corte())).toEqual({ texts: true, description: true })
  })
  it('sem headline → texts false', () => {
    expect(metaCopyChecks(corte({ headline: '' })).texts).toBe(false)
  })
  it('sem cta → texts false', () => {
    expect(metaCopyChecks(corte({ cta: '' })).texts).toBe(false)
  })
  it('texto_principal ausente mas copy presente → texts true (fallback)', () => {
    const a = corte({ copy: 'Legenda alternativa', meta_ad: { texto_principal: '' } })
    expect(metaCopyChecks(a).texts).toBe(true)
  })
  it('descricao só com espaços → description false', () => {
    expect(metaCopyChecks(corte({ meta_ad: { descricao: '   ' } })).description).toBe(false)
  })
  it('asset nulo não quebra', () => {
    expect(metaCopyChecks(null)).toEqual({ texts: false, description: false })
  })
})

describe('assetRenderedApproved', () => {
  it('approved + public_url → true', () => {
    expect(assetRenderedApproved(corte({ status: 'approved' }))).toBe(true)
  })
  it('published + public_url → true', () => {
    expect(assetRenderedApproved(corte({ status: 'published' }))).toBe(true)
  })
  it('generated (não aprovado) → false', () => {
    expect(assetRenderedApproved(corte({ status: 'generated' }))).toBe(false)
  })
  it('sem public_url → false', () => {
    expect(assetRenderedApproved(corte({ public_url: '' }))).toBe(false)
  })
})

describe('assetPublishReady (contrato do build_draft)', () => {
  it('aprovado + renderizado + textos completos → true', () => {
    expect(assetPublishReady(corte())).toBe(true)
  })
  it('REGRESSÃO da descrição: aprovado e renderizado, mas sem descricao → false', () => {
    // Foi exatamente o bug que travava "Criar rascunho na Meta".
    expect(assetPublishReady(corte({ meta_ad: { descricao: '' } }))).toBe(false)
  })
  it('só gerado (sem aprovação humana) → false mesmo com copy completa', () => {
    expect(assetPublishReady(corte({ status: 'generated' }))).toBe(false)
  })
  it('sem CTA → false', () => {
    expect(assetPublishReady(corte({ cta: '' }))).toBe(false)
  })
})

describe('evaluateMetaAdReadiness', () => {
  it('anúncio completo → ok e qaReady true, todos os checks ok', () => {
    const r = evaluateMetaAdReadiness(adValido())
    expect(r.ok).toBe(true)
    expect(r.qaReady).toBe(true)
    expect(r.checks.every(c => c.ok)).toBe(true)
  })
  it('falta 1 formato → check formats false e ok false', () => {
    const ad = { key: 'a', assets: [corte({ aspect_ratio: '1:1' }), corte({ aspect_ratio: '9:16' })] }
    const r = evaluateMetaAdReadiness(ad)
    expect(r.checks.find(c => c.id === 'formats').ok).toBe(false)
    expect(r.ok).toBe(false)
  })
  it('um corte com lint reprovado → design_lint false', () => {
    const ad = adValido()
    ad.assets[1].metadata.lint = { ok: false }
    expect(evaluateMetaAdReadiness(ad).checks.find(c => c.id === 'design_lint').ok).toBe(false)
  })
  it('cortes só gerados (não aprovados) → approval false, mas qaReady true', () => {
    const ad = { key: 'a', assets: AD_FORMAT_ORDER.map(ar => corte({ aspect_ratio: ar, status: 'generated' })) }
    const r = evaluateMetaAdReadiness(ad)
    expect(r.checks.find(c => c.id === 'approval').ok).toBe(false)
    expect(r.qaReady).toBe(true)
    expect(r.ok).toBe(false)
  })
  it('lint ausente (metadata.lint indefinido) não reprova', () => {
    const ad = { key: 'a', assets: AD_FORMAT_ORDER.map(ar => corte({ aspect_ratio: ar, metadata: { lint: undefined } })) }
    expect(evaluateMetaAdReadiness(ad).checks.find(c => c.id === 'design_lint').ok).toBe(true)
  })
})

// A GUARDA que motivou a extração: o QA do card e o gate de publicação usam a MESMA exigência de
// textos/descrição. Se um dia divergirem, este teste quebra.
describe('anti-divergência QA × gate de publicação', () => {
  it('sem descrição: o check "description" do QA e o assetPublishReady concordam (ambos falham)', () => {
    const semDesc = corte({ meta_ad: { descricao: '' } })
    const ad = { key: 'a', assets: AD_FORMAT_ORDER.map(ar => ({ ...semDesc, aspect_ratio: ar })) }
    const qaDescription = evaluateMetaAdReadiness(ad).checks.find(c => c.id === 'description').ok
    expect(qaDescription).toBe(false)
    expect(assetPublishReady(semDesc)).toBe(false)
    expect(qaDescription).toBe(assetPublishReady(semDesc) ? true : false)
  })
  it('textos completos: o check "texts" do QA reflete metaCopyChecks do primeiro corte', () => {
    const ad = adValido()
    const first = [...ad.assets].sort((a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio))[0]
    const qaTexts = evaluateMetaAdReadiness(ad).checks.find(c => c.id === 'texts').ok
    expect(qaTexts).toBe(metaCopyChecks(first).texts)
  })
})
