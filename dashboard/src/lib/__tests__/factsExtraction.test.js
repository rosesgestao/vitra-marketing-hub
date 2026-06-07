import { describe, it, expect } from 'vitest'
// Modulo compartilhado da Edge (extract-facts) — mesma extracao/validacao que roda no servidor.
import {
  buildFactsSchema,
  buildExtractSystemPrompt,
  validateExtractedFacts,
} from '../../../../supabase/functions/_shared/factsExtraction.ts'
import { buildFactsApplyPatch } from '../premiumData.js'

// Degrau B' do copiloto: a IA LE um anuncio colado e PROPOE valores por campo. O invariante central e
// NUNCA inventar — a evidencia precisa estar ancorada no texto-fonte; senao o campo e descartado.

describe('buildFactsSchema', () => {
  const specs = [
    { key: 'product_name', label: 'Nome', type: 'text' },
    { key: 'price', label: 'Valor', type: 'money', maxLength: 20 },
    { key: 'differentials', label: 'Diferenciais', type: 'list' },
  ]

  it('lista TODAS as keys em required e trava additionalProperties em todos os niveis', () => {
    const schema = buildFactsSchema(specs)
    expect(schema.additionalProperties).toBe(false)
    expect(schema.properties.fields.additionalProperties).toBe(false)
    expect(schema.properties.fields.required).toEqual(['product_name', 'price', 'differentials'])
    expect(schema.properties.fields.properties.price.additionalProperties).toBe(false)
    expect(schema.properties.fields.properties.price.required).toEqual(['value', 'evidence', 'confidence', 'present'])
  })

  it('value vira array para type list e string para os demais', () => {
    const schema = buildFactsSchema(specs)
    expect(schema.properties.fields.properties.differentials.properties.value.type).toBe('array')
    expect(schema.properties.fields.properties.price.properties.value.type).toBe('string')
  })

  it('dedup de keys repetidas (nao duplica propriedade)', () => {
    const schema = buildFactsSchema([{ key: 'price', type: 'money' }, { key: 'price', type: 'text' }])
    expect(schema.properties.fields.required).toEqual(['price'])
  })
})

describe('buildExtractSystemPrompt', () => {
  it('instrui a NAO inventar e ajusta o publico por escopo', () => {
    expect(buildExtractSystemPrompt('vitra_imobiliaria')).toMatch(/NUNCA invente/)
    expect(buildExtractSystemPrompt('vitra_premium')).toMatch(/alto padrao/)
  })
})

