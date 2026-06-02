// Edge Function: render-asset (Fase 3) - satori -> SVG -> resvg -> PNG, logo + paleta 100% brandbook
import { createClient } from "jsr:@supabase/supabase-js@2";
import satori from "npm:satori@0.10.13";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GOLD = "#C4942A";        // brandbook --gold
const GOLD_LIGHT = "#F0C95C";  // brandbook --gold-light (kicker)
const OFF_WHITE = "#F5F5F0";   // brandbook --off-white (copy)
const SCALE = 0.55;
const PHASE_TAG: Record<string, string> = { "1": "FASE 1 - TEASER", "2": "FASE 2 - REVELACAO", "3": "FASE 3 - URGENCIA" };
const MODEL_LABEL: Record<string, string> = {
  "premium-photo-offer": "Foto protagonista + oferta",
  "premium-editorial-panel": "Painel editorial + imagem",
  "premium-dark-spec": "Ficha premium escura",
  "premium-location-panorama": "Panorama de localizacao",
  "premium-gallery-proof": "Prova visual / galeria",
};

const LOGO_INNER = `<g transform="translate(3,2) scale(0.87)"><polygon points="55,8 94,30.5 94,72.5 55,95 16,72.5 16,30.5" fill="#000000" stroke="#C4942A" stroke-width="2.3"/><polygon points="55,13 90,33 90,70 55,90 20,70 20,33" fill="none" stroke="rgba(212,168,74,0.15)" stroke-width="0.7"/><polygon points="25,37 39,37 32,54" fill="#FFE08A"/><polygon points="25,37 32,54 55,76" fill="#8B6914"/><polygon points="39,37 32,54 55,76" fill="#C4942A"/><polygon points="85,37 71,37 78,54" fill="#F0C95C"/><polygon points="85,37 78,54 55,76" fill="#7A5C10"/><polygon points="71,37 78,54 55,76" fill="#D4A84A"/></g><line x1="105" y1="20" x2="105" y2="80" stroke="rgba(196,148,42,0.2)" stroke-width="1"/><text x="135" y="48" font-family="Inter" font-weight="700" font-size="27" letter-spacing="12" fill="#FFFFFF">VITR</text><path d="M254.99,28.56 L264.98,48.54 L245,48.54 Z M254.99,37.551 L258.4865,44.544 L251.4935,44.544 Z" fill="#FFFFFF" fill-rule="evenodd"/><text x="122.50" y="71" font-family="Inter" font-weight="700" font-size="10.5" letter-spacing="17.6108" fill="#C4942A">PREMIUM</text>`;

let wasmReady: Promise<void> | null = null;
function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"));
  return wasmReady;
}
let fontsCache: any[] | null = null;
async function loadFonts() {
  if (fontsCache) return fontsCache;
  const f = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());
  const [i4, i6, p7] = await Promise.all([
    f("https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff"),
    f("https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff"),
    f("https://cdn.jsdelivr.net/npm/@fontsource/playfair-display@5/files/playfair-display-latin-700-normal.woff"),
  ]);
  fontsCache = [
    { name: "Inter", data: i4, weight: 400, style: "normal" },
    { name: "Inter", data: i6, weight: 600, style: "normal" },
    { name: "Playfair Display", data: p7, weight: 700, style: "normal" },
  ];
  return fontsCache;
}
let resvgFontCache: Uint8Array | null = null;
async function loadResvgFont() {
  if (resvgFontCache) return resvgFontCache;
  const r = await fetch("https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/700Bold/Inter_700Bold.ttf");
  resvgFontCache = new Uint8Array(await r.arrayBuffer());
  return resvgFontCache;
}
const DIMS: Record<string, [number, number]> = { "1:1": [1080,1080], "9:16": [1080,1920], "4:5": [1080,1350], "16:9": [1280,720], "1.91:1": [1200,628], "desktop": [1200,630] };

