import { describe, it, expect } from 'vitest'
import {
  flattenImages,
  rotateItems,
  selectTemplateVariationImage,
} from '../premiumData.js'

// Baseline da distribuicao de fotos do imovel entre variacoes/cortes.
// Documenta o comportamento ATUAL (indice global, sem semantica de slot),
// que sera corrigido na Fase 2 (selecao slot-aware).

describe('flattenImages', () => {
  it('achata os slots numa lista unica e remove vazios', () => {
    const result = flattenImages({ fachada: ['a'], living: ['b', 'c'], extras: [] })
    expect(result).toEqual(['a', 'b', 'c'])
  })
  it('descarta null/undefined', () => {
    expect(flattenImages({ a: [null, 'b'], c: [undefined] })).toEqual(['b'])
  })
  it('retorna [] para objeto vazio ou ausente', () => {
    expect(flattenImages({})).toEqual([])
    expect(flattenImages()).toEqual([])
  })
})

describe('rotateItems', () => {
  it('rotaciona pelo offset', () => {
    expect(rotateItems(['a', 'b', 'c'], 0)).toEqual(['a', 'b', 'c'])
    expect(rotateItems(['a', 'b', 'c'], 1)).toEqual(['b', 'c', 'a'])
  })
  it('usa modulo do tamanho da lista', () => {
    expect(rotateItems(['a', 'b', 'c'], 4)).toEqual(['b', 'c', 'a'])
  })
  it('retorna [] para lista vazia', () => {
    expect(rotateItems([], 2)).toEqual([])
  })
})

describe('selectTemplateVariationImage (formatOffset feed/story/wide)', () => {
  const imgs = ['i0', 'i1', 'i2', 'i3']

  it('aplica offset por formato: feed=0, story=1, wide=2', () => {
    const c = { variation_index: 0 }
    expect(selectTemplateVariationImage(imgs, c, 'feed', 0)).toBe('i0')
    expect(selectTemplateVariationImage(imgs, c, 'story', 0)).toBe('i1')
    expect(selectTemplateVariationImage(imgs, c, 'wide', 0)).toBe('i2')
  })

  it('soma o indice da variacao ao offset do formato (indice GLOBAL - baseline)', () => {
    expect(selectTemplateVariationImage(imgs, { variation_index: 1 }, 'feed', 0)).toBe('i1')
    expect(selectTemplateVariationImage(imgs, { variation_index: 2 }, 'story', 0)).toBe('i3')
  })

  it('retorna null quando nao ha imagens', () => {
    expect(selectTemplateVariationImage([], { variation_index: 0 }, 'feed', 0)).toBeNull()
  })
})
