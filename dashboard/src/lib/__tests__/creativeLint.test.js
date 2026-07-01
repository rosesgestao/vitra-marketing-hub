import { describe, it, expect } from 'vitest'
import { formatSpec, withinSafe } from '../../../../supabase/functions/_shared/creativeDesign.ts'
import { lintCreative } from '../../../../supabase/functions/_shared/creativeLint.ts'

describe('creativeDesign — formatSpec / safe-zone', () => {
  it('deriva canvas, kind e safe-zone por formato', () => {
    expect(formatSpec(1080, 1080).kind).toBe('feed')
    expect(formatSpec(1080, 1920).kind).toBe('story')
    expect(formatSpec(1200, 628).kind).toBe('wide')
    // 9:16 reels-safe
    const story = formatSpec(1080, 1920).safe
    expect(story).toEqual({ x: 35, y: 250, w: 1010, h: 1220 })
    // 1.91:1 — margem 6% (72px), pois o feed mostra a imagem inteira
    const wide = formatSpec(1200, 628).safe
    expect(wide).toEqual({ x: 72, y: 63, w: 1056, h: 501 })
  })
  it('withinSafe respeita os limites', () => {
    const safe = { x: 100, y: 100, w: 800, h: 800 }
    expect(withinSafe({ x: 120, y: 120, w: 200, h: 200 }, safe)).toBe(true)
    expect(withinSafe({ x: 50, y: 120, w: 200, h: 200 }, safe)).toBe(false)
    expect(withinSafe({ x: 800, y: 800, w: 200, h: 200 }, safe)).toBe(false)
  })
})

