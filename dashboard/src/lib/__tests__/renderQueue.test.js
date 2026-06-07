import { describe, it, expect } from 'vitest'
import {
  isRenderablePendingAsset,
  isWorkerOwnedAsset,
  renderAttemptsFor,
  MAX_RENDER_ATTEMPTS,
} from '../premiumData.js'

// Fase 1: predicado unico de pendencia, alinhado a maquina de estados da Edge
// (queued -> rendering -> generated | error, com retry e dead-letter).

const NOW = Date.parse('2026-06-06T12:00:00Z')
const minutesAgo = (m) => new Date(NOW - m * 60_000).toISOString()

describe('renderAttemptsFor', () => {
  it('le de metadata.render_attempts ou da coluna, com fallback 0', () => {
    expect(renderAttemptsFor({ metadata: { render_attempts: 2 } })).toBe(2)
    expect(renderAttemptsFor({ render_attempts: 5 })).toBe(5)
    expect(renderAttemptsFor({})).toBe(0)
    expect(renderAttemptsFor(null)).toBe(0)
  })
})

describe('isRenderablePendingAsset', () => {
  it('queued e sempre pendente', () => {
    expect(isRenderablePendingAsset({ status: 'queued' }, NOW)).toBe(true)
  })

  it('generated/approved comum NAO e pendente', () => {
    expect(isRenderablePendingAsset({
      status: 'generated',
      channel: 'meta_ads',
      template_key: 'premium-editorial-feed',
      public_url: 'https://x/y.png',
    }, NOW)).toBe(false)
    expect(isRenderablePendingAsset({ status: 'approved' }, NOW)).toBe(false)
  })

  it('error reentra enquanto houver orcamento de retry e para no limite', () => {
    expect(isRenderablePendingAsset({ status: 'error', metadata: { render_attempts: 1 } }, NOW)).toBe(true)
    expect(isRenderablePendingAsset({ status: 'error', metadata: { render_attempts: MAX_RENDER_ATTEMPTS } }, NOW)).toBe(false)
  })

  it('rendering orfao (travado alem do timeout) volta a ser pendente', () => {
    expect(isRenderablePendingAsset({
      status: 'rendering',
      metadata: { last_render_attempt_at: minutesAgo(20) },
    }, NOW)).toBe(true)
  })

  it('rendering recente NAO e pendente (esta em andamento)', () => {
    expect(isRenderablePendingAsset({
      status: 'rendering',
      metadata: { last_render_attempt_at: minutesAgo(3) },
    }, NOW)).toBe(false)
  })

  it('rendering sem timestamp nao e considerado orfao', () => {
    expect(isRenderablePendingAsset({ status: 'rendering', metadata: {} }, NOW)).toBe(false)
  })

  it('template aprovado da Imobiliaria com versao antiga continua pendente (mesmo generated)', () => {
    expect(isRenderablePendingAsset({
      status: 'generated',
      channel: 'meta_ads',
      template_key: 'vitra-imobiliaria-financiamento-orla-feed',
      public_url: 'https://x/y.png',
      metadata: {
        visual_template: { family: 'vitra-imobiliaria-financiamento-orla' },
        rendered_template_family: 'vitra-imobiliaria-financiamento-orla',
        rendered_template_version: 'versao-antiga',
      },
    }, NOW)).toBe(true)
  })
})

describe('isWorkerOwnedAsset + exclusao do dispatch da Edge (roteamento Premium 9:16 -> worker)', () => {
  it('detecta render_engine=worker', () => {
    expect(isWorkerOwnedAsset({ metadata: { render_engine: 'worker' } })).toBe(true)
    expect(isWorkerOwnedAsset({ metadata: { render_engine: 'edge' } })).toBe(false)
    expect(isWorkerOwnedAsset({ metadata: {} })).toBe(false)
    expect(isWorkerOwnedAsset(null)).toBe(false)
  })

  it('asset do worker NUNCA e pendente para a Edge — nem queued nem error', () => {
    // A Edge/dashboard nao reivindica o que pertence ao worker (conjuntos disjuntos).
    expect(isRenderablePendingAsset({ status: 'queued', metadata: { render_engine: 'worker' } }, NOW)).toBe(false)
    expect(isRenderablePendingAsset({
      status: 'error',
      metadata: { render_engine: 'worker', render_attempts: 0 },
    }, NOW)).toBe(false)
  })
})
