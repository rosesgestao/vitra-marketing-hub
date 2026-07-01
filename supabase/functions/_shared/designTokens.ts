// Vitra Design Tokens (Etapa 1 da spec — fundação do sistema determinístico). PURO (Deno + Vitest).
// Estende creativeDesign.ts com a ESCALA que faltava virar token: tipografia (papel→faixa+peso+lh),
// pesos, strokes, paddings, sombra, tratamento de imagem, logo e grid. É a FONTE ÚNICA desses valores —
// nenhum builder deve ter literal de tamanho/peso/spacing/stroke/raio-de-logo. O objetivo é remover a
// deriva que sobrava família a família (logos com tamanhos distintos, pesos soltos, cores fora do token).
//
// Reexporta os tokens já existentes de creativeDesign.ts para haver UMA superfície de import.
import type { FormatKind } from "./creativeDesign.ts";
export { DS_COLORS, DS_FONT, DS_RADII, space, formatSpec, withinSafe, overlapArea } from "./creativeDesign.ts";
export type { FormatKind, Box, FormatSpec } from "./creativeDesign.ts";

// Versão do design system — gravada no render_trace (Etapa 5) e travada por template (schema, Etapa 3).
export const DS_VERSION = "ds-2026-07" as const;

// ── TIPOGRAFIA ────────────────────────────────────────────────────────────────────────────────────
// Papel → família/peso/faixa de tamanho (px no canvas real)/line-height/tracking. `min`/`max` são os
// limites que alimentam o fit (fitFillSize/fitDisplaySize); a arte cresce/encolhe DENTRO dessa faixa.
export interface TypeToken { family: "Anton" | "Inter"; weight: number; min: number; max: number; lh: number; tracking: number }
export const DS_TYPE: Record<string, TypeToken> = {
  hero:     { family: "Anton", weight: 400, min: 64, max: 150, lh: 0.92, tracking: 0 },
  headline: { family: "Anton", weight: 400, min: 30, max: 96,  lh: 1.02, tracking: 0 },
  price:    { family: "Anton", weight: 400, min: 40, max: 120, lh: 1.00, tracking: 0 },
  subtitle: { family: "Inter", weight: 500, min: 20, max: 34,  lh: 1.25, tracking: 0 },
  label:    { family: "Inter", weight: 700, min: 14, max: 24,  lh: 1.20, tracking: 0.14 },
  body:     { family: "Inter", weight: 500, min: 15, max: 22,  lh: 1.35, tracking: 0 },
  cta:      { family: "Inter", weight: 700, min: 20, max: 32,  lh: 1.00, tracking: 0 },
  footnote: { family: "Inter", weight: 500, min: 14, max: 30,  lh: 1.20, tracking: 0 },
  badge:    { family: "Inter", weight: 800, min: 11, max: 15,  lh: 1.00, tracking: 0.14 },
};

// ── PESOS ─────────────────────────────────────────────────────────────────────────────────────────
export const DS_WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700, black: 800 } as const;

// ── BORDAS / STROKES (px) ───────────────────────────────────────────────────────────────────────────
export const DS_STROKE = { hairline: 1.2, panel: 1.4, frame: 2 } as const;

// ── PADDING INTERNO dos containers (px) ─────────────────────────────────────────────────────────────
export const DS_PADDING = { plate: 24, panel: 28, pill: 28, card: 22, badge: 15 } as const;

// ── SOMBRA (sintética — Resvg tem suporte limitado a <filter>; usar como offset-rect, não blur real) ──
export const DS_SHADOW = {
  plate: { dy: 8, blur: 24, color: "rgba(7,17,31,0.28)" },
  pill:  { dy: 6, blur: 18, color: "rgba(7,17,31,0.22)" },
} as const;

// ── TRATAMENTO DE IMAGEM ────────────────────────────────────────────────────────────────────────────
// ratio = fração do eixo dominante ocupada pela FOTO (min..max) por formato; minLumaContrast = razão de
// luminância mínima texto↔fundo (WCAG, para a regra de contraste real da Etapa 4); grade = camada navy.
export const DS_IMAGE = {
  ratio: { feed: [0.30, 0.55], story: [0.35, 0.60], wide: [0.40, 0.70] } as Record<FormatKind, [number, number]>,
  minLumaContrast: 4.5,
  grade: "navy",
} as const;

// ── LOGO ────────────────────────────────────────────────────────────────────────────────────────────
// Largura da logo = fração canônica da largura do canvas, POR FORMATO (uma fonte para todas as famílias
// — antes cada template tinha um px próprio: oferta 170/184/150, destino 156/168/138…). aspect = razão
// do wordmark oficial (2538×434).
export const DS_LOGO = {
  widthRatio: { feed: 0.150, story: 0.160, wide: 0.120 } as Record<FormatKind, number>,
  aspect: 434 / 2538,
} as const;

// Dimensões da logo (px) para um canvas W e formato. Determinístico: mesma entrada → mesma saída.
export function logoDims(W: number, kind: FormatKind): { w: number; h: number } {
  const w = Math.round(W * DS_LOGO.widthRatio[kind]);
  return { w, h: Math.round(w * DS_LOGO.aspect) };
}

// ── GRID / ÍCONES ───────────────────────────────────────────────────────────────────────────────────
export const DS_GRID = { cols: 12, gutter: 24 } as const;
export const DS_ICON = { set: "vitra-line", stroke: 2, size: { sm: 24, md: 32 }, noEmoji: true } as const;
