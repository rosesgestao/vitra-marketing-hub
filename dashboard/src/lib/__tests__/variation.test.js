import { describe, it, expect } from 'vitest'
import { BRAND_SCOPES, getBrandProfile } from '../brandProfiles.js'
import {
  clampNumber,
  metaCreativeVariationCount,
  metaCreativeConceptsForBrand,
  selectedMetaCreativeConcepts,
  selectedTemplateVariationConcepts,
  buildMetaAssetBlueprints,
} from '../premiumData.js'

// Testes de CARACTERIZACAO da Fase 0: documentam o comportamento ATUAL como
// baseline (inclusive bugs conhecidos, marcados com BUG/baseline). Qualquer
// correcao futura deve quebrar o teste DE PROPOSITO e ser revisada.

const premium = getBrandProfile(BRAND_SCOPES.premium)
const imobiliaria = getBrandProfile(BRAND_SCOPES.imobiliaria)

describe('clampNumber', () => {
  it('mantem valor dentro do intervalo', () => {
    expect(clampNumber(8, 3, 12, 8)).toBe(8)
  })
  it('limita acima do maximo e abaixo do minimo', () => {
    expect(clampNumber(100, 3, 12, 8)).toBe(12)
    expect(clampNumber(1, 3, 12, 8)).toBe(3)
  })
  it('usa fallback para valor nao numerico e arredonda', () => {
    expect(clampNumber('abc', 3, 12, 8)).toBe(8)
    expect(clampNumber(5.6, 3, 12, 8)).toBe(6)
  })
})

describe('metaCreativeVariationCount', () => {
  it('default e 8 quando nao informado', () => {
    expect(metaCreativeVariationCount({})).toBe(8)
  })
  it('respeita o intervalo 3..12 (logica de teste da Meta)', () => {
    expect(metaCreativeVariationCount({ creative_variations: 12 })).toBe(12)
    expect(metaCreativeVariationCount({ creative_variations: 100 })).toBe(12)
    expect(metaCreativeVariationCount({ creative_variations: 2 })).toBe(3)
    expect(metaCreativeVariationCount({ creative_variations: '10' })).toBe(10)
  })
})

describe('metaCreativeConceptsForBrand', () => {
  it('Premium tem 12 conceitos genericos por angulo', () => {
    const concepts = metaCreativeConceptsForBrand(premium)
    expect(concepts).toHaveLength(12)
    expect(concepts.every(c => typeof c.key === 'string' && c.angle)).toBe(true)
  })
  it('Imobiliaria usa um conjunto de conceitos distinto do Premium', () => {
    const concepts = metaCreativeConceptsForBrand(imobiliaria)
    expect(Array.isArray(concepts)).toBe(true)
    expect(concepts[0].key).not.toBe(metaCreativeConceptsForBrand(premium)[0].key)
  })
})

describe('selectedTemplateVariationConcepts (contrato por template)', () => {
  it('BASELINE: Premium NUNCA usa contrato de template (retorna [])', () => {
    // Bug conhecido (Fase 3): o gate brandScope===imobiliaria exclui o Premium.
    expect(selectedTemplateVariationConcepts({ creative_variations: 8 }, premium)).toEqual([])
  })

  it('Imobiliaria com template default gera N conceitos a partir das recipes', () => {
    const concepts = selectedTemplateVariationConcepts({ creative_variations: 8 }, imobiliaria)
    expect(concepts).toHaveLength(8)
    expect(concepts[0].template_recipe).toBeTruthy()
    expect(concepts[0].variation_index).toBe(0)
  })

  it('BASELINE: com 8 variacoes e 5 recipes, a copy se REPETE (recipes[index % 5])', () => {
    // Bug conhecido (Fase 2): variacao 6 reusa a recipe da variacao 1.
    const concepts = selectedTemplateVariationConcepts({ creative_variations: 8 }, imobiliaria)
    expect(concepts[5].template_recipe.id).toBe(concepts[0].template_recipe.id)
    expect(concepts[6].template_recipe.id).toBe(concepts[1].template_recipe.id)
  })
})

describe('selectedMetaCreativeConcepts (selecao efetiva)', () => {
  it('Premium cai no fallback de conceitos genericos, cortado ao count', () => {
    const concepts = selectedMetaCreativeConcepts({ creative_variations: 8 }, premium)
    expect(concepts).toHaveLength(8)
    expect(concepts[0].template_recipe).toBeUndefined()
  })
  it('Imobiliaria usa os conceitos de template (com recipe)', () => {
    const concepts = selectedMetaCreativeConcepts({ creative_variations: 5 }, imobiliaria)
    expect(concepts).toHaveLength(5)
    expect(concepts[0].template_recipe).toBeTruthy()
  })
})

describe('buildMetaAssetBlueprints (N variacoes x 3 formatos)', () => {
  it('gera exatamente count x 3 assets, todos no canal meta_ads', () => {
    const blueprints = buildMetaAssetBlueprints({ creative_variations: 8 }, premium)
    expect(blueprints).toHaveLength(24)
    expect(blueprints.every(b => b[2] === 'meta_ads')).toBe(true)
  })

  it('cada variacao sai nos 3 formatos obrigatorios 1:1 / 9:16 / 1.91:1', () => {
    const blueprints = buildMetaAssetBlueprints({ creative_variations: 3 }, premium)
    expect(blueprints).toHaveLength(9)
    const aspectRatios = blueprints.map(b => b[5])
    expect(aspectRatios.filter(ar => ar === '1:1')).toHaveLength(3)
    expect(aspectRatios.filter(ar => ar === '9:16')).toHaveLength(3)
    expect(aspectRatios.filter(ar => ar === '1.91:1')).toHaveLength(3)
  })

  it('Imobiliaria usa a family do template aprovado como base do template_key', () => {
    const blueprints = buildMetaAssetBlueprints({ creative_variations: 3 }, imobiliaria)
    const suffixes = ['-feed', '-story', '-wide']
    expect(blueprints.every(b => suffixes.some(s => String(b[6]).endsWith(s)))).toBe(true)
    expect(blueprints.every(b => String(b[6]).startsWith('vitra-imobiliaria-'))).toBe(true)
  })
})
