import { describe, it, expect } from 'vitest'
// Importa o modulo compartilhado da Edge (Deno) — as mesmas funcoes que renderizam a arte.
// Da rede de seguranca ao caminho de render-asset, que ate aqui nao tinha NENHUM teste.
import {
  compactText,
  wrapText,
  textSizeForWidth,
  estimateTextWidthEm,
  estimateTextWidthPx,
  validateApprovedHeadline,
  approvedHeadlineWrapChars,
  classifyFit,
  fitFontSize,
} from '../../../../supabase/functions/_shared/textFit.ts'

describe('compactText (truncamento duro com ...)', () => {
  it('mantem texto dentro do limite', () => {
    expect(compactText('More na Orla', 20)).toBe('More na Orla')
  })
  it('trunca e adiciona ... quando excede', () => {
    expect(compactText('abcdefghij', 5)).toBe('ab...')
  })
  it('normaliza espacos', () => {
    expect(compactText('  More   na  Orla ', 40)).toBe('More na Orla')
  })
})

describe('wrapText (preenche linhas, reticencias no overflow)', () => {
  it('texto curto cabe em uma linha', () => {
    expect(wrapText('CASA NOVA', 24, 2)).toEqual(['CASA NOVA'])
  })
  it('respeita maxLines e fecha a ultima linha com … quando estoura', () => {
    const lines = wrapText('UM DOIS TRES QUATRO CINCO SEIS SETE OITO NOVE DEZ', 10, 2)
    expect(lines.length).toBe(2)
    expect(lines[lines.length - 1].endsWith('…')).toBe(true)
  })
  it('nao adiciona … quando o texto cabe nas linhas', () => {
    const lines = wrapText('DOIS DORMITORIOS', 10, 2)
    expect(lines.some(l => l.endsWith('…'))).toBe(false)
  })
})

describe('textSizeForWidth (auto-shrink linear com clamp)', () => {
  it('retorna o tamanho base quando cabe no idealChars', () => {
    expect(textSizeForWidth('ABC', 60, 30, 10)).toBe(60)
  })
  it('encolhe proporcionalmente quando excede o idealChars', () => {
    expect(textSizeForWidth('A'.repeat(15), 60, 20, 10)).toBe(40) // round(60*10/15)
  })
  it('respeita o piso (min)', () => {
    expect(textSizeForWidth('A'.repeat(40), 60, 30, 10)).toBe(30) // round(15) -> clamp 30
  })
})

describe('estimateTextWidthEm / Px (largura por glifo, caixa alta)', () => {
  it('glifos largos (W) ocupam mais que estreitos (I)', () => {
    expect(estimateTextWidthEm('W')).toBeGreaterThan(estimateTextWidthEm('I'))
  })
  it('e monotonico no comprimento', () => {
    expect(estimateTextWidthEm('CASAS')).toBeGreaterThan(estimateTextWidthEm('CASA'))
  })
  it('e case-insensitive (a arte desenha em uppercase)', () => {
    expect(estimateTextWidthEm('orla')).toBe(estimateTextWidthEm('ORLA'))
  })
  it('Px = Em * tamanho da fonte', () => {
    expect(estimateTextWidthPx('AB', 100)).toBe(estimateTextWidthEm('AB') * 100)
  })
})

describe('fitFontSize (encolhe por largura, nao por contagem — Fase 2/3 #4)', () => {
  it('mantem o tamanho base quando o texto cabe no budget', () => {
    expect(fitFontSize('CASA', 60, 30, 1000)).toBe(60)
  })
  it('encolhe quando a largura estimada estoura o budget', () => {
    const s = fitFontSize('W'.repeat(20), 60, 20, 300)
    expect(s).toBeLessThan(60)
    expect(s).toBeGreaterThanOrEqual(20)
  })
  it('respeita o piso minSize mesmo com texto enorme', () => {
    expect(fitFontSize('W'.repeat(80), 60, 38, 200)).toBe(38)
  })
})

describe('classifyFit', () => {
  it('classifica ok/tight/overflow por razao', () => {
    expect(classifyFit(90, 100)).toBe('ok')
    expect(classifyFit(100, 100)).toBe('tight')
    expect(classifyFit(130, 100)).toBe('overflow')
  })
})

describe('validateApprovedHeadline (so SINALIZA overflow por formato)', () => {
  it('headline curta cabe nos 3 formatos', () => {
    for (const fmt of ['1:1', '9:16', '1.91:1']) {
      expect(validateApprovedHeadline(fmt, 'CASA NOVA NA ORLA').status).not.toBe('overflow')
    }
  })

  it('DEMONSTRA o ponto cego da contagem de caracteres: N chars largos estouram (mesmo apos shrink), N estreitos cabem', () => {
    // Mesmo numero de caracteres, resultado oposto por causa da largura do glifo: o caminho largo
    // estoura mesmo apos o fitFontSize encolher ate o piso; o estreito nem precisa encolher.
    const wide = validateApprovedHeadline('1.91:1', 'W'.repeat(24))
    const narrow = validateApprovedHeadline('1.91:1', 'I'.repeat(24))
    expect(wide.estimatedPx).toBeGreaterThan(narrow.estimatedPx)
    expect(wide.status).toBe('overflow')
    expect(narrow.status).toBe('ok')
  })

  it('documenta o cap real de quebra da Edge (1.91:1=18, demais=24) — divergente do headlineChars do layout', () => {
    expect(approvedHeadlineWrapChars('1.91:1')).toBe(18)
    expect(approvedHeadlineWrapChars('1:1')).toBe(24)
    expect(approvedHeadlineWrapChars('9:16')).toBe(24)
  })
})
