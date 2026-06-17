// Edge Function: generate-content (Fase A do copiloto EDITORIAL) — gera N ideias de conteudo ORGANICO
// na VOZ DA MARCA Vitra, a partir do tipo de conteudo + pilar + formato + briefing leve. A IA rascunha;
// o codigo valida marca (vocabulario/separacao); o operador revisa e aprova (humano no loop).
//
// Diferente de generate-copy (anuncio: headline/body/cta). Aqui o produto e o POST organico: ideia,
// legenda, CTA, hashtags, roteiro (reels/stories), direcao visual. Tipo/pilar/formato vem do
// _shared/contentPlaybook.ts (fonte unica Deno+Vite). Modelo via COPILOT_COPY_MODEL. Chave no secret
// ANTHROPIC_API_KEY (server-side; NUNCA no browser) -> sem ela, 503.

import { validateCopyAngle, bannedVocabForScope } from "../_shared/copyValidation.ts";
import { authorizeAiEdge } from "../_shared/edgeAuth.ts";
import { contentTypeSpec, contentFormatSpec, CONTENT_PILLARS } from "../_shared/contentPlaybook.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("COPILOT_COPY_MODEL") ?? "claude-sonnet-4-6";

const POSTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          key: { type: "string", description: "id curto kebab-case da ideia" },
          idea: { type: "string", description: "a ideia/tema do post em 1 frase" },
          headline: { type: "string", description: "chamada principal (1a linha do criativo/post)" },
          caption: { type: "string", description: "legenda pronta para a rede social, 2-5 frases, pt-BR" },
          cta: { type: "string", description: "chamada para acao" },
          hashtags: { type: "array", items: { type: "string" }, description: "5-10 hashtags relevantes, sem #" },
          script: { type: "string", description: "roteiro curto (so para reels/stories), cenas/falas; vazio se nao aplicavel" },
          visual: { type: "string", description: "direcao visual: o que mostrar na imagem/video" },
        },
        required: ["key", "idea", "headline", "caption", "cta", "hashtags", "visual"],
      },
    },
  },
  required: ["posts"],
};

function brandVoice(scope: string) {
  if (scope === "vitra_premium") {
    return {
      nome: "Vitra Premium",
      paleta: "preto + dourado, editorial, alto padrao",
      tom: "Editorial, sofisticado e DISCRETO (brandbook Premium: 'o luxo nao grita — sussurra'). Frases curtas, vocabulario preciso, SEM superlativos gratuitos e SEM emojis em excesso. Lexico: curadoria, excepcional, seleto, atemporal, exclusivo, patrimonio, experiencia, discreto, sofisticado, singular, arquitetura, presenca.",
      evite: "Tom de promocao barata, superlativos gratuitos, excesso de emojis. Nada de 'imperdivel', 'aproveite ja', 'ultima chance', 'baratinho'.",
    };
  }
  return {
    nome: "Vitra Imobiliaria",
    paleta: "navy #0A1628 + dourado, institucional-comercial",
    tom: "Institucional-comercial, proximo e DIRETO. Conteudo util e concreto que constroi autoridade e relacionamento; pode usar emojis com moderacao. Foco em presenca, confianca e posicionamento da marca-mae.",
    evite: "NAO usar a voz editorial da Premium: nada de 'curadoria', 'uma categoria acima', 'liquidez', 'alto padrao', 'leitura objetiva', 'exclusividade', 'patrimonial'. Premium e Imobiliaria NAO misturam linguagem.",
  };
}