describe('validateExtractedFacts — groundedness (anti-alucinacao)', () => {
  it('FURO #1: valor inventado + evidence real (mas irrelevante) e DESCARTADO', () => {
    // O nucleo do invariante: a evidence NAO e passe-livre; o proprio VALOR tem que estar no texto.
    const source = 'Apartamento amplo no centro da cidade.'
    const raw = { area: { value: '92 m2', evidence: 'amplo', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'area', type: 'text' }], source)
    expect(r.fields.area.present).toBe(false)
    expect(r.fields.area.value).toBe('')
    expect(r.fields.area.issues.join(' ')).toMatch(/nao localizado/)
    expect(r.extracted).toBe(0)
  })

  it('MANTEM o campo quando o VALOR aparece no texto (ignorando acento/caixa/espaco)', () => {
    const source = 'Imovel na regiao do Menino Deus, otima localizacao.'
    const raw = { neighborhood: { value: 'Menino Deus', evidence: 'regiao do MENINO DEUS', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'neighborhood', type: 'text' }], source)
    expect(r.fields.neighborhood.present).toBe(true)
    expect(r.fields.neighborhood.confidence).toBe('high')
    expect(r.extracted).toBe(1)
  })

  it('FURO #7: numero curto inventado NAO casa por coincidencia (fronteira de palavra)', () => {
    // '92' inventado nao deve validar so porque aparece dentro de um telefone '9290'.
    const source = 'Ligue 51 99999-9290 para agendar.'
    const r = validateExtractedFacts({ area: { value: '92', evidence: '9290', confidence: 'high', present: true } }, [{ key: 'area', type: 'text' }], source)
    expect(r.fields.area.present).toBe(false)
    // mas um valor numerico REAL com fronteira e mantido
    const ok = validateExtractedFacts({ area: { value: '92 m2', evidence: '92 m2 privativos', confidence: 'high', present: true } }, [{ key: 'area', type: 'text' }], '92 m2 privativos no 10o andar.')
    expect(ok.fields.area.present).toBe(true)
  })

  it('FURO recombinacao: tokens espalhados em frases diferentes NAO ancoram (so substring contigua)', () => {
    // "2 suite" e FALSO: o imovel tem 1 suite; o "2" vem de "2 elevadores". Recombinar termos != ancorar.
    const source = 'Apartamento no Menino Deus. 3 dormitorios, 1 suite. Predio com 2 elevadores.'
    const r = validateExtractedFacts({ suites: { value: 'apartamento 2 suite', evidence: '2 elevadores', confidence: 'high', present: true } }, [{ key: 'suites', type: 'text' }], source)
    expect(r.fields.suites.present).toBe(false)
    expect(r.fields.suites.value).toBe('')
  })

  it('FURO money: preco fabricado a partir de digitos espalhados (78 + 000) NAO ancora', () => {
    const source = 'Area de 78m2. CEP 91000-000. Otima localizacao.'
    const r = validateExtractedFacts({ price: { value: 'R$ 78.000', evidence: '78m2', confidence: 'high', present: true } }, [{ key: 'price', type: 'money' }], source)
    expect(r.fields.price.present).toBe(false)
  })

  it('FURO substring-em-palavra: valor curto dentro de palavra maior NAO ancora (fronteira de palavra)', () => {
    // "sala" nao pode ancorar dentro de "salao"; "vaga" nao pode ancorar dentro de "vagaroso".
    const r1 = validateExtractedFacts({ area: { value: 'sala', evidence: 'salao', confidence: 'high', present: true } }, [{ key: 'area', type: 'text' }], 'Amplo salao de festas no condominio.')
    expect(r1.fields.area.present).toBe(false)
    const r2 = validateExtractedFacts({ suites: { value: 'vaga', evidence: 'vagaroso', confidence: 'high', present: true } }, [{ key: 'suites', type: 'text' }], 'Com vista para o rio vagaroso ao fundo.')
    expect(r2.fields.suites.present).toBe(false)
    // controle: a palavra inteira, cercada por fronteira, e mantida
    const ok = validateExtractedFacts({ area: { value: 'salao', evidence: 'salao de festas', confidence: 'high', present: true } }, [{ key: 'area', type: 'text' }], 'Amplo salao de festas no condominio.')
    expect(ok.fields.area.present).toBe(true)
  })

  it('numero colado a unidade ainda ancora (92 em 92m2) — fronteira so de digito p/ numero puro', () => {
    const r = validateExtractedFacts({ area: { value: '92', evidence: '92m2', confidence: 'high', present: true } }, [{ key: 'area', type: 'text' }], 'Area privativa de 92m2 no 10o andar.')
    expect(r.fields.area.present).toBe(true)
  })

  it('valor literal contiguo (mesmo com pontuacao/$) e mantido', () => {
    const source = 'Lancamento por apenas R$ 539.000,00 a vista.'
    const r = validateExtractedFacts({ price: { value: 'R$ 539.000,00', evidence: 'apenas R$ 539.000,00', confidence: 'high', present: true } }, [{ key: 'price', type: 'money' }], source)
    expect(r.fields.price.present).toBe(true)
    expect(r.fields.price.value).toBe('R$ 539.000,00')
  })

  it('present:true com value vazio vira present:false (present-consistency)', () => {
    const raw = { price: { value: '', evidence: '', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'price', type: 'money' }], 'qualquer texto')
    expect(r.fields.price.present).toBe(false)
    expect(r.extracted).toBe(0)
  })
})

describe('validateExtractedFacts — listas item a item', () => {
  it('FURO #2/#9: itens inventados sao REMOVIDOS; itens reais ficam', () => {
    const source = 'Apartamento com churrasqueira na sacada.'
    const raw = { differentials: { value: ['churrasqueira', 'piscina aquecida', 'academia'], evidence: 'churrasqueira na sacada', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'differentials', type: 'list' }], source)
    expect(r.fields.differentials.present).toBe(true)
    expect(r.fields.differentials.value).toEqual(['churrasqueira'])
    expect(r.fields.differentials.issues.join(' ')).toMatch(/2 item\(ns\) sem ancoragem/)
    expect(r.fields.differentials.confidence).toBe('medium')
  })

  it('FURO recombinacao em lista: item com termos espalhados ("piscina na cobertura") e removido', () => {
    const source = 'Lazer: piscina, academia. Vista para o parque. Churrasqueira na cobertura.'
    const raw = { differentials: { value: ['piscina', 'piscina na cobertura'], evidence: 'piscina', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'differentials', type: 'list' }], source)
    expect(r.fields.differentials.value).toEqual(['piscina'])
  })

  it('FURO #3: lista REAL separada por virgula no texto NAO e descartada (sem falso-negativo)', () => {
    const source = 'Itens: suite, churrasqueira, sacada.'
    const raw = { differentials: { value: ['suite', 'churrasqueira', 'sacada'], evidence: '', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'differentials', type: 'list' }], source)
    expect(r.fields.differentials.present).toBe(true)
    expect(r.fields.differentials.value).toEqual(['suite', 'churrasqueira', 'sacada'])
  })

  it('lista 100% inventada e DESCARTADA (present:false)', () => {
    const source = 'Imovel pronto para morar.'
    const raw = { differentials: { value: ['piscina', 'academia'], evidence: 'pronto', confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'differentials', type: 'list' }], source)
    expect(r.fields.differentials.present).toBe(false)
  })

  it('string com quebras/;/, vira array e e validada item a item', () => {
    const source = '61m2 privativos; suite e churrasqueira, infraestrutura completa'
    const raw = { differentials: { value: '- 61m2 privativos\n• Suite e churrasqueira\n\nInfraestrutura completa', evidence: source, confidence: 'high', present: true } }
    const r = validateExtractedFacts(raw, [{ key: 'differentials', type: 'list' }], source)
    expect(Array.isArray(r.fields.differentials.value)).toBe(true)
    expect(r.fields.differentials.value).toEqual(['61m2 privativos', 'Suite e churrasqueira', 'Infraestrutura completa'])
  })
})

