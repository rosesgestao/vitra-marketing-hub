// Edge Function: render-asset (Fase 3) - satori -> SVG -> resvg -> PNG, logo + paleta 100% brandbook
import { createClient } from "jsr:@supabase/supabase-js@2";
import satori from "npm:satori@0.10.13";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { decode as decodeWebp } from "npm:@jsquash/webp@1.5.0";
import { encode as encodePng } from "npm:@jsquash/png@3.1.1";
// Funcoes puras de ajuste/medida de texto (Fase 2/3): fonte unica testavel via Vitest.
import {
  DIMS,
  compactText,
  wrapText,
  textSizeForWidth,
  approvedTemplateLayout,
  fitFontSize,
  approvedHeadlineBudgetPx,
} from "../_shared/textFit.ts";
import { VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION } from "../_shared/renderVersions.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GOLD = "#C4942A";        // brandbook --gold
const GOLD_LIGHT = "#F0C95C";  // brandbook --gold-light (kicker)
const OFF_WHITE = "#F5F5F0";   // brandbook --off-white (copy)
// Densidade de pixels da peca Premium (caminho satori legado) POR FORMATO. 1.0 = full-res (DIMS
// reais, ex.: 1080x1080 / 1200x628). Historicamente fixo em 0.55 (~594px, ABAIXO do minimo Meta de
// 1080). O caminho satori estoura o limite de compute da Edge (WORKER_RESOURCE_LIMIT) no 9:16
// (1080x1920) em full-res — comprovado em teste — mas roda bem no 1:1/1.91:1 (mais leves). Por isso
// o 9:16 (formato "tall") tem um teto proprio (SCALE_TALL). Ambos configuraveis por secret para
// ajuste/rollback sem redeploy. Default 0.55 preserva o comportamento atual no deploy. O caminho
// Vitra Imobiliaria ja roda full-res por outro motor (SVG direto) e NAO usa isto.
function clampScale(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(1, Math.max(0.4, value));
}
const SCALE = clampScale(Number(Deno.env.get("PREMIUM_RENDER_SCALE") ?? "0.55"), 0.55);
// Teto do 9:16: 0.75 = 810x1440 (~1.16M px = a MESMA contagem do 1:1 a 1.0, que renderiza ok).
const SCALE_TALL = clampScale(Number(Deno.env.get("PREMIUM_RENDER_SCALE_TALL") ?? "0.75"), 0.75);
function premiumScale(isTall: boolean) { return isTall ? Math.min(SCALE, SCALE_TALL) : SCALE; }
// Teto de RASTERIZACAO do 9:16 (formato alto) — vale para AMBOS os motores, inclusive o approved da
// Imobiliaria (SVG direto em full 1080x1920, que e o que mais estoura o compute da Edge / OOM em isolate
// frio). Reduz a largura de raster do resvg para cortar o pico de memoria sem mexer no viewBox/safe zone.
// 0.85 => 918x1632 (~1.5M px vs 2.07M px do full, -28% memoria), ainda nitido p/ stories/reels.
// Ajustavel por secret PREMIUM_RENDER_TALL_RASTER sem novo deploy.
const TALL_RASTER = clampScale(Number(Deno.env.get("PREMIUM_RENDER_TALL_RASTER") ?? "0.85"), 0.85);
const isTallAR = (w: number, h: number) => h > w * 1.25;
const rasterWidth = (W: number, tall: boolean) => (tall ? Math.max(540, Math.round(W * TALL_RASTER)) : W);
const PHASE_TAG: Record<string, string> = { "1": "FASE 1 - TEASER", "2": "FASE 2 - REVELACAO", "3": "FASE 3 - URGENCIA" };
const VITRA_IMOBILIARIA_TEMPLATE_BASE = "vitra-imobiliaria-dual-photo-offer";
const VITRA_IMOBILIARIA_TEMPLATE_FAMILIES = [
  VITRA_IMOBILIARIA_TEMPLATE_BASE,
  "vitra-imobiliaria-patios-gallery",
  "vitra-imobiliaria-financiamento-orla",
  "vitra-imobiliaria-menino-deus-offer",
  "vitra-imobiliaria-hero-checklist",
  "vitra-imobiliaria-duo-selos-offer",
  "vitra-imobiliaria-hero-panel-gallery",
];
const MODEL_LABEL: Record<string, string> = {
  "premium-photo-offer": "Foto protagonista + oferta",
  "premium-editorial-panel": "Painel editorial + imagem",
  "premium-dark-spec": "Ficha premium escura",
  "premium-location-panorama": "Panorama de localizacao",
  "premium-gallery-proof": "Prova visual / galeria",
  "vitra-imobiliaria-dual-photo-offer-feed": "Vitra Imobiliaria - duas fotos + oferta 1:1",
  "vitra-imobiliaria-dual-photo-offer-story": "Vitra Imobiliaria - duas fotos + oferta 9:16",
  "vitra-imobiliaria-dual-photo-offer-wide": "Vitra Imobiliaria - duas fotos + oferta 1.91:1",
  "vitra-imobiliaria-patios-gallery-feed": "Vitra Imobiliaria - patios + galeria 1:1",
  "vitra-imobiliaria-patios-gallery-story": "Vitra Imobiliaria - patios + galeria 9:16",
  "vitra-imobiliaria-patios-gallery-wide": "Vitra Imobiliaria - patios + galeria 1.91:1",
  "vitra-imobiliaria-financiamento-orla-feed": "Vitra Imobiliaria - financiamento Orla 1:1",
  "vitra-imobiliaria-financiamento-orla-story": "Vitra Imobiliaria - financiamento Orla 9:16",
  "vitra-imobiliaria-financiamento-orla-wide": "Vitra Imobiliaria - financiamento Orla 1.91:1",
  "vitra-imobiliaria-menino-deus-offer-feed": "Vitra Imobiliaria - Menino Deus 1:1",
  "vitra-imobiliaria-menino-deus-offer-story": "Vitra Imobiliaria - Menino Deus 9:16",
  "vitra-imobiliaria-menino-deus-offer-wide": "Vitra Imobiliaria - Menino Deus 1.91:1",
  "vitra-imobiliaria-hero-checklist-feed": "Vitra Imobiliaria - foto + checklist 1:1",
  "vitra-imobiliaria-hero-checklist-story": "Vitra Imobiliaria - foto + checklist 9:16",
  "vitra-imobiliaria-hero-checklist-wide": "Vitra Imobiliaria - foto + checklist 1.91:1",
  "vitra-imobiliaria-duo-selos-offer-feed": "Vitra Imobiliaria - duo + selos 1:1",
  "vitra-imobiliaria-duo-selos-offer-story": "Vitra Imobiliaria - duo + selos 9:16",
  "vitra-imobiliaria-duo-selos-offer-wide": "Vitra Imobiliaria - duo + selos 1.91:1",
  "vitra-imobiliaria-hero-panel-gallery-feed": "Vitra Imobiliaria - hero + painel 1:1",
  "vitra-imobiliaria-hero-panel-gallery-story": "Vitra Imobiliaria - hero + painel 9:16",
  "vitra-imobiliaria-hero-panel-gallery-wide": "Vitra Imobiliaria - hero + painel 1.91:1",
};

const LOGO_INNER = `<g transform="translate(3,2) scale(0.87)"><polygon points="55,8 94,30.5 94,72.5 55,95 16,72.5 16,30.5" fill="#000000" stroke="#C4942A" stroke-width="2.3"/><polygon points="55,13 90,33 90,70 55,90 20,70 20,33" fill="none" stroke="rgba(212,168,74,0.15)" stroke-width="0.7"/><polygon points="25,37 39,37 32,54" fill="#FFE08A"/><polygon points="25,37 32,54 55,76" fill="#8B6914"/><polygon points="39,37 32,54 55,76" fill="#C4942A"/><polygon points="85,37 71,37 78,54" fill="#F0C95C"/><polygon points="85,37 78,54 55,76" fill="#7A5C10"/><polygon points="71,37 78,54 55,76" fill="#D4A84A"/></g><line x1="105" y1="20" x2="105" y2="80" stroke="rgba(196,148,42,0.2)" stroke-width="1"/><text x="135" y="48" font-family="Inter" font-weight="700" font-size="27" letter-spacing="12" fill="#FFFFFF">VITR</text><path d="M254.99,28.56 L264.98,48.54 L245,48.54 Z M254.99,37.551 L258.4865,44.544 L251.4935,44.544 Z" fill="#FFFFFF" fill-rule="evenodd"/><text x="122.50" y="71" font-family="Inter" font-weight="700" font-size="10.5" letter-spacing="17.6108" fill="#C4942A">PREMIUM</text>`;
const VITRA_LOGO_INNER = `<g transform="translate(5,7) scale(0.78)"><polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="#07111F" stroke="#C4942A" stroke-width="2.5"/><polygon points="50,9 86,29.5 86,70.5 50,91 14,70.5 14,29.5" fill="none" stroke="rgba(212,168,74,0.18)" stroke-width="0.8"/><polygon points="20,33 34,33 27,50" fill="#8EC4F0"/><polygon points="20,33 27,50 50,72" fill="#1B3A6B"/><polygon points="34,33 27,50 50,72" fill="#2E6BB5"/><polygon points="80,33 66,33 73,50" fill="#F0C95C"/><polygon points="80,33 73,50 50,72" fill="#9B7A1C"/><polygon points="66,33 73,50 50,72" fill="#D4A84A"/></g><line x1="105" y1="20" x2="105" y2="80" stroke="rgba(196,148,42,0.2)" stroke-width="1"/><text x="135" y="48" font-family="Inter" font-weight="700" font-size="27" letter-spacing="12" fill="#FFFFFF">VITR</text><path d="M254.99,28.56 L264.98,48.54 L245,48.54 Z M254.99,37.551 L258.4865,44.544 L251.4935,44.544 Z" fill="#FFFFFF" fill-rule="evenodd"/><text x="123" y="71" font-family="Inter" font-weight="700" font-size="8.5" letter-spacing="11.1" fill="#C4942A">IMOBILIÁRIA</text>`;

function brandScopeFor(campaign: any, asset: any) {
  const key = String(asset?.metadata?.visual_template?.key || asset?.template_key || "");
  if (isVitraImobiliariaTemplateKey(key)) return "vitra_imobiliaria";
  return asset?.metadata?.brand_scope ||
    campaign?.brief?.brand_scope ||
    campaign?.brief?.qa_policy?.brand_scope ||
    campaign?.content_plan?.brand_scope ||
    "vitra_premium";
}

