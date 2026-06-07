import { describe, it, expect } from 'vitest'
// Importa o modulo compartilhado da Edge (generate-copy) — mesma validacao que roda no servidor.
import {
  validateCopyAngle,
  bannedVocabForScope,
  annotateAngles,
} from '../../../../supabase/functions/_shared/copyValidation.ts'

describe('bannedVocabForScope', () => {
  it('Imobiliaria proibe vocabulario editorial da Premium', () => {
    expect(bannedVocabForScope('vitra_imobiliaria')).toContain('curadoria')
    expect(bannedVocabForScope('vitra_imobiliaria')).toContain('liquidez')
  })
  it('Premium proibe vocabulario de promocao barata', () => {
    expect(bannedVocabForScope('vitra_premium')).toContain('imperdivel')
    expect(bannedVocabForScope('vitra_premium')).not.toContain('curadoria')
  })
})

describe('validateCopyAngle', () => {
  const ok = {
    key: 'preco-ancora', angle: 'preco',
    headline: 'De R$ 450 mil por R$ 399 mil',
    body: 'Condicao com valor reduzido. Fale com a Vitra para garantir.',
    cta: 'Receber condicoes',
  }

  it('angulo bem-formado passa sem issues', () => {
    expect(validateCopyAngle(ok, { headlineMax: 36, scope: 'vitra_imobiliaria' }).ok).toBe(true)
  })

  it('headline acima do maxLength e sinalizada', () => {
    const r = validateCopyAngle({ ...ok, headline: 'A'.repeat(50) }, { headlineMax: 36 })
    expect(r.ok).toBe(false)
    expect(r.issues.join(' ')).toMatch(/headline com 50/)
  })

  it('nome do produto repetido na headline E no inicio do texto e sinalizado', () => {
    const r = validateCopyAngle(
      { ...ok, headline: 'Isla Zona Sul em destaque', body: 'Isla Zona Sul tem 2 dorms.' },
      { headlineMax: 40, productName: 'Isla Zona Sul' },
    )
    expect(r.issues.join(' ')).toMatch(/nome do produto repetido/)
  })

  it('vocabulario Premium na Imobiliaria e sinalizado', () => {
    const r = validateCopyAngle(
      { ...ok, body: 'Uma curadoria de alto padrao para voce.' },
      { headlineMax: 40, scope: 'vitra_imobiliaria' },
    )
    expect(r.issues.join(' ')).toMatch(/vocabulario fora da marca/)
  })

  it('campos vazios sao sinalizados', () => {
    const r = validateCopyAngle({ headline: '', body: '', cta: '' }, {})
    expect(r.issues).toContain('headline vazia')
    expect(r.issues).toContain('texto vazio')
    expect(r.issues).toContain('CTA vazio')
  })
})

describe('annotateAngles', () => {
  it('anota cada angulo com issues (vazio = ok)', () => {
    const out = annotateAngles([
      { headline: 'Curta', body: 'Texto ok aqui.', cta: 'Fale com a Vitra' },
      { headline: 'X'.repeat(99), body: '', cta: '' },
    ], { headlineMax: 36 })
    expect(out[0].issues).toEqual([])
    expect(out[1].issues.length).toBeGreaterThan(0)
  })
})
