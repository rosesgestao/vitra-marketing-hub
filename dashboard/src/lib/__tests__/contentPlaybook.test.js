import { describe, it, expect } from 'vitest'
import {
  CONTENT_TYPES,
  CONTENT_PILLARS,
  CONTENT_FORMATS,
  CONTENT_TYPE_OPTIONS,
  DEFAULT_CONTENT_TYPE,
  contentTypeSpec,
  contentFormatSpec,
  CONTENT_STATUSES,
  CONTENT_BOARD_LANES,
  contentStatusLane,
  contentStatusLabel,
} from '../../../../supabase/functions/_shared/contentPlaybook.ts'

describe('contentPlaybook (playbook editorial — fonte unica)', () => {
  it('todo tipo de conteudo referencia um pilar e um formato existentes', () => {
    for (const t of Object.values(CONTENT_TYPES)) {
      expect(CONTENT_PILLARS[t.pillar], `pilar do tipo ${t.key}`).toBeDefined()
      expect(CONTENT_FORMATS[t.format], `formato do tipo ${t.key}`).toBeDefined()
    }
  })

  it('contentTypeSpec cai no default para chave invalida', () => {
    expect(contentTypeSpec('nao-existe').key).toBe(DEFAULT_CONTENT_TYPE)
    expect(contentTypeSpec(null).key).toBe(DEFAULT_CONTENT_TYPE)
  })

  it('contentFormatSpec cai em feed para chave invalida e marca roteiro em reels/stories', () => {
    expect(contentFormatSpec('xyz').key).toBe('feed')
    expect(contentFormatSpec('reels').hasScript).toBe(true)
    expect(contentFormatSpec('feed').hasScript).toBe(false)
  })

  it('as opcoes da UI cobrem todos os tipos', () => {
    expect(CONTENT_TYPE_OPTIONS.length).toBe(Object.keys(CONTENT_TYPES).length)
  })

  it('todo status mapeia para uma lane existente do board', () => {
    const laneKeys = new Set(CONTENT_BOARD_LANES.map(l => l.key))
    for (const s of CONTENT_STATUSES) {
      // arquivado nao tem lane no board (e ok ficar fora); os demais devem ter
      if (s.key === 'archived') continue
      expect(laneKeys.has(contentStatusLane(s.key)), `lane do status ${s.key}`).toBe(true)
    }
  })

  it('contentStatusLabel/Lane caem no default para status invalido', () => {
    expect(contentStatusLabel('draft')).toBe('Rascunho')
    expect(contentStatusLane('xyz')).toBe('rascunho')
  })
})
