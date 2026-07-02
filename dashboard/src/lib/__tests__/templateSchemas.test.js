import { describe, it, expect } from 'vitest'
import {
  TEMPLATE_SCHEMAS, OFERTA_LAYOUT, schemaFor,
} from '../../../../supabase/functions/_shared/templateSchemas.ts'
import { DS_VERSION } from '../../../../supabase/functions/_shared/designTokens.ts'
import { selectableCreativeTemplatesForBrand } from '../creativeTemplateCatalog.js'

const ARCHETYPES = ['left-anchored', 'centered', 'photo-forward']

describe('templateSchemas — contrato formal por template', () => {
  it('schemaFor devolve o schema do oferta e null p/ desconhecido', () => {
    expect(schemaFor('vitra-imobiliaria-oferta-ancora')).toBeTruthy()
    expect(schemaFor('inexistente')).toBeNull()
  })

  it('todo schema tem arquétipo válido, componentes e dsVersion atual', () => {
    for (const [family, s] of Object.entries(TEMPLATE_SCHEMAS)) {
      expect(ARCHETYPES, `${family}.archetype`).toContain(s.archetype)
      expect(s.components.required.length, `${family}.required`).toBeGreaterThan(0)
      expect(s.dsVersion).toBe(DS_VERSION)
    }
  })

  it('campos têm charLimit>0, fallback e prioridade', () => {
    for (const [family, s] of Object.entries(TEMPLATE_SCHEMAS)) {
      for (const [role, f] of Object.entries(s.fields)) {
        expect(f.charLimit, `${family}.${role}.charLimit`).toBeGreaterThan(0)
        expect(f.fallback, `${family}.${role}.fallback`).toBeTruthy()
        expect(typeof f.priority).toBe('number')
      }
    }
  })

  it('OFERTA_LAYOUT tem os 3 formatos com as zonas esperadas', () => {
    for (const kind of ['feed', 'story', 'wide']) {
      const L = OFERTA_LAYOUT[kind]
      expect(L, kind).toBeTruthy()
      for (const key of ['margin', 'logoY', 'headY', 'headBudget', 'bar', 'box', 'footY', 'gapCap']) {
        expect(L[key], `${kind}.${key}`).toBeDefined()
      }
      expect(Array.isArray(L.bar) && L.bar.length).toBe(4)
      expect(Array.isArray(L.box) && L.box.length).toBe(4)
    }
  })

  // GOVERNANÇA (Etapa 8): guard cruzado catálogo↔schema — TODO template selecionável da Imobiliária
  // no catálogo REAL precisa ter schema. Impede que um selecionável novo entre sem contrato/zonas.
  it('todo template selecionável da Imobiliária tem schema (guard catálogo↔schema)', () => {
    const selectable = selectableCreativeTemplatesForBrand('vitra_imobiliaria')
    expect(selectable.length).toBeGreaterThanOrEqual(6)
    for (const t of selectable) {
      expect(schemaFor(t.family), `selecionável sem schema: ${t.family}`).toBeTruthy()
    }
  })

  it('oferta: contrato de lint e campos conforme aprovado', () => {
    const s = schemaFor('vitra-imobiliaria-oferta-ancora')
    expect(s.lint).toEqual({ priceMinRatio: 1.6, axisTol: 8, requireLogo: true, minLogoGap: 14 })
    expect(s.fields.headline.charLimit).toBe(40)
    expect(s.fields.footnote.charLimit).toBe(52)
  })

  it('as 6 selecionáveis declaram minLogoGap (regra logo↔headline v3)', () => {
    for (const fam of ['vitra-imobiliaria-oferta-ancora', 'vitra-imobiliaria-hero-checklist',
      'vitra-imobiliaria-duo-selos-offer', 'vitra-imobiliaria-vitrine-gallery',
      'vitra-imobiliaria-ficha-imovel', 'vitra-imobiliaria-destino-bairro']) {
      expect(schemaFor(fam).lint.minLogoGap, fam).toBeGreaterThan(0)
    }
  })
})
