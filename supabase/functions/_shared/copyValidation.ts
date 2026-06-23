// Validacao pura da copy gerada por IA (degrau A do copiloto). Sem imports Deno/npm: para rodar
// tanto na Edge (generate-copy) quanto nos testes Vitest do dashboard. A IA RASCUNHA; estas regras
// SINALIZAM problemas (a peca volta com `issues`), o operador revisa e aprova. Espelha os achados
// da auditoria de copy: tamanho de headline, nao repetir o nome do produto na headline E no inicio
// do texto, e nao misturar vocabulario entre Premium e Imobiliaria (regra do Brand System).

// Lexico GENUINAMENTE editorial da Vitra Premium — NUNCA pode vazar para a Imobiliaria (em nenhum canal).
// E a voz distintiva da Premium (brandbook): curadoria, seleto, atemporal, discreto, singular...
const PREMIUM_STRICT = [
  "curadoria", "curado", "uma categoria acima", "liquidez",
  "leitura objetiva", "sofisticacao", "sofisticação", "sofisticado",
  "patrimonial", "experiencia de morar", "experiência de morar", "assinatura premium", "requinte",
  "seleto", "seleta", "atemporal", "singular", "discreto", "discreta", "excepcional",
];
// Termos GENERICOS DE MERCADO imobiliario — bloqueados no ORGANICO da Imobiliaria (separacao de marca),
// mas LIBERADOS no PAGO da Imobiliaria: convertem (validado nos anuncios vencedores) e nao sao exclusivos
// da Premium. Decisao de produto (a): destravar o pago sem deixar a voz editorial Premium vazar.
const MARKET_GENERIC = ["alto padrao", "alto padrão", "exclusividade", "exclusivo", "exclusiva"];
// Vocabulario Premium completo (default p/ Imobiliaria: organico = separacao dura).
const PREMIUM_VOCAB = [...PREMIUM_STRICT, ...MARKET_GENERIC];
// Termos "promocao barata" que destoam do tom editorial da Premium.
const CHEAP_VOCAB = [
  "baratinho", "baratissimo", "baratíssimo", "liquidacao", "liquidação", "imperdivel", "imperdível",
  "promocao relampago", "promoção relâmpago", "aproveite ja", "aproveite já", "ultima chance",
];

// `channel='paid'` na Imobiliaria libera os termos genericos de mercado (alto padrao, exclusivo...),
// mantendo bloqueado o lexico genuinamente Premium. Organico (default) segue com separacao dura.
export function bannedVocabForScope(scope: string, channel: "paid" | "organic" = "organic"): string[] {
  if (scope === "vitra_premium") return CHEAP_VOCAB;
  return channel === "paid" ? PREMIUM_STRICT : PREMIUM_VOCAB;
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
  channel?: "paid" | "organic";   // 'paid' libera termos genericos de mercado na Imobiliaria
}

export interface ValidationResult {
  ok: boolean;
  issues: string[];
}

export function validateCopyAngle(angle: CopyAngle, opts: ValidateOpts = {}): ValidationResult {
  const { headlineMax = 40, scope = "vitra_imobiliaria", productName = "", channel = "organic" } = opts;
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
  // Casa por LIMITE DE PALAVRA (nao substring cru): evita falso-positivo como "curado" dentro de
  // "proCURADOs". \p{L} trata letras acentuadas (á, ç, ã) como letra, entao o termo so casa quando nao
  // estiver colado a outra letra. Frases multi-palavra ("alto padrao") seguem casando normalmente.
  const haystack = `${headline} ${body} ${cta}`.toLowerCase();
  const hits = bannedVocabForScope(scope, channel).filter((w) => {
    const esc = w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<!\\p{L})${esc}(?!\\p{L})`, "iu").test(haystack);
  });
  if (hits.length) {
    issues.push(`vocabulario fora da marca (${scope}): ${[...new Set(hits)].join(", ")}`);
  }

  return { ok: issues.length === 0, issues };
}

// Aplica a validacao a uma lista e devolve cada angulo anotado com `issues` (vazio = ok).
export function annotateAngles(angles: CopyAngle[], opts: ValidateOpts = {}): Array<CopyAngle & { issues: string[] }> {
  return (angles || []).map((a) => ({ ...a, issues: validateCopyAngle(a, opts).issues }));
}
