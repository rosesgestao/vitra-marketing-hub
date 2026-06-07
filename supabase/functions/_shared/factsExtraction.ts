// Extracao pura de FATOS de um anuncio/briefing colado (degrau B' do copiloto). Sem imports
// Deno/npm: roda na Edge (extract-facts) E nos testes Vitest do dashboard. A IA LE o texto e
// PROPOE valores por campo; o codigo VALIDA a ancoragem (a evidencia precisa estar no texto-fonte
// — anti-alucinacao) e o operador revisa/aplica no dashboard (humano no loop).
//
// Invariante central: NUNCA preencher um valor que nao esteja ancorado no texto colado. Campo
// ausente -> present:false, value vazio. Extracao e NEUTRA de voz (vale Premium E Imobiliaria):
// nao gera linguagem nem CTA, so transcreve fatos — por isso nao ha regra de Brand System aqui.

export interface FieldSpec {
  key: string;
  label?: string;
  type?: "text" | "textarea" | "list" | "money" | "select";
  maxLength?: number;
  description?: string;
  required?: boolean;
}

export interface ExtractedField {
  value: string | string[];
  evidence: string;
  confidence: "high" | "medium" | "low";
  present: boolean;
  issues?: string[];
}

// ---- helpers puros -------------------------------------------------------

