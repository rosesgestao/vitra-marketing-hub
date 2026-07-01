// Vitra Layout Kit (P0 — determinismo de composição). Funções PURAS (Deno + Vitest) que substituem
// números mágicos por decisões de layout auto-equilibrantes: crescer o texto para PREENCHER um
// container (não só encolher), medir o preenchimento real, centralizar um grupo e distribuir blocos
// na vertical sem faixas mortas. É a camada que faz o criativo "nascer equilibrado"; o creativeLint
// (v2) é quem PROVA — usando as mesmas medidas daqui.
//
// Modelo de largura: reutiliza estimateTextWidthPx + fitFontSize de textFit.ts (mesma lógica que a
// arte já renderiza). O `factor` espelha o fitDisplaySize da Edge (Anton/Inter display): a largura
// efetiva de um texto é estimateTextWidthPx * factor, e o orçamento de fit é width / factor.
import { estimateTextWidthPx, fitFontSize } from "./textFit.ts";

// Largura medida (px) de um texto num dado tamanho, no MESMO modelo do fit da Edge.
export function measuredWidthPx(text: unknown, sizePx: number, factor = 1): number {
  return estimateTextWidthPx(text, sizePx) * factor;
}

// Maior tamanho ≤ max cujo texto PREENCHE (cabe em) widthPx, com piso min. Diferente do
// fit-to-shrink: aqui o `max` é generoso de propósito, então textos curtos CRESCEM até encostar na
// largura do container (mata o vazio lateral) e textos longos encolhem para caber (mata o overflow).
export function fitFillSize(
  text: unknown,
  opts: { min: number; max: number; widthPx: number; factor?: number },
): number {
  const factor = opts.factor ?? 1;
  return fitFontSize(String(text ?? ""), opts.max, opts.min, Math.round(opts.widthPx / factor));
}

// Fração [0..1] da largura interna do container preenchida pelo conteúdo. É a métrica que o
// validador usa para reprovar placas/barras com vazio lateral sem função.
export function fillRatio(contentWidthPx: number, containerInnerWidthPx: number): number {
  if (!(containerInnerWidthPx > 0)) return 0;
  return Math.max(0, Math.min(1.5, contentWidthPx / containerInnerWidthPx));
}

// X inicial para centralizar um grupo de largura groupW dentro de [containerX, containerX+containerW].
export function centerStartX(containerX: number, containerW: number, groupW: number): number {
  return Math.round(containerX + Math.max(0, (containerW - groupW) / 2));
}

// Distribui N blocos (por altura) dentro da banda vertical [top, bottom] com folgas IGUAIS (n+1
// folgas: topo, entre-blocos e base). Elimina a "faixa morta" única — o espaço vago vira respiro
// uniforme. Se o conteúdo não couber, a folga é limitada a um mínimo e o overflow fica para o lint pegar.
export function distributeV(
  top: number,
  bottom: number,
  heights: number[],
  minGap = 8,
): { tops: number[]; gap: number } {
  const totalH = heights.reduce((s, h) => s + h, 0);
  const slack = (bottom - top) - totalH;
  const gap = Math.max(minGap, slack / (heights.length + 1));
  const tops: number[] = [];
  let y = top + gap;
  for (const h of heights) {
    tops.push(Math.round(y));
    y += h + gap;
  }
  return { tops, gap: Math.round(gap) };
}

// Maior folga vertical entre blocos consecutivos (ordenados por topo). Usado pelo validador para
// reprovar faixas mortas. `blocks` = caixas {y, h} de blocos de topo (full-width ou empilhados).
export function maxVerticalGap(blocks: Array<{ y: number; h: number }>): number {
  const sorted = [...blocks].sort((a, b) => a.y - b.y);
  let max = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].y - (sorted[i - 1].y + sorted[i - 1].h);
    if (gap > max) max = gap;
  }
  return Math.round(max);
}
