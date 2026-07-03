// Vitra Template Schemas (Etapa 3 da spec) — o CONTRATO formal de cada template como DADO, não código:
// arquétipo, componentes obrigatórios/opcionais, campos (limite de caracteres + fallback + prioridade),
// perfil de lint e o LAYOUT (posições/tamanhos por formato). PURO (Deno + Vitest). O builder passa a LER
// as zonas/contrato daqui em vez de decidir posição no código — "o motor não decide onde há regra".
//
// Migração família a família, byte-idêntico (os números do layout são os mesmos que estavam inline).
import { DS_VERSION, type FormatKind } from "./designTokens.ts";

export type Archetype = "left-anchored" | "centered" | "photo-forward";

// Contrato de um campo de texto: quanto cabe, o que fazer se faltar, e a ordem de sacrifício por espaço.
export interface FieldSpec { charLimit: number; fallback: "hide" | "derive" | string; priority: number }

// Opções de lint constantes por template (o gapCap é por-formato → vive no layout).
export interface LintProfile { priceMinRatio?: number; axisTol?: number; requireLogo?: boolean; minLogoGap?: number }

export interface TemplateSchema {
  id: string;
  family: string;
  archetype: Archetype;
  components: { required: string[]; optional: string[] };
  fields: Record<string, FieldSpec>;
  lint: LintProfile;
  approvedVariants: string[];
  dsVersion: string;
}

// ── oferta-ancora ────────────────────────────────────────────────────────────────────────────────────
// Layout POR FORMATO (px no canvas real). Mesmos números que estavam no builder — apenas relocados p/ dado.
export interface OfertaLayout {
  margin: number; logoY: number;
  headBase: number; headGap: number; headY: number; headBudget: number; headChars: number;
  bar: number[]; barSize: number;
  deY: number; deSize: number;
  box: number[]; boxLabel: number; boxValue: number;
  footY: number; footSize: number; gapCap: number;
}
export const OFERTA_LAYOUT: Record<FormatKind, OfertaLayout> = {
  feed: {
    margin: 90, logoY: 70,
    headBase: 82, headGap: 88, headY: 270, headBudget: 900, headChars: 15,
    bar: [90, 392, 900, 70], barSize: 28,
    deY: 580, deSize: 36,
    box: [90, 640, 900, 188], boxLabel: 46, boxValue: 92,
    footY: 930, footSize: 30, gapCap: 200,
  },
  story: {
    margin: 90, logoY: 272,
    headBase: 80, headGap: 86, headY: 470, headBudget: 900, headChars: 15,
    bar: [90, 720, 900, 70], barSize: 28,
    deY: 900, deSize: 36,
    box: [90, 940, 900, 200], boxLabel: 46, boxValue: 96,
    footY: 1230, footSize: 30, gapCap: 170,
  },
  wide: {
    // 1.91:1 alinhado à SAFE ZONE real do Meta (x≥89).
    margin: 89, logoY: 72,
    headBase: 48, headGap: 52, headY: 150, headBudget: 1022, headChars: 26,
    bar: [89, 250, 1022, 52], barSize: 21,
    deY: 348, deSize: 24,
    box: [89, 380, 1022, 116], boxLabel: 30, boxValue: 60,
    footY: 540, footSize: 22, gapCap: 140,
  },
};

