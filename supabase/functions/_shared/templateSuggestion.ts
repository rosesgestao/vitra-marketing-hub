// Sugestao de TEMPLATE por IA (degrau B do copiloto). A IA le o anuncio colado e RECOMENDA o template
// de arte que melhor encaixa, com uma justificativa curta + confianca. O operador CONFIRMA ou mantem o
// atual (humano aprovador). Sem imports Deno/npm: roda na Edge (suggest-template) e nos testes Vitest.
//
// Anti-alucinacao: o template escolhido tem que ser UM da lista fornecida (enum no schema + checagem no
// codigo). O dashboard e a fonte de verdade dos templates (passa id/nome/bestFor); a Edge so escolhe.

export interface TemplateOption {
  id: string;
  name?: string;
  bestFor?: string;
}

// json_schema de saida: template_id restrito ao enum dos ids fornecidos (a IA nao pode inventar id).
export function buildSuggestSchema(templates: TemplateOption[]): Record<string, unknown> {
  const ids = (templates || []).map((t) => t?.id).filter(Boolean);
  return {
    type: "object",
    additionalProperties: false,
    required: ["template_id", "rationale", "confidence"],
    properties: {
      template_id: { type: "string", enum: ids, description: "id EXATO de um template da lista (nunca invente)" },
      rationale: { type: "string", description: "1 frase curta e concreta explicando por que este template encaixa no anuncio" },
      confidence: { type: "string", enum: ["high", "medium", "low"], description: "high=encaixe claro; medium=razoavel; low=ambiguo" },
    },
  };
}

export function buildSuggestSystemPrompt(scope: string): string {
  const marca = scope === "vitra_premium" ? "Premium (alto padrao, editorial)" : "Imobiliaria (institucional-comercial)";
  return `Voce e estrategista de criativos de marketing imobiliario da Vitra ${marca}.
Tarefa: dado um anuncio/briefing e uma lista de TEMPLATES de arte (cada um com "melhor para"), escolha o template que MELHOR encaixa.

REGRAS:
1. Escolha SOMENTE um template da lista, pelo id EXATO. NAO invente id.
2. Baseie a escolha no ENCAIXE entre o conteudo do anuncio (preco/oferta, financiamento/entrada, bairro/localizacao, lazer/ambientes, configuracao, foto protagonista) e o "melhor para" de cada template.
3. rationale: 1 frase curta e concreta, citando o que NO ANUNCIO motivou a escolha.
4. confidence: high = encaixe claro; medium = razoavel; low = ambiguo/pouca informacao.
5. Portugues do Brasil. Devolva ESTRITAMENTE o JSON pedido, nada fora dele.`;
}

export function buildSuggestUserPrompt(sourceText: string, templates: TemplateOption[]): string {
  const list = (templates || [])
    .map((t) => `- ${t.id} ("${t.name || t.id}"): ${t.bestFor || "uso geral"}`)
    .join("\n");
  return `Escolha o melhor template para este anuncio.

TEMPLATES DISPONIVEIS (id, nome, melhor para):
${list}

ANUNCIO/BRIEFING:
"""
${sourceText}
"""

Devolva { template_id, rationale, confidence } com o id EXATO de um template da lista.`;
}

export interface SuggestionResult {
  templateId: string | null;
  rationale: string;
  confidence: "high" | "medium" | "low";
  valid: boolean;
}

// Valida a saida: o template_id PRECISA ser um id da lista (senao a sugestao e invalida e o dashboard
// a ignora — nunca troca o template para algo inexistente).
export function validateSuggestion(raw: any, templates: TemplateOption[]): SuggestionResult {
  const ids = new Set((templates || []).map((t) => t?.id).filter(Boolean));
  const templateId = raw && typeof raw.template_id === "string" && ids.has(raw.template_id) ? raw.template_id : null;
  const rationale = raw && typeof raw.rationale === "string" ? raw.rationale.replace(/\s+/g, " ").trim() : "";
  const confidence = raw && ["high", "medium", "low"].includes(raw.confidence) ? raw.confidence : "low";
  return { templateId, rationale, confidence, valid: templateId !== null };
}
