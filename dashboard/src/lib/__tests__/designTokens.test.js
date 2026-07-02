import { describe, it, expect } from 'vitest'
import {
  DS_TYPE, DS_WEIGHT, DS_STROKE, DS_PADDING, DS_IMAGE, DS_LOGO, DS_VERSION, logoDims, DS_PALETTE_EXTENDED,
} from '../../../../supabase/functions/_shared/designTokens.ts'
import { DS_COLORS, DS_FONT, DS_RADII } from '../../../../supabase/functions/_shared/creativeDesign.ts'

describe('designTokens — invariantes da fundação', () => {
  it('DS_VERSION é uma string estável (gravada no render_trace/schema)', () => {
    expect(typeof DS_VERSION).toBe('string')
    expect(DS_VERSION.length).toBeGreaterThan(0)
  })

  it('cada papel tipográfico tem min ≤ max e família válida', () => {
    for (const [role, t] of Object.entries(DS_TYPE)) {
      expect(t.min, `${role}.min`).toBeGreaterThan(0)
      expect(t.max, `${role}.max`).toBeGreaterThanOrEqual(t.min)
      expect(['Anton', 'Inter'], `${role}.family`).toContain(t.family)
      expect(t.lh, `${role}.lh`).toBeGreaterThan(0)
    }
  })

  it('pesos usados na arte existem no DS_WEIGHT (sem peso solto)', () => {
    expect(DS_WEIGHT.regular).toBe(400)
    expect(DS_WEIGHT.black).toBe(800)
    for (const t of Object.values(DS_TYPE)) {
      expect(Object.values(DS_WEIGHT)).toContain(t.weight)
    }
  })

  it('logoDims é determinístico e proporcional ao canvas por formato', () => {
    // feed 1080 × 0.150 = 162 ; story 1080 × 0.160 = 173 ; wide 1200 × 0.120 = 144
    expect(logoDims(1080, 'feed')).toEqual({ w: 162, h: Math.round(162 * DS_LOGO.aspect) })
    expect(logoDims(1080, 'story')).toEqual({ w: 173, h: Math.round(173 * DS_LOGO.aspect) })
    expect(logoDims(1200, 'wide')).toEqual({ w: 144, h: Math.round(144 * DS_LOGO.aspect) })
    // mesma entrada → mesma saída
    expect(logoDims(1080, 'feed')).toEqual(logoDims(1080, 'feed'))
  })

  it('ratios de logo e imagem estão em faixa plausível [0..1]', () => {
    for (const r of Object.values(DS_LOGO.widthRatio)) {
      expect(r).toBeGreaterThan(0); expect(r).toBeLessThan(0.5)
    }
    for (const [min, max] of Object.values(DS_IMAGE.ratio)) {
      expect(min).toBeGreaterThan(0); expect(max).toBeGreaterThan(min); expect(max).toBeLessThanOrEqual(1)
    }
  })

  it('DS_PALETTE_EXTENDED: hexes válidos e distintos, sem colidir com o núcleo', () => {
    const core = new Set(Object.values(DS_COLORS).filter((v) => /^#[0-9A-Fa-f]{6}$/.test(v)).map((v) => v.toUpperCase()))
    const seen = new Set()
    for (const c of DS_PALETTE_EXTENDED) {
      expect(c, `${c} deve ser #hex de 6 dígitos`).toMatch(/^#[0-9A-Fa-f]{6}$/)
      const up = c.toUpperCase()
      expect(seen.has(up), `duplicata: ${c}`).toBe(false); seen.add(up)
      expect(core.has(up), `${c} já está no núcleo DS_COLORS`).toBe(false)
    }
    expect(DS_PALETTE_EXTENDED.length).toBeGreaterThanOrEqual(20)
  })

  it('tokens de cor/fonte/raio/stroke seguem sendo a fonte única esperada', () => {
    expect(DS_COLORS.gold).toBe('#C4942A')
    expect(DS_COLORS.navy).toBe('#0A1628')
    expect(DS_FONT).toEqual({ display: 'Anton', body: 'Inter' })
    expect(DS_RADII.bar).toBe(10)
    expect(DS_STROKE.frame).toBe(2)
    expect(DS_PADDING.plate).toBeGreaterThan(0)
  })
})
