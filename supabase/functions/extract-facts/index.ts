// Edge Function: extract-facts (degrau B' do copiloto de IA) — LE um anuncio/briefing colado em
// texto livre e PROPOE, por campo do template, o valor + a evidencia (trecho literal) + confianca,
// SEM inventar nada. O dashboard passa os field specs (fonte de verdade no catalogo); esta Edge monta
// a json_schema dinamicamente, chama a IA e VALIDA a ancoragem da evidencia (anti-alucinacao). O
// operador revisa e aplica no dashboard (humano no loop). Espelha o padrao da generate-copy (degrau A).
//
// Modelo: claude-sonnet-4-6 (qualidade pt-BR; extracao on-demand, custo marginal).
// A chave fica no secret ANTHROPIC_API_KEY (server-side; NUNCA no browser). Sem ela, retorna 503.
// Reusa o MESMO secret do degrau A — ativar um ativa o outro.

import {
  buildFactsSchema,
  buildExtractSystemPrompt,
  buildExtractUserPrompt,
  validateExtractedFacts,
} from "../_shared/factsExtraction.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("COPILOT_EXTRACT_MODEL") ?? "claude-sonnet-4-6";

const MAX_SOURCE = 8000;
const MAX_FIELDS = 40;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "metodo nao permitido" }), { status: 405, headers: cors });

  // Auth: aceita a service role ou a chave publishable (igual ao render-asset / generate-copy).
  const presented = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("apikey");
  if (!presented || (presented !== SERVICE_KEY && presented !== ANON_KEY)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: "not_configured",
      message: "ANTHROPIC_API_KEY nao configurado. Defina o secret para ativar a extracao por IA: npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...",
    }), { status: 503, headers: cors });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const scope = body.brand_scope === "vitra_premium" ? "vitra_premium" : "vitra_imobiliaria";
  const sourceText = String(body.source_text ?? "").slice(0, MAX_SOURCE).trim();
  const rawSpecs = Array.isArray(body.field_specs) ? body.field_specs : [];
  // Dedup por key e limita o numero de campos; so aceita specs com key string.
  const seen = new Set<string>();
  const fieldSpecs = rawSpecs
    .filter((s: any) => s && typeof s.key === "string" && s.key.trim())
    .filter((s: any) => (seen.has(s.key) ? false : (seen.add(s.key), true)))
    .slice(0, MAX_FIELDS);

  if (!sourceText) {
    return new Response(JSON.stringify({ error: "bad_request", message: "source_text vazio: cole o texto do anuncio." }), { status: 400, headers: cors });
  }
  if (!fieldSpecs.length) {
    return new Response(JSON.stringify({ error: "bad_request", message: "field_specs ausente: escolha um template com campos." }), { status: 400, headers: cors });
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
        max_tokens: 3000,
        system: [{ type: "text", text: buildExtractSystemPrompt(scope), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: buildExtractUserPrompt(sourceText, fieldSpecs) }],
        output_config: { format: { type: "json_schema", schema: buildFactsSchema(fieldSpecs) } },
      }),
    });

    if (!aRes.ok) {
      const detail = await aRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "anthropic_error", status: aRes.status, detail }), { status: 502, headers: cors });
    }

    const data = await aRes.json();
    const textBlock = (data.content || []).find((b: any) => b.type === "text");
    const parsed = JSON.parse(textBlock?.text || "{}");
    const rawFields = parsed && typeof parsed.fields === "object" ? parsed.fields : {};

    // Validacao no codigo (a prova do schema): groundedness (evidencia no texto), maxLength, tipos.
    const { fields, issues, extracted, flagged } = validateExtractedFacts(rawFields, fieldSpecs, sourceText);

    return new Response(JSON.stringify({
      fields,
      issues,
      extracted,
      flagged,
      model: data.model || MODEL,
      usage: data.usage || null,
    }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: "exception", message: String((error as Error)?.message || error) }), { status: 500, headers: cors });
  }
});
