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
}

export interface LintReport { ok: boolean; errors: string[]; warnings: string[] }

// Fração da menor caixa a partir da qual uma sobreposição conta como colisão real (evita falso-positivo
// por encostar 1px). Blocos pai/filho NÃO entram aqui (só elementos marcados block:true).
const OVERLAP_TOL = 0.06;

export function lintCreative(safe: FormatSpec["safe"], elements: LintElement[]): LintReport {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  return { ok: errors.length === 0, errors, warnings };
}
