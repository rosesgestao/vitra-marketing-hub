import { describe, it, expect } from 'vitest'
import {
  BRAND_SCOPES,
  getBrandProfile,
  inferCampaignBrandScope,
  inferAssetBrandScope,
} from '../brandProfiles.js'
import {
  creativeTemplatesForBrand,
  selectableCreativeTemplatesForBrand,
  defaultCreativeTemplateForBrand,
  getCreativeTemplateById,
  variationRecipesForTemplate,
  referencesForTemplateVariant,
  fieldsForTemplate,
  templateFamilyFromTemplateKey,
  isApprovedTemplateKeyForBrand,
  frameForTemplateVariant,
  renderVersionForFamily,
  VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION,
} from '../creativeTemplateCatalog.js'
// Fonte real do lado da Edge (Deno) — o teste falha se divergir do mapa derivado do catalogo.
import { VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION as EDGE_RENDER_VERSION } from '../../../../supabase/functions/_shared/renderVersions.ts'

describe('catalogo de templates por marca', () => {
  it('Imobiliaria tem 13 templates aprovados e Premium tem 2', () => {
    expect(creativeTemplatesForBrand(BRAND_SCOPES.imobiliaria)).toHaveLength(13)
    expect(creativeTemplatesForBrand(BRAND_SCOPES.premium)).toHaveLength(2)
  })
  it('marca desconhecida cai no catalogo Premium', () => {
    expect(creativeTemplatesForBrand('marca-inexistente')).toHaveLength(2)
  })
})

