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
      const { data: pub } = await svc.from("premium_publications").select("id, meta_campaign_id, meta_adset_id, meta_ad_id")
        .eq("campaign_id", campaignId).eq("publication_type", "paid").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!pub?.meta_campaign_id) return json({ error: "no_draft", message: "Nenhum rascunho Meta encontrado para esta campanha. Crie o rascunho primeiro." }, 404);
      // Ativa os 3 niveis (campanha + conjunto + anuncio) — paused-by-default exige ligar cada um.
      for (const id of [pub.meta_adset_id, pub.meta_ad_id, pub.meta_campaign_id].filter(Boolean)) {
        await graphPost(id, { status: "ACTIVE" });
      }
      await svc.from("premium_publications").update({ status: "published", published_at: new Date().toISOString() }).eq("id", pub.id);
      await svc.from("premium_campaigns").update({ status: "active" }).eq("id", campaignId);
      return json({ activated: true, meta_campaign_id: pub.meta_campaign_id });
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

      // Criativo: 1o corte 1:1 ja renderizado (public_url do render pipeline)
      const { data: assets } = await svc.from("premium_campaign_assets").select("*")
        .eq("campaign_id", campaignId).eq("channel", "meta_ads").in("status", ["generated", "approved", "published"]);
      const feed = (assets || []).find((a: any) => a.aspect_ratio === "1:1" && a.public_url) || (assets || []).find((a: any) => a.public_url);
      if (!feed?.public_url) return json({ error: "no_creative", message: "Nenhum corte renderizado (public_url) encontrado. Gere os criativos antes de publicar." }, 422);

      const metaAd = feed.metadata?.meta_ad || {};
      const headline = String(feed.headline || metaAd.nome || campaign.product_name || "").slice(0, 40);
      const primaryText = String(metaAd.texto_principal || feed.copy || "");
      const description = String(metaAd.descricao || "");
      const cta = String(feed.cta || "Saiba mais");
      const imageUrl = String(feed.public_url).split("?")[0]; // sem cache-buster

      // Guard-rail de marca: bloqueia publicar copy com vocabulario fora da marca (mesma regra da edge de copy)
      const issues = validateCopyAngle({ headline, body: primaryText, cta }, {
        scope, headlineMax: 40, productName: String(campaign.product_name || ""),
      }).issues;
      if (issues.length) {
        return json({ error: "copy_invalid", message: "Copy reprovada na validacao de marca. Ajuste antes de publicar.", issues }, 422);
      }

      // ---- Graph API: campanha -> conjunto -> criativo -> anuncio (TUDO PAUSED) ----
      const stamp = new Date().toISOString().slice(0, 10);
      const campRes = await graphPost(`act_${adAccountId}/campaigns`, {
        name: `${campaign.name} | Leads ${stamp}`,
        objective: "OUTCOME_LEADS",
        status: "PAUSED",
        special_ad_categories: [],
        buying_type: "AUCTION",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        daily_budget: dailyBudgetCents, // CBO: teto definido pelo operador
      });

      const targeting = body.targeting && typeof body.targeting === "object"
        ? body.targeting
        : { geo_locations: { countries: ["BR"] } };

      const adsetRes = await graphPost(`act_${adAccountId}/adsets`, {
        name: `${campaign.name} | Conjunto Leads`,
        campaign_id: campRes.id,
        optimization_goal: "LINK_CLICKS",
        billing_event: "IMPRESSIONS",
        destination_type: "WEBSITE",
        targeting,
        status: "PAUSED",
        ...(body.start_time ? { start_time: body.start_time } : {}),
        ...(body.end_time ? { end_time: body.end_time } : {}),
      });

      const creativeRes = await graphPost(`act_${adAccountId}/adcreatives`, {
        name: `${campaign.name} | Criativo`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            link: destinationUrl,
            message: primaryText,
            name: headline,
            description,
            picture: imageUrl,
            call_to_action: { type: "LEARN_MORE", value: { link: destinationUrl } },
          },
        },
      });

      const adRes = await graphPost(`act_${adAccountId}/ads`, {
        name: `${campaign.name} | Anuncio`,
        adset_id: adsetRes.id,
        creative: { creative_id: creativeRes.id },
        status: "PAUSED",
      });

      // ---- Write-back: grava os IDs da Meta (modelo de dados ja tem as colunas) ----
      await svc.from("premium_campaigns").update({ meta_campaign_id: campRes.id }).eq("id", campaignId);
      const { data: pub } = await svc.from("premium_publications").insert({
        campaign_id: campaignId,
        platform: "facebook",
        publication_type: "paid",
        status: "scheduled", // criado e PAUSADO, aguardando ativacao explicita
        meta_campaign_id: campRes.id,
        meta_adset_id: adsetRes.id,
        meta_ad_id: adRes.id,
        utm_url: destinationUrl,
        asset_id: feed.id,
        metadata: { ad_account_id: adAccountId, page_id: pageId, daily_budget_cents: dailyBudgetCents, creative_id: creativeRes.id, created_via: "publish-meta-ads", paused: true },
      }).select("id").maybeSingle();

      return json({
        ok: true,
        paused: true,
        meta_campaign_id: campRes.id,
        meta_adset_id: adsetRes.id,
        meta_ad_id: adRes.id,
        creative_id: creativeRes.id,
        publication_id: pub?.id || null,
        ads_manager_url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}&selected_campaign_ids=${campRes.id}`,
        message: "Rascunho criado na Meta em status PAUSED. Nada foi ativado nem gastou verba.",
      });
    }

    return json({ error: "unknown_action", message: `Acao '${action}' nao suportada.` }, 400);
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
