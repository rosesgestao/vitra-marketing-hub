import { describe, it, expect } from 'vitest'
// Modulo compartilhado da Edge (suggest-template) — mesma logica que roda no servidor.
import {
  buildSuggestSchema,
  buildSuggestSystemPrompt,
  validateSuggestion,
} from '../../../../supabase/functions/_shared/templateSuggestion.ts'

// Degrau B do copiloto: a IA RECOMENDA o template; o operador confirma. Anti-alucinacao: o id escolhido
// PRECISA estar na lista fornecida (enum no schema + checagem em validateSuggestion).

const templates = [
  { id: 'vitra-imobiliaria-dual-photo-offer', name: 'Oferta com duas fotos', bestFor: 'Promocoes, preco com comparativo.' },
  { id: 'vitra-imobiliaria-financiamento-orla', name: 'Financiamento', bestFor: 'Campanhas de entrada, preco de oportunidade.' },
]

describe('buildSuggestSchema', () => {
  it('restringe template_id ao enum dos ids fornecidos', () => {
    const schema = buildSuggestSchema(templates)
    expect(schema.properties.template_id.enum).toEqual([
      'vitra-imobiliaria-dual-photo-offer',
      'vitra-imobiliaria-financiamento-orla',
    ])
    expect(schema.required).toEqual(['template_id', 'rationale', 'confidence'])
    expect(schema.additionalProperties).toBe(false)
  })
})

describe('buildSuggestSystemPrompt', () => {
  it('instrui a NAO inventar id e ajusta a marca por escopo', () => {
    expect(buildSuggestSystemPrompt('vitra_imobiliaria')).toMatch(/NAO invente id/)
    expect(buildSuggestSystemPrompt('vitra_premium')).toMatch(/Premium/)
  })
})

describe('validateSuggestion (anti-alucinacao do id)', () => {
  it('aceita um id que existe na lista', () => {
    const r = validateSuggestion({ template_id: 'vitra-imobiliaria-financiamento-orla', rationale: 'Anuncio fala de entrada e financiamento.', confidence: 'high' }, templates)
    expect(r.valid).toBe(true)
    expect(r.templateId).toBe('vitra-imobiliaria-financiamento-orla')
    expect(r.confidence).toBe('high')
  })

  it('REJEITA um id inventado (fora da lista) — valid:false, templateId:null', () => {
    const r = validateSuggestion({ template_id: 'template-inexistente', rationale: 'x', confidence: 'high' }, templates)
    expect(r.valid).toBe(false)
    expect(r.templateId).toBeNull()
  })

  it('confidence invalida vira low; rationale e normalizada', () => {
    const r = validateSuggestion({ template_id: 'vitra-imobiliaria-dual-photo-offer', rationale: '  multi   espaco  ', confidence: 'altissima' }, templates)
    expect(r.confidence).toBe('low')
    expect(r.rationale).toBe('multi espaco')
  })

  it('saida vazia/invalida nao quebra (templateId null)', () => {
    expect(validateSuggestion(null, templates).valid).toBe(false)
    expect(validateSuggestion({}, templates).templateId).toBeNull()
  })
})
