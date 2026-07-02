import { describe, it, expect } from 'vitest'
import { buildRenderTrace } from '../../../../supabase/functions/_shared/renderTrace.ts'
import { DS_VERSION } from '../../../../supabase/functions/_shared/designTokens.ts'

const AT = '2026-07-01T12:00:00.000Z'

describe('renderTrace — observabilidade por asset', () => {
  it('carimba ds_version, versão, arquétipo, formato e rendered_at', () => {
    const t = buildRenderTrace({ templateVersion: 'oferta-ancora-approved-v6', archetype: 'left-anchored', format: 'feed', lint: null, renderedAt: AT })
    expect(t.ds_version).toBe(DS_VERSION)
    expect(t.template_version).toBe('oferta-ancora-approved-v6')
    expect(t.archetype).toBe('left-anchored')
    expect(t.format).toBe('feed')
    expect(t.rendered_at).toBe(AT)
    expect(t.decided).toBe('no_lint')
  })

  it('lint ok → decided approved_by_gate, sem reason', () => {
    const lint = { ok: true, errors: [], warnings: ['token_font:Poppins'], recommendations: [], metrics: { logo_gap: 39 } }
    const t = buildRenderTrace({ format: 'feed', lint, renderedAt: AT })
    expect(t.decided).toBe('approved_by_gate')
    expect(t.reason).toBeNull()
    expect(t.lint.warnings).toEqual(['token_font:Poppins'])
    expect(t.lint.metrics.logo_gap).toBe(39)
  })

  it('lint reprovado → decided blocked_by_gate + reason = erros', () => {
    const lint = { ok: false, errors: ['contrast:price:2.10<4.5', 'safe_zone:logo'], warnings: [], recommendations: [], metrics: {} }
    const t = buildRenderTrace({ format: 'wide', lint, renderedAt: AT })
    expect(t.decided).toBe('blocked_by_gate')
    expect(t.reason).toBe('contrast:price:2.10<4.5, safe_zone:logo')
  })
})