// ── destino-bairro ─────────────────────────────────────────────────────────────────────────────────
// Layout POR FORMATO — bloco movido VERBATIM do builder (o TS infere o mesmo tipo; byte-idêntico).
export function destinoLayout(isStory: boolean, isWide: boolean) {
  return isStory ? {
    cx: 540, margin: 90, anchor: "middle" as const, contentX: 540,
    logoY: 258, logoCenter: true, // safe-zone story y≥250 (logo antes em 206, no chrome da Meta)
    heroY: 470, heroBase: 150, heroBudget: 720,
    subY: 596, subSize: 32, subChars: 40, subGap: 42,
    panel: [90, 690, 900, 248], panelTitleSize: 24, condBig: 60, condRest: 22, condRestChars: 22,
    cta: [330, 1196, 420, 92], ctaSize: 30, footY: 1320, footSize: 24, veil: "v",
  } : isWide ? {
    // 1.91:1 alinhado à SAFE ZONE real do Meta (x≥89), não mais x=72.
    cx: 600, margin: 89, anchor: "start" as const, contentX: 89,
    logoY: 66, logoCenter: false,
    heroY: 180, heroBase: 92, heroBudget: 640,
    subY: 236, subSize: 22, subChars: 44, subGap: 30,
    panel: [89, 282, 660, 158], panelTitleSize: 17, condBig: 38, condRest: 15, condRestChars: 18,
    cta: [89, 452, 320, 64], ctaSize: 21, footY: 540, footSize: 16, veil: "h",
  } : {
    cx: 540, margin: 90, anchor: "middle" as const, contentX: 540,
    logoY: 66, logoCenter: true,
    heroY: 296, heroBase: 152, heroBudget: 760,
    subY: 372, subSize: 29, subChars: 40, subGap: 38,
    panel: [90, 432, 900, 210], panelTitleSize: 22, condBig: 54, condRest: 20, condRestChars: 22,
    cta: [330, 686, 420, 80], ctaSize: 28, footY: 800, footSize: 22, veil: "v",
  };
}

// ── ficha-imovel ───────────────────────────────────────────────────────────────────────────────────
export function fichaLayout(isStory: boolean, isWide: boolean) {
  return isStory ? {
    logo: [80, 292, 168], head: [80, 470, 96], sub: [80, 548, 52, 60, 22, 2],
    feat: { tileX: 80, tileY0: 690, tileSize: 100, rowGap: 18, barX: 196, barW: 392, barH: 100, textX: 226, textSize: 32, iconSize: 50 },
    price: [80, 1232, 508, 134, 26, 102],
    gallery: [628, 412, [470, 778, 1086], 296, 22],
    footer: { y: 1418, pad: 80, ctaSize: 30, lh: 40 },
  } : isWide ? {
    logo: [72, 66, 150], head: [72, 156, 56], sub: [72, 206, 30, 36, 22, 2],
    feat: { tileX: 72, tileY0: 280, tileSize: 60, rowGap: 12, barX: 142, barW: 300, barH: 60, textX: 166, textSize: 22, iconSize: 32 },
    price: [466, 274, 348, 92, 16, 66],
    gallery: [836, 268, [64, 252, 440], 178, 16],
    footer: null,
  } : {
    logo: [72, 72, 158], head: [72, 200, 76], sub: [72, 256, 44, 52, 22, 2],
    feat: { tileX: 72, tileY0: 372, tileSize: 76, rowGap: 16, barX: 160, barW: 426, barH: 76, textX: 188, textSize: 28, iconSize: 40 },
    price: [72, 748, 514, 116, 20, 92],
    gallery: [624, 384, [72, 372, 672], 284, 22],
    footer: { y: 996, pad: 72, ctaSize: 25, lh: 33 },
  };
}

// ── vitrine-gallery ───────────────────────────────────────────────────────────────────────────────
export function vitrineLayout(isStory: boolean, isWide: boolean) {
  return isStory ? {
    split: [720, 640], gallery: [716, 300, 300, [300, 676, 1052], 360, 18],
    wm: [88, 300, 150], headX: 88, headY: 470, headGap: 92, headSize: 86, headBudget: 540,
    tagY: 400, tagSize: 22,
    deY: 660, deSize: 32, porY: 730, porSize: 60,
    bulletsY: 858, bulletStep: 78, bulletSize: 31, badge: 38, bulletX: 150, bulletChars: 32,
    cta: [88, 1320, 540, 96, 48], ctaSize: 31,
  } : isWide ? {
    split: [806, 770], gallery: [820, 292, 64, [64, 248, 432], 168, 14],
    wm: [96, 70, 140], headX: 96, headY: 150, headGap: 56, headSize: 50, headBudget: 600,
    tagY: 116, tagSize: 16,
    deY: 244, deSize: 19, porY: 286, porSize: 36,
    bulletsY: 346, bulletStep: 42, bulletSize: 18, badge: 24, bulletX: 150, bulletChars: 30,
    cta: [96, 500, 380, 54, 27], ctaSize: 19,
  } : {
    split: [668, 600], gallery: [694, 312, 694, [104, 392, 680], 280, 20],
    wm: [82, 90, 158], headX: 82, headY: 206, headGap: 80, headSize: 80, headBudget: 500,
    tagY: 150, tagSize: 20,
    deY: 372, deSize: 30, porY: 436, porSize: 56,
    bulletsY: 540, bulletStep: 62, bulletSize: 27, badge: 32, bulletX: 138, bulletChars: 34,
    cta: [82, 812, 470, 76, 38], ctaSize: 27,
  };
}

