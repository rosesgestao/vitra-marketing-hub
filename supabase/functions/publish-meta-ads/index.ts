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

// 2d: cria um formulario instantaneo de Lead na Pagina (nome completo, e-mail, telefone, pt-BR, com
// Politica de Privacidade obrigatoria; follow_up leva ao site/WhatsApp apos enviar). O nome leva um
// timestamp para nunca colidir com formularios pre-existentes (a Meta exige nome unico por Pagina). A
// IDEMPOTENCIA vem do banco (premium_campaigns.meta_lead_form_id), nao de listar leadgen_forms — listar
// exige leads_retrieval, que o token pode nao ter; criar funciona.
async function createLeadForm(pageId: string, formName: string, privacyUrl: string, followUrl: string) {
  const res = await graphPost(`${pageId}/leadgen_forms`, {
    name: formName.slice(0, 100), locale: "PT_BR",
    privacy_policy: { url: privacyUrl, link_text: "Politica de Privacidade" },
    questions: [{ type: "FULL_NAME" }, { type: "EMAIL" }, { type: "PHONE" }],
    ...(followUrl ? { follow_up_action_url: followUrl } : {}),
  });
  return res.id as string;
}

// Resume o geo_locations de um conjunto num formato legivel/aplicavel: cidade ampla, raio (cidade ou
// ponto custom), regiao ou pais. Usado pelo read_campaign_config (importar campanha de referencia).
function summarizeGeo(geo: any): any {
  if (!geo) return { type: "unknown" };
  const cities = geo.cities || [];
  const custom = geo.custom_locations || [];
  if (custom.length) {
    const c = custom[0];
    return { type: "radius_point", radius: c.radius ?? null, unit: c.distance_unit || "kilometer", lat: c.latitude ?? null, lng: c.longitude ?? null, count: custom.length };
  }
  if (cities.length) {
    const c = cities[0];
    const hasRadius = c.radius != null;
    return { type: hasRadius ? "radius_city" : "city", key: c.key ?? null, radius: c.radius ?? null, unit: c.distance_unit || "kilometer", count: cities.length };
  }
  if ((geo.regions || []).length) return { type: "region", count: geo.regions.length };
  if ((geo.countries || []).length) return { type: "country", countries: geo.countries };
  return { type: "other" };
}

