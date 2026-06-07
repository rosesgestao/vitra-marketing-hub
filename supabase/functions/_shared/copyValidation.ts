// Validacao pura da copy gerada por IA (degrau A do copiloto). Sem imports Deno/npm: para rodar
// tanto na Edge (generate-copy) quanto nos testes Vitest do dashboard. A IA RASCUNHA; estas regras
// SINALIZAM problemas (a peca volta com `issues`), o operador revisa e aprova. Espelha os achados
// da auditoria de copy: tamanho de headline, nao repetir o nome do produto na headline E no inicio
// do texto, e nao misturar vocabulario entre Premium e Imobiliaria (regra do Brand System).

// Vocabulario editorial da Vitra Premium — NAO pode vazar para a Imobiliaria. Inclui o lexico oficial
// do brandbook Premium (Curadoria, Seleto, Atemporal, Discreto, Singular, Excepcional, Sofisticado...).
const PREMIUM_VOCAB = [
  "curadoria", "curado", "uma categoria acima", "liquidez", "alto padrao", "alto padrão",
  "leitura objetiva", "sofisticacao", "sofisticação", "sofisticado", "exclusividade", "exclusivo", "exclusiva",
  "patrimonial", "experiencia de morar", "experiência de morar", "assinatura premium", "requinte",
  "seleto", "seleta", "atemporal", "singular", "discreto", "discreta", "excepcional",
];
// Termos "promocao barata" que destoam do tom editorial da Premium.
const CHEAP_VOCAB = [
  "baratinho", "baratissimo", "baratíssimo", "liquidacao", "liquidação", "imperdivel", "imperdível",
  "promocao relampago", "promoção relâmpago", "aproveite ja", "aproveite já", "ultima chance",
];

export function bannedVocabForScope(scope: string): string[] {
  return scope === "vitra_premium" ? CHEAP_VOCAB : PREMIUM_VOCAB;
}

export interface CopyAngle {
  key?: string;
  angle?: string;
  headline?: string;
  body?: string;
  cta?: string;
}

export interface ValidateOpts {
  headlineMax?: number;
  scope?: string;
  productName?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: string[];
}

export function validateCopyAngle(angle: CopyAngle, opts: ValidateOpts = {}): ValidationResult {
  const { headlineMax = 40, scope = "vitra_imobiliaria", productName = "" } = opts;
  const issues: string[] = [];

  const headline = String(angle?.headline ?? "").replace(/\s+/g, " ").trim();
  const body = String(angle?.body ?? "").replace(/\s+/g, " ").trim();
  const cta = String(angle?.cta ?? "").replace(/\s+/g, " ").trim();

  if (!headline) issues.push("headline vazia");
  if (!body) issues.push("texto vazio");
  if (!cta) issues.push("CTA vazio");
  if (headline.length > headlineMax) {
    issues.push(`headline com ${headline.length} chars (maximo ${headlineMax})`);
  }

  // Nome do produto repetido na headline E no inicio do texto (bug "Produto. Produto.").
  const pn = String(productName).trim().toLowerCase();
  if (pn && headline.toLowerCase().includes(pn) && body.toLowerCase().startsWith(pn)) {
    issues.push("nome do produto repetido na headline e no inicio do texto");
  }

  // Vocabulario fora da marca (cross-contaminacao Premium <-> Imobiliaria).
  const haystack = `${headline} ${body} ${cta}`.toLowerCase();
  const hits = bannedVocabForScope(scope).filter((w) => haystack.includes(w.toLowerCase()));
  if (hits.length) {
    issues.push(`vocabulario fora da marca (${scope}): ${[...new Set(hits)].join(", ")}`);
  }

  return { ok: issues.length === 0, issues };
}

// Aplica a validacao a uma lista e devolve cada angulo anotado com `issues` (vazio = ok).
export function annotateAngles(angles: CopyAngle[], opts: ValidateOpts = {}): Array<CopyAngle & { issues: string[] }> {
  return (angles || []).map((a) => ({ ...a, issues: validateCopyAngle(a, opts).issues }));
}
