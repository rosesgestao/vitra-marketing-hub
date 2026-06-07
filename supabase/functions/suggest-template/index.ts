// Edge Function: suggest-template (degrau B do copiloto de IA) — le um anuncio/briefing colado e
// RECOMENDA o template de arte que melhor encaixa, com justificativa + confianca. O operador CONFIRMA
// no dashboard (humano aprovador). O dashboard passa os templates (id/nome/bestFor); a Edge so escolhe
// (o template_id e restrito ao enum da lista — a IA nao inventa). Espelha o padrao da generate-copy.
//
// Modelo: claude-sonnet-4-6. Chave no secret ANTHROPIC_API_KEY (server-side). Sem ela, 503.

import {
  buildSuggestSchema,
  buildSuggestSystemPrompt,
  buildSuggestUserPrompt,
  validateSuggestion,
} from "../_shared/templateSuggestion.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("COPILOT_SUGGEST_MODEL") ?? "claude-sonnet-4-6";

const MAX_SOURCE = 8000;
const MAX_TEMPLATES = 24;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "metodo nao permitido" }), { status: 405, headers: cors });

  const presented = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("apikey");
  if (!presented || (presented !== SERVICE_KEY && presented !== ANON_KEY)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: "not_configured",
      message: "ANTHROPIC_API_KEY nao configurado. Defina o secret para ativar a sugestao por IA: npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...",
    }), { status: 503, headers: cors });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const scope = body.brand_scope === "vitra_premium" ? "vitra_premium" : "vitra_imobiliaria";
  const sourceText = String(body.source_text ?? "").slice(0, MAX_SOURCE).trim();
  const rawTemplates = Array.isArray(body.templates) ? body.templates : [];
  const seen = new Set<string>();
  const templates = rawTemplates
    .filter((t: any) => t && typeof t.id === "string" && t.id.trim())
    .filter((t: any) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    .slice(0, MAX_TEMPLATES);

  if (!sourceText) {
    return new Response(JSON.stringify({ error: "bad_request", message: "source_text vazio: cole o texto do anuncio." }), { status: 400, headers: cors });
  }
  if (templates.length < 2) {
    return new Response(JSON.stringify({ error: "bad_request", message: "templates insuficientes: precisa de ao menos 2 opcoes para sugerir." }), { status: 400, headers: cors });
  }

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
        max_tokens: 500,
        system: [{ type: "text", text: buildSuggestSystemPrompt(scope), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: buildSuggestUserPrompt(sourceText, templates) }],
        output_config: { format: { type: "json_schema", schema: buildSuggestSchema(templates) } },
      }),
    });

    if (!aRes.ok) {
      const detail = await aRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "anthropic_error", status: aRes.status, detail }), { status: 502, headers: cors });
    }

    const data = await aRes.json();
    const textBlock = (data.content || []).find((b: any) => b.type === "text");
    const parsed = JSON.parse(textBlock?.text || "{}");

    // Validacao no codigo (a prova do schema): o id tem que ser um da lista.
    const { templateId, rationale, confidence, valid } = validateSuggestion(parsed, templates);

    return new Response(JSON.stringify({
      template_id: templateId,
      rationale,
      confidence,
      valid,
      model: data.model || MODEL,
      usage: data.usage || null,
    }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: "exception", message: String((error as Error)?.message || error) }), { status: 500, headers: cors });
  }
});
