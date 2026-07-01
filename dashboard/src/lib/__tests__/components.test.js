import { describe, it, expect } from 'vitest'
import { logoBlock } from '../../../../supabase/functions/_shared/components.ts'
import { logoDims } from '../../../../supabase/functions/_shared/designTokens.ts'

const HREF = 'data:image/png;base64,AAAA'

describe('components — logoBlock (componente único de logo)', () => {
  it('usa a largura CANÔNICA (logoDims) do formato', () => {
    const { box } = logoBlock(HREF, 1080, 'feed', { y: 70, centered: true })
    expect({ w: box.w, h: box.h }).toEqual(logoDims(1080, 'feed'))
  })

  it('centraliza no eixo cx (x = cx - w/2)', () => {
    const { box } = logoBlock(HREF, 1080, 'feed', { y: 70, centered: true, cx: 540 })
    const { w } = logoDims(1080, 'feed')
    expect(box.x).toBe(Math.round(540 - w / 2))
  })

  it('ancora à esquerda em x quando não centrada (ex.: wide)', () => {
    const { box } = logoBlock(HREF, 1200, 'wide', { y: 66, centered: false, x: 89 })
    expect(box.x).toBe(89)
    expect(box.y).toBe(66)
  })

  it('markup carrega o href passado e as dimensões do box (determinístico)', () => {
    const a = logoBlock(HREF, 1080, 'story', { y: 258, centered: true })
    const b = logoBlock(HREF, 1080, 'story', { y: 258, centered: true })
    expect(a.markup).toBe(b.markup)
    expect(a.markup).toContain(HREF)
    expect(a.markup).toContain(`width="${a.box.w}"`)
    expect(a.markup).toContain(`height="${a.box.h}"`)
  })
})
