// Vitra Creative Lint (P0) — validação visual OBJETIVA de um criativo, a partir de um "relatório de
// layout" (lista de elementos posicionados). PURO (Deno + Vitest). É o gate que reprova criativos com
// problemas estruturais ANTES da aprovação — pega exatamente os erros que vazavam "no olho":
//   - elemento crítico fora da safe-zone do Meta;
//   - colisão entre blocos de topo (ex.: o selo atrás do herói);
//   - texto sobre a foto SEM placa/scrim controlado (rodapé ilegível);
//   - texto que encolheu até o mínimo (provável overflow);
//   - copy acima do limite de caracteres;
//   - hierarquia quebrada (o herói não é o maior elemento de display).
import { type Box, type FormatSpec, withinSafe, overlapArea } from "./creativeDesign.ts";
import { maxVerticalGap } from "./layoutKit.ts";

export interface LintElement {
  role: string;
  box: Box;
  critical?: boolean;   // precisa caber na safe-zone
  block?: boolean;      // bloco de TOPO (entra na checagem de colisão entre irmãos; filhos não)
  display?: boolean;    // participa da hierarquia tipográfica (tem peso/destaque)
  fontSize?: number; minFont?: number;
  charLen?: number; charLimit?: number;
  overImage?: boolean;  // está sobre a foto (não sobre uma superfície navy)
  hasScrim?: boolean;   // há placa/scrim controlado atrás (garante contraste)
  // v2 (determinismo de composição):
  fill?: number;        // fração [0..1] da largura interna do container preenchida pelo conteúdo
  minFill?: number;     // preenchimento mínimo exigido (reprova vazio lateral sem função)
  maxFill?: number;     // preenchimento máximo (fill>max ⇒ texto encostando/excedendo o container)
  secondary?: boolean;  // texto secundário (barra/rodapé) — referência p/ a proeminência do preço
  isLogo?: boolean;     // é a logo da marca (checa presença quando requireLogo)
  textLeft?: number;    // x óptico da 1ª letra (para checar o eixo de alinhamento entre textos)
  onAxis?: boolean;     // participa do eixo de alinhamento comum (com textLeft)
}

export interface LintReport { ok: boolean; errors: string[]; warnings: string[]; metrics?: Record<string, number> }

// Opções v2 (por formato/template). Ausentes → a regra correspondente é ignorada (retrocompatível).
export interface LintOptions {
  gapCap?: number;       // maior faixa morta vertical tolerada (px) entre blocos de topo
  priceMinRatio?: number; // altura do preço ≥ ratio × maior texto secundário
  requireLogo?: boolean;  // exige uma logo presente
  axisTol?: number;       // desvio máximo (px) entre os eixos ópticos dos textos onAxis
}

// Fração da menor caixa a partir da qual uma sobreposição conta como colisão real (evita falso-positivo
// por encostar 1px). Blocos pai/filho NÃO entram aqui (só elementos marcados block:true).
const OVERLAP_TOL = 0.06;

export function lintCreative(safe: FormatSpec["safe"], elements: LintElement[], opts: LintOptions = {}): LintReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metrics: Record<string, number> = {};

  // 1) Safe-zone: todo elemento crítico dentro.
  for (const e of elements) {
    if (e.critical && !withinSafe(e.box, safe)) errors.push(`safe_zone:${e.role}`);
  }

  // 2) Colisão entre blocos de topo.
  const blocks = elements.filter((e) => e.block);
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      const minArea = Math.min(a.box.w * a.box.h, b.box.w * b.box.h);
      if (minArea > 0 && overlapArea(a.box, b.box) > minArea * OVERLAP_TOL) {
        errors.push(`overlap:${a.role}x${b.role}`);
      }
    }
  }

  // 3) Overflow: a fonte encolheu até o mínimo (texto provavelmente não coube).
  for (const e of elements) {
    if (e.fontSize != null && e.minFont != null && e.fontSize <= e.minFont) {
      errors.push(`overflow:${e.role}`);
    }
  }

  // 4) Limite de caracteres da copy por slot.
  for (const e of elements) {
    if (e.charLen != null && e.charLimit != null && e.charLen > e.charLimit) {
      errors.push(`char_limit:${e.role}`);
    }
  }

  // 5) Contraste: texto sobre a foto SEM scrim controlado.
  for (const e of elements) {
    if (e.overImage && !e.hasScrim) errors.push(`contrast_no_scrim:${e.role}`);
  }

  // 6) Hierarquia: o herói deve ser o MAIOR elemento de display.
  const displays = elements.filter((e) => e.display && e.fontSize != null);
  const hero = displays.find((e) => e.role === "hero");
  if (hero) {
    for (const e of displays) {
      if (e !== hero && (e.fontSize as number) > (hero.fontSize as number)) {
        errors.push(`hierarchy:hero_smaller_than_${e.role}`);
        break;
      }
    }
  }

  // 7) Preenchimento: conteúdo que deixa vazio lateral sem função dentro do próprio container
  // (ex.: valor curto numa placa larga, texto centralizado numa barra full-width). REPROVA.
  // E o inverso: fill acima do teto ⇒ texto encostando/excedendo a borda do container (overflow).
  for (const e of elements) {
    if (e.fill != null && (e.minFill != null || e.maxFill != null)) {
      metrics[`fill_${e.role}`] = Number(e.fill.toFixed(2));
      if (e.minFill != null && e.fill < e.minFill) errors.push(`underfill:${e.role}`);
      if (e.maxFill != null && e.fill > e.maxFill) errors.push(`overflow:${e.role}`);
    }
  }

  // 7b) Eixo de alinhamento: os textos marcados onAxis devem partir do MESMO x óptico (± axisTol).
  if (opts.axisTol != null) {
    const lefts = elements.filter((e) => e.onAxis && e.textLeft != null).map((e) => e.textLeft as number);
    if (lefts.length > 1) {
      const spread = Math.max(...lefts) - Math.min(...lefts);
      metrics.axis_spread = Math.round(spread);
      if (spread > opts.axisTol) errors.push(`axis_misaligned:${Math.round(spread)}>${opts.axisTol}`);
    }
  }

  // 8) Faixa morta: maior folga vertical entre blocos de topo acima do teto do formato. REPROVA.
  if (opts.gapCap != null) {
    const gap = maxVerticalGap(elements.filter((e) => e.block).map((e) => ({ y: e.box.y, h: e.box.h })));
    metrics.max_gap = gap;
    if (gap > opts.gapCap) errors.push(`dead_gap:${gap}>${opts.gapCap}`);
  }

  // 9) Destaque do preço: o preço deve ser sensivelmente maior que o maior texto secundário. REPROVA.
  if (opts.priceMinRatio != null) {
    const price = elements.find((e) => e.role === "price" && e.fontSize != null);
    const secMax = elements.filter((e) => e.secondary && e.fontSize != null)
      .reduce((m, e) => Math.max(m, e.fontSize as number), 0);
    if (price && secMax > 0) {
      const ratio = (price.fontSize as number) / secMax;
      metrics.price_ratio = Number(ratio.toFixed(2));
      if (ratio < opts.priceMinRatio) errors.push(`price_weak:${ratio.toFixed(2)}<${opts.priceMinRatio}`);
    }
  }

  // 10) Logo: presença obrigatória (identidade da marca). REPROVA se ausente.
  if (opts.requireLogo && !elements.some((e) => e.isLogo)) errors.push("logo_missing");

  return { ok: errors.length === 0, errors, warnings, metrics };
}
