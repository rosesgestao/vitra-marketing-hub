// Funcoes puras de ajuste/medida de texto da fabrica de criativos, extraidas de
// render-asset/index.ts (Fase 2/3 — harness de overflow). Sem imports Deno/npm: para poderem
// ser importadas tanto pela Edge (Deno) quanto pelos testes Vitest (Node) do dashboard.
//
// As 4 primeiras funcoes sao MOVIDAS VERBATIM da Edge (mesma logica que renderiza hoje); o
// estimador de largura por glifo e o validador de overflow sao NOVOS (so SINALIZAM, nao mudam
// pixel). O objetivo e ter rede de seguranca testavel antes de mexer nos caps/heuristicas.

export const DIMS: Record<string, [number, number]> = {
  "1:1": [1080, 1080],
  "9:16": [1080, 1920],
  "4:5": [1080, 1350],
  "16:9": [1280, 720],
  "1.91:1": [1200, 628],
  "desktop": [1200, 630],
};

export function compactText(value: unknown, max = 120) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

export function wrapText(value: unknown, maxChars: number, maxLines: number) {
  // Fase 2 (P2): preenche cada linha ate maxChars e, se o texto exceder maxLines,
  // trunca a ultima linha com reticencias (em vez de cortar palavras no meio e
  // descartar o resto silenciosamente).
  const words = String(value ?? "").replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let idx = 0;
  for (; idx < words.length; idx++) {
    const word = words[idx];
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) { line = ""; break; }
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) { lines.push(line); idx = words.length; }
  if (idx < words.length && lines.length) {
    let tail = lines[lines.length - 1];
    while (tail.length > 0 && tail.length + 1 > maxChars) tail = tail.slice(0, -1);
    lines[lines.length - 1] = `${tail.replace(/[\s….,;:!?-]+$/, "")}…`;
  }
  return lines.slice(0, maxLines);
}

export function textSizeForWidth(text: unknown, base: number, min: number, idealChars: number) {
  const length = String(text ?? "").replace(/\s+/g, " ").trim().length;
  if (!length || length <= idealChars) return base;
  return Math.max(min, Math.round(base * (idealChars / length)));
}

export function approvedTemplateLayout(ar: string) {
  if (ar === "9:16") {
    return {
      logo: [285, 110, 510, 170],
      headline: [540, 345, 72, 72, 24, 2],
      description: [540, 490, 28, 86],
      price: [260, 515, 560, 58],
      photos: [[135, 650, 810, 420, 54], [135, 1096, 810, 420, 54]],
      features: [[540, 1580, "middle"], [540, 1635, "middle"]],
      cta: [235, 1708, 610, 72, 1760, 28],
      slogan: [540, 1830, 16, 8],
    };
  }
  if (ar === "1.91:1") {
    return {
      logo: [70, 50, 330, 110],
      headline: [335, 205, 54, 55, 24, 2],
      description: [335, 320, 22, 70],
      price: [95, 344, 500, 50],
      photos: [[735, 70, 370, 236, 34], [735, 332, 370, 236, 34]],
      features: [[95, 455, "start"], [95, 498, "start"]],
      cta: [120, 535, 430, 48, 566, 18],
      slogan: null,
    };
  }
  return {
    logo: [360, 78, 360, 120],
    headline: [540, 272, 65, 64, 25, 2],
    description: [540, 374, 24, 82],
    price: [285, 398, 510, 58],
    photos: [[135, 428, 385, 310, 46], [560, 428, 385, 310, 46]],
    features: [[135, 810, "start"], [560, 810, "start"]],
    cta: [300, 852, 480, 64, 895, 21],
    slogan: [540, 948, 13, 7],
  };
}

// --- NOVO: estimador de largura por glifo + validador de overflow (so sinaliza) ---

// Avanco aproximado (em "em", isto e, fracao do tamanho da fonte) por caractere para Inter Bold
// em CAIXA ALTA — que e como as headlines da arte sao desenhadas (.toUpperCase()). Aproximacao
// calibrada a olho a partir de metricas tipicas do Inter; o ponto e capturar que glifos largos
// (M/W) ocupam ~3x o de um I, algo que a contagem de caracteres ignora por completo.
const GLYPH_ADVANCE_EM: Record<string, number> = {
  A: 0.68, B: 0.66, C: 0.68, D: 0.71, E: 0.61, F: 0.59, G: 0.72, H: 0.74, I: 0.29, J: 0.54,
  K: 0.66, L: 0.58, M: 0.88, N: 0.74, O: 0.75, P: 0.64, Q: 0.75, R: 0.67, S: 0.63, T: 0.62,
  U: 0.72, V: 0.66, W: 0.96, X: 0.65, Y: 0.63, Z: 0.62,
  "0": 0.62, "1": 0.62, "2": 0.62, "3": 0.62, "4": 0.62, "5": 0.62,
  "6": 0.62, "7": 0.62, "8": 0.62, "9": 0.62,
  " ": 0.28, ".": 0.30, ",": 0.30, ":": 0.30, ";": 0.30, "!": 0.30, "?": 0.52,
  "-": 0.40, "/": 0.40, "$": 0.62, "%": 0.95,
};
const DEFAULT_ADVANCE_EM = 0.60;

