// Vitra Creative Design System (P0) — tokens, grade e geometria. PURO (sem APIs de runtime),
// compartilhado entre o Edge (render-asset) e o Vitest. É a FONTE ÚNICA das regras visuais dos
// criativos: cores, tipografia, escala de espaçamento, raios e a SAFE ZONE por formato. Os templates
// passam a compor sobre estes tokens em vez de números mágicos soltos.

export const DS_COLORS = {
  navyTop: "#11264A",
  navy: "#0A1628",
  navyMid: "#0F2140",
  navyDeep: "#07111F",
  gold: "#C4942A",
  goldLight: "#F0C95C",
  white: "#FFFFFF",
  offWhite: "#F5F5F0",
  ink: "#07111F",
  textMuted: "rgba(255,255,255,0.88)",
  textFaint: "rgba(255,255,255,0.66)",
} as const;

export const DS_FONT = { display: "Anton", body: "Inter" } as const;

// Escala de espaçamento — base 8. Use múltiplos (space(1)=8, space(2)=16, ...) para o ritmo vertical.
export function space(n: number): number { return Math.round(n * 8); }

export const DS_RADII = { panel: 26, panelWide: 18, pill: 999, badge: 999, bar: 10 } as const;

export type FormatKind = "feed" | "story" | "wide";

export interface Box { x: number; y: number; w: number; h: number }

export interface FormatSpec {
  W: number; H: number; kind: FormatKind;
  margin: number; cx: number;
  safe: Box;
}

// Canvas + margem + SAFE ZONE do Meta por formato (skill margem-seguranca-criativos):
// 1:1 margem ~6,5%; 9:16 reels-safe y[250..1470] x[35..1045]; 1.91:1 (1200x628) x[89..1111] y[63..564].
export function formatSpec(W: number, H: number): FormatSpec {
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const kind: FormatKind = isStory ? "story" : isWide ? "wide" : "feed";
  // 1:1 (feed) tem chrome mínimo na Meta → margem de 5%; story/wide têm safe-zone própria (abaixo).
  const margin = isWide ? 72 : Math.round(W * 0.05);
  const safe: Box = isStory
    ? { x: 35, y: 250, w: W - 70, h: 1470 - 250 }
    : isWide
    ? { x: 72, y: 63, w: W - 144, h: 564 - 63 } // 1.91:1 feed mostra a imagem inteira → margem 6% (72px)
    : { x: margin, y: margin, w: W - margin * 2, h: H - margin * 2 };
  return { W, H, kind, margin, cx: Math.round(W / 2), safe };
}

// A caixa cabe DENTRO da safe-zone? (tol = folga em px para arredondamentos).
export function withinSafe(box: Box, safe: Box, tol = 2): boolean {
  return box.x >= safe.x - tol && box.y >= safe.y - tol &&
    box.x + box.w <= safe.x + safe.w + tol && box.y + box.h <= safe.y + safe.h + tol;
}

// Área de interseção entre duas caixas (0 se não se tocam).
export function overlapArea(a: Box, b: Box): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}