describe('templates selecionaveis no modal (aposentados ocultos)', () => {
  it('Imobiliaria oferece os 6 templates aprovados na selecao, nesta ordem', () => {
    const selectable = selectableCreativeTemplatesForBrand(BRAND_SCOPES.imobiliaria)
    expect(selectable.map(t => t.id)).toEqual([
      'vitra-imobiliaria-hero-checklist',
      'vitra-imobiliaria-duo-selos-offer',
      'vitra-imobiliaria-vitrine-gallery',
      'vitra-imobiliaria-ficha-imovel',
      'vitra-imobiliaria-oferta-ancora',
      'vitra-imobiliaria-destino-bairro',
    ])
  })
  it('os 7 templates aposentados seguem no catalogo (resolvem) mas marcados como hidden', () => {
    const all = creativeTemplatesForBrand(BRAND_SCOPES.imobiliaria)
    const hidden = all.filter(t => t.hidden).map(t => t.id)
    expect(hidden).toEqual([
      // 4 antigos (junho/2026)
      'vitra-imobiliaria-dual-photo-offer',
      'vitra-imobiliaria-patios-gallery',
      'vitra-imobiliaria-financiamento-orla',
      'vitra-imobiliaria-menino-deus-offer',
      // 3 removidos por padrao de qualidade (junho/2026)
      'vitra-imobiliaria-hero-panel-gallery',
      'vitra-imobiliaria-lancamento',
      'vitra-imobiliaria-oportunidade-bairro',
    ])
    // ainda resolvem por id (campanhas/assets ja criados continuam funcionando, sem orfas)
    expect(getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-patios-gallery').id)
      .toBe('vitra-imobiliaria-patios-gallery')
    expect(getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-oportunidade-bairro').id)
      .toBe('vitra-imobiliaria-oportunidade-bairro')
  })
  it('o default da Imobiliaria passa a ser o primeiro selecionavel (hero-checklist)', () => {
    expect(defaultCreativeTemplateForBrand(BRAND_SCOPES.imobiliaria).id).toBe('vitra-imobiliaria-hero-checklist')
  })
})

describe('contratos de variacao (recipes)', () => {
  it('cada template aprovado da Imobiliaria tem pelo menos 5 recipes', () => {
    for (const template of creativeTemplatesForBrand(BRAND_SCOPES.imobiliaria)) {
      expect(variationRecipesForTemplate(template).length).toBeGreaterThanOrEqual(5)
    }
  })
  it('financiamento-orla foi ampliado para 9 angulos (Fase 2)', () => {
    const fin = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-financiamento-orla')
    expect(variationRecipesForTemplate(fin)).toHaveLength(9)
  })
  it('BASELINE: o template Premium nao tem recipes (contrato vazio)', () => {
    const premiumTemplate = defaultCreativeTemplateForBrand(BRAND_SCOPES.premium)
    expect(variationRecipesForTemplate(premiumTemplate)).toHaveLength(0)
  })
})

describe('regressao de copy nas receitas (Fase 2)', () => {
  it('nenhuma receita Imobiliaria usa o token bruto {headline} (deve ser {headline_only})', () => {
    for (const template of creativeTemplatesForBrand(BRAND_SCOPES.imobiliaria)) {
      for (const recipe of variationRecipesForTemplate(template)) {
        expect(recipe.headline).not.toMatch(/\{headline\}/)
      }
    }
  })
  it('nenhuma headline de receita do financiamento contem R$ (a arte descarta headlines com preco)', () => {
    const fin = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-financiamento-orla')
    for (const recipe of variationRecipesForTemplate(fin)) {
      expect(recipe.headline).not.toMatch(/R\$/)
    }
  })
})

describe('maxLength das headlines alinhado ao render (Fase 2)', () => {
  const maxLen = (template, key) => fieldsForTemplate(template).find(f => f.key === key)?.maxLength
  it('dual=36, patios=30, financiamento=34', () => {
    const dual = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-dual-photo-offer')
    const patios = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-patios-gallery')
    const fin = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-financiamento-orla')
    expect(maxLen(dual, 'suggested_headline')).toBe(36)
    expect(maxLen(patios, 'suggested_headline')).toBe(30)
    expect(maxLen(fin, 'suggested_headline')).toBe(34)
  })
  it('menino-deus ganhou maxLength nos campos que a arte trunca (suites=32, condo_argument=28)', () => {
    const menino = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-menino-deus-offer')
    expect(maxLen(menino, 'suites')).toBe(32)
    expect(maxLen(menino, 'condo_argument')).toBe(28)
  })
})

describe('references por variante (moldura)', () => {
  it('retorna 3 referencias (1 por formato) para cada variante', () => {
    const dual = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-dual-photo-offer')
    expect(referencesForTemplateVariant(dual, 'sem-moldura')).toHaveLength(3)
    expect(referencesForTemplateVariant(dual, 'com-moldura')).toHaveLength(3)
  })
  it('frame da variante: com-moldura=gold, sem-moldura=none', () => {
    const dual = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-dual-photo-offer')
    expect(frameForTemplateVariant(dual, 'com-moldura')).toBe('gold')
    expect(frameForTemplateVariant(dual, 'sem-moldura')).toBe('none')
  })
})

describe('render-version (fonte unica no catalogo — Fase 3)', () => {
  it('mapa derivado do catalogo == fonte da Edge (_shared/renderVersions.ts) — anti-divergencia', () => {
    // Importa a fonte REAL da Edge; se um lado mudar sem o outro, este teste quebra e o CI barra
    // o deploy dessincronizado (que geraria loop de pendencia de render).
    expect(VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION).toEqual(EDGE_RENDER_VERSION)
  })
  it('renderVersionForFamily retorna a versao das families versionadas e null para as demais', () => {
    expect(renderVersionForFamily('vitra-imobiliaria-financiamento-orla')).toBe('financiamento-orla-approved-v7')
    expect(renderVersionForFamily('vitra-imobiliaria-hero-checklist')).toBe('hero-checklist-ds-image-v4')
    expect(renderVersionForFamily('vitra-imobiliaria-duo-selos-offer')).toBe('duo-selos-approved-v1')
    expect(renderVersionForFamily('vitra-imobiliaria-hero-panel-gallery')).toBe('hero-panel-approved-v1')
    expect(renderVersionForFamily('vitra-imobiliaria-dual-photo-offer')).toBeNull()
    expect(renderVersionForFamily('vitra-imobiliaria-patios-gallery')).toBeNull()
    expect(renderVersionForFamily('vitra-imobiliaria-menino-deus-offer')).toBeNull()
    expect(renderVersionForFamily(undefined)).toBeNull()
  })
})

describe('template_key <-> family', () => {
  it('remove o sufixo de formato para extrair a family', () => {
    expect(templateFamilyFromTemplateKey('vitra-imobiliaria-dual-photo-offer-feed'))
      .toBe('vitra-imobiliaria-dual-photo-offer')
    expect(templateFamilyFromTemplateKey('premium-editorial-story')).toBe('premium-editorial')
    expect(templateFamilyFromTemplateKey('sem-sufixo')).toBe('sem-sufixo')
  })
  it('reconhece template aprovado da Imobiliaria e rejeita key Premium', () => {
    expect(isApprovedTemplateKeyForBrand(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-patios-gallery-wide')).toBe(true)
    expect(isApprovedTemplateKeyForBrand(BRAND_SCOPES.imobiliaria, 'premium-editorial-feed')).toBe(false)
  })
})

describe('campos do template', () => {
  it('dual-photo-offer expoe os campos comerciais essenciais', () => {
    const dual = getCreativeTemplateById(BRAND_SCOPES.imobiliaria, 'vitra-imobiliaria-dual-photo-offer')
    const keys = fieldsForTemplate(dual).map(f => f.key)
    expect(keys).toContain('product_name')
    expect(keys).toContain('price')
    expect(keys).toContain('differentials')
  })
})

describe('brandProfiles', () => {
  it('getBrandProfile resolve escopos e usa Premium como fallback', () => {
    expect(getBrandProfile(BRAND_SCOPES.premium).scope).toBe('vitra_premium')
    expect(getBrandProfile(BRAND_SCOPES.imobiliaria).scope).toBe('vitra_imobiliaria')
    expect(getBrandProfile('desconhecido').scope).toBe('vitra_premium')
  })
  it('infere brand_scope de campanha e asset, com fallback Premium', () => {
    expect(inferCampaignBrandScope({ brand_scope: 'vitra_imobiliaria' })).toBe('vitra_imobiliaria')
    expect(inferCampaignBrandScope({})).toBe('vitra_premium')
    expect(inferAssetBrandScope({ metadata: { brand_scope: 'vitra_imobiliaria' } })).toBe('vitra_imobiliaria')
  })
})
