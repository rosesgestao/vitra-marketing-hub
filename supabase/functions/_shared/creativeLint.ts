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
  // v3 (contraste WCAG real sobre superfície sólida): cor do texto e do fundo (#hex sólido).
  textColor?: string;
  bgColor?: string;
}

// v3: três níveis de severidade. `errors` BLOQUEIA (ok=false); `warnings`/`recommendations` são
// consultivos (não afetam ok) — o operador vê, mas o criativo não é barrado por eles.
export interface LintReport { ok: boolean; errors: string[]; warnings: string[]; recommendations: string[]; metrics?: Record<string, number> }

// Opções v2/v3 (por formato/template). Ausentes → a regra correspondente é ignorada (retrocompatível).
export interface LintOptions {
  gapCap?: number;       // maior faixa morta vertical tolerada (px) entre blocos de topo
  priceMinRatio?: number; // altura do preço ≥ ratio × maior texto secundário
  requireLogo?: boolean;  // exige uma logo presente
  axisTol?: number;       // desvio máximo (px) entre os eixos ópticos dos textos onAxis
  minLogoGap?: number;    // v3: folga vertical MÍNIMA entre a base da logo e a headline/herói abaixo dela
}

// Fração da menor caixa a partir da qual uma sobreposição conta como colisão real (evita falso-positivo
// por encostar 1px). Blocos pai/filho NÃO entram aqui (só elementos marcados block:true).
const OVERLAP_TOL = 0.06;

// v3 — conformidade de token (nível ALERTA): varre o SVG FINAL por CORES (#hex) e FONTES fora da paleta
// do design system. Diferente das demais regras (geometria), opera na STRING de saída. Ignora `none`,
// gradientes por url() e alphas rgba() (tratados à parte). Retorna avisos `token_color:#..`/`token_font:..`.
export function tokenConformance(svg: string, palette: Set<string>, fonts: Set<string>): string[] {
  const out: string[] = [];
  const colors = new Set<string>();
  for (const m of svg.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-fA-F]{6})"/g)) {
    const hex = m[1].toUpperCase();
    if (!palette.has(hex)) colors.add(hex);
  }
  for (const c of [...colors].sort()) out.push(`token_color:${c}`);
  const fam = new Set<string>();
  for (const m of svg.matchAll(/font-family="([^"]+)"/g)) {
    // fonte PRIMÁRIA do stack ("Inter, Arial, sans-serif" → "Inter"); fallbacks não contam.
    const f = m[1].split(",")[0].trim().replace(/^['"]|['"]$/g, "");
    if (f && !fonts.has(f)) fam.add(f);
  }
  for (const f of [...fam].sort()) out.push(`token_font:${f}`);
  return out;
}

// v3 — contraste WCAG real entre duas cores sólidas (#hex). Luminância relativa (sRGB) → razão de
// contraste (hi+0.05)/(lo+0.05). Usado para texto sobre SUPERFÍCIE sólida (placa/chip/pílula/painel);
// texto sobre FOTO segue pela heurística de scrim (contrast_no_scrim), pois exige amostrar a imagem.
function relLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const ch = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}
export function contrastRatio(fg: string, bg: string): number {
  const a = relLuminance(fg), b = relLuminance(bg);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

export function lintCreative(safe: FormatSpec["safe"], elements: LintElement[], opts: LintOptions = {}): LintReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
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

  // 12) Contraste WCAG real (ERRO) entre texto e a SUPERFÍCIE SÓLIDA sob ele (quando ambas as cores são
  // declaradas). Limiar: 4.5:1 (texto normal) ou 3:1 (texto grande/display, ≥24px). Texto sobre foto não
  // entra aqui (usa scrim). Grava `contrast_{role}`.
  const HEX = /^#[0-9a-fA-F]{6}$/;
  for (const e of elements) {
    if (e.textColor && e.bgColor && HEX.test(e.textColor) && HEX.test(e.bgColor)) {
      const ratio = contrastRatio(e.textColor, e.bgColor);
      metrics[`contrast_${e.role}`] = Number(ratio.toFixed(2));
      const large = (e.fontSize ?? 0) >= 24 || !!e.display;
      const min = large ? 3 : 4.5;
      if (ratio < min) errors.push(`contrast:${e.role}:${ratio.toFixed(2)}<${min}`);
    }
  }

  // 11) Aperto logo↔headline (nível ALERTA): a headline/herói encostando na logo quando estão na mesma
  // coluna (achado do hero-checklist: a logo canônica crescia e colava na headline). Só quando há
  // sobreposição horizontal entre a logo e o texto principal — logos em coluna oposta (ex.: topo-direito)
  // não disparam. É ALERTA (não bloqueia): a folga "apertada porém ok" varia por peça (ex.: banner 1.91:1
  // é denso). Grava a métrica `logo_gap` para auditoria; promover a ERRO exige limiar calibrado por arquétipo.
  if (opts.minLogoGap != null) {
    const logo = elements.find((e) => e.isLogo);
    const head = elements.find((e) => e.role === "headline" || e.role === "hero");
    if (logo && head) {
      const lb = logo.box.y + logo.box.h;
      const ox = Math.max(0, Math.min(logo.box.x + logo.box.w, head.box.x + head.box.w) - Math.max(logo.box.x, head.box.x));
      if (ox > 0 && head.box.y >= lb - 2) {
        const gap = head.box.y - lb;
        metrics.logo_gap = Math.round(gap);
        if (gap < opts.minLogoGap) warnings.push(`logo_crowding:${head.role}:${Math.round(gap)}<${opts.minLogoGap}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings, recommendations, metrics };
}
