import { describe, it, expect } from 'vitest'
import { humanizeLintNote, humanizeLintList } from '../lintText.js'

describe('lintText — humaniza os códigos do Creative Lint', () => {
  it('traduz token_font / token_color', () => {
    expect(humanizeLintNote('token_font:Poppins')).toBe('Fonte fora da marca: Poppins')
    expect(humanizeLintNote('token_color:#111111')).toBe('Cor fora da paleta: #111111')
  })

  it('traduz logo_crowding com folga e papel', () => {
    expect(humanizeLintNote('logo_crowding:hero:12<14')).toBe('Logo próxima da hero (folga 12px < 14px)')
  })

  it('traduz contrast com ratio', () => {
    expect(humanizeLintNote('contrast:price:2.10<4.5')).toBe('Contraste baixo em "price" (2.10:1)')
  })

  it('mantém código desconhecido como veio', () => {
    expect(humanizeLintNote('algo_novo:x')).toBe('algo_novo:x')
  })

  it('humanizeLintList remove duplicatas', () => {
    const out = humanizeLintList(['token_font:Poppins', 'token_font:Poppins', 'token_color:#FAFAF8'])
    expect(out).toEqual(['Fonte fora da marca: Poppins', 'Cor fora da paleta: #FAFAF8'])
  })
})