async function toDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try { const r = await fetch(url); if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/jpeg";
    return `data:${ct};base64,${encodeBase64(new Uint8Array(await r.arrayBuffer()))}`;
  } catch { return null; }
}
function h(type: string, style: Record<string, unknown>, children: unknown = null) { return { type, props: { style, children } }; }

function modelKey(asset: any): string {
  const key = asset?.metadata?.visual_template?.key || asset?.template_key || "premium-editorial-panel";
  return MODEL_LABEL[key] ? key : "premium-editorial-panel";
}

function productFeatures(productData: any, campaign: any, max = 4): string[] {
  const location = productData?.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(", ");
  const values = [
    productData?.area,
    productData?.suites,
    productData?.towers,
    location,
    productData?.price,
    productData?.differentials,
  ].filter(Boolean).map((value) => String(value).trim()).filter(Boolean);
  return [...new Set(values)].slice(0, max);
}

function featureNodes(items: string[], W: number) {
  return h("div", { display:"flex", flexDirection:"column", gap:Math.round(W*0.014), marginTop:Math.round(W*0.030), width:Math.round(W*0.86) },
    items.map((item) => h("div", { display:"flex", flexDirection:"row", alignItems:"center", gap:Math.round(W*0.012) }, [
      h("div", { display:"flex", width:Math.round(W*0.010), height:Math.round(W*0.010), borderRadius:99, backgroundColor:GOLD }),
      h("div", { display:"flex", fontSize:Math.round(W*0.019), color:"rgba(245,245,240,0.82)", lineHeight:1.2 }, item),
    ]))
  );
}

function firstBriefImageUrl(campaign: any): string | null {
  const groups = campaign?.brief?.images || {};
  for (const value of Object.values(groups)) {
    if (Array.isArray(value)) {
      const hit = value.find((item: any) => item?.public_url);
      if (hit?.public_url) return hit.public_url;
    } else if ((value as any)?.public_url) {
      return (value as any).public_url;
    }
  }
  return null;
}

