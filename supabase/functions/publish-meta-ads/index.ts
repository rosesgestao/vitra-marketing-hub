// Edge Function: publish-meta-ads — publica uma campanha Meta Ads a partir dos criativos ja
// renderizados/aprovados no dashboard, falando direto com a Graph API. O agente monta a estrutura
// AUTONOMAMENTE, mas SEMPRE em status PAUSED; ATIVAR (gastar verba) e uma acao SEPARADA, exige
// confirm:true do operador e NUNCA acontece sozinho.
//
// Fase 1 (MVP) — espelha o spike validado: 1 campanha (OUTCOME_LEADS, CBO com o TETO definido pelo
// operador) -> 1 conjunto (LINK_CLICKS, destino site/WhatsApp) -> 1 criativo (imagem = public_url do
// render pipeline) -> 1 anuncio. Tudo PAUSED. Copy validada server-side (separacao de marca).
//
// Token: secret META_ACCESS_TOKEN (system user, server-side; NUNCA no browser). Sem ele -> 503.
// Auth: mesmo gate das demais edges (service role OU anon + x-copilot-gate) — ver _shared/edgeAuth.ts.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { authorizeAiEdge } from "../_shared/edgeAuth.ts";
import { validateCopyAngle } from "../_shared/copyValidation.ts";
import { objectiveSpec } from "../_shared/objectivePlaybook.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const GRAPH = `https://graph.facebook.com/${Deno.env.get("META_GRAPH_VERSION") ?? "v23.0"}`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

// POST na Graph API (form-urlencoded). Objetos viram JSON; demais valores vao como string.
async function graphPost(path: string, params: Record<string, unknown>) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  form.append("access_token", META_TOKEN);
  const res = await fetch(`${GRAPH}/${path}`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && data.error)) {
    const e = data?.error || {};
    throw new Error(`Graph ${path}: ${e.message || res.status}${e.error_user_msg ? ` — ${e.error_user_msg}` : ""}`);
  }
  return data;
}