// ── hero-checklist ────────────────────────────────────────────────────────────────────────────────
// porY depende do preço "De" (runtime) → recebe priceFrom. Layout verbatim do builder.
export function heroChecklistLayout(isStory: boolean, isWide: boolean, priceFrom: boolean) {
  return isStory ? {
    logo: [905, 276, 120], margin: 90,
    headBase: 96, headGap: 104, headY: 440, headBudget: 740,
    deY: 720, deSize: 38, porY: priceFrom ? 796 : 760, porSize: 58,
    bulletsY: 900, bulletStep: 80, bulletSize: 34, badge: 38, bulletTextX: 152, bulletChars: 30,
    cta: [90, 1300, 640, 100, 20], ctaSize: 30,
  } : isWide ? {
    logo: [990, 72, 110], margin: 90,
    headBase: 46, headGap: 50, headY: 120, headBudget: 500,
    deY: 270, deSize: 22, porY: priceFrom ? 312 : 286, porSize: 34,
    bulletsY: 356, bulletStep: 42, bulletSize: 18, badge: 22, bulletTextX: 124, bulletChars: 26,
    cta: [90, 486, 460, 58, 14], ctaSize: 20,
  } : {
    logo: [852, 90, 120], margin: 108, // logo canônica (maior) → sobe p/ manter respiro à headline
    headBase: 84, headGap: 92, headY: 224, headBudget: 600,
    deY: 462, deSize: 32, porY: priceFrom ? 524 : 488, porSize: 48,
    bulletsY: 588, bulletStep: 62, bulletSize: 28, badge: 30, bulletTextX: 158, bulletChars: 30,
    cta: [108, 880, 552, 84, 18], ctaSize: 26,
  };
}

// ── duo-selos ─────────────────────────────────────────────────────────────────────────────────────
export function duoSelosLayout(isStory: boolean, isWide: boolean) {
  return isStory ? {
    // 9:16: fotos maiores + cluster inferior redistribuído p/ preencher a SAFE ZONE (y≤1470), em vez de
    // terminar cedo e deixar respiro morto. Abaixo de 1470 é zona não-segura (UI da Meta) → fica livre.
    wordmark: [465, 290, 150],
    headY: 420, headGap: 75, headSize: 64, headBudget: 940,
    subY: 555, subSize: 30,
    pill: [260, 590, 560, 58],
    photos: [[55, 700, 465, 560, 40], [560, 700, 465, 560, 40]],
    badgeRow: [[300, 1338], [780, 1338]], badgeSize: 24, badgeAnchor: "middle" as const,
    cta: [235, 1392, 610, 76, 1440, 26],
  } : isWide ? {
    wordmark: [89, 75, 130],
    headY: 165, headGap: 50, headSize: 40, headBudget: 540, headX: 365,
    subY: 258, subSize: 20, subX: 365,
    pill: [115, 285, 500, 50],
    photos: [[650, 70, 455, 230, 24], [650, 318, 455, 230, 24]],
    badgeRow: [[100, 385], [100, 428]], badgeSize: 19, badgeAnchor: "start" as const,
    cta: [120, 460, 430, 52, 493, 19],
  } : {
    wordmark: [470, 118, 140],
    headY: 235, headGap: 70, headSize: 60, headBudget: 820,
    photos: [[108, 470, 410, 330, 36], [562, 470, 410, 330, 36]],
    subY: 355, subSize: 28,
    pill: [285, 385, 510, 56],
    badgeRow: [[320, 860], [760, 860]], badgeSize: 24, badgeAnchor: "middle" as const,
    cta: [300, 895, 480, 64, 936, 21],
  };
}