function buildTree(asset: any, campaign: any, bg: string | null, W: number, H: number, logoH: number) {
  const pd = campaign?.brief?.product_data ?? {};
  const model = modelKey(asset);
  const kicker = (pd.tagline || campaign?.product_name || "VITRA PREMIUM").toString().toUpperCase();
  const headline = asset.headline || pd.suggested_headline || campaign?.name || "Vitra Premium";
  const copy = asset.copy || pd.suggested_copy || "";
  const cta = asset.cta || "Solicitar curadoria";
  const pad = Math.round(W * 0.075);
  const phase = PHASE_TAG[String(asset?.metadata?.campaign_phase)] || "";
  const isVertical = H > W * 1.25;
  const isWide = W > H * 1.35;
  const usePanel = !["premium-photo-offer", "premium-location-panorama"].includes(model);
  const mainWidth = isVertical ? Math.round(W*0.90) : model === "premium-location-panorama" ? Math.round(W*0.76) : model === "premium-photo-offer" ? Math.round(W*0.78) : Math.round(W*0.58);
  const headlineSize = Math.round(W * (isVertical ? 0.078 : isWide ? 0.048 : 0.058));
  const overlay = model === "premium-location-panorama"
    ? "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.84) 100%)"
    : model === "premium-photo-offer"
      ? "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.34) 48%, rgba(0,0,0,0.90) 100%)"
      : model === "premium-dark-spec"
        ? "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.76) 48%, rgba(0,0,0,0.34) 100%)"
        : "linear-gradient(145deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.50) 52%, rgba(0,0,0,0.82) 100%)";
  const features = productFeatures(pd, campaign, model === "premium-dark-spec" ? 5 : 3);
  const layers: unknown[] = [];
  if (bg) { const im = h("img", { position:"absolute", top:0, left:0, width:W, height:H, objectFit:"cover" }); (im as any).props.src = bg; layers.push(im); }
  layers.push(h("div", { position:"absolute", top:0, left:0, width:W, height:H, display:"flex",
    backgroundImage: bg ? overlay : "linear-gradient(160deg, #1A1A1A 0%, #050505 55%, #000000 100%)" }));
  layers.push(h("div", { position:"absolute", top:pad*0.45, left:pad*0.45, width:W-pad*0.9, height:H-pad*0.9, display:"flex", border:`1px solid ${GOLD}55` }));
  if (model === "premium-photo-offer" && pd?.price) {
    layers.push(h("div", { position:"absolute", right:pad, bottom:pad, display:"flex", backgroundColor:GOLD, color:"#080808", fontWeight:700, fontSize:Math.round(W*0.030), padding:`${Math.round(W*0.014)}px ${Math.round(W*0.026)}px`, letterSpacing:1 }, pd.price));
  }
  layers.push(h("div", { position:"absolute", top:0, left:0, width:W, height:H, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:pad, fontFamily:"Inter" }, [
    h("div", { display:"flex", height: logoH, flexDirection:"row", justifyContent:"space-between" }, [
      h("div", { display:"flex", width:Math.round(W*0.40), height:logoH }, ""),
      phase ? h("div", { display:"flex", alignItems:"center", height:Math.round(W*0.044), border:`1px solid ${GOLD}77`, color:GOLD_LIGHT, fontSize:Math.round(W*0.014), fontWeight:600, letterSpacing:1.5, padding:`0 ${Math.round(W*0.014)}px`, backgroundColor:"rgba(0,0,0,0.36)" }, phase) : h("div", { display:"flex" }, ""),
    ]),
    h("div", { display:"flex", flexDirection:"column", width:mainWidth, backgroundColor:usePanel ? "rgba(0,0,0,0.74)" : "rgba(0,0,0,0)", borderLeft:usePanel ? `2px solid ${GOLD}` : "0px solid transparent", padding:usePanel ? Math.round(W*0.038) : 0 }, [
      h("div", { display:"flex", letterSpacing:4*SCALE, fontSize:Math.round(W*0.020), fontWeight:600, color:GOLD_LIGHT, marginBottom:Math.round(H*0.02) }, kicker),
      h("div", { display:"flex", fontFamily:"Playfair Display", fontWeight:700, fontSize:headlineSize, lineHeight:1.06, color:"#FFFFFF", marginBottom:Math.round(H*0.020) }, headline),
      copy ? h("div", { display:"flex", fontSize:Math.round(W*0.022), fontWeight:400, lineHeight:1.42, color:OFF_WHITE, maxWidth:Math.round(W*0.82) }, copy) : h("div", { display:"flex" }, ""),
      (model === "premium-dark-spec" || model === "premium-gallery-proof") ? featureNodes(features, W) : h("div", { display:"flex" }, ""),
      h("div", { display:"flex", marginTop:Math.round(H*0.028) }, h("div", { display:"flex", backgroundColor:GOLD, color:"#080808", fontWeight:700, fontSize:Math.round(W*0.020), padding:`${Math.round(W*0.014)}px ${Math.round(W*0.030)}px`, borderRadius:3 }, cta)),
    ]),
    h("div", { display:"flex", fontSize:Math.round(W*0.011), letterSpacing:2, color:"rgba(245,245,240,0.34)" }, MODEL_LABEL[model]),
  ]));
  return h("div", { display:"flex", width:W, height:H, position:"relative", backgroundColor:"#000000" }, layers);
}

