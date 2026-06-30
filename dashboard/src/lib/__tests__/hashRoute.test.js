import { describe, it, expect } from 'vitest'
import { viewIdFromHash, hashForViewId } from '../hashRoute.js'

describe('hashRoute — deep-link de view (P0)', () => {
  it('extrai o id da view do hash (com e sem barra)', () => {
    expect(viewIdFromHash('#/metricas')).toBe('metricas')
    expect(viewIdFromHash('#metricas')).toBe('metricas')
    expect(viewIdFromHash('#/imobiliaria-trafego')).toBe('imobiliaria-trafego')
  })
  it('preserva ids compostos com dois-pontos (peças/criativos)', () => {
    expect(viewIdFromHash('#/pecas:facebook')).toBe('pecas:facebook')
    expect(viewIdFromHash('#/criativos:novo')).toBe('criativos:novo')
  })
  it('retorna null quando não há hash (cai para localStorage/default)', () => {
    expect(viewIdFromHash('')).toBeNull()
    expect(viewIdFromHash('#')).toBeNull()
    expect(viewIdFromHash('#/')).toBeNull()
    expect(viewIdFromHash(null)).toBeNull()
    expect(viewIdFromHash(undefined)).toBeNull()
  })
  it('monta o hash canônico e faz round-trip', () => {
    expect(hashForViewId('metricas')).toBe('#/metricas')
    for (const id of ['imobiliaria', 'premium-trafego', 'pecas:facebook', 'criativos:novo', 'kanban']) {
      expect(viewIdFromHash(hashForViewId(id))).toBe(id)
    }
  })
  it('decodifica componentes percent-encoded sem quebrar', () => {
    expect(viewIdFromHash('#/pecas%3Afacebook')).toBe('pecas:facebook')
  })
})