export function estimateTextWidthEm(text: unknown) {
  const upper = String(text ?? "").toUpperCase();
  let em = 0;
  for (const ch of upper) em += GLYPH_ADVANCE_EM[ch] ?? DEFAULT_ADVANCE_EM;
  return em;
}

export function estimateTextWidthPx(text: unknown, sizePx: number) {
  return estimateTextWidthEm(text) * sizePx;
}

// Largura util (px) disponivel para a HEADLINE por formato no template aprovado base. A headline
// e desenhada com anchor "middle" (centralizada em headlineX — textLine default, index.ts:386):
//  - 1:1   centralizada em x=540 (canvas 1080) -> ~960px uteis (margem ~60 cada lado).
//  - 9:16  centralizada em x=540 (canvas 1080) -> ~980px.
//  - 1.91:1 centralizada em x=335, limitada pela BORDA ESQUERDA (largura <= 2*335=670), com as
//    fotos comecando em x=735; orcamento ~630px (670 menos margem de safe-zone). E o mais apertado.
const HEADLINE_BUDGET_PX: Record<string, number> = {
  "1:1": 960,
  "9:16": 980,
  "1.91:1": 630,
};

export function approvedHeadlineBudgetPx(format: string) {
  return HEADLINE_BUDGET_PX[format] ?? DIMS[format]?.[0] ?? 1080;
}

// Maior tamanho de fonte <= baseSize cuja LARGURA estimada do texto cabe em budgetPx, com piso
// minSize. Substitui o encolhimento por contagem de caracteres (que ignora a largura real do glifo:
// um "W" ocupa ~3x um "I"). Usado tanto pela arte (render-asset) quanto pela validacao do harness,
// garantindo que detecte e renderize com a MESMA logica.
export function fitFontSize(text: string, baseSize: number, minSize: number, budgetPx: number) {
  const estimated = estimateTextWidthPx(text, baseSize);
  if (estimated <= budgetPx) return baseSize;
  return Math.max(minSize, Math.floor(baseSize * (budgetPx / estimated)));
}

// Cap de caracteres por linha da headline aprovada, alinhado ao headlineChars do layout (25/24/24).
// Antes o 1.91:1 era 18 fixo (truncava headlines longas); com o fitFontSize cuidando da largura, o
// cap segue o layout e a fonte encolhe para caber. Espelha render-asset (wrapText(headline, layout.headline[4], 2)).
export function approvedHeadlineWrapChars(format: string) {
  return (approvedTemplateLayout(format).headline as number[])[4] || 24;
}

export type FitStatus = "ok" | "tight" | "overflow";

export function classifyFit(estimatedPx: number, availablePx: number): FitStatus {
  const ratio = estimatedPx / availablePx;
  if (ratio <= 0.95) return "ok";
  if (ratio <= 1.05) return "tight";
  return "overflow";
}

// Tamanho de fonte REAL que a Edge usa por linha da headline aprovada (espelha render-asset): agora
// por LARGURA estimada via fitFontSize (piso 38px), nao mais por contagem de caracteres. Assim o
// harness valida com a mesma logica que a arte renderiza.
export function approvedHeadlineRenderSize(format: string, line: string) {
  const baseSize = (approvedTemplateLayout(format).headline as number[])[2];
  return fitFontSize(line, baseSize, 38, approvedHeadlineBudgetPx(format));
}

// Valida (apenas SINALIZA) se a headline aprovada cabe na largura util do formato. Quebra o texto
// com a MESMA logica/cap da Edge, aplica o MESMO encolhimento de fonte por linha e estima a largura
// da linha mais larga, classificando ok/tight/overflow.
export function validateApprovedHeadline(format: string, text: string) {
  const headline = approvedTemplateLayout(format).headline as number[];
  const maxLines = headline[5];
  const capChars = approvedHeadlineWrapChars(format);
  const lines = wrapText(text, capChars, maxLines);
  const widestPx = lines.reduce(
    (max, line) => Math.max(max, estimateTextWidthPx(line, approvedHeadlineRenderSize(format, line))),
    0,
  );
  const availablePx = HEADLINE_BUDGET_PX[format] ?? DIMS[format]?.[0] ?? 1080;
  return {
    format,
    text,
    lines,
    estimatedPx: Math.round(widestPx),
    availablePx,
    ratio: Number((widestPx / availablePx).toFixed(2)),
    status: classifyFit(widestPx, availablePx),
  };
}