async function renderAsset(svc: any, asset: any, campaign: any, resvgFont: Uint8Array) {
  const ar = (asset.aspect_ratio || "1:1").toString();
  const base = DIMS[ar] || DIMS["1:1"];
  const W = Math.round(base[0] * SCALE);
  const H = Math.round(base[1] * SCALE);
  const pad = Math.round(W * 0.075);
  const logoW = Math.round(W * 0.40);
  const logoH = Math.round(logoW / 3);
  const fonts = await loadFonts();
  const bg = await toDataUri(asset.source_image_url || firstBriefImageUrl(campaign));
  let svg = await satori(buildTree(asset, campaign, bg, W, H, logoH) as any, { width: W, height: H, fonts });
  const logoNode = `<svg x="${pad}" y="${pad}" width="${logoW}" height="${logoH}" viewBox="0 0 300 100">${LOGO_INNER}</svg>`;
  svg = svg.replace("</svg>", logoNode + "</svg>");
  await ensureWasm();
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontBuffers: [resvgFont], loadSystemFonts: false, defaultFontFamily: "Inter" } });
  const img = resvg.render();
  const png = img.asPng();
  try { img.free?.(); } catch (_) {}
  try { resvg.free?.(); } catch (_) {}
  const slug = campaign?.slug || campaign?.id || "campanha";
  const path = `premium-campaigns/${slug}/rendered/${asset.id}.png`;
  const up = await svc.storage.from("cards").upload(path, png, { contentType: "image/png", upsert: true });
  if (up.error) throw up.error;
  const { data: pub } = svc.storage.from("cards").getPublicUrl(path);
  const { error: updErr } = await svc.from("premium_campaign_assets").update({ status:"generated", storage_bucket:"cards", storage_path:path, public_url:pub.publicUrl, updated_at:new Date().toISOString() }).eq("id", asset.id);
  if (updErr) throw updErr;
  return pub.publicUrl;
}

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, apikey, content-type", "Content-Type":"application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const apikey = req.headers.get("apikey") || "";
  const presented = auth || apikey;
  if (!presented || (presented !== SERVICE_KEY && presented !== ANON_KEY)) return new Response(JSON.stringify({ error:"unauthorized" }), { status:401, headers:cors });
  let body: any = {}; try { body = await req.json(); } catch {}
  const campaignId = body.campaign_id || null;
  const assetIds = Array.isArray(body.asset_ids) ? body.asset_ids : null;
  const limit = Math.min(Number(body.limit || 4), 12);
  if (!campaignId && !assetIds) return new Response(JSON.stringify({ error:"informe campaign_id ou asset_ids" }), { status:400, headers:cors });
  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth:{ persistSession:false } });
  let q = svc.from("premium_campaign_assets").select("*");
  if (assetIds) q = q.in("id", assetIds); else q = q.eq("campaign_id", campaignId).not("channel","in","(whatsapp,email)").eq("status","queued");
  const { data: assets, error: aErr } = await q.limit(limit);
  if (aErr) return new Response(JSON.stringify({ error: aErr.message }), { status:500, headers:cors });
  if (!assets || assets.length === 0) return new Response(JSON.stringify({ rendered:0, failed:0, remaining:0, message:"nenhum asset queued" }), { headers:cors });
  const cId = campaignId || assets[0].campaign_id;
  const { data: campaign } = await svc.from("premium_campaigns").select("*").eq("id", cId).single();
  const resvgFont = await loadResvgFont();
  await svc.from("premium_generation_jobs").update({ status:"running", started_at:new Date().toISOString() }).eq("campaign_id", cId).eq("job_type","asset_render").in("status",["queued","running"]);
  const results: any[] = []; let rendered = 0, failed = 0;
  for (const asset of assets) {
    try { const url = await renderAsset(svc, asset, campaign, resvgFont); rendered++; results.push({ id:asset.id, ok:true, url }); }
    catch (e) { failed++; results.push({ id:asset.id, ok:false, error:String((e as Error)?.message || e) }); }
  }
  const { count: remaining } = await svc.from("premium_campaign_assets").select("id",{ count:"exact", head:true }).eq("campaign_id", cId).not("channel","in","(whatsapp,email)").eq("status","queued");
  if (!remaining) await svc.from("premium_generation_jobs").update({ status: failed===0 ? "done":"error", progress:100, finished_at:new Date().toISOString(), output_payload:{ rendered, failed }, error_message: failed?`${failed} falharam`:null }).eq("campaign_id", cId).eq("job_type","asset_render").eq("status","running");
  return new Response(JSON.stringify({ campaign_id:cId, rendered, failed, remaining: remaining || 0 }), { headers:cors });
});
