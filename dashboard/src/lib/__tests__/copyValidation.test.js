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
  it('Imobiliaria proibe o lexico oficial do brandbook Premium (seleto/atemporal/singular)', () => {
    const banned = bannedVocabForScope('vitra_imobiliaria')
    expect(banned).toContain('seleto')
    expect(banned).toContain('atemporal')
    expect(banned).toContain('singular')
  })
  it('Premium proibe vocabulario de promocao barata', () => {
    expect(bannedVocabForScope('vitra_premium')).toContain('imperdivel')
    expect(bannedVocabForScope('vitra_premium')).not.toContain('curadoria')
  })
  it("pago da Imobiliaria libera genericos de mercado mas mantem o lexico Premium", () => {
    const paid = bannedVocabForScope('vitra_imobiliaria', 'paid')
    // genericos de mercado liberados no pago (validado nos anuncios vencedores)
    expect(paid).not.toContain('alto padrao')
    expect(paid).not.toContain('exclusivo')
    expect(paid).not.toContain('exclusiva')
    // voz genuinamente Premium continua bloqueada mesmo no pago
    expect(paid).toContain('curadoria')
    expect(paid).toContain('atemporal')
    expect(paid).toContain('seleto')
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

  it('no pago da Imobiliaria, termos genericos de mercado (alto padrao/exclusiva) NAO sao sinalizados', () => {
    const r = validateCopyAngle(
      { ...ok, body: 'Apartamento de alto padrao, unidade exclusiva em andar alto.' },
      { headlineMax: 40, scope: 'vitra_imobiliaria', channel: 'paid' },
    )
    expect(r.issues.join(' ')).not.toMatch(/vocabulario fora da marca/)
  })

  it('no pago da Imobiliaria, o lexico Premium (curadoria) ainda e sinalizado', () => {
    const r = validateCopyAngle(
      { ...ok, body: 'Uma curadoria pensada para voce.' },
      { headlineMax: 40, scope: 'vitra_imobiliaria', channel: 'paid' },
    )
    expect(r.issues.join(' ')).toMatch(/vocabulario fora da marca/)
  })

  it('nao da falso-positivo de substring: "procurados" nao casa com "curado"', () => {
    const r = validateCopyAngle(
      { ...ok, body: 'Um dos bairros mais procurados da zona sul, com acesso facil.' },
      { headlineMax: 40, scope: 'vitra_imobiliaria', channel: 'paid' },
    )
    expect(r.issues.join(' ')).not.toMatch(/vocabulario fora da marca/)
  })

  it('palavra real banida (curado) entre pontuacao ainda e sinalizada', () => {
    const r = validateCopyAngle(
      { ...ok, body: 'Imovel curado, pensado para voce.' },
      { headlineMax: 40, scope: 'vitra_imobiliaria', channel: 'paid' },
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
