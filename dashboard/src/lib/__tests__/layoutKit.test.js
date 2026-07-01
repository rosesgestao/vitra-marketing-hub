import { describe, it, expect } from 'vitest'
import {
  measuredWidthPx, fitFillSize, fillRatio, centerStartX, distributeV, maxVerticalGap,
} from '../../../../supabase/functions/_shared/layoutKit.ts'

describe('layoutKit — helpers auto-equilibrantes', () => {
  it('fitFillSize CRESCE textos curtos até o teto (preenche) e ENCOLHE longos (cabe)', () => {
    const opts = { min: 20, max: 120, widthPx: 600 }
    const short = fitFillSize('R$ 319', opts)
    const long = fitFillSize('R$ 319.000,00 À VISTA OU FINANCIADO', opts)
    expect(short).toBe(120)          // curto → encosta no teto (não fica pequeno num container grande)
    expect(long).toBeLessThan(120)   // longo → encolhe para caber
    expect(long).toBeGreaterThanOrEqual(20)
  })

  it('fitFillSize respeita o piso mínimo', () => {
    const s = fitFillSize('TEXTO EXTREMAMENTE LONGO QUE NAO CABE DE JEITO NENHUM AQUI', { min: 40, max: 120, widthPx: 80 })
    expect(s).toBe(40)
  })

  it('fillRatio mede a fração preenchida', () => {
    expect(fillRatio(0, 100)).toBe(0)
    expect(fillRatio(90, 100)).toBe(0.9)
    expect(fillRatio(100, 0)).toBe(0) // container inválido → 0 (não divide por zero)
  })

  it('centerStartX centraliza o grupo no container', () => {
    expect(centerStartX(100, 800, 400)).toBe(300) // 100 + (800-400)/2
    expect(centerStartX(100, 400, 500)).toBe(100) // grupo maior → não recua além da borda
  })

  it('distributeV reparte os blocos com folgas iguais (sem faixa morta única)', () => {
    const { tops, gap } = distributeV(0, 1000, [100, 100, 100])
    // slack 700 / 4 folgas = 175 cada
    expect(gap).toBe(175)
    expect(tops).toEqual([175, 450, 725])
  })

  it('distributeV limita a folga a um mínimo quando não cabe (deixa o overflow para o lint)', () => {
    const { gap } = distributeV(0, 100, [80, 80], 8)
    expect(gap).toBe(8)
  })

  it('maxVerticalGap acha a maior folga entre blocos consecutivos', () => {
    const blocks = [{ y: 0, h: 100 }, { y: 400, h: 100 }, { y: 560, h: 100 }]
    expect(maxVerticalGap(blocks)).toBe(300) // 400 - 100
  })

  it('measuredWidthPx cresce com o tamanho da fonte', () => {
    expect(measuredWidthPx('R$ 319.000,00', 100)).toBeGreaterThan(measuredWidthPx('R$ 319.000,00', 50))
  })
})
