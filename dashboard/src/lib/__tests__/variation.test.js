import { describe, it, expect } from 'vitest'
import { BRAND_SCOPES, getBrandProfile } from '../brandProfiles.js'
import {
  clampNumber,
  metaCreativeVariationCount,
  metaCreativeConceptsForBrand,
  selectedMetaCreativeConcepts,
  selectedTemplateVariationConcepts,
  buildMetaAssetBlueprints,
  distinctConceptCapacity,
  variationTokens,
  renderVariationText,
  aiCopyConcepts,
  revalidateCopyAngle,
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
  it('default e 3 (minimo) quando nao informado', () => {
    expect(metaCreativeVariationCount({})).toBe(3)
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

  it('Imobiliaria gera ate o numero de receitas distintas', () => {
    const concepts = selectedTemplateVariationConcepts({ creative_variations: 5 }, imobiliaria)
    expect(concepts).toHaveLength(5)
    expect(concepts[0].template_recipe).toBeTruthy()
    expect(concepts[0].variation_index).toBe(0)
  })

  it('Fase 2 (P1): pedir 8 com 5 receitas gera 5 SEM repetir recipe (era 8 com duplicatas)', () => {
    const concepts = selectedTemplateVariationConcepts({ creative_variations: 8 }, imobiliaria)
    expect(concepts).toHaveLength(5)
    const recipeIds = concepts.map(c => c.template_recipe.id)
    expect(new Set(recipeIds).size).toBe(recipeIds.length) // todos os angulos distintos
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

describe('revalidateCopyAngle (revalidacao ao vivo na edicao da copy)', () => {
  const ok = { headline: 'More na Zona Norte', body: 'Imovel com otima localizacao. Fale com a Vitra.', cta: 'Receber condicoes' }

  it('angulo bem-formado nao retorna issues', () => {
    expect(revalidateCopyAngle(ok, { scope: 'vitra_imobiliaria', headlineMax: 36 })).toEqual([])
  })

  it('headline acima do maxLength e sinalizada (mesma regra da Edge)', () => {
    const issues = revalidateCopyAngle({ ...ok, headline: 'A'.repeat(50) }, { scope: 'vitra_imobiliaria', headlineMax: 36 })
    expect(issues.join(' ')).toMatch(/headline com 50/)
  })

  it('vocabulario Premium editado na Imobiliaria e sinalizado', () => {
    const issues = revalidateCopyAngle({ ...ok, body: 'Uma curadoria de alto padrao.' }, { scope: 'vitra_imobiliaria', headlineMax: 36 })
    expect(issues.join(' ')).toMatch(/vocabulario fora da marca/)
  })
})

describe('aiCopyConcepts (copiloto de IA — degrau A)', () => {
  const aiForm = {
    creative_variations: 8,
    creative_template_id: 'vitra-imobiliaria-dual-photo-offer',
    ai_copy_angles: [
      { key: 'preco', angle: 'preco', headline: 'De R$ 450 por R$ 399 mil', body: 'Valor reduzido.', cta: 'Fale com a Vitra' },
      { key: 'local', angle: 'localizacao', headline: 'Perto de tudo', body: 'Mobilidade e comercio.', cta: 'Conhecer a regiao' },
    ],
  }

  it('sem ai_copy_angles, nao gera conceitos de IA', () => {
    expect(aiCopyConcepts({ creative_variations: 5 }, imobiliaria)).toEqual([])
  })

  it('usa os angulos da IA como copy LITERAL das variacoes (cap no numero de angulos)', () => {
    const concepts = aiCopyConcepts(aiForm, imobiliaria)
    expect(concepts).toHaveLength(2) // min(8, 2 angulos da IA)
    expect(concepts[0].template_recipe.headline).toBe('De R$ 450 por R$ 399 mil')
    expect(concepts[0].template_recipe.copy).toBe('Valor reduzido.')
    expect(concepts[0].template_recipe.source).toBe('ai')
    expect(concepts[0].templateBase).toBe('vitra-imobiliaria-dual-photo-offer')
  })

  it('Premium AGORA usa copy de IA: reusa o conceito generico Premium e sobrescreve o texto', () => {
    const concepts = aiCopyConcepts({
      creative_variations: 8,
      ai_copy_angles: [
        { key: 'editorial', angle: 'editorial', headline: 'Uma categoria acima', body: 'Curadoria reservada.', cta: 'Receba a curadoria' },
        { key: 'local', angle: 'localizacao', headline: 'Endereco singular', body: 'Localizacao rara.', cta: 'Agende uma visita' },
      ],
    }, premium)
    expect(concepts).toHaveLength(2)
    expect(concepts[0].template_recipe.headline).toBe('Uma categoria acima')
    expect(concepts[0].template_recipe.source).toBe('ai')
    // Premium nao tem family: reusa o templateBase do conceito generico (premium-editorial/lead/retarget)
    expect(String(concepts[0].templateBase)).toMatch(/^premium-/)
  })

  it('selectedMetaCreativeConcepts prioriza a copy de IA sobre as receitas', () => {
    const concepts = selectedMetaCreativeConcepts(aiForm, imobiliaria)
    expect(concepts).toHaveLength(2)
    expect(concepts.every(c => c.template_recipe.source === 'ai')).toBe(true)
  })

  it('distinctConceptCapacity reflete os angulos da IA quando presentes (Imobiliaria E Premium)', () => {
    expect(distinctConceptCapacity(aiForm, imobiliaria)).toBe(2)
    expect(distinctConceptCapacity({ ai_copy_angles: [{ headline: 'a', body: 'b' }, { headline: 'c', body: 'd' }] }, premium)).toBe(2)
  })
})

describe('distinctConceptCapacity (Fase 2 P1)', () => {
  it('template aprovado da Imobiliaria expoe 5 angulos distintos', () => {
    expect(distinctConceptCapacity({}, imobiliaria)).toBe(5)
  })
  it('Premium expoe os 12 conceitos genericos', () => {
    expect(distinctConceptCapacity({}, premium)).toBe(12)
  })
  it('financiamento-orla expoe 9 angulos apos a ampliacao (Fase 2)', () => {
    expect(distinctConceptCapacity({ creative_template_id: 'vitra-imobiliaria-financiamento-orla' }, imobiliaria)).toBe(9)
  })
})

describe('headline_only (Fase 2: nome do produto vazando para a headline da arte)', () => {
  it('headline (legado) mantem o fallback para o nome do produto', () => {
    const tokens = variationTokens('Residencial Aurora', 'Centro', {})
    expect(tokens.headline).toBe('Residencial Aurora')
  })
  it('headline_only NAO faz fallback para o produto (fica vazio sem suggested_headline)', () => {
    const tokens = variationTokens('Residencial Aurora', 'Centro', {})
    expect(tokens.headline_only).toBe('')
  })
  it('headline_only usa a headline sugerida quando preenchida', () => {
    const tokens = variationTokens('Residencial Aurora', 'Centro', { suggested_headline: 'More na Orla' })
    expect(tokens.headline_only).toBe('More na Orla')
  })
  it('receita {headline_only} renderiza vazio sem suggested_headline (cai no fallback por angulo)', () => {
    expect(renderVariationText('{headline_only}', variationTokens('Aurora', 'Centro', {}))).toBe('')
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
