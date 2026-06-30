import { describe, it, expect } from 'vitest'
import { filterCommands, normalizeText } from '../commandFilter.js'

const ITEMS = [
  { id: 'metricas', label: 'Métricas', group: 'Inteligência & automação' },
  { id: 'imobiliaria-trafego', label: 'Tráfego Pago', group: 'Vitra Imobiliária' },
  { id: 'premium-trafego', label: 'Tráfego Pago', group: 'Vitra Premium' },
  { id: 'biblioteca', label: 'Biblioteca', group: 'Produção de conteúdo' },
]

describe('commandFilter — busca do ⌘K (P1.7)', () => {
  it('normaliza acentos', () => {
    expect(normalizeText('Métricas')).toBe('metricas')
    expect(normalizeText('Tráfego')).toBe('trafego')
  })
  it('acha por texto sem acento', () => {
    expect(filterCommands(ITEMS, 'metricas').map((i) => i.id)).toEqual(['metricas'])
    expect(filterCommands(ITEMS, 'trafego').map((i) => i.id)).toEqual(['imobiliaria-trafego', 'premium-trafego'])
  })
  it('query vazia devolve tudo', () => {
    expect(filterCommands(ITEMS, '')).toHaveLength(4)
    expect(filterCommands(ITEMS, '   ')).toHaveLength(4)
  })
  it('multi-termo é AND (label + grupo)', () => {
    expect(filterCommands(ITEMS, 'trafego premium').map((i) => i.id)).toEqual(['premium-trafego'])
    expect(filterCommands(ITEMS, 'trafego imobiliaria').map((i) => i.id)).toEqual(['imobiliaria-trafego'])
  })
  it('sem resultado quando nada casa', () => {
    expect(filterCommands(ITEMS, 'xyz')).toHaveLength(0)
  })
})
