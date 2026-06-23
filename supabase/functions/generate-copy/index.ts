// Edge Function: generate-copy (degrau A do copiloto de IA) — gera N angulos de copy de anuncio
// na VOZ DA MARCA Vitra, a partir dos FATOS do imovel. A IA rascunha; o codigo valida (tamanho,
// vocabulario de marca, nome duplicado); o operador revisa e aprova no dashboard (humano no loop).
//
// Modelo: claude-sonnet-4-6 (qualidade/voz pt-BR no tier de copy; custo ~R$0,09/campanha).
// Saida estruturada via output_config.format (json_schema) — devolve { angles: [...] } validado.
// A chave fica no secret ANTHROPIC_API_KEY (server-side; NUNCA no browser). Sem ela, retorna 503.

import { validateCopyAngle, bannedVocabForScope } from "../_shared/copyValidation.ts";
import { authorizeAiEdge } from "../_shared/edgeAuth.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("COPILOT_COPY_MODEL") ?? "claude-sonnet-4-6";

const ANGLES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    angles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: { type: "string", description: "id curto do angulo, kebab-case (ex.: preco-ancora)" },
          angle: { type: "string", description: "tipo de angulo (preco, localizacao, financiamento, lazer, planta, escassez, investimento)" },
          headline: { type: "string" },
          body: { type: "string", description: "texto principal do anuncio, 1-2 frases" },
          description: { type: "string", description: "descricao do link: 1 linha curta de reforco (<= 30 palavras), complementar ao texto" },
          cta: { type: "string" },
        },
        required: ["key", "angle", "headline", "body", "description", "cta"],
      },
    },
  },
  required: ["angles"],
};

function brandVoice(scope: string) {
  if (scope === "vitra_premium") {
    return {
      nome: "Vitra Premium",
      paleta: "preto + dourado, editorial, alto padrao",
      tom: "Editorial, sofisticado e DISCRETO (brandbook Premium: 'o luxo nao grita — sussurra'). Menos e mais: frases CURTAS, vocabulario preciso, SEM superlativos gratuitos e SEM emojis. Posicionamento de alto padrao e patrimonio. Lexico da marca: curadoria, excepcional, seleto, atemporal, exclusivo, patrimonio, experiencia, discreto, sofisticado, singular, arquitetura, presenca.",
      ctas: "Receba a curadoria, Agende uma visita reservada, Fale com um especialista",
      evite: "Tom de promocao barata ou liquidacao, superlativos gratuitos, emojis. Nada de 'imperdivel', 'aproveite ja', 'ultima chance', 'baratinho'.",
    };
  }
  return {
    nome: "Vitra Imobiliaria",
    paleta: "navy #0A1628 + dourado, institucional-comercial",
    tom: "Institucional-comercial DIRETO. Vende com argumento concreto de imovel: preco, parcela, planta, bairro, financiamento, lazer, prazo de entrega, escassez concreta (ultimas unidades).",
    ctas: "Fale com a Vitra, Fale com um consultor, Agendar visita, Conhecer o imovel, Receber condicoes, Conhecer a regiao",
    evite: "NAO usar a voz EDITORIAL da Premium: nada de 'curadoria', 'uma categoria acima', 'liquidez', 'leitura objetiva', 'atemporal', 'seleto', 'singular', 'sofisticado', 'patrimonial', 'experiencia de morar'. Termos genericos de mercado (ex.: 'alto padrao', 'exclusivo'/'exclusiva') SAO permitidos no anuncio pago. Regra do Brand System: a voz editorial Premium nao mistura com a Imobiliaria.",
  };
}

