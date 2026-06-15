// Edge Function: sync-metrics-from-meta (fase 2a) — puxa os insights da Meta (Graph API) das
// publicacoes pagas e faz UPSERT em premium_metrics, fechando o loop de ROI no dashboard.
// READ-ONLY na Meta (so GET /insights): nao cria, nao altera, nao gasta.
//
// Token: secret META_ACCESS_TOKEN (server-side). Auth: mesmo gate das demais edges (service role OU
// anon + x-copilot-gate) — ver _shared/edgeAuth.ts. Insights tem ~24h de atraso; campanha PAUSED (sem
// entrega) retorna vazio (esperado -> 0 linhas). Idempotente: upsert por (publication_id, metric_date,
// source) — rodar 2x nao duplica (indice unico premium_metrics_pub_date_source_uniq).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { authorizeAiEdge } from "../_shared/edgeAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const GRAPH = `https://graph.facebook.com/${Deno.env.get("META_GRAPH_VERSION") ?? "v23.0"}`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
  "Content-Type": "application/json",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });

const LEAD_ACTIONS = new Set(["lead", "onsite_conversion.lead_grouped", "leadgen_grouped", "offsite_conversion.fb_pixel_lead"]);

async function graphGet(path: string, query: string) {
  const url = `${GRAPH}/${path}?${query}&access_token=${encodeURIComponent(META_TOKEN)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(`Graph ${path}: ${data?.error?.message || res.status}`);
  return data;
}

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "metodo nao permitido" }, 405);

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);
  if (!META_TOKEN) return json({ error: "not_configured", message: "META_ACCESS_TOKEN nao configurado. Defina o secret para sincronizar metricas." }, 503);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "not_configured", message: "Supabase service role ausente." }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const campaignId = body.campaign_id || null;

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    let q = svc.from("premium_publications")
      .select("id, campaign_id, social_account_id, platform, meta_ad_id")
      .eq("publication_type", "paid")
      .not("meta_ad_id", "is", null);
    if (campaignId) q = q.eq("campaign_id", campaignId);
    const { data: pubs, error: pErr } = await q;
    if (pErr) return json({ error: "db_error", message: pErr.message }, 500);
    if (!pubs?.length) return json({ publications: 0, rows: 0, empty: true, message: "Nenhuma publicacao paga com anuncio na Meta para sincronizar." });

    const fields = "reach,impressions,spend,clicks,inline_link_clicks,actions,ctr,cpc,cpm";
    const rows: any[] = [];
    const errors: Array<{ publication_id: string; error: string }> = [];

    for (const pub of pubs) {
      try {
        const ins = await graphGet(`${pub.meta_ad_id}/insights`, `fields=${fields}&time_increment=1&date_preset=last_30d`);
        for (const day of (ins.data || [])) {
          const leads = Array.isArray(day.actions)
            ? day.actions.filter((a: any) => LEAD_ACTIONS.has(a.action_type)).reduce((s: number, a: any) => s + (num(a.value) || 0), 0)
            : null;
          rows.push({
            publication_id: pub.id,
            campaign_id: pub.campaign_id,
            social_account_id: pub.social_account_id,
            platform: pub.platform || "facebook",
            source: "paid",
            metric_date: day.date_start,
            reach: num(day.reach),
            impressions: num(day.impressions),
            clicks: num(day.clicks),
            link_clicks: num(day.inline_link_clicks),
            leads: leads,
            spend: num(day.spend),
            ctr: num(day.ctr),
            cpc: num(day.cpc),
            cpm: num(day.cpm),
            raw_payload: day,
            collected_at: new Date().toISOString(),
          });
        }
        await svc.from("premium_publications").update({
          metadata: { last_metrics_sync: new Date().toISOString() },
        }).eq("id", pub.id);
      } catch (e) {
        errors.push({ publication_id: pub.id, error: String((e as Error)?.message || e) });
      }
    }

    if (rows.length) {
      const { error: upErr } = await svc.from("premium_metrics").upsert(rows, { onConflict: "publication_id,metric_date,source" });
      if (upErr) return json({ error: "upsert_error", message: upErr.message, errors }, 500);
    }

    return json({
      publications: pubs.length,
      rows: rows.length,
      empty: rows.length === 0,
      errors,
      message: rows.length
        ? `Sincronizadas ${rows.length} linha(s) de metricas de ${pubs.length} publicacao(oes).`
        : "0 metricas — campanhas pausadas ou ainda sem entrega (insights da Meta tem ~24h de atraso).",
    });
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