async function graphGet(id: string, fields: string) {
  const url = `${GRAPH}/${id}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(META_TOKEN)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && data.error)) throw new Error(`Graph GET ${id}: ${data?.error?.message || res.status}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "metodo nao permitido" }, 405);

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);

  if (!META_TOKEN) {
    return json({
      error: "not_configured",
      message: "META_ACCESS_TOKEN nao configurado. Defina o secret (token de system user da Meta): npx supabase secrets set META_ACCESS_TOKEN=...",
    }, 503);
  }
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "not_configured", message: "Supabase service role ausente." }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const action = String(body.action || "build_draft");
  const campaignId = body.campaign_id;
  if (!campaignId) return json({ error: "missing_campaign_id" }, 400);

  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    if (action === "status") {
      const { data: pub } = await svc.from("premium_publications").select("meta_campaign_id, meta_adset_id, meta_ad_id, status")
        .eq("campaign_id", campaignId).eq("publication_type", "paid").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!pub?.meta_campaign_id) return json({ exists: false });
      const meta = await graphGet(pub.meta_campaign_id, "name,status,effective_status,daily_budget");
      return json({ exists: true, db_status: pub.status, meta });
    }

    if (action === "activate") {
      // GATE: ativar gasta verba — exige confirmacao explicita do operador. Nunca automatico.
      if (body.confirm !== true) {
        return json({ error: "confirm_required", message: "Ativar a campanha gasta verba. Reenvie com confirm:true (acao explicita do operador)." }, 400);
      }
      // Campanha mais recente publicada para esta campanha (todos os conjuntos compartilham o mesmo
      // meta_campaign_id). Ativa TODOS os conjuntos/anuncios desse rascunho + a campanha.
      const { data: campRow } = await svc.from("premium_campaigns").select("meta_campaign_id").eq("id", campaignId).maybeSingle();
      const metaCampaignId = campRow?.meta_campaign_id;
      if (!metaCampaignId) return json({ error: "no_draft", message: "Nenhum rascunho Meta encontrado para esta campanha. Crie o rascunho primeiro." }, 404);
      const { data: pubs } = await svc.from("premium_publications").select("id, meta_adset_id, meta_ad_id")
        .eq("campaign_id", campaignId).eq("publication_type", "paid").eq("meta_campaign_id", metaCampaignId);
      const ids = [
        ...(pubs || []).map((p: any) => p.meta_adset_id).filter(Boolean),
        ...(pubs || []).map((p: any) => p.meta_ad_id).filter(Boolean),
        metaCampaignId,
      ];
      for (const id of ids) { await graphPost(id, { status: "ACTIVE" }); }
      await svc.from("premium_publications").update({ status: "published", published_at: new Date().toISOString() })
        .eq("campaign_id", campaignId).eq("publication_type", "paid").eq("meta_campaign_id", metaCampaignId);
      await svc.from("premium_campaigns").update({ status: "active" }).eq("id", campaignId);
      return json({ activated: true, meta_campaign_id: metaCampaignId, ad_sets: (pubs || []).length });
    }

    if (action === "build_draft") {
      const adAccountId = String(body.ad_account_id || "").replace(/^act_/, "");
      const pageId = String(body.page_id || "");
      const destinationUrl = String(body.destination_url || "");
      const dailyBudgetCents = Math.max(Number(body.daily_budget_cents || 0), 0);
      if (!adAccountId || !pageId) return json({ error: "missing_account_or_page", message: "Informe ad_account_id e page_id." }, 400);
      if (!destinationUrl) return json({ error: "missing_destination", message: "Informe destination_url (site ou link de WhatsApp)." }, 400);
      if (dailyBudgetCents < 100) return json({ error: "missing_budget", message: "Defina o teto de orcamento diario (em centavos)." }, 400);

      // Campanha + dados da marca
      const { data: campaign, error: cErr } = await svc.from("premium_campaigns").select("*").eq("id", campaignId).single();
      if (cErr || !campaign) return json({ error: "campaign_not_found" }, 404);
      const scope = campaign.brief?.brand_scope || campaign.brief?.qa_policy?.brand_scope || "vitra_imobiliaria";

      // Objetivo (fase 2e): do body (teste de objetivo) ou da campanha; deriva campanha/conjunto/CTA do
      // playbook. Objetivos com pre-requisito (Vendas->pixel, Leads-formulario->ToS) ficam bloqueados
      // com mensagem acionavel ate o pre-requisito existir.
      const obj = objectiveSpec(body.objective || campaign.campaign_objective);
      if (!obj.available) {
        return json({ error: "objective_unavailable", message: `Objetivo "${obj.label}" ainda nao disponivel: ${obj.hint || "pre-requisito pendente."}`, needs: obj.needs }, 422);
      }

      // ---- Conjuntos a construir ----
      // Agrupa os cortes meta_ads por ad_group (espelha groupMetaAds do front): cada grupo vira 1
      // conjunto + criativo (corte 1:1 do grupo) + anuncio, sob a MESMA campanha CBO. A proposta de
      // publico/posicionamento vem do operador (body.ad_sets, gerada por suggest-meta-audiences e
      // revisada). Sem proposta -> comportamento da fase 1 (1 conjunto amplo, 1o corte renderizado).
      const { data: assets } = await svc.from("premium_campaign_assets").select("*")
        .eq("campaign_id", campaignId).eq("channel", "meta_ads").in("status", ["generated", "approved", "published"]);
      const all = assets || [];
      const feedOf = (groupKey: string) => {
        const inG = all.filter((a: any) => (a.metadata?.ad_group || "") === groupKey);
        return inG.find((a: any) => a.aspect_ratio === "1:1" && a.public_url) || inG.find((a: any) => a.public_url);
      };
      const anyFeed = all.find((a: any) => a.aspect_ratio === "1:1" && a.public_url) || all.find((a: any) => a.public_url);
      if (!anyFeed?.public_url) return json({ error: "no_creative", message: "Nenhum corte renderizado (public_url) encontrado. Gere os criativos antes de publicar." }, 422);

      const proposed = Array.isArray(body.ad_sets) && body.ad_sets.length ? body.ad_sets : null;
      const specs: any[] = proposed || [{ group_key: anyFeed.metadata?.ad_group || null, label: anyFeed.metadata?.ad_label || "Conjunto Leads", placements: "automatic" }];

      // Resolve interesses/geo (keyword -> ID real via Graph search; NUNCA inventar). Best-effort.
      async function searchGraph(type: string, q: string) {
        try {
          const url = `${GRAPH}/search?type=${type}&q=${encodeURIComponent(q)}&limit=1&access_token=${encodeURIComponent(META_TOKEN)}`;
          const r = await fetch(url); const d = await r.json().catch(() => ({}));
          return Array.isArray(d.data) && d.data[0] ? d.data[0] : null;
        } catch { return null; }
      }
      const pdCity = campaign.brief?.product_data?.city || campaign.city || "";
      let geo: any = { geo_locations: { countries: ["BR"] } };
      if (pdCity) {
        const city = await searchGraph("adgeolocation", String(pdCity));
        if (city?.key) geo = { geo_locations: { cities: [{ key: city.key, radius: 25, distance_unit: "kilometer" }] } };
      }
      async function targetingFor(spec: any) {
        const t: any = { ...geo };
        if (spec.age_min) t.age_min = Math.max(18, Math.min(65, Number(spec.age_min)));
        if (spec.age_max) t.age_max = Math.max(18, Math.min(65, Number(spec.age_max)));
        // 2c: conjunto de retargeting usa um publico custom (site/lookalike) escolhido pelo operador.
        // Com publico custom, NAO sobrepoe interesses (o publico ja define quem ve).
        if (spec.custom_audience_id) t.custom_audiences = [{ id: String(spec.custom_audience_id) }];
        const kws: string[] = Array.isArray(spec.interest_keywords) ? spec.interest_keywords.slice(0, 6) : [];
        const interests: any[] = [];
        for (const kw of kws) { const it = await searchGraph("adinterest", String(kw)); if (it?.id) interests.push({ id: it.id, name: it.name }); }
        if (interests.length && !spec.retargeting && !spec.custom_audience_id) t.flexible_spec = [{ interests }];
        const pl = String(spec.placements || "automatic").toLowerCase();
        if (pl !== "automatic" && pl.trim()) {
          const platforms = new Set<string>(); const fb: string[] = []; const ig: string[] = [];
          for (const w of pl.split(",").map((s) => s.trim())) {
            if (w.startsWith("facebook")) { platforms.add("facebook"); if (w.includes("feed")) fb.push("feed"); if (w.includes("reels")) fb.push("facebook_reels"); }
            if (w.startsWith("instagram")) { platforms.add("instagram"); if (w.includes("feed")) ig.push("stream"); if (w.includes("stories")) ig.push("story"); if (w.includes("reels")) ig.push("reels"); }
          }
          if (platforms.size) t.publisher_platforms = [...platforms];
          if (fb.length) t.facebook_positions = fb;
          if (ig.length) t.instagram_positions = ig;
        }
        return t;
      }

      // ---- Campanha (1x, CBO com o teto do operador, PAUSED) ----
      const stamp = new Date().toISOString().slice(0, 10);
      const campRes = await graphPost(`act_${adAccountId}/campaigns`, {
        name: `${campaign.name} | ${obj.label} ${stamp}`.slice(0, 100),
        objective: obj.objective, status: "PAUSED", special_ad_categories: [],
        buying_type: "AUCTION", bid_strategy: "LOWEST_COST_WITHOUT_CAP", daily_budget: dailyBudgetCents,
      });
      await svc.from("premium_campaigns").update({ meta_campaign_id: campRes.id }).eq("id", campaignId);

      // ---- Um conjunto + criativo + anuncio por grupo (TUDO PAUSED) ----
      const built: any[] = [];
      for (const spec of specs) {
        const asset = spec.group_key ? feedOf(spec.group_key) : anyFeed;
        if (!asset?.public_url) { built.push({ group_key: spec.group_key, skipped: "sem criativo renderizado" }); continue; }
        const m = asset.metadata?.meta_ad || {};
        const headline = String(asset.headline || m.nome || campaign.product_name || "").slice(0, 40);
        const primaryText = String(m.texto_principal || asset.copy || "");
        const cta = String(asset.cta || "Saiba mais");
        const issues = validateCopyAngle({ headline, body: primaryText, cta }, { scope, headlineMax: 40, productName: String(campaign.product_name || "") }).issues;
        if (issues.length) { built.push({ group_key: spec.group_key, skipped: "copy reprovada", issues }); continue; }
        const targeting = await targetingFor(spec);
        const adsetRes = await graphPost(`act_${adAccountId}/adsets`, {
          name: `${campaign.name} | ${spec.label || asset.metadata?.ad_label || "Conjunto"}`.slice(0, 100),
          campaign_id: campRes.id, optimization_goal: obj.optimization_goal, billing_event: obj.billing_event,
          ...(obj.destination_type ? { destination_type: obj.destination_type } : {}),
          targeting, status: "PAUSED",
          ...(body.start_time ? { start_time: body.start_time } : {}),
          ...(body.end_time ? { end_time: body.end_time } : {}),
        });
        const creativeRes = await graphPost(`act_${adAccountId}/adcreatives`, {
          name: `${campaign.name} | ${spec.label || "Criativo"}`.slice(0, 100),
          object_story_spec: { page_id: pageId, link_data: {
            link: destinationUrl, message: primaryText, name: headline, description: String(m.descricao || ""),
            picture: String(asset.public_url).split("?")[0], call_to_action: { type: obj.cta, value: { link: destinationUrl } },
          } },
        });
        const adRes = await graphPost(`act_${adAccountId}/ads`, {
          name: `${campaign.name} | ${spec.label || "Anuncio"}`.slice(0, 100),
          adset_id: adsetRes.id, creative: { creative_id: creativeRes.id }, status: "PAUSED",
        });
        await svc.from("premium_publications").insert({
          campaign_id: campaignId, platform: "facebook", publication_type: "paid", status: "scheduled",
          meta_campaign_id: campRes.id, meta_adset_id: adsetRes.id, meta_ad_id: adRes.id,
          utm_url: destinationUrl, asset_id: asset.id,
          metadata: { ad_account_id: adAccountId, page_id: pageId, daily_budget_cents: dailyBudgetCents, ad_group: spec.group_key, audience: spec, creative_id: creativeRes.id, created_via: "publish-meta-ads", paused: true },
        });
        built.push({ group_key: spec.group_key, label: spec.label, adset_id: adsetRes.id, ad_id: adRes.id });
      }

      const okBuilt = built.filter((b) => b.ad_id);
      if (!okBuilt.length) return json({ error: "nothing_built", message: "Nenhum conjunto pode ser criado (sem criativo ou copy reprovada).", built }, 422);
      return json({
        ok: true, paused: true, meta_campaign_id: campRes.id, ad_sets: okBuilt.length, built,
        ads_manager_url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}&selected_campaign_ids=${campRes.id}`,
        message: `Rascunho criado na Meta: ${okBuilt.length} conjunto(s), tudo PAUSED. Nada foi ativado nem gastou verba.`,
      });
    }

    return json({ error: "unknown_action", message: `Acao '${action}' nao suportada.` }, 400);
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
