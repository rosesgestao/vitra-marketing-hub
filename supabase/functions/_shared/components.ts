// Vitra Creative Components (Etapa 2 da spec) — builders de COMPONENTE únicos, compartilhados por todas
// as famílias, para acabar com a duplicação (cada template tinha seu price/cta/badge/logo). PUROS
// (produzem string SVG, sem depender de helpers do render-asset) → testáveis em Deno + Vitest. Consomem
// os design tokens (Etapa 1) como fonte única de tamanho/proporção.
import { logoDims, type FormatKind } from "./designTokens.ts";

// ── LOGO ────────────────────────────────────────────────────────────────────────────────────────────
// Wordmark VITRA (PNG oficial aprovado — decisão de marca: canônico único, aspecto 2538×434). Largura
// CANÔNICA por formato (DS_LOGO via logoDims); posição por `y` + (centrada no eixo `cx` OU em `x`).
// Retorna markup + box (para o Creative Lint declarar a logo como elemento crítico).
export function logoBlock(
  hrefPng: string,
  W: number,
  kind: FormatKind,
  opts: { y: number; centered?: boolean; x?: number; cx?: number },
): { markup: string; box: { x: number; y: number; w: number; h: number } } {
  const { w, h } = logoDims(W, kind);
  const cx = opts.cx ?? Math.round(W / 2);
  const x = opts.centered ? Math.round(cx - w / 2) : Math.round(opts.x ?? 0);
  const markup = `<image href="${hrefPng}" x="${x}" y="${opts.y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  return { markup, box: { x, y: opts.y, w, h } };
}