describe('creativeLint — gate objetivo', () => {
  const safe = formatSpec(1080, 1080).safe
  const ok = [
    { role: 'hero', box: { x: 90, y: 200, w: 900, h: 160 }, critical: true, block: true, display: true, fontSize: 150 },
    { role: 'subtitle', box: { x: 90, y: 380, w: 900, h: 80 }, critical: true, block: true, display: true, fontSize: 30, minFont: 16, charLen: 60, charLimit: 88 },
    { role: 'panel', box: { x: 90, y: 480, w: 900, h: 200 }, critical: true, block: true },
    { role: 'cta', box: { x: 330, y: 720, w: 420, h: 80 }, critical: true, block: true, overImage: true, hasScrim: true },
    { role: 'footnote', box: { x: 380, y: 820, w: 320, h: 28 }, critical: true, overImage: true, hasScrim: true },
  ]

  it('um layout saudável passa sem erros', () => {
    const r = lintCreative(safe, ok)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('REPROVA o selo atrás do herói (colisão de blocos) — o bug que vazou', () => {
    const badge = { role: 'badge', box: { x: 120, y: 210, w: 200, h: 60 }, block: true } // dentro do herói
    const r = lintCreative(safe, [...ok, badge])
    expect(r.ok).toBe(false)
    expect(r.errors.some(e => e.startsWith('overlap:'))).toBe(true)
  })

  it('REPROVA texto sobre a foto sem scrim (rodapé ilegível)', () => {
    const els = ok.map(e => e.role === 'footnote' ? { ...e, hasScrim: false } : e)
    const r = lintCreative(safe, els)
    expect(r.errors).toContain('contrast_no_scrim:footnote')
  })

  it('REPROVA elemento crítico fora da safe-zone', () => {
    const els = ok.map(e => e.role === 'hero' ? { ...e, box: { x: 10, y: 20, w: 900, h: 160 } } : e)
    const r = lintCreative(safe, els)
    expect(r.errors).toContain('safe_zone:hero')
  })

  it('REPROVA hierarquia quebrada (herói menor que outro display)', () => {
    const els = ok.map(e => e.role === 'subtitle' ? { ...e, fontSize: 200 } : e)
    const r = lintCreative(safe, els)
    expect(r.errors.some(e => e.startsWith('hierarchy:'))).toBe(true)
  })

  it('REPROVA copy acima do limite e overflow de fonte', () => {
    const els = [
      { role: 'subtitle', box: { x: 90, y: 380, w: 900, h: 80 }, charLen: 120, charLimit: 88 },
      { role: 'hero', box: { x: 90, y: 200, w: 900, h: 160 }, fontSize: 60, minFont: 60, display: true },
    ]
    const r = lintCreative(safe, els)
    expect(r.errors).toContain('char_limit:subtitle')
    expect(r.errors).toContain('overflow:hero')
  })
})

describe('creativeLint v2 — composição determinística (os erros marcados nos screenshots)', () => {
  const safe = formatSpec(1080, 1080).safe

  it('REPROVA preenchimento baixo (placa/barra com vazio lateral sem função)', () => {
    const els = [
      { role: 'price', box: { x: 90, y: 640, w: 900, h: 188 }, fill: 0.40, minFill: 0.60 },
    ]
    const r = lintCreative(safe, els)
    expect(r.errors).toContain('underfill:price')
    expect(r.metrics.fill_price).toBe(0.4)
  })

  it('APROVA quando o conteúdo preenche o container', () => {
    const els = [{ role: 'price', box: { x: 90, y: 640, w: 900, h: 188 }, fill: 0.98, minFill: 0.60 }]
    expect(lintCreative(safe, els).ok).toBe(true)
  })

  it('REPROVA faixa morta vertical acima do teto (gapCap)', () => {
    const els = [
      { role: 'bar', box: { x: 90, y: 300, w: 900, h: 70 }, block: true },
      { role: 'price', box: { x: 90, y: 700, w: 900, h: 188 }, block: true }, // 330px de folga
    ]
    const r = lintCreative(safe, els, { gapCap: 200 })
    expect(r.errors.some(e => e.startsWith('dead_gap:'))).toBe(true)
    expect(r.metrics.max_gap).toBe(330)
  })

  it('APROVA folga vertical dentro do teto', () => {
    const els = [
      { role: 'bar', box: { x: 90, y: 300, w: 900, h: 70 }, block: true },
      { role: 'price', box: { x: 90, y: 500, w: 900, h: 188 }, block: true }, // 130px de folga
    ]
    expect(lintCreative(safe, els, { gapCap: 200 }).ok).toBe(true)
  })

  it('REPROVA preço sem destaque suficiente sobre o texto secundário', () => {
    const els = [
      { role: 'price', box: { x: 90, y: 640, w: 900, h: 120 }, fontSize: 40 },
      { role: 'bar', box: { x: 90, y: 300, w: 900, h: 70 }, secondary: true, fontSize: 30 },
    ]
    const r = lintCreative(safe, els, { priceMinRatio: 1.6 }) // 40/30 = 1.33 < 1.6
    expect(r.errors.some(e => e.startsWith('price_weak:'))).toBe(true)
  })

  it('APROVA preço com destaque adequado', () => {
    const els = [
      { role: 'price', box: { x: 90, y: 640, w: 900, h: 188 }, fontSize: 120 },
      { role: 'bar', box: { x: 90, y: 300, w: 900, h: 70 }, secondary: true, fontSize: 30 },
    ]
    expect(lintCreative(safe, els, { priceMinRatio: 1.6 }).ok).toBe(true) // 4.0 ≥ 1.6
  })

  it('REPROVA logo ausente quando requireLogo', () => {
    const els = [{ role: 'headline', box: { x: 90, y: 200, w: 900, h: 160 } }]
    expect(lintCreative(safe, els, { requireLogo: true }).errors).toContain('logo_missing')
    expect(lintCreative(safe, [...els, { role: 'logo', box: { x: 400, y: 60, w: 280, h: 48 }, isLogo: true }], { requireLogo: true }).ok).toBe(true)
  })

  it('retrocompatível: sem opts, as regras v2 não disparam', () => {
    const els = [{ role: 'bar', box: { x: 90, y: 300, w: 900, h: 70 }, block: true }]
    expect(lintCreative(safe, els).ok).toBe(true)
  })

  it('REPROVA overflow: texto excede o container (fill acima do teto)', () => {
    const els = [{ role: 'bar', box: { x: 90, y: 300, w: 400, h: 70 }, fill: 1.08, maxFill: 0.99 }]
    const r = lintCreative(safe, els)
    expect(r.errors).toContain('overflow:bar')
  })

  it('APROVA quando o texto abraça o container com folga (fill ≤ maxFill)', () => {
    const els = [{ role: 'bar', box: { x: 90, y: 300, w: 400, h: 70 }, fill: 0.94, minFill: 0.80, maxFill: 0.99 }]
    expect(lintCreative(safe, els).ok).toBe(true)
  })

  it('REPROVA eixos de texto escalonados (axis_misaligned)', () => {
    const els = [
      { role: 'headline', box: { x: 90, y: 200, w: 800, h: 80 }, onAxis: true, textLeft: 90 },
      { role: 'bar', box: { x: 90, y: 300, w: 800, h: 70 }, onAxis: true, textLeft: 125 }, // recuo do padding
      { role: 'price', box: { x: 90, y: 400, w: 800, h: 120 }, onAxis: true, textLeft: 154 },
    ]
    const r = lintCreative(safe, els, { axisTol: 8 })
    expect(r.errors.some(e => e.startsWith('axis_misaligned:'))).toBe(true)
    expect(r.metrics.axis_spread).toBe(64)
  })

  it('APROVA quando todos os textos partem do mesmo eixo (spread 0)', () => {
    const els = [
      { role: 'headline', box: { x: 124, y: 200, w: 700, h: 80 }, onAxis: true, textLeft: 124 },
      { role: 'bar', box: { x: 90, y: 300, w: 700, h: 70 }, onAxis: true, textLeft: 124 },
      { role: 'price', box: { x: 90, y: 400, w: 700, h: 120 }, onAxis: true, textLeft: 124 },
    ]
    const r = lintCreative(safe, els, { axisTol: 8 })
    expect(r.metrics.axis_spread).toBe(0)
    expect(r.errors.some(e => e.startsWith('axis_misaligned'))).toBe(false)
  })
})