function brandRenderProfile(campaign: any, asset: any) {
  const scope = brandScopeFor(campaign, asset);
  if (scope === "vitra_imobiliaria") {
    return {
      scope,
      name: "Vitra Imobiliária",
      fallbackKicker: "VITRA IMOBILIÁRIA",
      fallbackHeadline: "Vitra Imobiliária",
      bg: "#07111F",
      overlayNoImage: "#07111F",
      overlayOpacity: "78",
      panel: "rgba(7,17,31,0.78)",
      logo: VITRA_LOGO_INNER,
      storagePrefix: "vitra-imobiliaria-campaigns",
    };
  }
  return {
    scope,
    name: "Vitra Premium",
    fallbackKicker: "VITRA PREMIUM",
    fallbackHeadline: "Vitra Premium",
    bg: "#000000",
    overlayNoImage: "#050505",
    overlayOpacity: "86",
    panel: "rgba(0,0,0,0.74)",
    logo: LOGO_INNER,
    storagePrefix: "premium-campaigns",
  };
}

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
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/400Regular/Inter_400Regular.ttf"),
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/600SemiBold/Inter_600SemiBold.ttf"),
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/playfair-display@0.4.2/700Bold/PlayfairDisplay_700Bold.ttf"),
  ]);
  fontsCache = [
    { name: "Inter", data: i4, weight: 400, style: "normal" },
    { name: "Inter", data: i6, weight: 600, style: "normal" },
    { name: "Playfair Display", data: p7, weight: 700, style: "normal" },
  ];
  return fontsCache;
}
// Fontes do caminho SVG direto (resvg): Inter 700 e a base historica de TODOS os templates
// aprovados (default). Anton (headline condensada) e Poppins 500/600/700 (corpo/preco/CTA)
// entraram com o template hero-checklist (New Life) e so afetam SVGs que as referenciam por
// font-family — os templates antigos seguem resolvendo Inter como antes.
let resvgFontsCache: Uint8Array[] | null = null;
async function loadResvgFonts() {
  if (resvgFontsCache) return resvgFontsCache;
  const f = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());
  const [inter700, anton400, poppins500, poppins600, poppins700] = await Promise.all([
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/700Bold/Inter_700Bold.ttf"),
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/anton@0.4.2/400Regular/Anton_400Regular.ttf"),
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/poppins@0.4.1/500Medium/Poppins_500Medium.ttf"),
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/poppins@0.4.1/600SemiBold/Poppins_600SemiBold.ttf"),
    f("https://cdn.jsdelivr.net/npm/@expo-google-fonts/poppins@0.4.1/700Bold/Poppins_700Bold.ttf"),
  ]);
  resvgFontsCache = [inter700, anton400, poppins500, poppins600, poppins700];
  return resvgFontsCache;
}
function storageTransformUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes("/storage/v1/object/public/")) return null;
    parsed.pathname = parsed.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    parsed.searchParams.set("width", "700");
    parsed.searchParams.set("quality", "62");
    parsed.searchParams.set("resize", "contain");
    return parsed.toString();
  } catch {
    return null;
  }
}