// Normaliza para casar a evidencia com o texto-fonte: sem acento, minuscula, espacos colapsados.
function normalizeForMatch(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Tira espacos duplicados e aspas/markdown das bordas (sem corromper o miolo).
function sanitizeScalar(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^["'`*\s]+|["'`*\s]+$/g, "")
    .trim();
}

// Mesmo split do splitContentItems do dashboard: quebra a string CRUA por linha/;/, (sem colapsar
// \n antes, senao perde as quebras), depois limpa cada item (bullets, espacos internos).
function splitListString(value: unknown): string[] {
  return String(value ?? "")
    .split(/[\n;,]+/)
    .map((item) => item.replace(/^[-•\s]+/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// Coage o value cru ao tipo do campo: lista vira array; demais viram string.
function coerceValue(raw: unknown, isList: boolean): string | string[] {
  if (isList) {
    if (Array.isArray(raw)) return raw.map((s) => sanitizeScalar(s)).filter(Boolean);
    return splitListString(raw);
  }
  if (Array.isArray(raw)) return raw.map((s) => sanitizeScalar(s)).filter(Boolean).join("; ");
  return sanitizeScalar(raw);
}

// `needle` aparece em `hay` com FRONTEIRA em ambos os lados? `boundary` decide o que conta como
// "dentro de uma palavra/numero": p/ numero puro, so digito (permite '92' em '92m2', barra '92' em
// '9290'); p/ texto, alfanumerico (barra 'sala' dentro de 'salao', 'vaga' dentro de 'vagaroso').
function containsBounded(needle: string, hay: string, boundary: RegExp): boolean {
  let from = 0;
  for (;;) {
    const idx = hay.indexOf(needle, from);
    if (idx === -1) return false;
    const before = idx === 0 ? "" : hay[idx - 1];
    const after = idx + needle.length >= hay.length ? "" : hay[idx + needle.length];
    if (!boundary.test(before) && !boundary.test(after)) return true;
    from = idx + 1;
  }
}

// O VALOR precisa estar ANCORADO no texto-fonte — esta e a defesa anti-alucinacao real. NAO confiamos
// na evidence (campo livre que a IA preenche) nem em tokens espalhados (que deixariam recombinar
// palavras de frases diferentes num fato falso, ex.: "2 suites" pegando o "2" de "2 elevadores").
// Exigimos o PROPRIO valor como SUBSTRING CONTIGUA do texto (normalizado: acento/caixa/espaco). Por
// isso o prompt manda copiar o valor LITERAL do anuncio. Numero puro casa com fronteira. Sem isso ->
// "none" (campo descartado). Falso-negativo (a IA parafraseou) e seguro: descarta, nunca inventa.
function valueAnchoring(rawValue: string, normSource: string): "literal" | "none" {
  const nv = normalizeForMatch(rawValue);
  if (nv.length < 2) return "none";
  // Numero puro: fronteira so de digitos (permite '92' colado em '92m2', barra dentro de '9290').
  if (/^[0-9]+$/.test(nv)) return containsBounded(nv, normSource, /[0-9]/) ? "literal" : "none";
  // Texto/misto: fronteira alfanumerica (barra um valor curto dentro de uma palavra maior).
  return containsBounded(nv, normSource, /[\p{L}\p{N}]/u) ? "literal" : "none";
}

// ---- schema dinamico (output_config.format) ------------------------------

// Monta a json_schema de saida a partir dos field specs do template (fonte de verdade no dashboard).
// Cada campo exige { value, evidence, confidence, present }; additionalProperties:false em todos os
// niveis trava a invencao de chaves. Anthropic exige TODAS as keys em required quando
// additionalProperties:false — ausentes voltam com present:false.
export function buildFactsSchema(fieldSpecs: FieldSpec[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const spec of fieldSpecs || []) {
    const key = spec?.key;
    if (!key || Object.prototype.hasOwnProperty.call(properties, key)) continue;
    required.push(key);
    const isList = spec.type === "list";
    const valueDesc = [
      `Valor para "${spec.label || key}".`,
      spec.description ? `Contexto: ${spec.description}.` : "",
      spec.maxLength ? `Maximo ${spec.maxLength} caracteres.` : "",
      isList ? "Lista de itens curtos." : "",
      "Deixe vazio se o dado NAO estiver no texto.",
    ].filter(Boolean).join(" ");

    properties[key] = {
      type: "object",
      additionalProperties: false,
      required: ["value", "evidence", "confidence", "present"],
      properties: {
        value: isList
          ? { type: "array", items: { type: "string" }, description: valueDesc }
          : { type: "string", description: valueDesc },
        evidence: { type: "string", description: "Trecho LITERAL copiado do texto-fonte que comprova o valor. Vazio se ausente." },
        confidence: { type: "string", enum: ["high", "medium", "low"], description: "high=explicito; medium=inferido; low=incerto" },
        present: { type: "boolean", description: "true se o dado foi encontrado no texto; false se ausente" },
      },
    };
  }

  return {
    type: "object",
    additionalProperties: false,
    required: ["fields"],
    properties: {
      fields: { type: "object", additionalProperties: false, required, properties },
    },
  };
}

// ---- prompts -------------------------------------------------------------

export function buildExtractSystemPrompt(scope: string): string {
  const audience = scope === "vitra_premium"
    ? "imoveis de alto padrao (publico premium)"
    : "imoveis residenciais e de oportunidade (publico amplo)";
  return `Voce extrai FATOS de um anuncio/briefing imobiliario colado em texto livre, para preencher um formulario de campanha (${audience}).

REGRAS ABSOLUTAS:
1. Use SOMENTE informacoes que ESTAO NO TEXTO. NUNCA invente preco, metragem, bairro, diferenciais, prazos, numero de dormitorios/suites/vagas.
2. Se um campo NAO aparece no texto, devolva present=false e value vazio (string vazia, ou lista vazia). NAO chute.
3. O "value" deve ser COPIADO do texto (literal): use as MESMAS palavras/numeros/valores que aparecem no anuncio. Voce pode recortar (pegar so a parte relevante) e remover emojis, mas NAO reformate numeros/precos, NAO troque sinonimos e NAO invente. O valor TEM que aparecer no texto.
4. Para cada campo preenchido (present=true), copie em "evidence" o TRECHO LITERAL (a frase ao redor) do texto-fonte que contem o valor.
5. confidence: "high" = explicito no texto; "medium" = inferido por contexto; "low" = incerto.
6. Portugues do Brasil. Devolva ESTRITAMENTE o JSON pedido, nada fora dele.`;
}

export function buildExtractUserPrompt(sourceText: string, fieldSpecs: FieldSpec[]): string {
  const fieldList = (fieldSpecs || [])
    .map((s) => [
      `- ${s.key} ("${s.label || s.key}")`,
      s.type ? `[${s.type}]` : "",
      s.maxLength ? `max ${s.maxLength} chars` : "",
      s.description ? `- ${s.description}` : "",
    ].filter(Boolean).join(" "))
    .join("\n");

  return `Extraia os campos abaixo deste anuncio imobiliario.

CAMPOS A PREENCHER (key, rotulo, tipo):
${fieldList}

TEXTO-FONTE (anuncio/briefing):
"""
${sourceText}
"""

Devolva { fields: { <key>: { value, evidence, confidence, present } } } com TODAS as keys listadas. Campo ausente no texto: present=false e value vazio.`;
}

// ---- validacao (a prova do schema) ---------------------------------------

export interface ValidateFactsResult {
  fields: Record<string, ExtractedField>;
  issues: Record<string, string[]>;
  extracted: number;
  flagged: number;
}

// Valida a saida da IA: a real defesa anti-alucinacao. Para cada campo present:true, o PROPRIO VALOR
// precisa estar ANCORADO no texto-fonte (substring direta, ou todos os tokens). A evidence NAO e
// passe-livre — e so contexto pro operador. Listas sao validadas ITEM A ITEM (itens nao ancorados
// sao removidos). Sem ancoragem -> campo DESCARTADO (present:false, value zera). maxLength so sinaliza.
export function validateExtractedFacts(
  rawFields: Record<string, unknown> | null | undefined,
  fieldSpecs: FieldSpec[],
  sourceText: string,
): ValidateFactsResult {
  const source = normalizeForMatch(sourceText);
  const fields: Record<string, ExtractedField> = {};
  const issues: Record<string, string[]> = {};
  let extracted = 0;
  let flagged = 0;

  for (const spec of fieldSpecs || []) {
    const key = spec?.key;
    if (!key || Object.prototype.hasOwnProperty.call(fields, key)) continue;

    const isList = spec.type === "list";
    const raw = (rawFields && typeof rawFields === "object" ? (rawFields as Record<string, any>)[key] : null) || {};

    let value = coerceValue(raw.value, isList);
    let evidence = sanitizeScalar(raw.evidence);
    let confidence: ExtractedField["confidence"] = ["high", "medium", "low"].includes(raw.confidence) ? raw.confidence : "low";
    let present = raw.present === true;
    const fieldIssues: string[] = [];

    // present-consistency: valor vazio nunca conta como presente.
    const isEmpty = isList ? (value as string[]).length === 0 : value === "";
    if (isEmpty) present = false;

    if (present) {
      if (isList) {
        // Lista: valida ITEM A ITEM. Mantem so os itens ancorados no texto; remove os inventados.
        const items = value as string[];
        const kept = items.filter((item) => valueAnchoring(item, source) !== "none");
        const dropped = items.length - kept.length;
        value = kept;
        if (!kept.length) {
          present = false;
          confidence = "low";
          evidence = "";
          fieldIssues.push("nenhum item da lista localizado no texto (descartado)");
        } else if (dropped > 0) {
          if (confidence === "high") confidence = "medium";
          fieldIssues.push(`${dropped} item(ns) sem ancoragem no texto removido(s)`);
        }
      } else {
        // Escalar: o PROPRIO valor precisa aparecer no texto-fonte (nunca confiar so na evidence).
        if (valueAnchoring(value as string, source) === "none") {
          present = false;
          confidence = "low";
          value = "";
          evidence = "";
          fieldIssues.push("valor nao localizado no texto (descartado para nao inventar dado)");
        }
      }
    }

    // present-consistency pos-filtro: lista pode ter ficado vazia acima.
    if (present && isList && (value as string[]).length === 0) present = false;

    // maxLength: SINALIZA, nao trunca. Mede com o MESMO separador do patch (lista junta com "\n").
    if (present && spec.maxLength) {
      const len = (isList ? (value as string[]).join("\n") : (value as string)).length;
      if (len > spec.maxLength) fieldIssues.push(`valor com ${len} chars (maximo ${spec.maxLength})`);
    }

    if (present) extracted += 1;
    if (fieldIssues.length) { issues[key] = fieldIssues; flagged += 1; }

    fields[key] = { value, evidence, confidence, present, issues: fieldIssues };
  }

  return { fields, issues, extracted, flagged };
}