// ── Registro dos schemas (contrato) ───────────────────────────────────────────────────────────────────
export const TEMPLATE_SCHEMAS: Record<string, TemplateSchema> = {
  "vitra-imobiliaria-oferta-ancora": {
    id: "template-12-oferta-ancora",
    family: "vitra-imobiliaria-oferta-ancora",
    archetype: "left-anchored", // logo centralizada no topo; todo texto num eixo único à esquerda
    components: { required: ["logo", "headline", "bar", "price", "footnote"], optional: ["de", "savings"] },
    fields: {
      headline: { charLimit: 40, fallback: "derive", priority: 1 }, // preço-like → heroBenefitHeadline
      footnote: { charLimit: 52, fallback: "hide", priority: 3 },    // localização/proximidade
    },
    lint: { priceMinRatio: 1.6, axisTol: 8, requireLogo: true, minLogoGap: 14 },
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
  "vitra-imobiliaria-destino-bairro": {
    id: "template-13-destino-bairro",
    family: "vitra-imobiliaria-destino-bairro",
    archetype: "centered", // feed/story no eixo central; wide em coluna à esquerda — SEM regra de eixo
    components: { required: ["logo", "hero", "subtitle", "panel", "cta", "footnote"], optional: ["badge"] },
    fields: {
      hero: { charLimit: 18, fallback: "derive", priority: 1 },     // nome do bairro (herói)
      subtitle: { charLimit: 88, fallback: "hide", priority: 2 },   // lifestyle
    },
    lint: { requireLogo: true, minLogoGap: 14 },
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
  "vitra-imobiliaria-ficha-imovel": {
    id: "template-11-ficha",
    family: "vitra-imobiliaria-ficha-imovel",
    archetype: "left-anchored", // coluna navy à esquerda + galeria à direita
    components: { required: ["logo", "headline", "subtitle", "features", "price"], optional: ["footnote"] },
    fields: {
      headline: { charLimit: 30, fallback: "derive", priority: 1 },
    },
    lint: { axisTol: 8, requireLogo: true, minLogoGap: 14 },
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
  "vitra-imobiliaria-vitrine-gallery": {
    id: "template-09-vitrine",
    family: "vitra-imobiliaria-vitrine-gallery",
    archetype: "left-anchored", // painel navy à esquerda (conteúdo no eixo) + galeria à direita
    components: { required: ["logo", "headline", "price", "bullets", "cta"], optional: ["tag"] },
    fields: { headline: { charLimit: 40, fallback: "derive", priority: 1 } },
    lint: { axisTol: 8, requireLogo: true, minLogoGap: 14 }, // gapCap é por-formato → fica no builder
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
  "vitra-imobiliaria-hero-checklist": {
    id: "template-05-hero-checklist",
    family: "vitra-imobiliaria-hero-checklist",
    archetype: "left-anchored",
    components: { required: ["logo", "headline", "price", "bullets", "cta"], optional: [] },
    fields: { headline: { charLimit: 40, fallback: "derive", priority: 1 } },
    lint: { axisTol: 8, requireLogo: true, minLogoGap: 14 }, // gapCap por-formato no builder
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
  "vitra-imobiliaria-duo-selos-offer": {
    id: "template-06-duo-selos",
    family: "vitra-imobiliaria-duo-selos-offer",
    archetype: "centered", // feed/story centrados; wide em coluna à esquerda — foto-forward, sem eixo
    components: { required: ["logo", "headline", "pill", "selo1", "selo2", "cta"], optional: [] },
    fields: {
      headline: { charLimit: 40, fallback: "derive", priority: 1 },
      selo1: { charLimit: 30, fallback: "hide", priority: 2 },
      selo2: { charLimit: 30, fallback: "hide", priority: 2 },
    },
    lint: { requireLogo: true, minLogoGap: 14 },
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
};

export function schemaFor(family: string): TemplateSchema | null {
  return TEMPLATE_SCHEMAS[family] ?? null;
}