function buildSystemPrompt(scope: string, headlineMax: number) {
  const v = brandVoice(scope);
  return `Voce e copywriter senior de marketing imobiliario da ${v.nome} (paleta ${v.paleta}).
Sua tarefa: escrever angulos DISTINTOS de copy de anuncio Meta Ads para UM imovel, a partir dos fatos fornecidos.

VOZ DA MARCA (${v.nome}):
- Tom: ${v.tom}
- CTAs preferidos: ${v.ctas}
- Evite: ${v.evite}

REGRAS OBRIGATORIAS:
1. Escreva em portugues do Brasil.
2. Cada angulo deve ter um GANCHO de venda DIFERENTE (preco, localizacao, financiamento, lazer, planta, prazo/entrega, escassez, investimento). Nada de variacoes da mesma ideia.
3. Use SOMENTE os fatos fornecidos. NAO invente preco, metragem, bairro, diferenciais nem prazos.
4. headline: curta e impactante, no MAXIMO ${headlineMax} caracteres. NAO use o preco nem o formato "De X por Y" como headline (o criativo ja mostra o preco em destaque) — a headline e beneficio/posicionamento.
5. NAO repita o nome do produto na headline E no inicio do texto (evite "Produto. Produto.").
6. body (texto principal): 1 a 2 frases, com um beneficio concreto e o proximo passo.
7. description (descricao do link): UMA linha curta (ate ~30 palavras) que reforca o body sem repetir a headline.
8. cta: curto, de conversao imobiliaria, coerente com a voz da marca.
9. NUNCA use vocabulario fora da marca. Proibido aqui: ${bannedVocabForScope(scope, "paid").slice(0, 8).join(", ")}.

Devolva ESTRITAMENTE no formato JSON pedido (angles[]). Sem texto fora do JSON.`;
}

function factsPrompt(facts: Record<string, unknown>, count: number, angleHints?: string[]) {
  const lines = Object.entries(facts || {})
    .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== "")
    .map(([k, val]) => `- ${k}: ${Array.isArray(val) ? val.join("; ") : String(val)}`);
  const hints = angleHints?.length ? `\n\nAngulos sugeridos (use como inspiracao, nao copie literalmente): ${angleHints.join(", ")}.` : "";
  return `Gere ${count} angulos distintos para este imovel.\n\nFATOS DO IMOVEL:\n${lines.join("\n")}${hints}`;
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "metodo nao permitido" }), { status: 405, headers: cors });

  // Auth: service role (server) OU anon + gate token (x-copilot-gate). Ver _shared/edgeAuth.ts.
  const auth = authorizeAiEdge(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error, message: auth.message }), { status: auth.status, headers: cors });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: "not_configured",
      message: "ANTHROPIC_API_KEY nao configurado. Defina o secret para ativar a copy por IA: npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...",
    }), { status: 503, headers: cors });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const scope = body.brand_scope === "vitra_premium" ? "vitra_premium" : "vitra_imobiliaria";
  const headlineMax = Math.min(Math.max(Number(body.headline_max || 40), 16), 80);
  const count = Math.min(Math.max(Number(body.count || 5), 1), 12);
  const facts = body.facts && typeof body.facts === "object" ? body.facts : {};
  const productName = String(facts.product_name || facts.nome || "");
  const angleHints = Array.isArray(body.angle_hints) ? body.angle_hints.map(String) : undefined;

  try {
    const aRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: [{ type: "text", text: buildSystemPrompt(scope, headlineMax), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: factsPrompt(facts, count, angleHints) }],
        output_config: { format: { type: "json_schema", schema: ANGLES_SCHEMA } },
      }),
    });

    if (!aRes.ok) {
      const detail = await aRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "anthropic_error", status: aRes.status, detail }), { status: 502, headers: cors });
    }

    const data = await aRes.json();
    const textBlock = (data.content || []).find((b: any) => b.type === "text");
    const parsed = JSON.parse(textBlock?.text || "{}");
    const rawAngles = Array.isArray(parsed.angles) ? parsed.angles : [];

    // Validacao no codigo (a prova do schema): tamanho, vocabulario de marca, nome duplicado.
    const angles = rawAngles.map((a: any) => ({
      key: a.key, angle: a.angle, headline: a.headline, body: a.body, description: a.description, cta: a.cta,
      issues: validateCopyAngle(a, { headlineMax, scope, productName, channel: "paid" }).issues,
    }));
    const flagged = angles.filter((a: any) => a.issues.length).length;

    return new Response(JSON.stringify({
      angles,
      model: data.model || MODEL,
      flagged,
      usage: data.usage || null,
    }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: "exception", message: String((error as Error)?.message || error) }), { status: 500, headers: cors });
  }
});
