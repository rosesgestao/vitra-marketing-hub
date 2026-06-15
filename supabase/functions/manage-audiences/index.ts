// Edge Function: manage-audiences (fase 2c) — lista e cria publicos (custom audiences) na Meta via
// Graph API, para alimentar o retargeting dos conjuntos (2b). Criar publico nao gasta verba, mas
// ESCREVE na conta — por isso fica atras do mesmo gate das demais edges (service role OU anon +
// x-copilot-gate) e do secret META_ACCESS_TOKEN.
//
// Acoes:
//  - list: GET /act_{id}/customaudiences (id, nome, subtype, tamanho aprox., status).
//  - create_website: publico de RETARGETING de visitantes do site (precisa do pixel_id; regra
//    ALL_VISITORS). Ideal para o conjunto de retargeting do funil imobiliario.
//  - create_lookalike: publico semelhante a partir de uma audiencia-fonte (origin_audience_id) +
//    pais (BR) + ratio. (O MCP nao cria lookalike; pela Graph direto, sim.)

import { authorizeAiEdge } from "../_shared/edgeAuth.ts";

const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const GRAPH = `https://graph.facebook.com/${Deno.env.get("META_GRAPH_VERSION") ?? "v23.0"}`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
  "Content-Type": "application/json",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });

async function graphPost(path: string, params: Record<string, unknown>) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  form.append("access_token", META_TOKEN);
  const res = await fetch(`${GRAPH}/${path}`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(`Graph ${path}: ${data?.error?.message || res.status}`);
  return data;
}

async function graphGet(path: string, query: string) {
  const url = `${GRAPH}/${path}?${query}&access_token=${encodeURIComponent(META_TOKEN)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(`Graph ${path}: ${data?.error?.message || res.status}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "metodo nao permitido" }, 405);

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);
  if (!META_TOKEN) return json({ error: "not_configured", message: "META_ACCESS_TOKEN nao configurado." }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const action = String(body.action || "list");

  // page_status (read-only): le name + leadgen_tos_accepted por Pagina com o NOSSO token. Aceita
  // page_ids[] direto, ou deriva as Paginas promovidas a partir de ad_account_id. Serve para
  // reconciliar o aceite do ToS de Lead (a UI pode dizer "Aceitou" antes da API/token refletir).
  if (action === "page_status") {
    try {
      let pageIds: string[] = Array.isArray(body.page_ids) ? body.page_ids.map((p: unknown) => String(p)) : [];
      const acct = String(body.ad_account_id || "").replace(/^act_/, "");
      if (!pageIds.length && acct) {
        const promo = await graphGet(`act_${acct}/promote_pages`, "fields=id&limit=200");
        pageIds = (promo.data || []).map((p: any) => String(p.id));
      }
      if (!pageIds.length) return json({ error: "missing_pages", message: "Informe page_ids[] ou ad_account_id." }, 400);
      const pages = await Promise.all(pageIds.map(async (id) => {
        try {
          const p = await graphGet(id, "fields=name,leadgen_tos_accepted");
          return { page_id: id, name: p.name ?? null, leadgen_tos_accepted: !!p.leadgen_tos_accepted };
        } catch (e) {
          return { page_id: id, error: String((e as Error)?.message || e) };
        }
      }));
      return json({ pages });
    } catch (e) {
      return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
    }
  }

  const adAccountId = String(body.ad_account_id || "").replace(/^act_/, "");
  if (!adAccountId) return json({ error: "missing_account", message: "Informe ad_account_id." }, 400);

  try {
    if (action === "list") {
      const data = await graphGet(`act_${adAccountId}/customaudiences`, "fields=id,name,subtype,approximate_count_lower_bound,delivery_status,time_created&limit=200");
      const audiences = (data.data || []).map((a: any) => ({
        id: a.id, name: a.name, subtype: a.subtype,
        size: a.approximate_count_lower_bound ?? null,
        status: a.delivery_status?.code === 200 ? "ready" : (a.delivery_status?.description || "n/a"),
      }));
      return json({ audiences });
    }

    if (action === "create_website") {
      const pixelId = String(body.pixel_id || "");
      const name = String(body.name || "Visitantes do site").slice(0, 100);
      const retentionSeconds = Math.min(Math.max(Number(body.retention_days || 180), 1), 180) * 86400;
      if (!pixelId) return json({ error: "missing_pixel", message: "Informe o pixel_id (Gerenciador de Eventos da Meta)." }, 400);
      const rule = {
        inclusions: {
          operator: "or",
          rules: [{
            event_sources: [{ type: "pixel", id: pixelId }],
            retention_seconds: retentionSeconds,
            filter: { operator: "and", filters: [{ field: "url", operator: "i_contains", value: "" }] },
            template: "ALL_VISITORS",
          }],
        },
      };
      const res = await graphPost(`act_${adAccountId}/customaudiences`, { name, subtype: "WEBSITE", rule, prefill: true });
      return json({ ok: true, audience_id: res.id, name, subtype: "WEBSITE" });
    }

    if (action === "create_lookalike") {
      const originId = String(body.origin_audience_id || "");
      const country = String(body.country || "BR");
      const ratio = Math.min(Math.max(Number(body.ratio || 0.01), 0.01), 0.2);
      const name = String(body.name || "Semelhante").slice(0, 100);
      if (!originId) return json({ error: "missing_origin", message: "Informe origin_audience_id (a audiencia-fonte do lookalike)." }, 400);
      const res = await graphPost(`act_${adAccountId}/customaudiences`, {
        name, subtype: "LOOKALIKE", origin_audience_id: originId,
        lookalike_spec: { type: "similarity", country, ratio },
      });
      return json({ ok: true, audience_id: res.id, name, subtype: "LOOKALIKE" });
    }

    return json({ error: "unknown_action", message: `Acao '${action}' nao suportada.` }, 400);
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