function imageUrlCandidates(url: string): string[] {
  const transformed = storageTransformUrl(url);
  const candidates = transformed ? [transformed, url] : [url];
  if (/\.webp($|[?#])/i.test(url)) {
    candidates.push(url.replace(/(jpe?g|png)\.webp($|[?#])/i, "$1$2"));
    candidates.push(url.replace(/\.webp($|[?#])/i, "$1"));
  }
  return [...new Set(candidates)];
}

function isWebp(bytes: Uint8Array, contentType = "") {
  return contentType.includes("image/webp") ||
    (bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50);
}

function isJpeg(bytes: Uint8Array, contentType = "") {
  return contentType.includes("image/jpeg") || (bytes[0] === 0xff && bytes[1] === 0xd8);
}

function isPng(bytes: Uint8Array, contentType = "") {
  return contentType.includes("image/png") ||
    (bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47);
}

async function toDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  for (const candidate of imageUrlCandidates(url)) {
    try {
      const r = await fetch(candidate);
      if (!r.ok) continue;
      const bytes = new Uint8Array(await r.arrayBuffer());
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      if (isWebp(bytes, ct)) {
        const webpBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const decoded = await decodeWebp(webpBuffer);
        const png = new Uint8Array(await encodePng(decoded));
        return `data:image/png;base64,${encodeBase64(png)}`;
      }
      if (isPng(bytes, ct)) return `data:image/png;base64,${encodeBase64(bytes)}`;
      if (isJpeg(bytes, ct)) return `data:image/jpeg;base64,${encodeBase64(bytes)}`;
    } catch {
      continue;
    }
  }
  return null;
}
function h(type: string, style: Record<string, unknown>, children: unknown = null) { return { type, props: { style, children } }; }

function templateFamilyFromKey(key: string) {
  const value = String(key || "");
  for (const suffix of ["-feed", "-story", "-wide"]) {
    if (value.endsWith(suffix)) return value.slice(0, -suffix.length);
  }
  return value;
}

function isVitraImobiliariaTemplateKey(key: string) {
  return VITRA_IMOBILIARIA_TEMPLATE_FAMILIES.includes(templateFamilyFromKey(key));
}

function isVitraImobiliariaTemplate(key: string, brandProfile: ReturnType<typeof brandRenderProfile>) {
  return brandProfile.scope === "vitra_imobiliaria" && isVitraImobiliariaTemplateKey(key);
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoneyLike(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  if (/^\d+$/.test(compact)) {
    return `R$ ${compact.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  }
  return raw;
}

function priceParts(value: unknown) {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return { from: "", to: "" };
  const split = raw.split("|").map((part) => part.trim()).filter(Boolean);
  if (split.length >= 2) {
    return {
      from: split[0].replace(/^de\s*:\s*/i, ""),
      to: split.slice(1).join(" ").replace(/^por\s*:\s*/i, ""),
    };
  }
  const match = raw.match(/de\s*:?\s*(.*?)\s+por\s*:?\s*(.*)$/i);
  if (match) return { from: match[1], to: match[2] };
  return { from: "", to: formatMoneyLike(raw) };
}

function briefImageUrls(campaign: any): string[] {
  const groups = campaign?.brief?.images || {};
  const urls: string[] = [];
  for (const value of Object.values(groups)) {
    if (Array.isArray(value)) {
      for (const item of value) if ((item as any)?.public_url) urls.push((item as any).public_url);
    } else if ((value as any)?.public_url) {
      urls.push((value as any).public_url);
    }
  }
  return urls;
}

function metadataImageUrls(asset: any): string[] {
  const groups = asset?.metadata?.source_images || {};
  const urls: string[] = [];
  for (const value of Object.values(groups)) {
    if (Array.isArray(value)) {
      for (const item of value) if ((item as any)?.public_url) urls.push((item as any).public_url);
    } else if ((value as any)?.public_url) {
      urls.push((value as any).public_url);
    }
  }
  const selected = asset?.metadata?.source_image_selection?.url;
  if (selected) urls.unshift(selected);
  return urls;
}

const APPROVED_SLOT_ORDER = ["fachada", "living", "varanda", "infraestrutura", "extras"];

function urlsFromImageGroup(group: any): string[] {
  if (Array.isArray(group)) return group.map((g) => (g as any)?.public_url).filter(Boolean).map(String);
  if (group && (group as any).public_url) return [String((group as any).public_url)];
  return [];
}

// Fase 2 (slot-aware): monta a lista de imagens em ORDEM DE SLOT (fachada -> pos 0,
// living -> 1, varanda -> 2 ...), pegando 1 foto por slot primeiro e depois o restante.
// Assim a fachada/localizacao cai sempre na posicao certa do template aprovado.
function slotOrderedUrls(groups: any): string[] {
  if (!groups || typeof groups !== "object") return [];
  const firstPerSlot: string[] = [];
  const rest: string[] = [];
  const done = new Set<string>();
  const take = (slot: string, group: any) => {
    const urls = urlsFromImageGroup(group);
    if (!urls.length) return;
    firstPerSlot.push(urls[0]);
    rest.push(...urls.slice(1));
    done.add(slot);
  };
  for (const slot of APPROVED_SLOT_ORDER) if (groups[slot] !== undefined) take(slot, groups[slot]);
  for (const [slot, group] of Object.entries(groups)) if (!done.has(slot)) take(slot, group);
  return [...firstPerSlot, ...rest];
}

function imageUrlsForApprovedTemplate(asset: any, campaign: any) {
  const dedupe = (arr: any[]) => [...new Set(arr.filter(Boolean).map((u) => String(u)))];
  // Posicionamento por slot a partir do mapa slot-keyed do asset (metadata.source_images),
  // com a campanha (brief.images) como complemento. Fallback para o fluxo antigo se nao
  // houver slots reconheciveis (campanhas legadas).
  const slotted = dedupe([
    ...slotOrderedUrls(asset?.metadata?.source_images),
    ...slotOrderedUrls(campaign?.brief?.images),
  ]);
  const legacy = dedupe([
    asset?.source_image_url,
    ...metadataImageUrls(asset),
    ...briefImageUrls(campaign),
  ]);
  return slotted.length ? dedupe([...slotted, ...legacy]) : legacy;
}

function productDifferentials(pd: any, campaign: any) {
  const values = String(pd?.differentials || "")
    .split(/[\n;,]+/)
    .map((item) => item.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);
  if (values.length >= 2) return values.slice(0, 2);
  const fallback = [
    pd?.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(", "),
    pd?.suites,
    pd?.area,
  ].filter(Boolean).map((item) => String(item).trim());
  return [...values, ...fallback].filter(Boolean).slice(0, 2);
}

function approvedDescription(pd: any, asset: any) {
  const details = [pd?.area, pd?.suites, pd?.towers].filter(Boolean).map((item) => String(item).trim());
  if (details.length) return details.join(", ");
  return compactText(pd?.suggested_copy || asset?.copy || "", 76);
}

function modelKey(asset: any): string {
  const key = asset?.metadata?.visual_template?.key || asset?.template_key || "premium-editorial-panel";
  return MODEL_LABEL[key] || isVitraImobiliariaTemplateKey(key) ? key : "premium-editorial-panel";
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

function textLine(x: number, y: number, text: string, opts: Record<string, unknown> = {}) {
  const fill = opts.fill || "#FFFFFF";
  const size = opts.size || 32;
  const weight = opts.weight || 700;
  const anchor = opts.anchor || "middle";
  const family = opts.family || "Inter, Arial, sans-serif";
  const spacing = opts.spacing ? ` letter-spacing="${opts.spacing}"` : "";
  const opacity = opts.opacity ? ` opacity="${opts.opacity}"` : "";
  const decoration = opts.decoration ? ` text-decoration="${opts.decoration}"` : "";
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}"${spacing}${opacity}${decoration}>${esc(text)}</text>`;
}

function imageLayer(href: string | null, id: string, x: number, y: number, w: number, h: number, rx: number) {
  if (!href) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#07111F" stroke="${GOLD}" stroke-width="1.5" opacity="0.72"/>
      <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${GOLD}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">FOTO DO IMOVEL</text>`;
  }
  return `<image href="${esc(href)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
}

function featureLine(x: number, y: number, text: string, anchor: "start" | "middle" = "start") {
  const iconX = anchor === "middle" ? x - Math.min(290, text.length * 6.4) / 2 : x;
  const textX = iconX + 38;
  return `<g>
    <circle cx="${iconX + 13}" cy="${y - 8}" r="13" fill="none" stroke="${GOLD_LIGHT}" stroke-width="3"/>
    <path d="M${iconX + 6},${y - 8} L${iconX + 11},${y - 3} L${iconX + 20},${y - 15}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${textLine(textX, y, compactText(text, 42), { fill: "#F5F5F0", size: 25, weight: 800, anchor: "start" })}
  </g>`;
}

function priceChip(x: number, y: number, w: number, h: number, rawPrice: unknown) {
  const parts = priceParts(rawPrice);
  const from = compactText(parts.from, 22);
  const to = compactText(parts.to || "Consulte", 24);
  const cy = y + Math.round(h * 0.64);
  if (!from) {
    return `<g filter="url(#pillShadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(h / 2)}" fill="#F5F5F0"/>
      ${textLine(x + w / 2 - 70, cy, "Por:", { fill: "#111111", size: 24, weight: 900 })}
      ${textLine(x + w / 2 + 40, cy, to, { fill: GOLD, size: 30, weight: 900 })}
    </g>`;
  }
  return `<g filter="url(#pillShadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(h / 2)}" fill="#F5F5F0"/>
    ${textLine(x + 70, cy, "De:", { fill: "#111111", size: 22, weight: 900 })}
    ${textLine(x + 160, cy, from, { fill: "#111111", size: 23, weight: 900, decoration: "line-through" })}
    <line x1="${x + w / 2}" y1="${y + 13}" x2="${x + w / 2}" y2="${y + h - 13}" stroke="#111111" stroke-width="2" opacity="0.72"/>
    ${textLine(x + w / 2 + 55, cy, "Por:", { fill: "#111111", size: 22, weight: 900 })}
    ${textLine(x + w / 2 + 175, cy, to, { fill: GOLD, size: 29, weight: 900 })}
  </g>`;
}

function templateFrame(asset: any) {
  return asset?.metadata?.visual_template?.frame === "gold" || asset?.metadata?.frame === "gold";
}

function outerFrame(W: number, H: number, frame: boolean, inset = 22, radius = 20) {
  return frame ? `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="${radius}" fill="none" stroke="${GOLD}" stroke-width="1.4" opacity="0.82"/>` : "";
}

function baseDefs(idBase: string, photoDefs: string) {
  return `<defs>
    <radialGradient id="${idBase}-bg" cx="50%" cy="44%" r="70%">
      <stop offset="0%" stop-color="#0A1B32"/>
      <stop offset="66%" stop-color="#07111F"/>
      <stop offset="100%" stop-color="#050C16"/>
    </radialGradient>
    ${photoDefs}
    <filter id="${idBase}-shadow" x="-20%" y="-35%" width="140%" height="170%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.24"/>
    </filter>
    <filter id="pillShadow" x="-20%" y="-35%" width="140%" height="170%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.24"/>
    </filter>
  </defs>`;
}

function featureArrow(x: number, y: number, text: string, size = 24) {
  return `<g>
    <path d="M${x} ${y - 9} H${x + 42} M${x + 26} ${y - 24} L${x + 48} ${y - 9} L${x + 26} ${y + 6}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    ${textLine(x + 72, y, compactText(text, 42), { fill: OFF_WHITE, size, weight: 850, anchor: "start" })}
  </g>`;
}

function isFinancingVisualHeadline(value: unknown) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (/R\$\s*[\d.,]+|OPORTUNIDADE\s+A\s+PARTIR/i.test(text)) return false;
  if (text.length > 34 && !/\bJUNTO\b/i.test(text)) return false;
  return true;
}

function financingHeadlineParts(asset: any, campaign: any) {
  const campaignPd = campaign?.brief?.product_data ?? {};
  const assetPd = asset?.metadata?.product_data ?? {};
  const templateValues = asset?.metadata?.template_values ?? {};
  const variableHeadline =
    assetPd.suggested_headline ||
    asset?.headline ||
    "";
  const raw = (
    (isFinancingVisualHeadline(variableHeadline) ? variableHeadline : "") ||
    templateValues.suggested_headline ||
    assetPd.template_headline ||
    campaignPd.suggested_headline ||
    campaignPd.headline ||
    "1DORM E 2DORM JUNTO A NOVA ORLA"
  ).toString().replace(/\s+/g, " ").trim().toUpperCase();
  const normalized = raw || "1DORM E 2DORM JUNTO A NOVA ORLA";
  const marker = normalized.match(/\s+JUNTO\s+/);
  if (marker?.index && marker.index > 0) {
    return [
      normalized.slice(0, marker.index).trim(),
      normalized.slice(marker.index + 1).trim(),
    ];
  }
  const split = normalized.split(/\s*[|/]\s*/).filter(Boolean);
  if (split.length >= 2) return [split[0], split.slice(1).join(" ")];
  const fromPrice = normalized.match(/\s+A\s+PARTIR\s+DE\s+/);
  if (fromPrice?.index && fromPrice.index > 0) {
    return [
      normalized.slice(0, fromPrice.index + " A PARTIR".length).trim(),
      normalized.slice(fromPrice.index + " A PARTIR".length).trim(),
    ];
  }
  const lines = wrapText(normalized, 18, 2);
  return [lines[0] || "1DORM E 2DORM", lines[1] || "JUNTO A NOVA ORLA"];
}

function financingDefs(idBase: string, photoDefs: string) {
  return `<defs>
    <radialGradient id="${idBase}-financingBg" cx="42%" cy="28%" r="92%">
      <stop offset="0%" stop-color="#123B86"/>
      <stop offset="43%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#07111F"/>
    </radialGradient>
    <linearGradient id="${idBase}-blueVeil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#164DA6" stop-opacity="0.58"/>
      <stop offset="42%" stop-color="#0A1628" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#07111F" stop-opacity="0.88"/>
    </linearGradient>
    <linearGradient id="${idBase}-goldStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F0C95C"/>
      <stop offset="54%" stop-color="#C4942A"/>
      <stop offset="100%" stop-color="#9B7A1C"/>
    </linearGradient>
    ${photoDefs}
    <filter id="${idBase}-softShadow" x="-20%" y="-30%" width="140%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity="0.24"/>
    </filter>
  </defs>`;
}

function financingBackground(W: number, H: number, idBase: string) {
  return `<rect width="${W}" height="${H}" fill="url(#${idBase}-financingBg)"/>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-blueVeil)" opacity="0.82"/>
  <path d="M${-W * 0.12} 0 L${W * 0.34} 0 L${W * 0.18} ${H} H${-W * 0.12} Z" fill="#2E6BB5" opacity="0.11"/>
  <path d="M${W * 0.74} 0 L${W + 40} 0 V${H} H${W * 0.88} Z" fill="#C4942A" opacity="0.04"/>`;
}

function financingFrame(W: number, H: number, frame: boolean, isStory: boolean, isWide: boolean) {
  if (!frame) return "";
  const inset = isWide ? 6 : 22;
  const radius = isStory ? 34 : isWide ? 20 : 28;
  return `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="${radius}" fill="none" stroke="${GOLD}" stroke-width="1.3" opacity="0.78"/>`;
}

function financingTitleBlock(x: number, y: number, lineA: string, lineB: string, claim: string, opts: Record<string, any>) {
  const anchor = opts.anchor || "middle";
  const family = "Arial Narrow, Impact, Inter, Arial, sans-serif";
  const lineAChars = opts.lineAChars || opts.lineChars || 24;
  const lineBChars = opts.lineBChars || opts.lineChars || 24;
  const sizeA = textSizeForWidth(lineA, opts.sizeA, opts.minSizeA || Math.round(opts.sizeA * 0.72), lineAChars);
  const sizeB = textSizeForWidth(lineB, opts.sizeB, opts.minSizeB || Math.round(opts.sizeB * 0.72), lineBChars);
  return `${textLine(x, y, compactText(lineA, Math.max(lineAChars + 8, 32)), { anchor, fill: "#FFFFFF", family, size: sizeA, weight: 900 })}
  ${textLine(x, y + opts.gapA, compactText(lineB, Math.max(lineBChars + 8, 32)), { anchor, fill: GOLD_LIGHT, family, size: sizeB, weight: 900 })}
  ${textLine(x, y + opts.gapB, compactText(claim, 30), { anchor, fill: OFF_WHITE, family: "Inter, Arial, sans-serif", size: opts.claimSize, weight: 800, spacing: opts.claimSpacing })}`;
}

function financingPhotoLayer(href: string | null, idBase: string, id: string, x: number, y: number, w: number, h: number, rx: number, strokeWidth: number, shadow = true) {
  const fallback = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#07111F"/>
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${GOLD}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">FOTO DO IMOVEL</text>`;
  const filter = shadow ? ` filter="url(#${idBase}-softShadow)"` : "";
  return `<g${filter}>
    ${href ? `<image href="${esc(href)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>` : fallback}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="url(#${idBase}-goldStroke)" stroke-width="${strokeWidth}"/>
  </g>`;
}

function financingPriceBox(x: number, y: number, w: number, h: number, labelY: number, priceY: number, labelSize: number, priceSize: number, price: string, idBase: string, radius = 34) {
  const family = "Arial Narrow, Impact, Inter, Arial, sans-serif";
  const safePriceSize = textSizeForWidth(price || "CONSULTE", priceSize, Math.round(priceSize * 0.72), priceSize >= 100 ? 11 : 14);
  return `<g>
    ${textLine(x + w / 2, labelY, "OPORTUNIDADE A PARTIR", { fill: OFF_WHITE, family: "Inter, Arial, sans-serif", size: labelSize, weight: 800, spacing: 9 })}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="#0A1628" opacity="0.78" stroke="url(#${idBase}-goldStroke)" stroke-width="7"/>
    ${textLine(x + w / 2, priceY, price || "CONSULTE", { fill: GOLD_LIGHT, family, size: safePriceSize, weight: 900 })}
  </g>`;
}

function templateVariationIndex(asset: any) {
  const value =
    asset?.metadata?.template_variation?.index ??
    asset?.metadata?.creative_concept?.variation_index ??
    asset?.metadata?.template_recipe?.index ??
    0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rotateFinancingImages(images: Array<string | null>, asset: any, isStory: boolean, isWide: boolean) {
  const unique = [...new Set(images.filter(Boolean).map((url) => String(url)))];
  if (unique.length <= 1) return unique;
  const formatOffset = isWide ? 2 : isStory ? 1 : 0;
  const offset = (templateVariationIndex(asset) + formatOffset) % unique.length;
  return [...unique.slice(offset), ...unique.slice(0, offset)];
}

function buildVitraPatiosGallerySvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const headline = wrapText((asset.headline || pd.suggested_headline || campaign?.name || "OPORTUNIDADE").toString().toUpperCase(), 18, 2);
  const features = productFeatures(pd, campaign, 4);
  while (features.length < 4) features.push(features[0] || "Atendimento consultivo Vitra");
  const price = formatMoneyLike(pd.price || campaign?.offer || "");
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const photos = isStory
    ? [[120, 690, 840, 258, 18], [120, 978, 840, 258, 18], [120, 1266, 840, 258, 18]]
    : isWide
      ? [[760, 66, 380, 148, 10], [760, 240, 380, 148, 10], [760, 414, 380, 148, 10]]
      : [[630, 188, 384, 208, 10], [630, 424, 384, 208, 10], [630, 660, 384, 208, 10]];
  const photoDefs = photos.map((p, i) => `<clipPath id="${idBase}-p${i}"><rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="${p[4]}" ry="${p[4]}"/></clipPath>`).join("");
  const logo = isStory ? [318, 78, 444, 100] : isWide ? [74, 54, 300, 68] : [358, 52, 364, 82];
  const headX = isStory ? 540 : isWide ? 64 : 56;
  const anchor = isStory ? "middle" : "start";
  const titleY = isStory ? 318 : isWide ? 190 : 225;
  const priceX = isStory ? 540 : isWide ? 74 : 110;
  const priceY = isStory ? 610 : isWide ? 405 : 540;
  const loc = pd.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(", ");
  const locationY = isStory ? 1825 : isWide ? 548 : 957;
  const neighborhoodY = isStory ? 1864 : isWide ? 572 : 1008;
  // Fase 2 (P2): auto-ajuste da fonte da headline para nao estourar a largura disponivel
  // (a esquerda das fotos). Antes a fonte era fixa e o texto transbordava atras das fotos.
  const hBaseA = isWide ? 58 : isStory ? 78 : 74;
  const hBaseB = isWide ? 61 : isStory ? 82 : 77;
  const hIdeal = isWide ? 11 : isStory ? 14 : 9;
  const hLongest = "a".repeat(Math.max((headline[0] || "OPORTUNIDADE").length, (headline[1] || "").length, 1));
  const hSizeA = textSizeForWidth(hLongest, hBaseA, Math.round(hBaseA * 0.45), hIdeal);
  const hSizeB = textSizeForWidth(hLongest, hBaseB, Math.round(hBaseB * 0.45), hIdeal);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>
  ${outerFrame(W, H, frame, isWide ? 10 : 22, isStory ? 34 : 20)}
  <svg x="${logo[0]}" y="${logo[1]}" width="${logo[2]}" height="${logo[3]}" viewBox="0 0 300 100">${brandProfile.logo}</svg>
  ${textLine(headX, titleY, headline[0] || "OPORTUNIDADE", { anchor, fill: "#FFFFFF", size: hSizeA, weight: 900 })}
  ${textLine(headX, titleY + (isWide ? 70 : 100), headline[1] || "", { anchor, fill: GOLD_LIGHT, size: hSizeB, weight: 900 })}
  ${textLine(priceX, isStory ? 535 : isWide ? 350 : 464, "OPORTUNIDADE POR:", { anchor, fill: OFF_WHITE, size: isWide ? 22 : 30, weight: 500 })}
  ${textLine(priceX, priceY, price || "CONSULTE", { anchor, fill: GOLD_LIGHT, size: isWide ? 50 : isStory ? 70 : 66, weight: 900 })}
  ${photos.map((p, i) => imageLayer(images[i] || images[0], `${idBase}-p${i}`, p[0], p[1], p[2], p[3], p[4])).join("")}
  ${isWide ? `
    ${featureArrow(74, 454, features[0], 18)}
    ${featureArrow(74, 496, features[1], 18)}
    ${featureArrow(442, 454, features[2], 18)}
    ${featureArrow(442, 496, features[3], 18)}
  ` : `
    ${features.map((text, index) => featureArrow(isStory ? 328 : 96, (isStory ? 1576 : 608) + index * (isStory ? 54 : 56), text, isStory ? 22 : 24)).join("")}
  `}
  ${textLine(isWide ? 646 : 540, locationY, compactText(loc || "Porto Alegre", isWide ? 44 : 58), { fill: OFF_WHITE, size: isWide ? 14 : isStory ? 21 : 27, weight: 600 })}
  ${textLine(isWide ? 646 : 540, neighborhoodY, compactText(campaign?.neighborhood || pd.neighborhood || campaign?.city || "VITRA", 30), { fill: "#FFFFFF", size: isWide ? 18 : isStory ? 30 : 35, weight: 900 })}
</svg>`;
}

function buildVitraFinancingSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const [headlineA, headlineB] = financingHeadlineParts(asset, campaign);
  const photos = isStory
    ? [[116, 548, 848, 360, 30], [116, 952, 848, 360, 30]]
    : isWide
      ? [[70, 265, 438, 180, 24], [548, 265, 438, 180, 24]]
      : [[72, 340, 452, 222, 30], [556, 340, 452, 222, 30]];
  const photoDefs = photos.map((p, i) => `<clipPath id="${idBase}-p${i}"><rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="${p[4]}" ry="${p[4]}"/></clipPath>`).join("");
  const logo = isStory ? [334, 86, 392, 92] : isWide ? [54, 96, 178, 42] : [445, 36, 190, 46];
  const price = formatMoneyLike(pd.price || campaign?.offer || "");
  const neighborhood = pd.neighborhood || campaign?.neighborhood || "BAIRRO";
  const financingClaim = (pd.financing_claim || pd.tagline || "ATE 100% FINANCIADO").toString().replace(/\s+/g, " ").trim().toUpperCase();
  const strokeWidth = isWide ? 5 : 7;
  // Fase 2 (slot-aware): ordem por slot (localizacao -> esquerda, empreendimento -> direita).
  // Sem rotacao, para nao trocar as fotos de slot entre variacoes nem puxar fotos extras.
  const orderedImages = images;
  const photoA = orderedImages[0] || orderedImages[1] || null;
  const photoB = orderedImages[1] || orderedImages[0] || null;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${financingDefs(idBase, photoDefs)}
  ${financingBackground(W, H, idBase)}
  ${financingFrame(W, H, frame, isStory, isWide)}
  <svg x="${logo[0]}" y="${logo[1]}" width="${logo[2]}" height="${logo[3]}" viewBox="0 0 300 100">${brandProfile.logo}</svg>
  ${isWide
    ? financingTitleBlock(276, 92, headlineA, headlineB, financingClaim, { anchor: "start", sizeA: 72, sizeB: 66, claimSize: 22, claimSpacing: 5, gapA: 68, gapB: 110, lineAChars: 22, lineBChars: 25, minSizeA: 44, minSizeB: 43 })
    : isStory
      ? financingTitleBlock(540, 300, headlineA, headlineB, financingClaim, { sizeA: 92, sizeB: 86, claimSize: 30, claimSpacing: 9, gapA: 90, gapB: 156, lineAChars: 20, lineBChars: 23, minSizeA: 54, minSizeB: 52 })
      : financingTitleBlock(540, 176, headlineA, headlineB, financingClaim, { sizeA: 82, sizeB: 76, claimSize: 28, claimSpacing: 9, gapA: 80, gapB: 134, lineAChars: 20, lineBChars: 23, minSizeA: 52, minSizeB: 50 })
  }
  ${financingPhotoLayer(photoA, idBase, `${idBase}-p0`, photos[0][0], photos[0][1], photos[0][2], photos[0][3], photos[0][4], strokeWidth, !isStory)}
  ${financingPhotoLayer(photoB, idBase, `${idBase}-p1`, photos[1][0], photos[1][1], photos[1][2], photos[1][3], photos[1][4], strokeWidth, !isStory)}
  ${isWide
    ? financingPriceBox(230, 496, 740, 80, 480, 558, 20, 56, price, idBase, 22)
    : isStory
      ? financingPriceBox(126, 1464, 828, 210, 1412, 1608, 30, 102, price, idBase, 34)
      : financingPriceBox(130, 725, 820, 190, 692, 858, 31, 112, price, idBase, 34)
  }
  ${textLine(W / 2, isStory ? 1766 : isWide ? 612 : 1018, compactText(neighborhood, 28).toUpperCase(), { fill: OFF_WHITE, size: isWide ? 18 : 30, weight: 600, spacing: isWide ? 7 : 16 })}
</svg>`;
}

function buildVitraMeninoDeusSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const hero = images[0] || null;
  const heroRect = isStory ? [0, 0, 1080, 900, 0] : isWide ? [0, 0, 628, 628, 0] : [0, 0, 1080, 610, 0];
  const photoDefs = `<clipPath id="${idBase}-hero"><rect x="${heroRect[0]}" y="${heroRect[1]}" width="${heroRect[2]}" height="${heroRect[3]}" rx="${heroRect[4]}" ry="${heroRect[4]}"/></clipPath>`;
  const neighborhood = (campaign?.neighborhood || pd.neighborhood || "OPORTUNIDADE").toString().toUpperCase();
  const feature = (pd.suites || pd.area || asset.headline || "2 DORMITORIOS C/ SUITE").toString().toUpperCase();
  const price = formatMoneyLike(pd.price || campaign?.offer || "");
  const condoArgument = (pd.condo_argument || campaign?.offer || "MENOR VALOR DO CONDOMINIO").toString().toUpperCase();
  const features = productFeatures(pd, campaign, 4);
  const loc = pd.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(" - ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="#F5F5F0"/>
  ${imageLayer(hero, `${idBase}-hero`, heroRect[0], heroRect[1], heroRect[2], heroRect[3], heroRect[4])}
  <rect x="0" y="${isStory ? 852 : isWide ? 600 : 580}" width="${isWide ? 628 : 1080}" height="${isStory ? 64 : isWide ? 28 : 48}" fill="#0A1628"/>
  ${isWide ? `<rect x="628" y="0" width="572" height="628" fill="#F5F5F0"/>` : ""}
  <rect x="${isWide ? 38 : isStory ? 64 : 52}" y="${isWide ? 42 : isStory ? 68 : 42}" width="${isWide ? 306 : isStory ? 330 : 324}" height="${isWide ? 174 : isStory ? 252 : 244}" fill="#0A1628" opacity="0.94"/>
  ${textLine(isWide ? 191 : isStory ? 229 : 214, isWide ? 102 : isStory ? 154 : 112, "OPORTUNIDADE", { fill: "#FFFFFF", size: isWide ? 22 : 30, weight: 500, spacing: 5 })}
  ${textLine(isWide ? 191 : isStory ? 229 : 214, isWide ? 152 : isStory ? 226 : 176, compactText(neighborhood, 18), { fill: "#FFFFFF", size: isWide ? 36 : 52, weight: 900, spacing: 4 })}
  <svg x="${isWide ? 900 : isStory ? 736 : 806}" y="${isWide ? 48 : isStory ? 82 : 64}" width="${isWide ? 180 : isStory ? 224 : 196}" height="${isWide ? 42 : isStory ? 52 : 46}" viewBox="0 0 300 100">${brandProfile.logo}</svg>
  <rect x="${isWide ? 458 : isStory ? 130 : 196}" y="${isWide ? 210 : isStory ? 858 : 594}" width="${isWide ? 664 : isStory ? 820 : 724}" height="${isWide ? 68 : isStory ? 96 : 74}" fill="#0A1628" filter="url(#${idBase}-shadow)"/>
  ${textLine(isWide ? 790 : isStory ? 540 : 558, isWide ? 254 : isStory ? 918 : 640, compactText(feature, 32), { fill: "#FFFFFF", size: isWide ? 31 : isStory ? 42 : 38, weight: 900, spacing: 7 })}
  ${textLine(isWide ? 760 : isStory ? 280 : 260, isWide ? 390 : isStory ? 1190 : 806, "APENAS", { anchor: "start", fill: "#0A1628", size: isWide ? 20 : isStory ? 31 : 25, weight: 600, spacing: 5 })}
  ${textLine(isWide ? 760 : isStory ? 170 : 246, isWide ? 436 : isStory ? 1286 : 870, price || "CONSULTE", { anchor: "start", fill: "#0A1628", size: isWide ? 52 : isStory ? 78 : 65, weight: 900 })}
  ${textLine(isWide ? 1042 : isStory ? 668 : 770, isWide ? 436 : isStory ? 1286 : 870, compactText(condoArgument, 28), { fill: "#0A1628", size: isWide ? 18 : isStory ? 25 : 25, weight: 900 })}
  ${features.slice(0, 4).map((item, index) => textLine(isWide ? 894 : 540, (isWide ? 496 : isStory ? 1338 : 852) + index * (isWide ? 28 : isStory ? 50 : 36), compactText(item, 42), { fill: "#0A1628", size: isWide ? 20 : isStory ? 32 : 25, weight: 800 })).join("")}
  ${textLine(isWide ? 900 : isStory ? 600 : 612, isWide ? 596 : isStory ? 1722 : 1022, compactText(loc || "PORTO ALEGRE", isWide ? 36 : 44).toUpperCase(), { fill: "#0A1628", size: isWide ? 16 : isStory ? 27 : 25, weight: 850 })}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

// ===== Template 05: hero-checklist (New Life / Av. Ipiranga) =====
// Referencia aprovada: criativos-aprovados-vitra-imobiliaria/new life.jpeg
// Foto unica full-bleed + gradiente navy a esquerda, wordmark VITRA branco no topo direito,
// headline condensada (Anton), preco "De" riscado + "Por" em dourado (brandbook), checklist com
// selo (badge-check) dourado e botao CTA dourado #C4942A com texto navy.
// Paleta 100% brandbook Vitra Imobiliaria (alinhado em 2026-06-11): a peca de referencia usava um
// amarelo vivo #FBC52D, fora do brandbook - trocado pelo dourado oficial. GOLD (#C4942A) e GOLD_LIGHT
// (#F0C95C, familia dourada) ja sao do brandbook (topo do arquivo). Convencao dos outros 4 templates:
// dourado-claro para TEXTO sobre navy (legivel) e GOLD solido para PREENCHIMENTO de botao.
const HC_GOLD_TEXT = GOLD_LIGHT;  // preco "Por" + selos: dourado claro do brandbook sobre fundo navy
const HC_GOLD_BTN = GOLD;         // botao CTA preenchido com o dourado oficial #C4942A
const HC_INK = "#07111F";         // texto navy sobre o botao dourado (== template duas fotos)

// Selo "badge-check" (mesmo desenho do icone lucide), escalado a partir do grid 24x24.
function heroChecklistBadge(x: number, y: number, size: number) {
  const s = (size / 24).toFixed(3);
  return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${HC_GOLD_TEXT}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
    <path d="m9 12 2 2 4-4"/>
  </g>`;
}

// O estimador de largura (textFit) e calibrado para Inter em CAIXA ALTA; Anton (condensada)
// e Poppins (minusculas) avancam menos. O fator corrige o orcamento para o fitFontSize nao
// encolher a fonte alem do necessario. Anton ~0.79x, Poppins ~0.84x do estimado.
function fitDisplaySize(text: string, base: number, min: number, budgetPx: number, factor: number) {
  return fitFontSize(String(text ?? ""), base, min, Math.round(budgetPx / factor));
}

function heroChecklistBullets(pd: any, campaign: any, max: number) {
  const values = String(pd?.differentials || "")
    .split(/[\n;,]+/)
    .map((item) => item.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);
  if (values.length) return values.slice(0, max);
  const location = pd?.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(", ");
  return [pd?.area, pd?.suites, pd?.towers, location]
    .filter(Boolean).map((value) => String(value).trim()).slice(0, max);
}

// Detecta headline que e basicamente o preco/oferta (duplicaria o bloco De/Por do hero-checklist).
function isPriceLikeHeadline(s: string) {
  const t = String(s || "").toLowerCase();
  if (/r\$\s*[\d.]/.test(t) && /\bpor\b/.test(t)) return true;              // "... R$ ... por ..."
  if (/\bde\b/.test(t) && /\bpor\b/.test(t) && /\d{3}/.test(t)) return true; // "de ... por ... <numero>"
  return false;
}
// Titulo de BENEFICIO (sem preco) a partir dos dados do imovel — para nao repetir a oferta De/Por.
function heroBenefitHeadline(pd: any, campaign: any, brandProfile: any) {
  const bits: string[] = [];
  if (pd?.suites) bits.push(String(pd.suites));
  else if (pd?.rooms) bits.push(String(pd.rooms));
  if (pd?.area) bits.push(String(pd.area));
  const nb = pd?.neighborhood || campaign?.city || "";
  let h = bits.join(" · ");
  if (nb) h = h ? `${h} — ${nb}` : `Oportunidade em ${nb}`;
  return h || campaign?.name || brandProfile?.fallbackHeadline || "OPORTUNIDADE";
}

function buildVitraHeroChecklistSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const hero = images[0] || null;

  // O hero-checklist JA exibe o preco no bloco De/Por. Se a headline for o proprio preco (ex.:
  // "De R$X por R$Y"), trocamos por um titulo de beneficio para nao repetir a oferta na peca.
  let headlineSource = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString();
  if (isPriceLikeHeadline(headlineSource)) headlineSource = heroBenefitHeadline(pd, campaign, brandProfile);
  const headlineRaw = headlineSource.toUpperCase();
  const lines = wrapText(headlineRaw, isWide ? 16 : 14, 3);

  const parts = priceParts(pd.price || campaign?.offer || "");
  const priceFrom = String(pd.price_from || parts.from || "").replace(/^de\s*:?\s*/i, "").trim();
  const priceTo = formatMoneyLike(parts.to || pd.price || "") || "Consulte";
  const bullets = heroChecklistBullets(pd, campaign, isWide ? 3 : 5);
  const cta = compactText(asset.cta || "Clique abaixo e receba mais informações", 46);

  // Layout por formato com a SAFE ZONE do Meta aplicada (skill margem-seguranca-criativos): mesma
  // hierarquia da peca aprovada (logo > headline > De/Por > checklist > CTA), mas com todo o
  // conteudo critico DENTRO do retangulo seguro. 1:1 [108..972]; 9:16 reels-safe y[250..1470]
  // (logo abaixo de 250, CTA acima de 1470); 1.91:1 (1200x628) x[89..1111] y[63..564]. So a foto
  // de fundo sangra ate a borda.
  const L = isStory ? {
    logo: [905, 276, 120], margin: 90,
    headBase: 96, headGap: 104, headY: 440, headBudget: 740,
    deY: 720, deSize: 38, porY: priceFrom ? 796 : 760, porSize: 58,
    bulletsY: 900, bulletStep: 80, bulletSize: 34, badge: 38, bulletTextX: 152, bulletChars: 30,
    cta: [90, 1300, 640, 100, 20], ctaSize: 30,
  } : isWide ? {
    logo: [990, 72, 110], margin: 90,
    headBase: 46, headGap: 50, headY: 120, headBudget: 500,
    deY: 270, deSize: 22, porY: priceFrom ? 312 : 286, porSize: 34,
    bulletsY: 356, bulletStep: 42, bulletSize: 18, badge: 22, bulletTextX: 124, bulletChars: 26,
    cta: [90, 486, 460, 58, 14], ctaSize: 20,
  } : {
    logo: [852, 120, 120], margin: 108,
    headBase: 84, headGap: 92, headY: 224, headBudget: 600,
    deY: 462, deSize: 32, porY: priceFrom ? 524 : 488, porSize: 48,
    bulletsY: 588, bulletStep: 62, bulletSize: 28, badge: 30, bulletTextX: 158, bulletChars: 30,
    cta: [108, 880, 552, 84, 18], ctaSize: 26,
  };

  const x = L.margin;
  const photoLayer = hero
    ? `<image href="${esc(hero)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>`;

  const headLines = lines.map((line, index) => {
    const size = fitDisplaySize(line, L.headBase, Math.round(L.headBase * 0.55), L.headBudget, 0.79);
    return textLine(x, L.headY + index * L.headGap, line, { anchor: "start", fill: "#FFFFFF", family: "Anton", size, weight: 400 });
  }).join("");

  const deLine = priceFrom
    ? textLine(x, L.deY, `De ${formatMoneyLike(priceFrom)}`, { anchor: "start", fill: "#F2F2F2", family: "Poppins", size: L.deSize, weight: 600, decoration: "line-through" })
    : "";
  const porSize = fitDisplaySize(`Por ${priceTo}`, L.porSize, Math.round(L.porSize * 0.6), L.cta[2], 0.84);
  const porLine = `<text x="${x}" y="${L.porY}" text-anchor="start" font-family="Poppins" font-size="${porSize}" font-weight="700"><tspan fill="#FFFFFF">Por </tspan><tspan fill="${HC_GOLD_TEXT}">${esc(priceTo)}</tspan></text>`;

  const bulletRows = bullets.map((item, index) => {
    const baseY = L.bulletsY + index * L.bulletStep;
    const badgeTop = baseY - Math.round(L.bulletSize * 0.35 + L.badge / 2);
    return `${heroChecklistBadge(x, badgeTop, L.badge)}
    ${textLine(L.bulletTextX, baseY, compactText(item, L.bulletChars), { anchor: "start", fill: "#FAFAF8", family: "Poppins", size: L.bulletSize, weight: 500 })}`;
  }).join("");

  const [ctaX, ctaY, ctaW, ctaH, ctaRx] = L.cta;
  // Padding proporcional a altura do botao + fator 0.90 (Poppins bold minuscula avanca ~90%
  // do estimado pela tabela caps): sem isso o texto encostava nas bordas do botao no 1:1/9:16.
  const ctaSize = fitDisplaySize(cta, L.ctaSize, 16, ctaW - Math.round(ctaH * 0.9), 0.90);
  const ctaTextY = ctaY + Math.round(ctaH / 2) + Math.round(ctaSize * 0.36);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="${idBase}-bg" cx="50%" cy="44%" r="70%">
      <stop offset="0%" stop-color="#0A1B32"/>
      <stop offset="66%" stop-color="#07111F"/>
      <stop offset="100%" stop-color="#050C16"/>
    </radialGradient>
    <linearGradient id="${idBase}-veilX" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#07111F" stop-opacity="0.95"/>
      <stop offset="32%" stop-color="#07111F" stop-opacity="0.82"/>
      <stop offset="58%" stop-color="#07111F" stop-opacity="0.40"/>
      <stop offset="82%" stop-color="#07111F" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#07111F" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="${idBase}-veilY" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#07111F" stop-opacity="0.52"/>
      <stop offset="45%" stop-color="#07111F" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#07111F" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${photoLayer}
  <rect width="${W}" height="${H}" fill="#07111F" opacity="0.26"/>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-veilX)"/>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-veilY)"/>
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
  <svg x="${L.logo[0]}" y="${L.logo[1]}" width="${L.logo[2]}" height="${Math.round(L.logo[2] * 25 / 136)}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>
  ${headLines}
  ${deLine}
  ${porLine}
  ${bulletRows}
  ${ctaBlockForHeroChecklist(ctaX, ctaY, ctaW, ctaH, ctaRx, ctaTextY, ctaSize, cta)}
</svg>`;
}

function ctaBlockForHeroChecklist(x: number, y: number, w: number, h: number, rx: number, textY: number, size: number, label: string) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${HC_GOLD_BTN}"/>
  ${textLine(x + w / 2, textY, label, { fill: HC_INK, family: "Poppins", size, weight: 700 })}`;
}

// Wordmark VITRA so com o texto branco (sem hexagono), para o topo direito do hero-checklist.
// Usado lazy dentro de buildVitraHeroChecklistSvg (declaracao apos a funcao e segura em runtime).
const VITRA_WORDMARK_WHITE = `<text x="135" y="48" font-family="Inter" font-weight="700" font-size="27" letter-spacing="12" fill="#FFFFFF">VITR</text><path d="M254.99,28.56 L264.98,48.54 L245,48.54 Z M254.99,37.551 L258.4865,44.544 L251.4935,44.544 Z" fill="#FFFFFF" fill-rule="evenodd"/>`;

// ===== Template 06: duo-selos (Zona Norte / Isla) =====
// Referencia aprovada: criativos-aprovados-vitra-imobiliaria/2fe17ff8 (feed) e f38e4f2b (story).
// Composicao centralizada fiel a peca original: wordmark VITRA branco no topo, headline em 2
// linhas (2a dourada), subtitulo, pill branco De/Por, duas fotos grandes lado a lado SEM moldura,
// dois selos badge-check dourados e CTA pill dourado com texto navy. Paleta 100% brandbook (o
// azul-royal e o amarelo da referencia viram navy + dourado, mesma regra dos demais templates).
// SAFE ZONE do Meta aplicada desde o nascimento (skill margem-seguranca-criativos): 1:1 conteudo
// em [108..972]; 9:16 reels-safe y[250..1470] (topo 250 / base 450) x[35..1045]; 1.91:1 (1200x628)
// x[89..1111] y[63..564]. So o fundo navy sangra ate a borda.
function duoSelosPhoto(href: string | null, id: string, x: number, y: number, w: number, h: number, rx: number) {
  if (!href) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#0F2140"/>
      <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="${GOLD}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">FOTO DO IMOVEL</text>`;
  }
  // Sem stroke dourado: na referencia as fotos sao "limpas", so com cantos arredondados.
  return `<image href="${esc(href)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}

// Selo badge-check + texto, centralizado em xCenter (anchor middle) ou ancorado a esquerda
// (anchor start). Largura do texto estimada como featureLine (aproximacao por contagem).
function duoSelosBadge(x: number, y: number, text: string, size: number, anchor: "middle" | "start" = "middle") {
  const label = compactText(text, 34);
  const badge = Math.round(size * 1.35);
  const textW = Math.min(620, label.length * size * 0.52);
  const iconX = anchor === "middle" ? Math.round(x - (textW + badge + 14) / 2) : x;
  const textX = iconX + badge + 14;
  const badgeTop = y - Math.round(size * 0.35 + badge / 2);
  return `${heroChecklistBadge(iconX, badgeTop, badge)}
  ${textLine(textX, y, label, { anchor: "start", fill: "#FFFFFF", size, weight: 700 })}`;
}

function buildVitraDuoSelosSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const headline = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString().toUpperCase();
  const lines = wrapText(headline, 24, 2);
  const subtitle = compactText((pd.area || approvedDescription(pd, asset) || "").toString(), 58);
  // O pill De/Por reaproveita o priceChip: se o form trouxe price_from separado, monta a string
  // "De: X | Por: Y" que o priceParts entende; senao usa pd.price cru (pode ja vir com De/Por).
  const rawPrice = pd.price_from
    ? `De: ${pd.price_from} | Por: ${pd.price || "Consulte"}`
    : (pd.price || campaign?.offer || "");
  const badges = productDifferentials(pd, campaign);
  while (badges.length < 2) badges.push(badges[0] || "Atendimento consultivo Vitra");
  const cta = compactText(asset.cta || "Clique para receber mais informacoes", 46);
  const photoA = images[0] || null;
  const photoB = images[1] || images[0] || null;

  // Layout por formato — todos os elementos DENTRO da safe zone do formato.
  const L = isStory ? {
    wordmark: [465, 290, 150],
    headY: 420, headGap: 75, headSize: 64, headBudget: 940,
    subY: 555, subSize: 30,
    pill: [260, 590, 560, 58],
    photos: [[55, 690, 465, 450, 40], [560, 690, 465, 450, 40]],
    badgeRow: [[300, 1230], [780, 1230]], badgeSize: 24, badgeAnchor: "middle" as const,
    cta: [235, 1310, 610, 76, 1358, 26],
  } : isWide ? {
    wordmark: [89, 75, 130],
    headY: 165, headGap: 50, headSize: 40, headBudget: 540, headX: 365,
    subY: 258, subSize: 20, subX: 365,
    pill: [115, 285, 500, 50],
    photos: [[650, 70, 455, 230, 24], [650, 318, 455, 230, 24]],
    badgeRow: [[100, 385], [100, 428]], badgeSize: 19, badgeAnchor: "start" as const,
    cta: [120, 460, 430, 52, 493, 19],
  } : {
    wordmark: [470, 118, 140],
    headY: 235, headGap: 70, headSize: 60, headBudget: 820,
    photos: [[108, 470, 410, 330, 36], [562, 470, 410, 330, 36]],
    subY: 355, subSize: 28,
    pill: [285, 385, 510, 56],
    badgeRow: [[320, 860], [760, 860]], badgeSize: 24, badgeAnchor: "middle" as const,
    cta: [300, 895, 480, 64, 936, 21],
  };

  const headX = (L as any).headX || W / 2;
  const subX = (L as any).subX || W / 2;
  const h1 = lines[0] || "OPORTUNIDADE";
  const h2 = lines[1] || "";
  const h1Size = fitFontSize(h1, L.headSize, 34, L.headBudget);
  const h2Size = fitFontSize(h2, L.headSize, 34, L.headBudget);
  const [wmX, wmY, wmW] = L.wordmark;
  const wmH = Math.round(wmW * 25 / 136);
  const [pillX, pillY, pillW, pillH] = L.pill;
  const [ctaX, ctaY, ctaW, ctaH, ctaTextY, ctaSize] = L.cta;
  const photoDefs = L.photos.map((p, i) => `<clipPath id="${idBase}-p${i}"><rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="${p[4]}" ry="${p[4]}"/></clipPath>`).join("") +
    `<radialGradient id="${idBase}-glow" cx="78%" cy="10%" r="60%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.10"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-glow)"/>
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
  <svg x="${wmX}" y="${wmY}" width="${wmW}" height="${wmH}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>
  ${textLine(headX, L.headY, h1, { fill: "#FFFFFF", size: h1Size, weight: 900, spacing: "-0.5" })}
  ${h2 ? textLine(headX, L.headY + L.headGap, h2, { fill: GOLD_LIGHT, size: h2Size, weight: 900, spacing: "-0.5" }) : ""}
  ${subtitle ? textLine(subX, L.subY, subtitle, { fill: "#FFFFFF", size: L.subSize, weight: 600 }) : ""}
  ${priceChip(pillX, pillY, pillW, pillH, rawPrice)}
  ${duoSelosPhoto(photoA, `${idBase}-p0`, L.photos[0][0], L.photos[0][1], L.photos[0][2], L.photos[0][3], L.photos[0][4])}
  ${duoSelosPhoto(photoB, `${idBase}-p1`, L.photos[1][0], L.photos[1][1], L.photos[1][2], L.photos[1][3], L.photos[1][4])}
  ${duoSelosBadge(L.badgeRow[0][0], L.badgeRow[0][1], badges[0], L.badgeSize, L.badgeAnchor)}
  ${duoSelosBadge(L.badgeRow[1][0], L.badgeRow[1][1], badges[1], L.badgeSize, L.badgeAnchor)}
  <rect x="${ctaX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${Math.round(ctaH / 2)}" fill="${GOLD}"/>
  ${textLine(ctaX + ctaW / 2, ctaTextY, cta, { fill: "#07111F", size: ctaSize, weight: 900 })}
</svg>`;
}

// ===== Template 07: hero-panel (San Clemente / Bairro Gloria) =====
// Referencia aprovada: criativos-aprovados-vitra-imobiliaria/1040ccb5 (feed) e 83b3c406 (story).
// Foto hero sangrando no topo + painel em degrade na FAMILIA AZUL do brandbook (#2E6BB5 -> #1B3A6B
// -> navy) com headline 2 linhas brancas + linha de destaque dourada (Anton), lista de setas
// douradas (featureArrow), "OPORTUNIDADE POR:" e preco dourado; galeria lateral de 2 fotos
// sobrepondo hero e painel. Sem CTA (fiel a peca original). Amarelo da referencia -> dourado.
// SAFE ZONE do Meta (skill margem-seguranca-criativos): 1:1 conteudo em [108..972]; 9:16
// reels-safe y[250..1470]; 1.91:1 x[89..1111] y[63..564]. Fotos e painel sangram; texto, nunca.
function buildVitraHeroPanelSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const headline = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString().toUpperCase();
  const lines = wrapText(headline, 24, 2);
  const destaque = compactText((pd.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(", ") || "OPORTUNIDADE VITRA").toString().toUpperCase(), 30);
  const bullets = heroChecklistBullets(pd, campaign, 5);
  const price = formatMoneyLike(pd.price || campaign?.offer || "") || "CONSULTE";

  // photos[0] = hero (topo/direita), photos[1..] = galeria lateral. No wide so ha 2 fotos.
  const L = isStory ? {
    photos: [[0, 0, 1080, 820, 0], [700, 640, 345, 330, 0], [700, 982, 345, 330, 0]],
    panel: [0, 760, 690, 1160],
    wordmark: [830, 270, 150],
    headX: 110, headY: 850, headGap: 72, headSize: 60, headBudget: 550,
    bulletsY: 1064, bulletStep: 52, bulletSize: 26,
    labelY: 1340, labelSize: 24,
    priceY: 1408, priceSize: 60,
  } : isWide ? {
    photos: [[652, 0, 548, 316, 0], [652, 328, 548, 300, 0]],
    panel: [0, 0, 640, 628],
    wordmark: [960, 68, 140],
    headX: 100, headY: 130, headGap: 48, headSize: 38, headBudget: 510,
    // Passo 42 (nao 36): a seta do featureArrow tem ~30px de altura fixa; com passo menor as
    // setas se encostavam formando uma "corrente" visual.
    bulletsY: 272, bulletStep: 42, bulletSize: 17,
    labelY: 484, labelSize: 16,
    priceY: 536, priceSize: 38,
  } : {
    photos: [[0, 0, 1080, 540, 0], [684, 360, 348, 300, 0], [684, 672, 348, 300, 0]],
    panel: [0, 485, 668, 595],
    wordmark: [820, 112, 150],
    headX: 110, headY: 540, headGap: 60, headSize: 50, headBudget: 530,
    bulletsY: 700, bulletStep: 44, bulletSize: 21,
    labelY: 908, labelSize: 22,
    priceY: 962, priceSize: 54,
  };

  const x = L.headX;
  const [wmX, wmY, wmW] = L.wordmark;
  const wmH = Math.round(wmW * 25 / 136);
  const [panelX, panelY, panelW, panelH] = L.panel;
  const photoDefs = L.photos.map((p, i) => `<clipPath id="${idBase}-p${i}"><rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="${p[4]}" ry="${p[4]}"/></clipPath>`).join("") +
    `<linearGradient id="${idBase}-panel" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#2E6BB5"/><stop offset="45%" stop-color="#1B3A6B"/><stop offset="100%" stop-color="#0A1628"/></linearGradient>`;
  const headLines = lines.map((line, index) =>
    textLine(x, L.headY + index * L.headGap, line, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: fitDisplaySize(line, L.headSize, 28, L.headBudget, 0.79), weight: 400 })
  ).join("");
  const destaqueLine = textLine(x, L.headY + lines.length * L.headGap, destaque, { anchor: "start", fill: GOLD_LIGHT, family: "Anton", size: fitDisplaySize(destaque, L.headSize, 28, L.headBudget, 0.79), weight: 400 });
  const arrowRows = bullets.map((item, index) => featureArrow(x, L.bulletsY + index * L.bulletStep, item, L.bulletSize)).join("");
  const sidePhotos = L.photos.slice(1).map((p, i) =>
    duoSelosPhoto(images[i + 1] || images[0], `${idBase}-p${i + 1}`, p[0], p[1], p[2], p[3], p[4])
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>
  ${duoSelosPhoto(images[0], `${idBase}-p0`, L.photos[0][0], L.photos[0][1], L.photos[0][2], L.photos[0][3], L.photos[0][4])}
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" fill="url(#${idBase}-panel)"/>
  ${sidePhotos}
  <svg x="${wmX}" y="${wmY}" width="${wmW}" height="${wmH}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>
  ${headLines}
  ${destaqueLine}
  ${arrowRows}
  ${textLine(x, L.labelY, "OPORTUNIDADE POR:", { anchor: "start", fill: "#FFFFFF", size: L.labelSize, weight: 800, spacing: 6 })}
  ${textLine(x, L.priceY, price, { anchor: "start", fill: GOLD_LIGHT, family: "Anton", size: fitDisplaySize(price, L.priceSize, 30, L.headBudget, 0.79), weight: 400 })}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

function buildVitraImobiliariaApprovedSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, templateFamily = VITRA_IMOBILIARIA_TEMPLATE_BASE) {
  const ar = (asset.aspect_ratio || "1:1").toString();
  const layout = approvedTemplateLayout(ar);
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const headline = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString().toUpperCase();
  // Cap de quebra alinhado ao headlineChars do layout (25/24/24), nao mais 18 fixo no 1.91:1: com o
  // fitFontSize cuidando da largura, deixar mais caracteres por linha evita truncar headlines longas
  // (antes "VALOR PARA AVALIA..."); a fonte encolhe o quanto precisar para caber no orcamento.
  const lines = wrapText(headline, (layout.headline as number[])[4] || 24, 2);
  const description = approvedDescription(pd, asset);
  const price = pd.price || campaign?.offer || "";
  const features = productDifferentials(pd, campaign);
  while (features.length < 2) features.push(features[0] || "Atendimento consultivo Vitra");
  const cta = asset.cta || "Fale com a Vitra";
  const [logoX, logoY, logoW, logoH] = layout.logo as number[];
  const [headlineX, headlineY, headlineSize, headlineGap] = layout.headline as number[];
  const [descX, descY, descSize, descChars] = layout.description as number[];
  const [priceX, priceY, priceW, priceH] = layout.price as number[];
  const [ctaX, ctaY, ctaW, ctaH, ctaTextY, ctaSize] = layout.cta as number[];
  const [photoA, photoB] = layout.photos as number[][];
  const idBase = `asset-${String(asset.id || "preview").replace(/[^a-z0-9_-]/gi, "-")}`;
  if (templateFamily === "vitra-imobiliaria-patios-gallery") return buildVitraPatiosGallerySvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-financiamento-orla") return buildVitraFinancingSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-menino-deus-offer") return buildVitraMeninoDeusSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-hero-checklist") return buildVitraHeroChecklistSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-duo-selos-offer") return buildVitraDuoSelosSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-hero-panel-gallery") return buildVitraHeroPanelSvg(asset, campaign, images, W, H, brandProfile, idBase);
  const frame = templateFrame(asset);
  const slogan = layout.slogan as number[] | null;

  const h1 = lines[0] || "VITRA IMOBILIARIA";
  const h2 = lines[1] || "";
  // Fase 2/3 (#4): encolhimento da headline por LARGURA estimada (estimateTextWidthPx), nao por
  // contagem de caracteres. Corrige o caso do 1.91:1, onde o cap de quebra (18) era menor que o
  // antigo limiar headlineChars (24), entao o shrink nunca disparava e headlines de glifos largos
  // transbordavam.
  const headlineBudget = approvedHeadlineBudgetPx(ar);
  const h1Size = fitFontSize(h1, headlineSize, 38, headlineBudget);
  const h2Size = fitFontSize(h2, headlineSize - 2, 38, headlineBudget);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="${idBase}-bg" cx="50%" cy="44%" r="70%">
      <stop offset="0%" stop-color="#0A1B32"/>
      <stop offset="66%" stop-color="#07111F"/>
      <stop offset="100%" stop-color="#050C16"/>
    </radialGradient>
    <clipPath id="${idBase}-photoA"><rect x="${photoA[0]}" y="${photoA[1]}" width="${photoA[2]}" height="${photoA[3]}" rx="${photoA[4]}" ry="${photoA[4]}"/></clipPath>
    <clipPath id="${idBase}-photoB"><rect x="${photoB[0]}" y="${photoB[1]}" width="${photoB[2]}" height="${photoB[3]}" rx="${photoB[4]}" ry="${photoB[4]}"/></clipPath>
    <filter id="pillShadow" x="-20%" y="-35%" width="140%" height="170%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.24"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>
  ${frame ? `<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="20" fill="none" stroke="${GOLD}" stroke-width="1.4" opacity="0.82"/>` : ""}
  <svg x="${logoX}" y="${logoY}" width="${logoW}" height="${logoH}" viewBox="0 0 300 100">${brandProfile.logo}</svg>
  ${textLine(headlineX, headlineY, h1, { fill: "#FFFFFF", size: h1Size, weight: 900, spacing: "-0.5" })}
  ${h2 ? textLine(headlineX, headlineY + headlineGap, h2, { fill: GOLD_LIGHT, size: h2Size, weight: 900, spacing: "-0.5" }) : ""}
  ${description ? textLine(descX, descY, compactText(description, descChars), { fill: OFF_WHITE, size: descSize, weight: 800 }) : ""}
  ${imageLayer(images[0], `${idBase}-photoA`, photoA[0], photoA[1], photoA[2], photoA[3], photoA[4])}
  ${imageLayer(images[1] || images[0], `${idBase}-photoB`, photoB[0], photoB[1], photoB[2], photoB[3], photoB[4])}
  ${priceChip(priceX, priceY, priceW, priceH, price)}
  ${featureLine((layout.features as any)[0][0], (layout.features as any)[0][1], features[0], (layout.features as any)[0][2])}
  ${featureLine((layout.features as any)[1][0], (layout.features as any)[1][1], features[1], (layout.features as any)[1][2])}
  <rect x="${ctaX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${Math.round(ctaH / 2.8)}" fill="${GOLD}"/>
  ${textLine(ctaX + ctaW / 2, ctaTextY, compactText(cta, 46), { fill: "#07111F", size: ctaSize, weight: 900 })}
  ${slogan ? textLine(slogan[0], slogan[1], "VIVA, INVISTA, EVOLUA", { fill: OFF_WHITE, size: slogan[2], weight: 800, spacing: slogan[3], opacity: "0.58" }) : ""}
</svg>`;
}

function buildTree(asset: any, campaign: any, bg: string | null, W: number, H: number, logoH: number, brandProfile: ReturnType<typeof brandRenderProfile>) {
  const pd = campaign?.brief?.product_data ?? {};
  const model = modelKey(asset);
  const kicker = (pd.tagline || campaign?.product_name || brandProfile.fallbackKicker).toString().toUpperCase();
  const headline = asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline;
  const copy = asset.copy || pd.suggested_copy || "";
  const cta = asset.cta || "Solicitar curadoria";
  const pad = Math.round(W * 0.075);
  const phase = PHASE_TAG[String(asset?.metadata?.campaign_phase)] || "";
  const isVertical = H > W * 1.25;
  const isWide = W > H * 1.35;
  const usePanel = !["premium-photo-offer", "premium-location-panorama"].includes(model);
  const mainWidth = isVertical ? Math.round(W*0.90) : model === "premium-location-panorama" ? Math.round(W*0.76) : model === "premium-photo-offer" ? Math.round(W*0.78) : Math.round(W*0.58);
  const headlineSize = Math.round(W * (isVertical ? 0.078 : isWide ? 0.048 : 0.058));
  const overlayOpacity = brandProfile.scope === "vitra_imobiliaria"
    ? brandProfile.overlayOpacity
    : model === "premium-photo-offer" || model === "premium-location-panorama"
      ? "66"
      : brandProfile.overlayOpacity;
  const features = productFeatures(pd, campaign, model === "premium-dark-spec" ? 5 : 3);
  const layers: unknown[] = [];
  if (bg) { const im = h("img", { position:"absolute", top:0, left:0, width:W, height:H, objectFit:"cover" }); (im as any).props.src = bg; layers.push(im); }
  layers.push(h("div", {
    position:"absolute",
    top:0,
    left:0,
    width:W,
    height:H,
    display:"flex",
    backgroundColor:bg ? `${brandProfile.bg}${overlayOpacity}` : brandProfile.overlayNoImage,
  }));
  layers.push(h("div", {
    position:"absolute",
    top:pad*0.45,
    left:pad*0.45,
    width:W-pad*0.9,
    height:H-pad*0.9,
    display:"flex",
    borderWidth:1,
    borderStyle:"solid",
    borderColor:`${GOLD}55`,
  }));
  if (model === "premium-photo-offer" && pd?.price) {
    layers.push(h("div", { position:"absolute", right:pad, bottom:pad, display:"flex", backgroundColor:GOLD, color:"#080808", fontWeight:700, fontSize:Math.round(W*0.030), padding:`${Math.round(W*0.014)}px ${Math.round(W*0.026)}px`, letterSpacing:1 }, pd.price));
  }
  layers.push(h("div", { position:"absolute", top:0, left:0, width:W, height:H, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:pad, fontFamily:"Inter" }, [
    h("div", { display:"flex", height: logoH, flexDirection:"row", justifyContent:"space-between" }, [
      h("div", { display:"flex", width:Math.round(W*0.40), height:logoH }, ""),
      phase ? h("div", {
        display:"flex",
        alignItems:"center",
        height:Math.round(W*0.044),
        borderWidth:1,
        borderStyle:"solid",
        borderColor:`${GOLD}77`,
        color:GOLD_LIGHT,
        fontSize:Math.round(W*0.014),
        fontWeight:600,
        letterSpacing:1.5,
        paddingLeft:Math.round(W*0.014),
        paddingRight:Math.round(W*0.014),
        backgroundColor:brandProfile.scope === "vitra_imobiliaria" ? "rgba(7,17,31,0.42)" : "rgba(0,0,0,0.36)",
      }, phase) : h("div", { display:"flex" }, ""),
    ]),
    h("div", {
      display:"flex",
      flexDirection:"column",
      width:mainWidth,
      backgroundColor:usePanel ? brandProfile.panel : "rgba(0,0,0,0)",
      borderLeftWidth:usePanel ? 2 : 0,
      borderLeftStyle:"solid",
      borderLeftColor:usePanel ? GOLD : "transparent",
      padding:usePanel ? Math.round(W*0.038) : 0,
    }, [
      h("div", { display:"flex", letterSpacing:4*premiumScale(isVertical), fontSize:Math.round(W*0.020), fontWeight:600, color:GOLD_LIGHT, marginBottom:Math.round(H*0.02) }, kicker),
      h("div", { display:"flex", fontFamily:"Playfair Display", fontWeight:700, fontSize:headlineSize, lineHeight:1.06, color:"#FFFFFF", marginBottom:Math.round(H*0.020) }, headline),
      copy ? h("div", { display:"flex", fontSize:Math.round(W*0.022), fontWeight:400, lineHeight:1.42, color:OFF_WHITE, maxWidth:Math.round(W*0.82) }, copy) : h("div", { display:"flex" }, ""),
      (model === "premium-dark-spec" || model === "premium-gallery-proof") ? featureNodes(features, W) : h("div", { display:"flex" }, ""),
      h("div", { display:"flex", marginTop:Math.round(H*0.028) }, h("div", { display:"flex", backgroundColor:GOLD, color:"#080808", fontWeight:700, fontSize:Math.round(W*0.020), padding:`${Math.round(W*0.014)}px ${Math.round(W*0.030)}px`, borderRadius:3 }, cta)),
    ]),
    // Rotulo interno do template (MODEL_LABEL) removido da arte final em 2026-06-06:
    // era texto de debug visivel no PNG entregue ao cliente. O rastreio interno do
    // template permanece em metadata.visual_template; nao precisa aparecer na peca.
  ]));
  return h("div", { display:"flex", width:W, height:H, position:"relative", backgroundColor:brandProfile.bg }, layers);
}

async function renderAsset(svc: any, asset: any, campaign: any, resvgFonts: Uint8Array[]) {
  let step = "init";
  const brandProfile = brandRenderProfile(campaign, asset);
  const model = modelKey(asset);
  const templateFamily = templateFamilyFromKey(model);
  const ar = (asset.aspect_ratio || "1:1").toString();
  const base = DIMS[ar] || DIMS["1:1"];
  const useApprovedVitraTemplate = isVitraImobiliariaTemplate(model, brandProfile);
  const premiumS = premiumScale(base[1] > base[0] * 1.25); // 9:16 (tall) usa o teto SCALE_TALL
  const W = useApprovedVitraTemplate ? base[0] : Math.round(base[0] * premiumS);
  const H = useApprovedVitraTemplate ? base[1] : Math.round(base[1] * premiumS);
  const pad = Math.round(W * 0.075);
  const logoW = Math.round(W * 0.40);
  const logoH = Math.round(logoW / 3);
  try {
    if (useApprovedVitraTemplate) {
      step = "load_template_images";
      const imageUrls = imageUrlsForApprovedTemplate(asset, campaign);
      const imageData: Array<string | null> = [];
      const maxTemplateImages = templateFamily === "vitra-imobiliaria-hero-checklist"
        ? 1
        : templateFamily === "vitra-imobiliaria-financiamento-orla" || templateFamily === "vitra-imobiliaria-patios-gallery" || templateFamily === "vitra-imobiliaria-hero-panel-gallery"
          ? 3
          : 2;
      for (const url of imageUrls) {
        if (imageData.length >= maxTemplateImages) break;
        const dataUri = await toDataUri(url);
        if (dataUri) imageData.push(dataUri);
      }
      while (imageData.length < maxTemplateImages) imageData.push(imageData[0] || null);
      step = "build_approved_template_svg";
      const svg = buildVitraImobiliariaApprovedSvg(asset, campaign, imageData, W, H, brandProfile, templateFamily);
      step = "init_wasm";
      await ensureWasm();
      step = "resvg";
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: rasterWidth(W, isTallAR(W, H)) }, font: { fontBuffers: resvgFonts, loadSystemFonts: false, defaultFontFamily: "Inter" } });
      const img = resvg.render();
      const png = img.asPng();
      try { img.free?.(); } catch (_) {}
      try { resvg.free?.(); } catch (_) {}
      const slug = campaign?.slug || campaign?.id || "campanha";
      const path = `${brandProfile.storagePrefix}/${slug}/rendered/${asset.id}.png`;
      step = "upload";
      const up = await svc.storage.from("cards").upload(path, png, { contentType: "image/png", upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = svc.storage.from("cards").getPublicUrl(path);
      step = "update_asset";
      const { error: updErr } = await svc.from("premium_campaign_assets").update({
        status:"generated",
        storage_bucket:"cards",
        storage_path:path,
        public_url:`${pub.publicUrl}?v=${Date.now()}`,
        metadata:{
          ...(asset.metadata || {}),
          brand_scope:brandProfile.scope,
          brand_name:brandProfile.name,
          rendered_template_family: templateFamily,
          ...(VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION[templateFamily] ? { rendered_template_version: VITRA_IMOBILIARIA_TEMPLATE_RENDER_VERSION[templateFamily] } : {}),
          rendered_image_count: imageData.filter(Boolean).length,
          last_render_error:null,
        },
        updated_at:new Date().toISOString(),
      }).eq("id", asset.id);
      if (updErr) throw updErr;
      return pub.publicUrl;
    }

    step = "load_fonts";
    const fonts = await loadFonts();
    step = "load_image";
    const bg = await toDataUri(asset.source_image_url || firstBriefImageUrl(campaign));
    step = "satori";
    let svg = await satori(buildTree(asset, campaign, bg, W, H, logoH, brandProfile) as any, { width: W, height: H, fonts });
    const logoNode = `<svg x="${pad}" y="${pad}" width="${logoW}" height="${logoH}" viewBox="0 0 300 100">${brandProfile.logo}</svg>`;
    svg = svg.replace("</svg>", logoNode + "</svg>");
    step = "init_wasm";
    await ensureWasm();
    step = "resvg";
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: rasterWidth(W, isTallAR(W, H)) }, font: { fontBuffers: resvgFonts, loadSystemFonts: false, defaultFontFamily: "Inter" } });
    const img = resvg.render();
    const png = img.asPng();
    try { img.free?.(); } catch (_) {}
    try { resvg.free?.(); } catch (_) {}
    const slug = campaign?.slug || campaign?.id || "campanha";
    const path = `${brandProfile.storagePrefix}/${slug}/rendered/${asset.id}.png`;
    step = "upload";
    const up = await svc.storage.from("cards").upload(path, png, { contentType: "image/png", upsert: true });
    if (up.error) throw up.error;
    const { data: pub } = svc.storage.from("cards").getPublicUrl(path);
    step = "update_asset";
    const { error: updErr } = await svc.from("premium_campaign_assets").update({
      status:"generated",
      storage_bucket:"cards",
      storage_path:path,
      public_url:`${pub.publicUrl}?v=${Date.now()}`,
      metadata:{ ...(asset.metadata || {}), brand_scope:brandProfile.scope, brand_name:brandProfile.name, last_render_error:null },
      updated_at:new Date().toISOString(),
    }).eq("id", asset.id);
    if (updErr) throw updErr;
    return pub.publicUrl;
  } catch (e) {
    const message = String((e as Error)?.message || e);
    throw new Error(`${step}: ${message}`);
  }
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Content-Type":"application/json"
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const apikey = req.headers.get("apikey") || "";
  const presented = auth || apikey;
  if (!presented || (presented !== SERVICE_KEY && presented !== ANON_KEY)) return new Response(JSON.stringify({ error:"unauthorized" }), { status:401, headers:cors });
  let body: any = {}; try { body = await req.json(); } catch {}
  const campaignId = body.campaign_id || null;
  const assetIds = Array.isArray(body.asset_ids) ? body.asset_ids : null;
  let limit = Math.min(Math.max(Number(body.limit || 1), 1), 3);
  if (!campaignId && !assetIds) return new Response(JSON.stringify({ error:"informe campaign_id ou asset_ids" }), { status:400, headers:cors });
  const svc = createClient(SUPABASE_URL, SERVICE_KEY, { auth:{ persistSession:false } });
  // Claim ATOMICO (Fase 1): marca os assets elegiveis como 'rendering' de forma
  // atomica (FOR UPDATE SKIP LOCKED na funcao SQL), evitando corrida entre cron,
  // dashboard e worker. Fallback defensivo para o fluxo legado enquanto a migration
  // do claim (migration-render-queue-claim.sql) ainda nao estiver aplicada.
  const MAX_RENDER_ATTEMPTS = 4;
  // Recicla orfaos 'rendering' travados (crash/OOM) ANTES de reivindicar, para que voltem a 'queued'
  // e o fluxo termine SEM reenfileiramento manual. Janela curta (3 min) para o 9:16 que estourou em
  // isolate frio se recuperar rapido. Best-effort: se a migration do reaper ainda nao foi aplicada, segue.
  await svc.rpc("reap_stale_render_assets", { p_max_attempts: MAX_RENDER_ATTEMPTS, p_orphan_minutes: 3 });
  // Estabilidade (full-res): o caminho Premium (satori) estoura o compute da Edge se renderizar
  // varios full-res numa unica invocacao (OOM em lote, comprovado). Cap em 1 por chamada para
  // Premium; a Imobiliaria (SVG direto, leve) mantem ate 3. Probe barato do brand_scope do alvo;
  // na duvida (sem brand_scope) trata como Premium e cap em 1 (conservador).
  try {
    let probeQ = svc.from("premium_campaign_assets").select("metadata, aspect_ratio, status").eq("channel", "meta_ads");
    probeQ = campaignId ? probeQ.eq("campaign_id", campaignId) : probeQ.in("id", assetIds ?? []);
    const probe = await probeQ.limit(20);
    const rows = probe.data || [];
    const scope = rows[0]?.metadata?.brand_scope || "vitra_premium";
    if (scope !== "vitra_imobiliaria") limit = 1;
    // 9:16 (formato alto) em full-res e o que mais estoura o compute -> processa 1 por invocacao,
    // mesmo na Imobiliaria, para nunca empilhar dois 1080x1920 numa mesma chamada (causa de OOM).
    const hasTallPending = rows.some((r: any) => {
      const d = DIMS[(r.aspect_ratio || "1:1")] || DIMS["1:1"];
      return isTallAR(d[0], d[1]) && ["queued", "rendering", "error", "generated"].includes(String(r.status));
    });
    if (hasTallPending) limit = 1;
  } catch (_) { /* probe best-effort: mantem o limit pedido */ }
  let assets: any[] | null = null;
  let aErr: any = null;
  const claim = await svc.rpc("claim_render_assets", { p_campaign: campaignId, p_asset_ids: assetIds, p_limit: limit });
  if (!claim.error) {
    assets = claim.data;
  } else {
    // Fallback transicional (migration do claim ainda nao aplicada): sem garantia
    // atomica, mas restrito a meta_ads e a estados renderizaveis, para nao re-renderizar
    // 'approved'/'rendering' nem assets de outros canais.
    // Particao: o fallback tambem ignora o conjunto-worker (render_engine='worker'), null-safe.
    let q = svc.from("premium_campaign_assets").select("*").eq("channel","meta_ads")
      .or("metadata->>render_engine.is.null,metadata->>render_engine.neq.worker");
    if (assetIds) q = q.in("id", assetIds).in("status",["queued","generated","error"]); else q = q.eq("campaign_id", campaignId).eq("status","queued");
    const legacy = await q.limit(limit);
    assets = legacy.data; aErr = legacy.error;
  }
  if (aErr) return new Response(JSON.stringify({ error: aErr.message }), { status:500, headers:cors });
  if (!assets || assets.length === 0) return new Response(JSON.stringify({ rendered:0, failed:0, remaining:0, message:"nenhum asset queued" }), { headers:cors });
  const cId = campaignId || assets[0].campaign_id;
  const { data: campaign } = await svc.from("premium_campaigns").select("*").eq("id", cId).single();
  const resvgFonts = await loadResvgFonts();
  await svc.from("premium_generation_jobs").update({ status:"running", started_at:new Date().toISOString() }).eq("campaign_id", cId).eq("job_type","asset_render").in("status",["queued","running"]);
  const results: any[] = []; let rendered = 0, failed = 0;
  for (const asset of assets) {
    try { const url = await renderAsset(svc, asset, campaign, resvgFonts); rendered++; results.push({ id:asset.id, ok:true, url }); }
    catch (e) {
      const error = String((e as Error)?.message || e);
      failed++;
      results.push({ id:asset.id, ok:false, error });
      // Maquina de estados (Fase 1): incrementa tentativas; reenfileira ('queued')
      // enquanto houver orcamento de retry, senao marca 'error' (dead-letter). Evita
      // que o asset fique preso em loop e que o job 'asset_render' rode para sempre.
      const attempts = (Number(asset.metadata?.render_attempts) || 0) + 1;
      await svc.from("premium_campaign_assets").update({
        status: attempts < MAX_RENDER_ATTEMPTS ? "queued" : "error",
        metadata: { ...(asset.metadata || {}), last_render_error: error, render_attempts: attempts },
        updated_at:new Date().toISOString(),
      }).eq("id", asset.id);
    }
  }
  const { count: remaining } = await svc.from("premium_campaign_assets").select("id",{ count:"exact", head:true }).eq("campaign_id", cId).eq("channel","meta_ads").in("status",["queued","rendering"]);
  if (!remaining) await svc.from("premium_generation_jobs").update({ status: failed===0 ? "done":"error", progress:100, finished_at:new Date().toISOString(), output_payload:{ rendered, failed, results }, error_message: failed?`${failed} falharam`:null }).eq("campaign_id", cId).eq("job_type","asset_render").eq("status","running");
  return new Response(JSON.stringify({ campaign_id:cId, rendered, failed, remaining: remaining || 0, results }), { headers:cors });
});