function buildSystemPrompt(scope: string) {
  const v = brandVoice(scope);
  return `Voce e o(a) social media / estrategista de conteudo da ${v.nome} (paleta ${v.paleta}).
Sua tarefa: criar ideias de CONTEUDO ORGANICO para redes sociais (demanda receptiva: presenca,
autoridade, relacionamento) — NAO e anuncio pago.

VOZ DA MARCA (${v.nome}):
- Tom: ${v.tom}
- Evite: ${v.evite}

REGRAS OBRIGATORIAS:
1. Escreva em portugues do Brasil.
2. Cada ideia deve ser DISTINTA (gancho/abordagem diferente). Nada de variacoes da mesma coisa.
3. Use SOMENTE os fatos/contexto fornecidos. NAO invente preco, metragem, bairro, dados nem promessas.
4. A legenda (caption) deve ser pronta para postar: gancho na 1a linha, corpo util, e o CTA ao final.
5. hashtags: 5 a 10, relevantes, sem o caractere '#'.
6. script (roteiro): preencha SO quando o formato for reels/stories (cenas + falas curtas); senao deixe vazio.
7. visual: descreva objetivamente o que mostrar (foto/cena), coerente com a identidade da marca.
8. NUNCA use vocabulario fora da marca. Proibido aqui: ${bannedVocabForScope(scope).slice(0, 8).join(", ")}.

Devolva ESTRITAMENTE no formato JSON pedido (posts[]). Sem texto fora do JSON.`;
}

function briefPrompt(opts: {
  type: ReturnType<typeof contentTypeSpec>;
  pillar: string;
  format: ReturnType<typeof contentFormatSpec>;
  tone: string;
  count: number;
  context: Record<string, unknown>;
}) {
  const pillarInfo = CONTENT_PILLARS[opts.pillar];
  const ctx = Object.entries(opts.context || {})
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join("; ") : String(v)}`);
  return `Gere ${opts.count} ideias de conteudo.

TIPO: ${opts.type.label} — ${opts.type.hint}
PILAR: ${pillarInfo ? `${pillarInfo.label} (${pillarInfo.description})` : opts.pillar}
FORMATO: ${opts.format.label} (${opts.format.spec})${opts.format.hasScript ? " — INCLUA roteiro (script)" : ""}
ETAPA DE FUNIL: ${opts.type.funnel}
TOM: ${opts.tone}

CONTEXTO (use se houver; ideia livre se vazio):
${ctx.length ? ctx.join("\n") : "- (sem contexto especifico — produza a partir do tipo/pilar)"}`;
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "metodo nao permitido" }), { status: 405, headers: cors });

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return new Response(JSON.stringify({ error: auth.error, message: auth.message }), { status: auth.status, headers: cors });

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: "not_configured",
      message: "ANTHROPIC_API_KEY nao configurado. Defina o secret para ativar a IA editorial.",
    }), { status: 503, headers: cors });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const scope = body.brand_scope === "vitra_premium" ? "vitra_premium" : "vitra_imobiliaria";
  const type = contentTypeSpec(body.content_type);
  const pillar = String(body.pillar || type.pillar);
  const format = contentFormatSpec(body.format || type.format);
  const tone = String(body.tone || "padrao da marca");
  const count = Math.min(Math.max(Number(body.count || 3), 1), 8);
  const context = body.context && typeof body.context === "object" ? body.context : {};

  try {
    const aRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
        system: [{ type: "text", text: buildSystemPrompt(scope), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: briefPrompt({ type, pillar, format, tone, count, context }) }],
        output_config: { format: { type: "json_schema", schema: POSTS_SCHEMA } },
      }),
    });

    if (!aRes.ok) {
      const detail = await aRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "anthropic_error", status: aRes.status, detail }), { status: 502, headers: cors });
    }

    const data = await aRes.json();
    const textBlock = (data.content || []).find((b: any) => b.type === "text");
    const parsed = JSON.parse(textBlock?.text || "{}");
    const rawPosts = Array.isArray(parsed.posts) ? parsed.posts : [];

    // Validacao de marca: roda a checagem de vocabulario/separacao na legenda (mapeia caption->body).
    const posts = rawPosts.map((p: any) => ({
      key: p.key, idea: p.idea, headline: p.headline, caption: p.caption, cta: p.cta,
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
      script: p.script || "", visual: p.visual || "",
      pillar, format: format.key, content_type: type.key,
      issues: validateCopyAngle({ headline: p.headline, body: p.caption, cta: p.cta }, { headlineMax: 80, scope, productName: String(context.product_name || context.nome || "") }).issues,
    }));
    const flagged = posts.filter((p: any) => p.issues.length).length;

    return new Response(JSON.stringify({ posts, model: data.model || MODEL, flagged, usage: data.usage || null }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: "exception", message: String((error as Error)?.message || error) }), { status: 500, headers: cors });
  }
});
