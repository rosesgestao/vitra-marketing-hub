// Edge Function: suggest-meta-audiences (fase 2b) — a IA PROPOE, por conjunto (ad_group) da campanha,
// um publico (faixa etaria + interesses por palavra-chave) e posicionamentos, com racional. So PROPOE:
// nao cria nada na Meta. O operador revisa no painel e o build (publish-meta-ads) aplica sob o gate.
//
// Os interesses sao palavras-chave (pt-BR) — quem resolve para IDs reais e o build, via Graph
// targeting search (NUNCA inventar ID). Modelo/segredo iguais a generate-copy (ANTHROPIC_API_KEY).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { authorizeAiEdge } from "../_shared/edgeAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("COPILOT_COPY_MODEL") ?? "claude-sonnet-4-6";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
  "Content-Type": "application/json",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ad_sets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          group_key: { type: "string", description: "o ad_group exato recebido" },
          label: { type: "string" },
          age_min: { type: "integer", description: "18 a 65" },
          age_max: { type: "integer", description: "18 a 65" },
          interest_keywords: { type: "array", items: { type: "string" }, description: "3 a 6 interesses em pt-BR (ex.: 'comprar imovel', 'apartamento novo', 'decoracao')" },
          placements: { type: "string", description: "'automatic' (recomendado) ou lista separada por virgula: facebook_feed, instagram_feed, instagram_stories, facebook_reels" },
          retargeting: { type: "boolean", description: "true se o conjunto e de retargeting (publico custom — sera tratado na proxima fase; por ora cai em amplo)" },
          rationale: { type: "string", description: "1 frase explicando a escolha do publico" },
        },
        required: ["group_key", "label", "age_min", "age_max", "interest_keywords", "placements", "retargeting", "rationale"],
      },
    },
  },
  required: ["ad_sets"],
};

function systemPrompt(scope: string) {
  const brand = scope === "vitra_premium"
    ? "Vitra Premium (alto padrao, preto+dourado, publico A/B com maior renda e interesse em arquitetura/design/investimento patrimonial)"
    : "Vitra Imobiliaria (marca-mae, navy+dourado, publico amplo de medio padrao, compra e financiamento de imovel)";
  return `Voce e um media planner senior de Meta Ads para o mercado IMOBILIARIO da ${brand}.
Recebe os conjuntos (ad_groups) de uma campanha e os FATOS do imovel. Para CADA conjunto, proponha um
publico (faixa etaria coerente com compra de imovel; interesses por palavra-chave em pt-BR que existam
no Gerenciador da Meta) e posicionamentos, ajustando ao angulo/etapa do funil que o nome do conjunto
sugere (awareness = amplo/reach; leads = interesses + intencao de compra; retarget = marque retargeting=true).
Regras: nao invente metricas; interesses devem ser termos reais e buscaveis; prefira placements
'automatic' salvo motivo claro; faixa etaria entre 18 e 65. Devolva ESTRITAMENTE o JSON pedido.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "metodo nao permitido" }, 405);

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);
  if (!ANTHROPIC_API_KEY) return json({ error: "not_configured", message: "ANTHROPIC_API_KEY nao configurado." }, 503);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "not_configured", message: "Supabase service role ausente." }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  if (!body.campaign_id) return json({ error: "missing_campaign_id" }, 400);

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: campaign } = await svc.from("premium_campaigns").select("*").eq("id", body.campaign_id).single();
  if (!campaign) return json({ error: "campaign_not_found" }, 404);
  const scope = campaign.brief?.brand_scope || "vitra_imobiliaria";

  const { data: assets } = await svc.from("premium_campaign_assets").select("metadata")
    .eq("campaign_id", body.campaign_id).eq("channel", "meta_ads");
  const groups = [...new Map((assets || [])
    .map((a: any) => [a.metadata?.ad_group, a.metadata?.ad_label])
    .filter(([k]: any[]) => k)
    .map(([k, l]: any[]) => [k, { group_key: k, label: l || k }])).values()];
  if (!groups.length) return json({ error: "no_groups", message: "Nenhum conjunto (ad_group) de Meta Ads nesta campanha." }, 422);

  const pd = campaign.brief?.product_data || {};
  const facts = {
    produto: campaign.product_name, bairro: pd.neighborhood || campaign.neighborhood, cidade: pd.city || campaign.city,
    preco: pd.price, area: pd.area, dormitorios: pd.suites || pd.rooms, diferenciais: pd.differentials,
  };
  const userPrompt = `FATOS:\n${JSON.stringify(facts)}\n\nCONJUNTOS (ad_groups) — proponha 1 publico por item:\n${JSON.stringify(groups)}`;

  try {
    const aRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: [{ type: "text", text: systemPrompt(scope), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
      }),
    });
    if (!aRes.ok) {
      const detail = await aRes.text().catch(() => "");
      return json({ error: "anthropic_error", status: aRes.status, detail }, 502);
    }
    const data = await aRes.json();
    let parsed: any = {};
    try {
      const block = (data.content || []).find((c: any) => c.type === "text" || c.type === "tool_use");
      parsed = JSON.parse(block?.text ?? JSON.stringify(block?.input ?? {}));
    } catch { parsed = {}; }
    const adSets = Array.isArray(parsed.ad_sets) ? parsed.ad_sets : [];
    return json({ ad_sets: adSets, groups });
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