async function graphDelete(id: string) {
  const res = await fetch(`${GRAPH}/${id}?access_token=${encodeURIComponent(META_TOKEN)}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && data.error)) throw new Error(`Graph DELETE ${id}: ${data?.error?.message || res.status}`);
  return data;
}

// Guard de marca: cada conta/Pagina pertence a uma marca. Publicar uma campanha numa conta/Pagina de
// OUTRA marca seria cross-contamination. Mapa do que conhecemos (deve acompanhar os ativos do Business
// Manager atribuidos ao system user). Conta/Pagina desconhecida -> nao bloqueia (so bloqueia conflito
// conhecido), para nao travar build legitimo.
const META_ACCOUNT_BRAND: Record<string, string> = {
  "122035585232240": "vitra_imobiliaria", // PoA
  "438407633940884": "vitra_imobiliaria", // Zona Sul
  "548694582827733": "vitra_imobiliaria", // Classificados
  "1057868298461356": "vitra_premium",
};
const META_PAGE_BRAND: Record<string, string> = {
  "1509497485962089": "vitra_imobiliaria", // Vitra Imobiliaria
};

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

  // Importar CONFIG de uma campanha de referencia (vencedora) -> blueprint normalizado. READ-ONLY na Meta
  // (nao gasta, nao cria nada). Usa meta_campaign_id (id da campanha NA META), nao a campanha do banco.
  if (action === "read_campaign_config") {
    const metaCampaignId = String(body.meta_campaign_id || "");
    if (!metaCampaignId) return json({ error: "missing_meta_campaign_id", message: "Informe o meta_campaign_id da campanha de referencia." }, 400);
    try {
      const camp = await graphGet(metaCampaignId, "name,objective,buying_type,bid_strategy,daily_budget,lifetime_budget,status,effective_status");
      const adsetsRes = await graphGet(`${metaCampaignId}/adsets`, "name,optimization_goal,billing_event,bid_strategy,daily_budget,destination_type,promoted_object,targeting{age_min,age_max,genders,geo_locations,publisher_platforms}").catch(() => ({ data: [] }));
      const adsets = (adsetsRes?.data || []).map((a: any) => ({
        name: a.name,
        optimization_goal: a.optimization_goal ?? null,
        billing_event: a.billing_event ?? null,
        age_min: a.targeting?.age_min ?? null,
        age_max: a.targeting?.age_max ?? null,
        genders: a.targeting?.genders ?? null,            // [1]=masc, [2]=fem; ausente = todos
        publisher_platforms: a.targeting?.publisher_platforms ?? null, // ausente = automatico
        geo: summarizeGeo(a.targeting?.geo_locations),
        lead_gen_form_id: a.promoted_object?.lead_gen_form_id ?? null,
      }));
      // Formulario de Lead: tenta pelo promoted_object; senao, pelo 1o anuncio -> creative.
      let formId = adsets.map((a: any) => a.lead_gen_form_id).find(Boolean) || null;
      if (!formId) {
        const adsRes = await graphGet(`${metaCampaignId}/ads`, "creative{id}").catch(() => ({ data: [] }));
        const creativeId = (adsRes?.data || [])[0]?.creative?.id;
        if (creativeId) {
          const cr = await graphGet(creativeId, "object_story_spec").catch(() => null);
          formId = cr?.object_story_spec?.link_data?.call_to_action?.value?.lead_gen_form_id || null;
        }
      }
      let leadForm: any = null;
      if (formId) {
        const f = await graphGet(formId, "name,locale,is_optimized_for_quality,question_page_custom_headline,questions").catch(() => null);
        if (f) leadForm = {
          id: formId, name: f.name ?? null, locale: f.locale ?? null,
          higher_intent: !!f.is_optimized_for_quality,   // true = "maior intencao" (mais fricçao/qualidade)
          questions: (f.questions || []).map((q: any) => q.type || q.key).filter(Boolean),
        };
      }
      return json({
        source_meta_campaign_id: metaCampaignId,
        campaign: {
          name: camp.name ?? null, objective: camp.objective ?? null, buying_type: camp.buying_type ?? null,
          bid_strategy: camp.bid_strategy ?? null,
          daily_budget_cents: camp.daily_budget ? Number(camp.daily_budget) : null,
          lifetime_budget_cents: camp.lifetime_budget ? Number(camp.lifetime_budget) : null,
          cbo: !!camp.daily_budget || !!camp.lifetime_budget,
        },
        adsets, lead_form: leadForm,
      });
    } catch (e) {
      return json({ error: "graph_error", message: String((e as Error)?.message || e) }, 502);
    }
  }

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

    if (action === "delete_draft") {
      // Apaga um rascunho na Meta (campanha DELETE -> cascateia conjuntos/anuncios) e limpa o estado no
      // banco. Destrutivo -> exige confirm:true. Aceita meta_campaign_id explicito (para remover orfaos
      // que nao estao mais ligados a campanha no banco).
      if (body.confirm !== true) return json({ error: "confirm_required", message: "Apagar rascunho e irreversivel. Reenvie com confirm:true." }, 400);
      const { data: campRow } = await svc.from("premium_campaigns").select("meta_campaign_id").eq("id", campaignId).maybeSingle();
      const metaCampaignId = String(body.meta_campaign_id || campRow?.meta_campaign_id || "");
      if (!metaCampaignId) return json({ error: "no_draft", message: "Nenhum rascunho Meta para apagar." }, 404);
      await graphDelete(metaCampaignId);
      await svc.from("premium_publications").delete().eq("campaign_id", campaignId).eq("publication_type", "paid").eq("meta_campaign_id", metaCampaignId);
      if (campRow?.meta_campaign_id === metaCampaignId) {
        await svc.from("premium_campaigns").update({ meta_campaign_id: null, status: "planning" }).eq("id", campaignId);
      }
      return json({ deleted: true, meta_campaign_id: metaCampaignId });
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

      // Guard de marca: a conta/Pagina nao pode ser de outra marca que a da campanha (anti-contaminacao).
      const acctBrand = META_ACCOUNT_BRAND[adAccountId];
      if (acctBrand && acctBrand !== scope) {
        return json({ error: "brand_mismatch", message: `A conta de anuncio pertence a marca "${acctBrand}", mas a campanha e "${scope}". Use a conta da marca correta.` }, 422);
      }
      const pgBrand = META_PAGE_BRAND[pageId];
      if (pgBrand && pgBrand !== scope) {
        return json({ error: "brand_mismatch", message: `A Pagina pertence a marca "${pgBrand}", mas a campanha e "${scope}". Use a Pagina da marca correta.` }, 422);
      }

      // Objetivo (fase 2e): do body (teste de objetivo) ou da campanha; deriva campanha/conjunto/CTA do
      // playbook. Objetivos com pre-requisito (Vendas->pixel, Leads-formulario->ToS) ficam bloqueados
      // com mensagem acionavel ate o pre-requisito existir.
      const obj = objectiveSpec(body.objective || campaign.campaign_objective);
      if (!obj.available) {
        return json({ error: "objective_unavailable", message: `Objetivo "${obj.label}" ainda nao disponivel: ${obj.hint || "pre-requisito pendente."}`, needs: obj.needs }, 422);
      }

      // 2d: Leads por FORMULARIO instantaneo (LEAD_GENERATION). Valida o ToS de Lead da Pagina em
      // runtime (o nosso token e a autoridade — a UI pode dizer "Aceitou" antes de refletir) e garante
      // um formulario. O conjunto usa destination ON_AD + promoted_object{page_id}; o criativo abre o form.
      const isLeadForm = obj.optimization_goal === "LEAD_GENERATION";
      // Click-to-WhatsApp: conjunto otimiza por CONVERSATIONS com destination WHATSAPP + promoted_object;
      // o criativo usa CTA WHATSAPP_MESSAGE (obj.cta) com link wa.me (destination_url). A Pagina precisa
      // de um numero de WhatsApp Business conectado — hoje bloqueado no playbook (available:false) ate isso.
      const isWhatsApp = obj.destination_type === "WHATSAPP";
      // Vendas/Conversoes: otimiza por evento do pixel. Exige pixel_id (dataset) + evento de conversao
      // (default LEAD — imovel raramente tem 'Compra'). O conjunto leva promoted_object{pixel_id,event}.
      const isConversions = obj.optimization_goal === "OFFSITE_CONVERSIONS";
      let pixelId = "";
      let conversionEvent = "LEAD";
      if (isConversions) {
        pixelId = String(body.pixel_id || "");
        conversionEvent = String(body.conversion_event || "LEAD").toUpperCase();
        if (!pixelId) return json({ error: "pixel_required", message: "Selecione o pixel (dataset) para otimizar por conversao." }, 422);
        // Valida pela COLECAO de pixels da conta (o nó single nao expõe is_active de forma confiavel).
        const list = await graphGet(`act_${adAccountId}/adspixels`, "id,name").catch(() => null);
        const ok = (list?.data || []).some((p: any) => String(p.id) === pixelId);
        if (!ok) return json({ error: "pixel_invalid", message: `Pixel ${pixelId} nao pertence a esta conta de anuncio. Escolha um pixel da conta.` }, 422);
      }
      let leadFormId = "";
      if (isLeadForm) {
        const page = await graphGet(pageId, "name,leadgen_tos_accepted").catch(() => null);
        if (!page?.leadgen_tos_accepted) {
          return json({ error: "leadgen_tos_pending", message: `A Pagina ${page?.name || pageId} ainda nao aceitou o ToS de Lead (ou o token nao a enxerga). Um admin precisa aceitar em facebook.com/legal/leadgen/tos e a Pagina deve estar atribuida ao system user.`, needs: ["leadgen_tos"] }, 422);
        }
        // Reusa o formulario ja gravado para esta campanha (idempotente, sem listar); senao cria 1x e grava.
        leadFormId = String(campaign.meta_lead_form_id || "");
        if (!leadFormId) {
          const privacyUrl = String(body.privacy_policy_url || destinationUrl);
          leadFormId = await createLeadForm(pageId, `${campaign.name} | Lead ${new Date().toISOString()}`, privacyUrl, destinationUrl);
          await svc.from("premium_campaigns").update({ meta_lead_form_id: leadFormId }).eq("id", campaignId);
        }
      }

      // ---- Conjuntos a construir ----
      // Agrupa os cortes meta_ads por ad_group (espelha groupMetaAds do front): cada grupo vira 1
      // conjunto + criativo (corte 1:1 do grupo) + anuncio, sob a MESMA campanha CBO. A proposta de
      // publico/posicionamento vem do operador (body.ad_sets, gerada por suggest-meta-audiences e
      // revisada). Sem proposta -> comportamento da fase 1 (1 conjunto amplo, 1o corte renderizado).
      // So criativos APROVADOS (ou ja publicados) vao ao ar — alinha o edge ao gate do painel (readyAds)
      // e impede que um render de teste/rascunho ('generated') seja publicado.
      const { data: assets } = await svc.from("premium_campaign_assets").select("*")
        .eq("campaign_id", campaignId).eq("channel", "meta_ads").in("status", ["approved", "published"]);
      const all = assets || [];
      const anyFeed = all.find((a: any) => a.aspect_ratio === "1:1" && a.public_url) || all.find((a: any) => a.public_url);
      if (!anyFeed?.public_url) return json({ error: "no_approved_creative", message: "Nenhum criativo APROVADO encontrado para esta campanha. Aprove ao menos 1 anúncio (QA completo) antes de publicar." }, 422);

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
        // Geo POR CONJUNTO (preset "campanha de referencia"): raio em km a partir de um ponto (lat/lng)
        // = conjunto REGIONAL; ou cidade inteira = conjunto MACRO. Sobrepoe o geo base da campanha.
        if (spec.geo === "radius" && spec.lat != null && spec.lng != null) {
          t.geo_locations = { custom_locations: [{ latitude: Number(spec.lat), longitude: Number(spec.lng), radius: Math.max(1, Math.min(80, Number(spec.radius_km) || 2)), distance_unit: "kilometer" }] };
        } else if (spec.geo === "city" && spec.city_key) {
          t.geo_locations = { cities: [{ key: String(spec.city_key) }] };
        }
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
        // A Meta passou a EXIGIR a sinalizacao do Advantage+ Audience no targeting. Como enviamos
        // publico explicito (geo/interesses/custom), declaramos 0 = NAO usar a expansao Advantage+
        // (respeita o publico definido). Sem isso a criacao do conjunto falha com "Invalid parameter".
        t.targeting_automation = { advantage_audience: 0 };
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

      // Criativos por conjunto: 1 anuncio POR criativo aprovado (ate N) — espelha a estrutura "3x3" da
      // vencedora (varios criativos no mesmo conjunto p/ teste). Prefere 1:1; dedup por id; cap em N.
      const maxCreatives = Math.max(1, Math.min(10, Number(body.creatives_per_adset) || 3));
      const feedsFor = (spec: any) => {
        const pool = spec.group_key ? all.filter((a: any) => (a.metadata?.ad_group || "") === spec.group_key) : all;
        const withUrl = pool.filter((a: any) => a.public_url);
        const ordered = [...withUrl.filter((a: any) => a.aspect_ratio === "1:1"), ...withUrl.filter((a: any) => a.aspect_ratio !== "1:1")];
        const seen = new Set<string>(); const out: any[] = [];
        for (const a of ordered) { if (!seen.has(a.id)) { seen.add(a.id); out.push(a); } if (out.length >= maxCreatives) break; }
        return out.length ? out : (anyFeed ? [anyFeed] : []);
      };

      // ---- Um conjunto por grupo; N anuncios (1 por criativo aprovado) — TUDO PAUSED ----
      const built: any[] = [];
      let totalAds = 0;
      for (const spec of specs) {
        // Pre-valida a copy de cada criativo; so cria o conjunto se houver ao menos 1 criativo valido.
        const valid: any[] = [];
        for (const asset of feedsFor(spec)) {
          const m = asset.metadata?.meta_ad || {};
          const headline = String(asset.headline || m.nome || campaign.product_name || "").slice(0, 40);
          const primaryText = String(m.texto_principal || asset.copy || "");
          const cta = String(asset.cta || "Saiba mais");
          const issues = validateCopyAngle({ headline, body: primaryText, cta }, { scope, headlineMax: 40, productName: String(campaign.product_name || ""), channel: "paid" }).issues;
          if (issues.length) continue;
          valid.push({ asset, headline, primaryText, descricao: String(m.descricao || "") });
        }
        if (!valid.length) { built.push({ group_key: spec.group_key, label: spec.label, skipped: "sem criativo aprovado com copy valida" }); continue; }

        const targeting = await targetingFor(spec);
        const adsetRes = await graphPost(`act_${adAccountId}/adsets`, {
          name: `${campaign.name} | ${spec.label || valid[0].asset.metadata?.ad_label || "Conjunto"}`.slice(0, 100),
          campaign_id: campRes.id, optimization_goal: obj.optimization_goal, billing_event: obj.billing_event,
          ...(obj.destination_type ? { destination_type: obj.destination_type } : {}),
          ...(isConversions
            ? { promoted_object: { pixel_id: pixelId, custom_event_type: conversionEvent } }
            : (isLeadForm || isWhatsApp) ? { promoted_object: { page_id: pageId } } : {}),
          targeting, status: "PAUSED",
          ...(body.start_time ? { start_time: body.start_time } : {}),
          ...(body.end_time ? { end_time: body.end_time } : {}),
        });
        // CTA: formulario instantaneo abre o lead_gen_form na propria Meta; demais objetivos levam ao link.
        const callToAction = isLeadForm
          ? { type: obj.cta, value: { lead_gen_form_id: leadFormId, link: destinationUrl } }
          : { type: obj.cta, value: { link: destinationUrl } };
        const adIds: string[] = [];
        for (const v of valid) {
          const creativeRes = await graphPost(`act_${adAccountId}/adcreatives`, {
            name: `${campaign.name} | ${v.headline}`.slice(0, 100),
            object_story_spec: { page_id: pageId, link_data: {
              link: destinationUrl, message: v.primaryText, name: v.headline, description: v.descricao,
              picture: String(v.asset.public_url).split("?")[0], call_to_action: callToAction,
            } },
          });
          const adRes = await graphPost(`act_${adAccountId}/ads`, {
            name: `${campaign.name} | ${v.headline}`.slice(0, 100),
            adset_id: adsetRes.id, creative: { creative_id: creativeRes.id }, status: "PAUSED",
          });
          await svc.from("premium_publications").insert({
            campaign_id: campaignId, platform: "facebook", publication_type: "paid", status: "scheduled",
            meta_campaign_id: campRes.id, meta_adset_id: adsetRes.id, meta_ad_id: adRes.id,
            utm_url: destinationUrl, asset_id: v.asset.id,
            metadata: { ad_account_id: adAccountId, page_id: pageId, daily_budget_cents: dailyBudgetCents, ad_group: spec.group_key, audience: spec, creative_id: creativeRes.id, created_via: "publish-meta-ads", paused: true },
          });
          adIds.push(adRes.id);
        }
        totalAds += adIds.length;
        built.push({ group_key: spec.group_key, label: spec.label, adset_id: adsetRes.id, ads: adIds.length, ad_ids: adIds });
      }

      const okBuilt = built.filter((b) => b.adset_id);
      if (!okBuilt.length) return json({ error: "nothing_built", message: "Nenhum conjunto pode ser criado (sem criativo aprovado ou copy reprovada).", built }, 422);
      return json({
        ok: true, paused: true, meta_campaign_id: campRes.id, ad_sets: okBuilt.length, ads: totalAds, built,
        ads_manager_url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}&selected_campaign_ids=${campRes.id}`,
        message: `Rascunho criado na Meta: ${okBuilt.length} conjunto(s) e ${totalAds} anuncio(s), tudo PAUSED. Nada foi ativado nem gastou verba.`,
      });
    }

    return json({ error: "unknown_action", message: `Acao '${action}' nao suportada.` }, 400);
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
