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
export interface LintProfile { priceMinRatio?: number; axisTol?: number; requireLogo?: boolean }

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
    lint: { priceMinRatio: 1.6, axisTol: 8, requireLogo: true },
    approvedVariants: ["noFrame", "gold"],
    dsVersion: DS_VERSION,
  },
};

export function schemaFor(family: string): TemplateSchema | null {
  return TEMPLATE_SCHEMAS[family] ?? null;
}