describe('validateExtractedFacts — tamanho e tipos', () => {
  it('maxLength SINALIZA sem truncar (mede com o separador do patch)', () => {
    const value = '2 dormitorios com suite, churrasqueira e sacada ampla'
    const source = `Faixa principal: ${value}, disponivel.`
    const r = validateExtractedFacts(
      { suites: { value, evidence: value, confidence: 'high', present: true } },
      [{ key: 'suites', type: 'text', maxLength: 32 }],
      source,
    )
    expect(r.fields.suites.present).toBe(true)
    expect(r.fields.suites.value.length).toBeGreaterThan(32)
    expect(r.fields.suites.issues.join(' ')).toMatch(/maximo 32/)
    expect(r.flagged).toBe(1)
  })

  it('type money: preserva texto livre (Sob consulta) e o valor literal do texto', () => {
    const source = 'Valor: R$ 399 mil. Outra unidade sob consulta.'
    const r1 = validateExtractedFacts({ price: { value: 'R$ 399 mil', evidence: 'R$ 399 mil', confidence: 'high', present: true } }, [{ key: 'price', type: 'money' }], source)
    expect(r1.fields.price.value).toBe('R$ 399 mil')
    expect(r1.fields.price.present).toBe(true)
    const r2 = validateExtractedFacts({ price: { value: 'Sob consulta', evidence: 'sob consulta', confidence: 'medium', present: true } }, [{ key: 'price', type: 'money' }], source)
    expect(r2.fields.price.value).toBe('Sob consulta')
    expect(r2.fields.price.present).toBe(true)
  })

  it('campo ausente na saida da IA vira present:false (tolerante a key faltando)', () => {
    const r = validateExtractedFacts({}, [{ key: 'price', type: 'money' }], 'texto qualquer')
    expect(r.fields.price.present).toBe(false)
    expect(r.fields.price.value).toBe('')
  })
})

describe('buildFactsApplyPatch (aplicacao ao form, anti-regressao)', () => {
  it('fill-empty: so preenche campos vazios; ignora present:false; nunca sobrescreve', () => {
    const form = { product_name: 'Existente', neighborhood: '', price: '' }
    const fields = {
      product_name: { value: 'Novo Nome', present: true },
      neighborhood: { value: 'Menino Deus', present: true },
      price: { value: '', present: false },
    }
    const { patch, appliedKeys, skippedKeys } = buildFactsApplyPatch(form, fields, { mode: 'fill-empty' })
    expect(patch).toEqual({ neighborhood: 'Menino Deus' })
    expect(appliedKeys).toEqual(['neighborhood'])
    expect(skippedKeys).toContain('product_name')
    expect(skippedKeys).toContain('price')
  })

  it('overwrite: aplica todos present:true; lista junta com quebra de linha', () => {
    const form = { product_name: 'Existente', differentials: '' }
    const fields = {
      product_name: { value: 'Novo', present: true },
      differentials: { value: ['61m2', 'Suite'], present: true },
    }
    const { patch } = buildFactsApplyPatch(form, fields, { mode: 'overwrite' })
    expect(patch.product_name).toBe('Novo')
    expect(patch.differentials).toBe('61m2\nSuite')
  })

  it('nunca inclui campo ausente nem apaga valor existente', () => {
    const form = { price: 'R$ 100' }
    const fields = { area: { value: '', present: false }, price: { value: 'R$ 999', present: true } }
    const { patch } = buildFactsApplyPatch(form, fields, { mode: 'fill-empty' })
    expect(patch).toEqual({})
  })
})
