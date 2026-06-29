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
import { DS_COLORS, formatSpec } from "../_shared/creativeDesign.ts";
import { lintCreative, type LintElement } from "../_shared/creativeLint.ts";

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
  "vitra-imobiliaria-lancamento",
  "vitra-imobiliaria-vitrine-gallery",
  "vitra-imobiliaria-oportunidade-bairro",
  "vitra-imobiliaria-ficha-imovel",
  "vitra-imobiliaria-oferta-ancora",
  "vitra-imobiliaria-destino-bairro",
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
  "vitra-imobiliaria-oferta-ancora-feed": "Vitra Imobiliaria - oferta ancora 1:1",
  "vitra-imobiliaria-oferta-ancora-story": "Vitra Imobiliaria - oferta ancora 9:16",
  "vitra-imobiliaria-oferta-ancora-wide": "Vitra Imobiliaria - oferta ancora 1.91:1",
  "vitra-imobiliaria-destino-bairro-feed": "Vitra Imobiliaria - destino bairro 1:1",
  "vitra-imobiliaria-destino-bairro-story": "Vitra Imobiliaria - destino bairro 9:16",
  "vitra-imobiliaria-destino-bairro-wide": "Vitra Imobiliaria - destino bairro 1.91:1",
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

// Famílias Premium que usam o motor SVG-direto (mesma densidade dos aprovados da Imob, paleta preto+dourado).
// Ficam fora de VITRA_IMOBILIARIA_TEMPLATE_FAMILIES (que infere escopo imobiliaria); o palette vem do
// brandProfile (escopo da campanha/asset = premium).
const PREMIUM_DIRECT_SVG_FAMILIES = ["vitra-premium-lancamento"];
function isDirectSvgTemplateKey(key: string) {
  return isVitraImobiliariaTemplateKey(key) || PREMIUM_DIRECT_SVG_FAMILIES.includes(templateFamilyFromKey(key));
}
function usesDirectSvgTemplate(key: string, brandProfile: ReturnType<typeof brandRenderProfile>) {
  return isVitraImobiliariaTemplate(key, brandProfile) || PREMIUM_DIRECT_SVG_FAMILIES.includes(templateFamilyFromKey(key));
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
  return MODEL_LABEL[key] || isDirectSvgTemplateKey(key) ? key : "premium-editorial-panel";
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

// ===== Design System — IMAGEM dirigida (P1) =====
// Enquadramento art-directed por formato (foco) + grade navy SUTIL via overlay (NÃO usa filtro SVG:
// feColorMatrix em full-res estoura o compute do isolate da Edge — WORKER_RESOURCE_LIMIT). O overlay
// navy de baixa opacidade dá coesão cromática às fotos do imóvel sem custo de render.
function dsImageLayer(href: string | null, W: number, H: number, idBase: string, kind: string, opts?: { grade?: boolean; focal?: string }): string {
  if (!href) return `<rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>`;
  const focal = opts?.focal || (kind === "story" ? "top" : "center");
  const par = focal === "top" ? "xMidYMin slice"
    : focal === "bottom" ? "xMidYMax slice"
    : focal === "left" ? "xMinYMid slice"
    : focal === "right" ? "xMaxYMid slice"
    : "xMidYMid slice";
  const grade = opts?.grade === false ? "" : `<rect width="${W}" height="${H}" fill="${DS_COLORS.navy}" opacity="0.12"/>`;
  return `<image href="${esc(href)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="${par}"/>${grade}`;
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

  // Logo: nos formatos 1:1 (feed) e 9:16 (story) usa a PNG OFICIAL "VITRA" (texto branco) ancorada a
  // ESQUERDA (alinhada a margem/headline). No 1.91:1 (wide) mantem o wordmark desenhado no topo direito.
  const logoMarkup = isWide
    ? `<svg x="${L.logo[0]}" y="${L.logo[1]}" width="${L.logo[2]}" height="${Math.round(L.logo[2] * 25 / 136)}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>`
    : `<image href="${VITRA_WORDMARK_WHITE_PNG}" x="${L.margin}" y="${L.logo[1]}" width="${L.logo[2]}" height="${Math.round(L.logo[2] * 434 / 2538)}" preserveAspectRatio="xMidYMid meet"/>`;

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
  ${logoMarkup}
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
// Wordmark Premium (VITR▲ branco + "PREMIUM" dourado embaixo), sem hexagono — para o topo das pecas Premium
// renderizadas pelo motor SVG-direto. viewBox alto o suficiente para incluir a linha PREMIUM (y~71).
const VITRA_WORDMARK_PREMIUM = `${VITRA_WORDMARK_WHITE}<text x="122.5" y="71" font-family="Inter" font-weight="700" font-size="10.5" letter-spacing="17.6" fill="#C4942A">PREMIUM</text>`;

// Logo oficial VITRA (texto branco) em PNG — usada no canto ESQUERDO do hero-checklist nos formatos
// 1:1 e 9:16 (substitui o wordmark desenhado, so nesses formatos). Fonte: dashboard/public/brand/
// vitra-imobiliaria/logos/texto-wordmark/vitra-imobiliaria-vitra-branco.png (reduzida p/ 480px).
const VITRA_WORDMARK_WHITE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAABSCAMAAAC7f/dtAAAC3FBMVEVMaXH////////////////////////+/v7////////////////////////////////////////////////////////+/v7////////////////////////////////+/v7////////+/v7+/v7////////////////////+/v7+/v7+/v7////////////////////////////////////////////////+/v7////+/v7////////////////////////////+/v7////////////////+/v7////////////////////////////////////////////////+/v7////////////////////////////////////////+/v7////////////////+/v7////////////////////+/v7////////////////+/v7////+/v7////////////////////////////////////////////+/v7////////////////////////////////////////+/v7////////////////////////////////////////////////////////////////////////////////+/v7////////////////+/v7////////////////////////////////////////////////////////+/v7////////////////////+/v7////+/v7////+/v7////////////////////////////////////////////////////////////////////////+/v7////////+/v7////////////////////////////////////////////////////////////////////+/v7////////////////////////////////////////////////////+/v7///////93MkkBAAAA83RSTlMAAv1U+/4D/AEEUQ/r1Iwra5v6uvj5BwbhCVOACKF/fjAxxSkv3eOxou/g4sYqxKf3VcegGHoTBXvnUnl4kJ/x3hnf3Armw+kofejsFC70XhWpgTsO6timTHYMVr6eNvY3Gkdpdy2osK1c5Y06YT4cj9Ez8B3O8x9iDXwLke1ZElpIlNYRQBYnOEVmrzKqtCCWXYPa8ruuFxAhTfVE7phKtSxxmtKJmW25V4oi15dOPbc/ZHXI2b3KaKPBtpMbI2eC1UacrHTkT4uOJGq8288lY785hG9DUM1spYWHzLNBX5JuNKTQHiZzNdM8lZ3JssCrcEv8y2NoAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAM90lEQVR42u1d94MURRZ+1UxX96AeuO6ysLDkKGkJuiCcCCdBcs4Hko4ggkoSCSKioCh6IHgEARUVs96ZPbN36hkv55xzqH/gqmeXmXrVPbNd1dWzwzjvJ8J0dfX7+nvv1atXrwFKUpKSlKQkBS1uEgsNcQ2RrnE17kvRCERn6vI0wouWpnKOSClx3bMEcSM/+VwKTdL4VeMSNTQnP1rVJCNVjx5zG76mww50zfZNGpC/Ldy3akdn9RFcaIamEV76vVepodjaI/OyD9n0xOox41OGgdK4AXYVAR7LbJYWm61bDw2+Ih2ZI15itQeiCo77FrPSQyTYB6BsNpOwn1+oITYbNl75fXLha9tERfmlbNvNewcdm+55jhjhJXDlCSVtU3iYlTsZqWDXA23gFr1rrIR4xUca6nKvZWXpIcrZYzoAt0YzDy0JNu5GjRmfM5Ylcoxq1707Xd95lgChMQI85ZTS5CncxGzhzXRYtwZeEAoPiATmf/4vUHWAzxMGSbAv6AGsyeAeF+sAfG5OBtu2bTkJzyr1n+1CXL6YwISFrKmKvl3Y8rFgLL2nX5/76V2Yjy30xO+oWmhDALctJIDPDJ6wbPbMbkjGgzCFLzM2SvGSa5CeHHZ1zheEwOGNDFH+Ap0AyQTA7QoQYE8jDtt4ezwcJtC5hutNicIU1qCJO2xvTkJSWCJZ6JeULbQhgK8oTIBTEO90iRsHgS/1Bu9DlGaevBbb6PvW5np8Avuwhb7nsLKFNgTwDYUKMDfUrDoGhAm0L+fO3lKl8H7JRv86x+UE1vbAFnqfOr6GAL6oYAH2HmkrkFgIzDgd+6gshglc52DIlueYGoWVkoW+Wt1CGwJ4CCsrWID5M30dqPEQujw1B4tVKYzNH7U/ttHjBmZ/fgJ3Ygt932saaSwzAM9hNQm/YBQs/w/KNNfBGGA0sGPZMvgW6zHGMIfrCeyNPUptKTxHIuVXs74fcubLYSt0nsIMwEN1GayVyWpoHexI/6upmgZCaLv+7blEgcI8NVWBQXs368woVIlsz/kyxAwwT9H0PX6+LA9eOlF4Fov9c+c7vp/8Y+uWqABbbP5DW79YL09WH3ziqAex/CL90KiR9tbAzpnb93GVJi+lLsYtyqYACt3xT2cM1NlbMgFwloHbdEVJ7m8ZGxgBnGBL0MCVm2Z3X8csG1N4uUkKcwKXp2egFkhTaI5stMW2Z7maP2ZPkcEO+4rWM5gB2KU+ScLcbyOAh0AL/6+oAYAfEQcm3g/umoURtllNb4MIkwyBPcWPUoqj77oH2+g7s0yMwmxkoS3WT8sKxcjgVhjgpXExuDka2CWUp65ewhROsDnmbDQisCqFCXQLZ3gpPCmuPS02crzW7n+cAHdtDIBTWqzllhAHKC+Yq42gMACrvqOrcvEkKY7eEfh68J2JLuIj8HyN3italADz6idYIerRyrng1EliIeOpEEi7MPBcbKODXSuFW9DeomLOrDEAHppHgLkuVjPhR1xV00zZaI/ADl5nq3nhWdhGj7436NXzdp7QG9ryHL03tEgB5vKiqCCHTTIEME9iVUjLcIs1CT+4f3kbFEe7UPkWttDna86/WAFOwm9ER5lg7QzdnoohtMZa2IVdvuUPDbjLNOkWi0sASxr6TMQhwXaaub3PAyt7Ya80C8Voo2/1G98kfB9b6Ms2a8YQxQvwTdjEdTdjotNZaJxI6UWUSrMsFD7N802No/ILPP1v6k4/ToB7NirAa7Ah7GsEYE7gGn8i3FahsAuXPy9Pjfhu08HGJbbHCh/gIXkG+DZMgd8bAniAn8CKgbRUmmWzkb49UwpLsRmf2UZ3lVe8AK/EPvi4idtLSSy9QJrC09I6OiAJ2QuvAa7Rfj2LFeAkvI+j6P0mbh/ogetA6uWG5ZhcmuX44gMCncqxhV5TiAC3aUyAXXzowzFS1cFdY0WWrWgVL0xhKrbRgyfjlyOJC94tdnML7TxckQJM4XcWzmTdYgTgAcEE9t6gjkShNEucnL/ux4WD2L/8XH/ycQLcstEA5rloqZ5p2Pro+4VZPTBTrs6SXCy20QReF2sl+J++pz/5/AF8Uf4A5pvRP5HygX0M7DX4CIxDpfAU9kqzUJC8CpWmUbgdW+gfkyjqKi6AXZd4R4MfsaX94HbRLbSPwPgeCoE0gTE12EYjB07gl9hCT40w+SIAWKzoIKkf/GmFXNFR1j66hfay0Kj8u2aiL5AO/QwvYBstbva6sH4dstDWdREmXwQAo5osumvZpOVHmSPVZO2LbqHlLLTDHl4q1VeF9sLSqSN+1nVXZoLSEt5iL0bp5HDWA2yzU+/+q1u9PDN/wwwrqKrybRMWegAGxe4wfQZGPPRJJV6aNQzb6COZCUo7xk40zcUJ8IX5ADhgxZLw1UXvjYPAU4CvZx29tTCBQ9jN3p2+0oXpouK4e1kG5GwAeFBcAFv4fL/tX8Bs223CA1djAicWACwajHkYOpCWSrMsdqDVmXfQy6KjQUdFVNdZD3BDxyc0jwTkTmKl9oCo1NogvBd24d7RckkROQPwY+KgDi8opyWAc54ffdNIEqsapxedK4GfSh0oUTh0aYfkaBOsdf0k+QDPCf9js4poJd3FDrDlsIcMnPGX18D1m7gehR2ttTCFpnjDoWO9ieZrZNFUOGx+tPghRoBbND7A3Dw7fzbRw8EXQjsLIHWIYvhIPS/Mm0H1RKHUwvr+KhSux9T+bTT7U9QAW3ynfI2JLix+DzzlDBz6FD6OXW190ywKfYV/5411Xo8WIBYzwPzIdLu5RrrsSPvAdR64bjLDB2Pk+5OwQy7GF76cAtiFueKJBq3GOnkDeAQC+Ia4ALattEjJ4b+PN9MJzb8G7puJedvqUZgXRMxENrpnqm6SwB6GXPAbESPEIgA42/6Ow7MHla6ZWtnqYAKnKDwWR0thA2kKH+C4/FkPStzvhG9zHo64hD/rAbbZthEt62XEaAy2/Tcjh0b9BBbOE2l7YeLVtttyab4LrwrDNdztsIAAviKuzYYHYPPlKdlSu2kVBuKkEYB9Say6EDpNYb1AWirNctgrHhgwWUiA2E6D/Uo/DwB/mB6YwjckNs2OoRJLKmT2p7NCUpiiDpC8u/BaL2JYjBxz9g4PhQDwZfkBuDnUunVCYPoB0SFarD8F82vgxAIRYJnCTth9Yf7iOOggeROvFOVNAXSHHYpsgooC4GSWYhfN3mE+D5yLwBECaYA+SEM7vZTMv5EL3h55+sUFML/pBkzhmZuj2jjqI/BfMMCptbClcVIJexSLfcK75i0SuhfagefSChbgdvmoyaIwT6q2i9qcI8caODuFw/VLIbB7oQhnohnA/1Dc9XL0EKLIAOb/+13Mt5GvRSOBtAZmwhpYaMuwSjOQ/ggZ5M8AbRXqNtYpaoBTGUBbTNZfFUlJ/hB6lj/u0aUwhTeQ7qs9r+xkXs5VF0evRIkR4MoujQAw1/5yqclypP3UoEIOEtBZRcpIh6MwgT8KpVkW60KHC393dBvrFDvAexJY2VHUFLSNlCQ+qfWls6pCeuFDImPZp8IqmB86fqoEcMDJBt/Oj7Van8K+hpFlHYIGc2F8VymQDpnrWImUP2lQxgXrN9YpcoB5R9eJmHSvauuJwB0V+BznxtMXBMnBk/ijVyG9MC/NGiva5CmnMypLsAdNnFnPH8Bt83U2icJWyV4e0dUUwQQOL1ZoL/xT0UYPOyoOcaIEcCDALmySmsn1T+pxWE5i1X3mI8fnuHK3Vgm00T8ST9nYYuayy1wTzfmKEGDfqkU7YUnlNbAKhXlphxumNEs8/2HbJhrr5A3gLzUSwHzP7UKcsHxeK1yRPbAiwv3CUfju4A+a2OxXJYCzng+GH0gUHqqjLKJPYA/g58LlOm7L0tUlQtuGxgG4df4A5pVr5+Gvmwxeq66tHB05zFGYl2Y9gbLnhjJwxQ2wryuzlrq0Q+j0eWESisJXBd3FZk+XAM7ZJ0v6QNHGTqrZjogEDrsvTLzGxwHXnqo10+C6SAGm8JS0bajcq5JGI3B9IB3icegnfhudYD8z1P64WBlM4LTUtnuaGoV5r6NoBA67Fqb8261lNha+NN5j6CsiHOC/skR65DL2vjEcag/wTgqZgQ0CPIMnBzIDfxgMMG+Jn/kVP2N4Us3kkagEDlvawc+1OcyXJtlADH2CIEYG136MGDw1vx3f+RfYpYTleypGzztOaCWcaFIWygu78Aorx9/8K4/UWEce/w+svOyMLOSHLY0BPJNVpKdcY3IdPJiVCQMvyQLwHQudzM8SFWoJSwL/iUrgFBErw9xz0YTezbAsmw7m5PFmndIy5n5jXycB99P7MzPuPeFWYwPTMWjgbN+3JI8vE3XWu3MrlZskZ1/SNLpUhUqhuaH+qSRnrY5cfwmBycnHNnJjDywrTe0mSSNS4llJSlKSkhS4/B/CMrrs5sME1wAAAABJRU5ErkJggg==";

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

// ===== Template 08: Lançamento / Pré-lançamento (teaser editorial) =====
// Conceito proprio: foto hero no topo + PAINEL navy institucional embaixo (familia azul->navy do
// brandbook) com SELO de lançamento (dourado), headline (Anton) + destaque dourado (bairro), lista de
// diferenciais com setas, condicao "A partir de" + preco e CTA pill "Lista VIP". Densidade e hierarquia
// no nivel do San Clemente, com finalidade de expectativa/escassez. Safe zone do Meta por formato.
function buildVitraLancamentoSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  // Brand-aware: Imobiliária = painel azul→navy + wordmark VITRA; Premium = preto+dourado + wordmark PREMIUM.
  const isPrem = brandProfile.scope === "vitra_premium";
  const wm = isPrem ? VITRA_WORDMARK_PREMIUM : VITRA_WORDMARK_WHITE;
  const wmVB = isPrem ? "118 24 184 52" : "133 26 136 25";
  const wmAR = isPrem ? 52 / 184 : 25 / 136;
  const bgFill = isPrem ? "#050505" : `url(#${idBase}-bg)`;
  const panelStops = isPrem
    ? `<stop offset="0%" stop-color="#241803"/><stop offset="55%" stop-color="#0B0B0B"/><stop offset="100%" stop-color="#000000"/>`
    : `<stop offset="0%" stop-color="#0F2140"/><stop offset="55%" stop-color="#0A1628"/><stop offset="100%" stop-color="#07111F"/>`;

  const selo = compactText((pd.tagline || "Lançamento").toString().toUpperCase(), 16);
  const headline = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString().toUpperCase();
  const lines = wrapText(headline, 24, 2);
  const destaque = compactText((pd.location || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(", ") || "").toString().toUpperCase(), 30);
  const bullets = heroChecklistBullets(pd, campaign, 3);
  const price = formatMoneyLike(pd.price || pd.price_from || campaign?.offer || "");
  const cta = compactText(asset.cta || "Entrar na lista VIP", 28);

  const L = isStory ? {
    hero: [0, 0, 1080, 820], panel: [0, 760, 1080, 1160], wordmark: [830, 272, 150],
    selo: [90, 300, 58, 30], headX: 110, headY: 900, headGap: 74, headSize: 60, headBudget: 560,
    bulletsY: 1118, bulletStep: 54, bulletSize: 26,
    labelY: 1322, labelSize: 24, priceY: 1392, priceSize: 60,
    cta: [560, 1316, 410, 92, 46], ctaSize: 30,
  } : isWide ? {
    hero: [664, 0, 536, 628], panel: [0, 0, 664, 628], wordmark: [968, 68, 140],
    selo: [100, 84, 40, 20], headX: 100, headY: 152, headGap: 46, headSize: 36, headBudget: 500,
    bulletsY: 300, bulletStep: 40, bulletSize: 16,
    labelY: 452, labelSize: 15, priceY: 500, priceSize: 38,
    cta: [372, 470, 270, 56, 28], ctaSize: 19,
  } : {
    hero: [0, 0, 1080, 540], panel: [0, 490, 1080, 590], wordmark: [828, 120, 150],
    selo: [108, 124, 52, 26], headX: 110, headY: 604, headGap: 58, headSize: 50, headBudget: 540,
    bulletsY: 772, bulletStep: 46, bulletSize: 22,
    labelY: 902, labelSize: 22, priceY: 958, priceSize: 52,
    cta: [600, 900, 372, 64, 32], ctaSize: 25,
  };

  const x = L.headX;
  const [wmX, wmY, wmW] = L.wordmark; const wmH = Math.round(wmW * wmAR);
  const [px, py, pw, ph] = L.panel;
  const photoDefs = `<clipPath id="${idBase}-hero"><rect x="${L.hero[0]}" y="${L.hero[1]}" width="${L.hero[2]}" height="${L.hero[3]}"/></clipPath>`
    + `<linearGradient id="${idBase}-panel" x1="0" y1="0" x2="0.6" y2="1">${panelStops}</linearGradient>`;

  // Selo de lançamento (pill dourado + texto navy).
  const [seloX, seloY, seloH, seloSize] = L.selo;
  const seloW = Math.round(selo.length * seloSize * 0.64) + Math.round(seloH * 1.3);
  const seloPill = `<rect x="${seloX}" y="${seloY}" width="${seloW}" height="${seloH}" rx="${Math.round(seloH / 2)}" fill="${GOLD}"/>
  ${textLine(seloX + seloW / 2, seloY + seloH / 2 + Math.round(seloSize * 0.36), selo, { fill: HC_INK, family: "Poppins", size: seloSize, weight: 700, spacing: 2 })}`;

  const headLines = lines.map((line, i) =>
    textLine(x, L.headY + i * L.headGap, line, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: fitDisplaySize(line, L.headSize, 28, L.headBudget, 0.79), weight: 400 })
  ).join("");
  const destaqueLine = destaque
    ? textLine(x, L.headY + lines.length * L.headGap, destaque, { anchor: "start", fill: GOLD_LIGHT, family: "Anton", size: fitDisplaySize(destaque, Math.round(L.headSize * 0.84), 24, L.headBudget, 0.79), weight: 400 })
    : "";
  const arrowRows = bullets.map((it, i) => featureArrow(x, L.bulletsY + i * L.bulletStep, it, L.bulletSize)).join("");

  const priceBlock = price
    ? `${textLine(x, L.labelY, "A PARTIR DE", { anchor: "start", fill: "#FFFFFF", size: L.labelSize, weight: 800, spacing: 6 })}
       ${textLine(x, L.priceY, price, { anchor: "start", fill: GOLD_LIGHT, family: "Anton", size: fitDisplaySize(price, L.priceSize, 28, L.headBudget, 0.79), weight: 400 })}`
    : `${textLine(x, L.labelY, "PRÉ-VENDA", { anchor: "start", fill: "#FFFFFF", size: L.labelSize, weight: 800, spacing: 6 })}
       ${textLine(x, L.priceY, "EXCLUSIVA", { anchor: "start", fill: GOLD_LIGHT, family: "Anton", size: L.priceSize, weight: 400 })}`;

  const [cx, cy, cw, ch, crx] = L.cta;
  const ctaSize = fitDisplaySize(cta, L.ctaSize, 14, cw - Math.round(ch * 0.9), 0.90);
  const ctaBlock = `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${crx}" fill="${GOLD}"/>
  ${textLine(cx + cw / 2, cy + ch / 2 + Math.round(ctaSize * 0.36), cta, { fill: HC_INK, family: "Poppins", size: ctaSize, weight: 700 })}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="${bgFill}"/>
  ${duoSelosPhoto(images[0], `${idBase}-hero`, L.hero[0], L.hero[1], L.hero[2], L.hero[3], 0)}
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="url(#${idBase}-panel)"/>
  <svg x="${wmX}" y="${wmY}" width="${wmW}" height="${wmH}" viewBox="${wmVB}">${wm}</svg>
  ${seloPill}
  ${headLines}
  ${destaqueLine}
  ${arrowRows}
  ${priceBlock}
  ${ctaBlock}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

// ===== Template 09: Vitrine alto padrão (painel diagonal + De/Por + checklist + galeria 3 fotos) =====
// Conceito (referência fornecida): painel navy com CORTE DIAGONAL à esquerda (foto do prédio atrás) com
// wordmark + headline + De/Por + checklist de selos-check + CTA pill clara; à direita, coluna de 3 fotos
// arredondadas sobre fundo off-white. Composição própria por formato. Safe zone do Meta aplicada.
function buildVitraVitrineSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;

  const headline = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString().toUpperCase();
  const parts = priceParts(pd.price || campaign?.offer || "");
  const priceFrom = String(pd.price_from || parts.from || "").replace(/^de\s*:?\s*/i, "").trim();
  const priceTo = formatMoneyLike(parts.to || pd.price || "") || "Consulte";
  const bullets = heroChecklistBullets(pd, campaign, isWide ? 4 : 5);

  const L = isStory ? {
    split: [720, 640], gallery: [716, 300, 300, [300, 676, 1052], 360, 18],
    wm: [88, 300, 150], headX: 88, headY: 470, headGap: 92, headSize: 86, headBudget: 540,
    tagY: 400, tagSize: 22,
    deY: 660, deSize: 32, porY: 730, porSize: 60,
    bulletsY: 858, bulletStep: 78, bulletSize: 31, badge: 38, bulletX: 150, bulletChars: 32,
    cta: [88, 1320, 540, 96, 48], ctaSize: 31,
  } : isWide ? {
    split: [806, 770], gallery: [820, 292, 64, [64, 248, 432], 168, 14],
    wm: [96, 70, 140], headX: 96, headY: 150, headGap: 56, headSize: 50, headBudget: 600,
    tagY: 116, tagSize: 16,
    deY: 244, deSize: 19, porY: 286, porSize: 36,
    bulletsY: 346, bulletStep: 42, bulletSize: 18, badge: 24, bulletX: 150, bulletChars: 30,
    cta: [96, 500, 380, 54, 27], ctaSize: 19,
  } : {
    split: [668, 600], gallery: [694, 312, 694, [104, 392, 680], 280, 20],
    wm: [82, 90, 158], headX: 82, headY: 206, headGap: 80, headSize: 80, headBudget: 500,
    tagY: 150, tagSize: 20,
    deY: 372, deSize: 30, porY: 436, porSize: 56,
    bulletsY: 540, bulletStep: 62, bulletSize: 27, badge: 32, bulletX: 138, bulletChars: 34,
    cta: [82, 812, 470, 76, 38], ctaSize: 27,
  };

  const [splitTop, splitBot] = L.split;
  const [gx, gw, , gys, gh, grx] = L.gallery as [number, number, number, number[], number, number];
  const x = L.headX;

  // Defs: painel navy + clip do painel diagonal (esquerda) + clips das fotos da galeria.
  const galClips = (gys as number[]).map((gy, i) => `<clipPath id="${idBase}-g${i}"><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${grx}" ry="${grx}"/></clipPath>`).join("");
  const photoDefs = `<clipPath id="${idBase}-panel"><polygon points="0,0 ${splitTop},0 ${splitBot},${H} 0,${H}"/></clipPath>`
    + `<linearGradient id="${idBase}-panel-grad" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="#13294C"/><stop offset="55%" stop-color="#0A1628"/><stop offset="100%" stop-color="#07111F"/></linearGradient>`
    + galClips;

  // Painel: foto do prédio (atrás, sutil) clipada ao polígono + véu navy por cima.
  const heroBehind = images[0]
    ? `<image href="${esc(images[0])}" x="0" y="0" width="${Math.round(W * 0.7)}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${idBase}-panel)"/>`
    : "";
  const panel = `${heroBehind}<polygon points="0,0 ${splitTop},0 ${splitBot},${H} 0,${H}" fill="url(#${idBase}-panel-grad)" opacity="0.9"/>`;

  // Galeria à direita (3 fotos arredondadas; usa images[1..3], fallback hero).
  const gallery = (gys as number[]).map((gy, i) => duoSelosPhoto(images[i + 1] || images[0], `${idBase}-g${i}`, gx, gy, gw, gh, grx)).join("");

  // Conteúdo (esquerda).
  const lines = wrapText(headline, isWide ? 22 : 16, 3);
  const headLines = lines.map((line, i) => textLine(x, L.headY + i * L.headGap, line, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: fitDisplaySize(line, L.headSize, 30, L.headBudget, 0.79), weight: 400 })).join("");

  const deLine = priceFrom
    ? textLine(x, L.deY, `De ${formatMoneyLike(priceFrom)}`, { anchor: "start", fill: GOLD_LIGHT, family: "Poppins", size: L.deSize, weight: 600, decoration: "line-through" })
    : "";
  const porSize = fitDisplaySize(`Por ${priceTo}`, L.porSize, Math.round(L.porSize * 0.6), L.cta[2] + 80, 0.84);
  const porLine = `<text x="${x}" y="${L.porY}" text-anchor="start" font-family="Poppins" font-size="${porSize}" font-weight="800"><tspan fill="#FFFFFF">Por </tspan><tspan fill="${GOLD_LIGHT}">${esc(priceTo)}</tspan></text>`;

  const bulletRows = bullets.map((item, i) => {
    const by = L.bulletsY + i * L.bulletStep;
    return `${heroChecklistBadge(x, by - Math.round(L.bulletSize * 0.35 + L.badge / 2), L.badge)}
    ${textLine(L.bulletX, by, compactText(item, L.bulletChars), { anchor: "start", fill: "#FAFAF8", family: "Poppins", size: L.bulletSize, weight: 500 })}`;
  }).join("");

  // CTA pill CLARA (fundo off-white, texto navy) — fiel à referência.
  const [ctaX, ctaY, ctaW, ctaH, ctaRx] = L.cta;
  const ctaSize = fitDisplaySize(compactText(asset.cta || "Clique abaixo e saiba mais", 40), L.ctaSize, 14, ctaW - Math.round(ctaH * 0.9), 0.90);
  const ctaText = compactText(asset.cta || "Clique abaixo e saiba mais", 40);
  const ctaBlock = `<rect x="${ctaX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaRx}" fill="${OFF_WHITE}"/>
  ${textLine(ctaX + ctaW / 2, ctaY + ctaH / 2 + Math.round(ctaSize * 0.36), ctaText, { fill: "#0A1628", family: "Poppins", size: ctaSize, weight: 700 })}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="${OFF_WHITE}"/>
  ${panel}
  ${gallery}
  <svg x="${L.wm[0]}" y="${L.wm[1]}" width="${L.wm[2]}" height="${Math.round(L.wm[2] * 25 / 136)}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>
  ${headLines}
  ${deLine}
  ${porLine}
  ${bulletRows}
  ${ctaBlock}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

// ===== Template 10: Oportunidade no bairro (foto aérea + blocos navy + galeria emoldurada) =====
// Conceito (referência do cliente): foto full-bleed + coluna de blocos navy à esquerda (eyebrow + headline
// do bairro + caixa de preço + barra de subtítulo + painel de checklist com selos) e, à direita, galeria de
// 3 fotos em moldura navy + wordmark em caixa navy no topo. Checks adaptados ao dourado do brandbook (a
// referência usa verde, fora da paleta). Composição própria por formato + safe zone do Meta.
function buildVitraOportunidadeSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;

  const eyebrow = compactText((pd.tagline || "Oportunidade").toString().toUpperCase(), 22);
  const headline = (asset.headline || pd.suggested_headline || campaign?.neighborhood || brandProfile.fallbackHeadline).toString().toUpperCase();
  const price = (formatMoneyLike(pd.price || campaign?.offer || "") || "CONSULTE").toUpperCase();
  const subtitle = compactText((pd.area || pd.suites || "").toString().toUpperCase(), 34);
  const bullets = heroChecklistBullets(pd, campaign, isWide ? 4 : 6);

  const L = isStory ? {
    wmBox: [770, 296, 250, 78], gallery: [636, 360, [430, 754, 1078], 300, 16], frameOff: 22,
    eyeX: 90, eyeY: 322, eyeSize: 28,
    headX: 90, headY: 430, headGap: 96, headSize: 104, headBudget: 600,
    priceBox: [74, 654, 470, 112, 6], priceX: 100, priceY: 730, priceSize: 70,
    // Largura alinhada a caixa de preco e ao checklist (470) — antes 580 saia da coluna e invadia a galeria.
    subBox: [74, 786, 470, 76, 6], subX: 100, subY: 838, subSize: 36,
    listBox: [74, 884, 470, 470, 8], listX: 156, listY: 952, listStep: 74, listSize: 36, badge: 38,
  } : isWide ? {
    // Caixa do wordmark recolocada na propria faixa, ACIMA da galeria (antes [902,70,210,64] sobrepunha a
    // 1a foto e estourava a margem direita). Galeria desce e encolhe para abrir a faixa do logo.
    wmBox: [858, 60, 238, 62], gallery: [858, 238, [136, 276, 416], 128, 12], frameOff: 14,
    eyeX: 92, eyeY: 100, eyeSize: 16,
    headX: 92, headY: 156, headGap: 50, headSize: 46, headBudget: 560,
    priceBox: [90, 252, 280, 66, 5], priceX: 110, priceY: 296, priceSize: 40,
    subBox: [90, 328, 400, 48, 5], subX: 108, subY: 360, subSize: 22,
    listBox: [90, 386, 380, 180, 6], listX: 144, listY: 420, listStep: 40, listSize: 18, badge: 22,
  } : {
    wmBox: [792, 72, 226, 74], gallery: [640, 366, [160, 452, 744], 276, 16], frameOff: 20,
    eyeX: 82, eyeY: 130, eyeSize: 28,
    headX: 82, headY: 214, headGap: 86, headSize: 92, headBudget: 500,
    priceBox: [64, 382, 432, 98, 6], priceX: 90, priceY: 450, priceSize: 64,
    subBox: [64, 498, 540, 68, 6], subX: 90, subY: 543, subSize: 32,
    listBox: [64, 584, 432, 388, 8], listX: 132, listY: 646, listStep: 56, listSize: 31, badge: 34,
  };

  const [gx, gw, gysAny, gh, grx] = L.gallery as [number, number, number[], number, number];
  const gys = gysAny as unknown as number[];
  const galClips = gys.map((gy, i) => `<clipPath id="${idBase}-g${i}"><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${grx}" ry="${grx}"/></clipPath>`).join("");
  const photoDefs = `<linearGradient id="${idBase}-nb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#13294C"/><stop offset="100%" stop-color="#0A1628"/></linearGradient>` + galClips;

  const heroLayer = images[0]
    ? `<image href="${esc(images[0])}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>`;

  // Galeria emoldurada à direita: moldura navy (offset) + 3 fotos por cima + caixa navy do wordmark.
  const frameRect = `<rect x="${gx + L.frameOff}" y="${gys[0] + L.frameOff}" width="${gw}" height="${gys[gys.length - 1] + gh - gys[0]}" fill="url(#${idBase}-nb)"/>`;
  const gallery = gys.map((gy, i) => duoSelosPhoto(images[i + 1] || images[0], `${idBase}-g${i}`, gx, gy, gw, gh, grx)).join("");
  const [wmbX, wmbY, wmbW, wmbH] = L.wmBox;
  const wmInner = Math.round(wmbW * 0.62);
  const wmBox = `<rect x="${wmbX}" y="${wmbY}" width="${wmbW}" height="${wmbH}" fill="url(#${idBase}-nb)"/>
    <svg x="${wmbX + Math.round((wmbW - wmInner) / 2)}" y="${wmbY + Math.round((wmbH - wmInner * 25 / 136) / 2)}" width="${wmInner}" height="${Math.round(wmInner * 25 / 136)}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>`;

  // Coluna de blocos navy à esquerda.
  const eyebrowLine = textLine(L.eyeX, L.eyeY, eyebrow, { anchor: "start", fill: "#FFFFFF", family: "Inter, Arial, sans-serif", size: L.eyeSize, weight: 700, spacing: Math.round(L.eyeSize * 0.42) });
  const lines = wrapText(headline, isWide ? 14 : 9, 2);
  const headLines = lines.map((line, i) => textLine(L.headX, L.headY + i * L.headGap, line, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: fitDisplaySize(line, L.headSize, 34, L.headBudget, 0.79), weight: 400 })).join("");

  const [pbx, pby, pbw, pbh, pbrx] = L.priceBox;
  const priceBlock = `<rect x="${pbx}" y="${pby}" width="${pbw}" height="${pbh}" rx="${pbrx}" fill="url(#${idBase}-nb)"/>
    ${textLine(L.priceX, L.priceY, price, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: fitDisplaySize(price, L.priceSize, 30, pbw - 48, 0.79), weight: 400 })}`;

  const [sbx, sby, sbw, sbh, sbrx] = L.subBox;
  const subBlock = subtitle
    ? `<rect x="${sbx}" y="${sby}" width="${sbw}" height="${sbh}" rx="${sbrx}" fill="url(#${idBase}-nb)"/>
       ${textLine(L.subX, L.subY, subtitle, { anchor: "start", fill: "#FFFFFF", family: "Inter, Arial, sans-serif", size: fitDisplaySize(subtitle, L.subSize, 16, sbw - 48, 0.84), weight: 800, spacing: 1 })}`
    : "";

  const [lbx, lby, lbw, lbh, lbrx] = L.listBox;
  const listBlock = `<rect x="${lbx}" y="${lby}" width="${lbw}" height="${lbh}" rx="${lbrx}" fill="url(#${idBase}-nb)"/>
    ${bullets.map((item, i) => {
      const by = L.listY + i * L.listStep;
      return `${heroChecklistBadge(lbx + Math.round(L.listSize * 0.5), by - Math.round(L.listSize * 0.35 + L.badge / 2), L.badge)}
      ${textLine(L.listX, by, compactText(item, isWide ? 22 : 18), { anchor: "start", fill: "#FAFAF8", family: "Inter, Arial, sans-serif", size: L.listSize, weight: 600 })}`;
    }).join("")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  ${heroLayer}
  <rect width="${W}" height="${H}" fill="#07111F" opacity="0.18"/>
  ${frameRect}
  ${gallery}
  ${wmBox}
  ${eyebrowLine}
  ${headLines}
  ${priceBlock}
  ${subBlock}
  ${listBlock}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

// ===== Template 11: Ficha do imóvel (fundo sólido navy + cards de atributo com ícones + galeria) =====
// Conceito (referência do cliente, marca concorrente — NÃO copiar logo/contatos): fundo de cor sólida da
// marca + logo/headline/subtítulo no topo-esquerda + cards de atributo (ícone em tile branco + barra navy
// com o texto) + card de preço + galeria de 3 fotos à direita + rodapé de contato/CTA. Adaptado ao brandbook
// Vitra Imobiliária (navy + dourado, wordmark VITRA, preço em dourado). Composição própria por formato.
function fichaIconKind(text: string) {
  const t = String(text || "").toLowerCase();
  if (/su[ií]te|dorm|quarto|cama|leito/.test(t)) return "bed";
  if (/vaga|garag|carro|autom|estacion/.test(t)) return "car";
  if (/piscina|pool|aquec|spa|hidro/.test(t)) return "pool";
  if (/m²|m2|metr|área|area|priv|amplo|tamanho|terreno/.test(t)) return "ruler";
  if (/bairro|local|endere|regi[aã]o|condom|cond\.|vista/.test(t)) return "pin";
  if (/churrasq|gourmet|espa[çc]o|lazer|sal[aã]o|festa/.test(t)) return "grill";
  return "check";
}
function fichaIconSvg(kind: string, x: number, y: number, size: number, color: string) {
  const s = (size / 24).toFixed(3);
  const P: Record<string, string> = {
    bed: `<path d="M2 5v14"/><path d="M2 11h18a2 2 0 0 1 2 2v6"/><path d="M2 16h20"/><path d="M6 11V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>`,
    car: `<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3v-5l2-5h9l3 5h2a1 1 0 0 1 1 1v4h-2"/><path d="M9 17h6"/>`,
    pool: `<path d="M2 7c1 .8 2.3.8 3.3 0s2.3-.8 3.4 0 2.3.8 3.3 0 2.3-.8 3.4 0 2.3.8 3.3 0"/><path d="M2 13c1 .8 2.3.8 3.3 0s2.3-.8 3.4 0 2.3.8 3.3 0 2.3-.8 3.4 0 2.3.8 3.3 0"/><path d="M2 19c1 .8 2.3.8 3.3 0s2.3-.8 3.4 0 2.3.8 3.3 0 2.3-.8 3.4 0 2.3.8 3.3 0"/>`,
    ruler: `<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h3M3 15h3M9 3v3M15 3v3"/>`,
    pin: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>`,
    grill: `<circle cx="12" cy="9" r="6"/><path d="M9 14.5 7 21M15 14.5 17 21M8 9h8"/>`,
    check: `<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>`,
  };
  return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[kind] || P.check}</g>`;
}
function buildVitraFichaSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;

  const headline = (asset.headline || pd.suggested_headline || pd.product_name || campaign?.name || brandProfile.fallbackHeadline).toString();
  const subtitle = (pd.location || pd.address || campaign?.neighborhood || "").toString();
  const price = formatMoneyLike(pd.price || campaign?.offer || "") || "Consulte";
  const features = String(pd.differentials || pd.features || "")
    .split(/[\n;|]+/).map((s) => s.replace(/^[-•\s]+/, "").trim()).filter(Boolean).slice(0, 4);
  const cta = (asset.cta || pd.cta || "Entre em contato para agendar uma visita!").toString();

  const NAVY = "#0A1628";
  const BAR = "#13294C";

  const L = isStory ? {
    logo: [80, 292, 168], head: [80, 470, 96], sub: [80, 548, 52, 60, 22, 2],
    feat: { tileX: 80, tileY0: 690, tileSize: 100, rowGap: 18, barX: 196, barW: 392, barH: 100, textX: 226, textSize: 32, iconSize: 50 },
    price: [80, 1232, 508, 134, 26, 102],
    gallery: [628, 412, [470, 778, 1086], 296, 22],
    footer: { y: 1418, pad: 80, ctaSize: 30, lh: 40 },
  } : isWide ? {
    logo: [72, 60, 150], head: [72, 156, 56], sub: [72, 206, 30, 36, 22, 2],
    feat: { tileX: 72, tileY0: 280, tileSize: 60, rowGap: 12, barX: 142, barW: 300, barH: 60, textX: 166, textSize: 22, iconSize: 32 },
    price: [466, 274, 348, 92, 16, 66],
    gallery: [836, 268, [64, 252, 440], 178, 16],
    footer: null,
  } : {
    logo: [72, 72, 158], head: [72, 200, 76], sub: [72, 256, 44, 52, 22, 2],
    feat: { tileX: 72, tileY0: 372, tileSize: 76, rowGap: 16, barX: 160, barW: 426, barH: 76, textX: 188, textSize: 28, iconSize: 40 },
    price: [72, 748, 514, 116, 20, 92],
    gallery: [624, 384, [72, 372, 672], 284, 22],
    footer: { y: 996, pad: 72, ctaSize: 25, lh: 33 },
  };

  // BG sólido navy (gradiente sutil).
  const bg = `<defs><linearGradient id="${idBase}-fbg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#0E1D38"/><stop offset="100%" stop-color="#0A1628"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-fbg)"/>`;

  // Galeria à direita (3 fotos arredondadas).
  const [gx, gw, gysAny, gh, grx] = L.gallery as [number, number, number[], number, number];
  const gys = gysAny as unknown as number[];
  const galDefs = gys.map((gy, i) => `<clipPath id="${idBase}-fg${i}"><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${grx}" ry="${grx}"/></clipPath>`).join("");
  const gallery = gys.map((gy, i) => duoSelosPhoto(images[i] || images[0], `${idBase}-fg${i}`, gx, gy, gw, gh, grx)).join("");

  // Logo VITRA branco.
  const [lgX, lgY, lgW] = L.logo;
  const logo = `<svg x="${lgX}" y="${lgY}" width="${lgW}" height="${Math.round(lgW * 25 / 136)}" viewBox="133 26 136 25">${VITRA_WORDMARK_WHITE}</svg>`;

  // Headline (Poppins 700) + subtítulo (Poppins 500, ate 2 linhas).
  const [hX, hY, hSize] = L.head;
  const headLine = textLine(hX, hY, compactText(headline, 18), { anchor: "start", fill: "#FFFFFF", family: "Poppins", size: fitDisplaySize(headline, hSize, 30, (isWide ? 360 : isStory ? 520 : 480), 0.84), weight: 700 });
  const [sX, sY, sSize, sLh, sMax, sLines] = L.sub as [number, number, number, number, number, number];
  const subLines = subtitle ? wrapText(subtitle, sMax, sLines).map((ln, i) => textLine(sX, sY + i * sLh, ln, { anchor: "start", fill: "#E8ECF4", family: "Poppins", size: sSize, weight: 500 })).join("") : "";

  // Cards de atributo: tile branco com ícone navy + barra navy com o texto.
  const f = L.feat;
  const featRows = features.map((item, i) => {
    const ty = f.tileY0 + i * (f.tileSize + f.rowGap);
    const kind = fichaIconKind(item);
    const ic = Math.round((f.tileSize - f.iconSize) / 2);
    const tLines = wrapText(item, 18, 2);
    const textBlockY = ty + f.barH / 2 - (tLines.length - 1) * (f.textSize * 0.58) + f.textSize * 0.34;
    const txt = tLines.map((ln, k) => textLine(f.textX, textBlockY + k * (f.textSize * 1.16), ln, { anchor: "start", fill: "#FFFFFF", family: "Poppins", size: f.textSize, weight: 600 })).join("");
    return `<rect x="${f.barX}" y="${ty}" width="${f.barW}" height="${f.barH}" rx="${Math.round(f.barH * 0.26)}" fill="${BAR}"/>
      <rect x="${f.tileX}" y="${ty}" width="${f.tileSize}" height="${f.tileSize}" rx="${Math.round(f.tileSize * 0.26)}" fill="#FFFFFF"/>
      ${fichaIconSvg(kind, f.tileX + ic, ty + ic, f.iconSize, NAVY)}
      ${txt}`;
  }).join("");

  // Card de preço (branco, valor em dourado) — ocupa a largura da coluna; o valor preenche o card sem
  // estourar. Fator conservador (1.0) + padding maior: o estimador (Inter caixa-alta) subdimensiona o
  // Poppins nesse corpo grande, entao orçamos com folga para o valor caber dentro do retângulo.
  const [pX, pY, pW, pH, pRx, pSize] = L.price;
  const pFit = fitDisplaySize(price, pSize, 24, pW - 72, 1.0);
  const priceCard = `<rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" rx="${pRx}" fill="#FFFFFF"/>
    ${textLine(pX + Math.round(pW * 0.5), pY + pH / 2 + Math.round(pFit * 0.34), price, { fill: GOLD, family: "Poppins", size: pFit, weight: 700 })}`;

  // Rodapé: só o CTA (esq.). Omitido no wide.
  let footer = "";
  if (L.footer) {
    const ft = L.footer;
    footer = wrapText(cta, 30, 2).map((ln, i) => textLine(ft.pad, ft.y + i * ft.lh, ln, { anchor: "start", fill: "#FFFFFF", family: "Poppins", size: ft.ctaSize, weight: 600 })).join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${galDefs}</defs>
  ${bg}
  ${gallery}
  ${logo}
  ${headLine}
  ${subLines}
  ${featRows}
  ${priceCard}
  ${footer}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

// ===== Template 12: oferta-ancora (preco-ancora em destaque) =====
// Referencia: oferta "2 DORM Av. Ipiranga" (foto do predio + veu navy; logo VITRA centralizada no
// topo; headline forte; barra BRANCA de caracteristicas; "De" riscado; "Por" num BOX de borda
// DOURADA como heroi da peca; rodape de localizacao/proximidade). Sem checklist vertical, sem
// CTA-botao, sem galeria — a oferta De/Por e o protagonista. Cada formato tem composicao propria com
// a SAFE ZONE do Meta: 1:1 [margem 90]; 9:16 reels-safe y[250..1470]; 1.91:1 (1200x628) x[89..1111].
function ofertaBox(x: number, y: number, w: number, h: number, label: string, value: string, valueSize: number, labelSize: number) {
  // Box de borda dourada com fill navy translucido (faz o valor branco "saltar" sobre a foto).
  const padL = Math.round(h * 0.42);
  const cy = y + Math.round(h / 2) + Math.round(valueSize * 0.34);
  const labelY = y + Math.round(h / 2) + Math.round(labelSize * 0.34);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(h * 0.12)}" fill="#07111F" fill-opacity="0.34" stroke="${GOLD}" stroke-width="${Math.max(2.5, Math.round(h * 0.028))}"/>
  ${textLine(x + padL, labelY, label, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: labelSize, weight: 400 })}
  ${textLine(x + padL + Math.round(labelSize * (label.length * 0.62)), cy, value, { anchor: "start", fill: "#FFFFFF", family: "Anton", size: valueSize, weight: 400 })}`;
}

function buildVitraOfertaAncoraSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string, out?: { lint?: ReturnType<typeof lintCreative> }) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const hero = images[0] || null;

  // Headline sem preco (o box De/Por ja exibe a oferta) — evita duplicar o valor.
  let headlineSource = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString();
  if (isPriceLikeHeadline(headlineSource)) headlineSource = heroBenefitHeadline(pd, campaign, brandProfile);
  const headlineRaw = headlineSource.toUpperCase();

  // Barra branca de caracteristicas: ate 3 diferenciais juntados por " | " (CAIXA ALTA).
  const feats = heroChecklistBullets(pd, campaign, 3).map((s) => String(s).toUpperCase());
  const featureBar = feats.join("   |   ");

  // Preco De/Por.
  const parts = priceParts(pd.price || campaign?.offer || "");
  const priceFrom = String(pd.price_from || parts.from || "").replace(/^de\s*:?\s*/i, "").trim();
  const priceTo = formatMoneyLike(parts.to || pd.price || "") || "Consulte";

  // Rodape: localizacao/proximidade (ou subtitulo/CTA como fallback).
  const footerRaw = (pd.location || asset.subtitle || [campaign?.neighborhood, campaign?.city].filter(Boolean).join(" · ") || asset.cta || "").toString();
  const footer = compactText(footerRaw, 52).toUpperCase();

  const L = isStory ? {
    margin: 90, logoW: 184, logoY: 196,
    headBase: 80, headGap: 86, headY: 452, headBudget: 900, headChars: 15,
    bar: [90, 638, 900, 70], barSize: 28,
    deY: 812, deSize: 36,
    box: [90, 868, 900, 196], boxLabel: 46, boxValue: 96,
    footY: 1140, footSize: 30,
  } : isWide ? {
    // 1.91:1 alinhado à SAFE ZONE real do Meta (x≥89), não mais x=72 (flagrado pelo Creative Lint).
    margin: 89, logoW: 150, logoY: 52,
    headBase: 48, headGap: 52, headY: 150, headBudget: 1022, headChars: 26,
    bar: [89, 250, 1022, 52], barSize: 21,
    deY: 348, deSize: 24,
    box: [89, 380, 1022, 116], boxLabel: 30, boxValue: 60,
    footY: 540, footSize: 22,
  } : {
    margin: 90, logoW: 170, logoY: 70,
    headBase: 82, headGap: 88, headY: 270, headBudget: 900, headChars: 15,
    bar: [90, 392, 900, 70], barSize: 28,
    deY: 580, deSize: 36,
    box: [90, 640, 900, 188], boxLabel: 46, boxValue: 92,
    footY: 930, footSize: 30,
  };

  const x = L.margin;
  const cx = Math.round(W / 2);
  const F = formatSpec(W, H);
  // Imagem dirigida (DS P1): grade navy + enquadramento por foco.
  const photoLayer = dsImageLayer(hero, W, H, idBase, F.kind, { grade: true });

  // Logo oficial VITRA (PNG branco) centralizada no topo.
  const logoX = cx - Math.round(L.logoW / 2);
  const logoH = Math.round(L.logoW * 434 / 2538);
  const logoMarkup = `<image href="${VITRA_WORDMARK_WHITE_PNG}" x="${logoX}" y="${L.logoY}" width="${L.logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`;

  // Headline (Anton, branca, alinhada a esquerda).
  const headLines = wrapText(headlineRaw, L.headChars, 2);
  const headMarkup = headLines.map((line, i) => {
    const size = fitDisplaySize(line, L.headBase, Math.round(L.headBase * 0.5), L.headBudget, 0.79);
    return textLine(x, L.headY + i * L.headGap, line, { anchor: "start", fill: "#FFFFFF", family: "Anton", size, weight: 400 });
  }).join("");

  // Barra branca de caracteristicas.
  const [barX, barY, barW, barH] = L.bar;
  const barTextY = barY + Math.round(barH / 2) + Math.round(L.barSize * 0.35);
  const barSize = featureBar ? fitDisplaySize(featureBar, L.barSize, 14, barW - 56, 0.9) : L.barSize;
  const barMarkup = featureBar
    ? `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="10" fill="#F5F5F0"/>
    ${textLine(cx, barTextY, featureBar, { anchor: "middle", fill: "#0A1628", family: "Inter", size: barSize, weight: 800 })}`
    : "";

  // "De" riscado (centralizado).
  const deMarkup = priceFrom
    ? `<text x="${cx}" y="${L.deY}" text-anchor="middle" font-family="Inter" font-size="${L.deSize}" font-weight="800" letter-spacing="1"><tspan fill="rgba(255,255,255,0.80)">DE: </tspan><tspan fill="rgba(255,255,255,0.80)" text-decoration="line-through">${esc(formatMoneyLike(priceFrom))}</tspan></text>`
    : "";

  // Box dourado com "POR: <valor>" (heroi da peca).
  const [boxX, boxY, boxW, boxH] = L.box;
  const valueText = esc(priceTo);
  const valueSize = fitDisplaySize(`POR: ${valueText}`, L.boxValue, Math.round(L.boxValue * 0.5), boxW - Math.round(boxH * 0.42) * 2 - Math.round(L.boxLabel * 2.6), 0.79);
  const boxMarkup = ofertaBox(boxX, boxY, boxW, boxH, "POR:", valueText, valueSize, L.boxLabel);

  // Rodape (localizacao / proximidade).
  const footMarkup = footer
    ? textLine(cx, L.footY, footer, { anchor: "middle", fill: "rgba(255,255,255,0.78)", family: "Inter", size: L.footSize, weight: 800 })
    : "";

  // ---- Creative Lint (P1): o gate agora cobre também o oferta-ancora. É um template de DOIS FOCOS
  // (headline em cima + preço-âncora embaixo), então NÃO aplica a regra de herói único; valida
  // safe-zone, colisão, overflow e limite de caracteres. ----
  if (out) {
    const headSize0 = headLines.length ? fitDisplaySize(headLines[0], L.headBase, Math.round(L.headBase * 0.5), L.headBudget, 0.79) : L.headBase;
    const els: LintElement[] = [
      { role: "headline", box: { x, y: L.headY - Math.round(headSize0 * 0.8), w: L.headBudget, h: headLines.length * L.headGap }, critical: true, block: true, charLen: headlineRaw.length, charLimit: 40 },
      { role: "bar", box: { x: barX, y: barY, w: barW, h: barH }, critical: true, block: true },
      { role: "pricebox", box: { x: boxX, y: boxY, w: boxW, h: boxH }, critical: true, block: true, fontSize: valueSize, minFont: Math.round(L.boxValue * 0.5) },
      { role: "footnote", box: { x: cx - Math.round((footer.length * L.footSize * 0.5) / 2), y: L.footY - L.footSize, w: Math.round(footer.length * L.footSize * 0.5), h: L.footSize + 6 }, critical: true },
    ];
    out.lint = lintCreative(F.safe, els);
    if (!out.lint.ok) console.warn(`[creativeLint] oferta-ancora ${F.kind}: ${out.lint.errors.join(", ")}`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="${idBase}-bg" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stop-color="#11264A"/>
      <stop offset="64%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#050C16"/>
    </radialGradient>
    <linearGradient id="${idBase}-veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A1628" stop-opacity="0.78"/>
      <stop offset="42%" stop-color="#0A1628" stop-opacity="0.52"/>
      <stop offset="100%" stop-color="#07111F" stop-opacity="0.80"/>
    </linearGradient>
  </defs>
  ${photoLayer}
  <rect width="${W}" height="${H}" fill="#0A1628" opacity="0.34"/>
  <rect width="${W}" height="${H}" fill="url(#${idBase}-veil)"/>
  ${logoMarkup}
  ${headMarkup}
  ${barMarkup}
  ${deMarkup}
  ${boxMarkup}
  ${footMarkup}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

// ===== Template 13: destino-bairro (poster de bairro + condicoes) =====
// Referencia (outro segmento, viagens): nome do DESTINO gigante como heroi, subtitulo de lifestyle,
// painel "glass" com 2 condicoes lado a lado, botao-pilula com seta e rodape "*consulte condicoes",
// sobre foto do destino com gradiente da marca no topo. ADAPTADO ao IMOBILIARIO: o "destino" vira o
// BAIRRO/regiao (a localizacao e o heroi); as condicoes da cia aerea viram condicoes do IMOVEL
// (financiamento/oferta); o aviao e removido; azul -> navy + dourado; logo VITRA. Cada formato tem
// composicao propria + SAFE ZONE do Meta (1:1/9:16 centrados com foto-horizonte na base; 1.91:1 com
// coluna de conteudo a esquerda e foto a direita).
function destinoSplitHighlight(text: string): { big: string; rest: string } {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return { big: "", rest: "" };
  const m = t.match(/^((?:at[eé]|de)\s+)?(R\$\s?[\d.,]+(?:\s?\/\s?m[eê]s)?|\d+\s?x|\d+\s?%|\d+)/i);
  if (m) return { big: m[0].replace(/\s+/g, " ").trim(), rest: t.slice(m[0].length).trim() };
  const parts = t.split(" ");
  return parts.length > 2 ? { big: parts.slice(0, 2).join(" "), rest: parts.slice(2).join(" ") } : { big: t, rest: "" };
}

function destinoConditionColumn(cx: number, topY: number, w: number, raw: string, bigSize: number, restSize: number, restChars: number) {
  const { big, rest } = destinoSplitHighlight(raw);
  const bigFit = fitDisplaySize(big, bigSize, Math.round(bigSize * 0.5), w - 24, 0.79);
  const restLines = rest ? wrapText(rest, restChars, 2) : [];
  const bigLine = textLine(cx, topY, big, { anchor: "middle", fill: GOLD_LIGHT, family: "Anton", size: bigFit, weight: 400 });
  const restMarkup = restLines.map((line, i) => textLine(cx, topY + Math.round(bigFit * 0.5) + 8 + i * (restSize + 6), line, { anchor: "middle", fill: "rgba(255,255,255,0.86)", family: "Inter", size: restSize, weight: 600 })).join("");
  return bigLine + restMarkup;
}

function destinoCtaPill(x: number, y: number, w: number, h: number, label: string, size: number) {
  const r = Math.round(h / 2);
  const cyc = y + Math.round(h / 2);
  const circR = Math.round(h * 0.33);
  const circX = x + Math.round(h * 0.5);
  const a = Math.round(circR * 0.52);
  const sw = Math.max(2.4, Math.round(h * 0.05));
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#FFFFFF"/>
  <circle cx="${circX}" cy="${cyc}" r="${circR}" fill="#0A1628"/>
  <path d="M ${circX - a} ${cyc} H ${circX + a} M ${circX + a - Math.round(a * 0.7)} ${cyc - Math.round(a * 0.7)} L ${circX + a} ${cyc} L ${circX + a - Math.round(a * 0.7)} ${cyc + Math.round(a * 0.7)}" stroke="#FFFFFF" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${textLine(circX + circR + Math.round(h * 0.40), cyc + Math.round(size * 0.35), label, { anchor: "start", fill: "#0A1628", family: "Inter", size, weight: 800 })}`;
}

function buildVitraDestinoBairroSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string, out?: { lint?: ReturnType<typeof lintCreative> }) {
  const pd = { ...(campaign?.brief?.product_data ?? {}), ...(asset?.metadata?.product_data ?? {}) };
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const hero = images[0] || null;

  // Heroi = BAIRRO / regiao (a localizacao e o protagonista).
  const place = String(pd.location || pd.neighborhood || campaign?.neighborhood || campaign?.city || "Seu novo endereço").trim();
  const placeRaw = place.toUpperCase();
  // Subtitulo = linha de lifestyle / beneficio.
  const subtitle = compactText((asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString(), 88);
  // Painel de condicoes (2 colunas). Deriva de campos dedicados ou cai para preco/financiamento.
  const panelTitle = compactText((pd.panel_title || "Condições exclusivas:").toString(), 40).toUpperCase();
  const cond1 = compactText((pd.condition_primary || pd.financing_claim || (pd.price ? `A partir de ${formatMoneyLike(pd.price)}` : "Condições facilitadas")).toString(), 40);
  const cond2 = compactText((pd.condition_secondary || pd.condo_argument || "").toString(), 40);
  const cta = compactText((asset.cta || "Agende sua visita").toString(), 26);
  const tag = compactText((pd.tag || "").toString(), 22).toUpperCase();

  // Design System (P0): safe-zone real do formato vinda da fonte única.
  const F = formatSpec(W, H);

  const L = isStory ? {
    cx: 540, margin: 90, anchor: "middle" as const, contentX: 540,
    logoW: 168, logoY: 206, logoCenter: true,
    heroY: 470, heroBase: 168, heroBudget: 900,
    subY: 588, subSize: 32, subChars: 40, subGap: 42,
    panel: [90, 690, 900, 248], panelTitleSize: 24, condBig: 60, condRest: 22, condRestChars: 22,
    cta: [330, 1196, 420, 92], ctaSize: 30, footY: 1320, footSize: 24, veil: "v",
  } : isWide ? {
    // 1.91:1 alinhado à SAFE ZONE real do Meta (x≥89), não mais x=72.
    cx: 600, margin: 89, anchor: "start" as const, contentX: 89,
    logoW: 138, logoY: 66, logoCenter: false,
    heroY: 180, heroBase: 92, heroBudget: 640,
    subY: 236, subSize: 22, subChars: 44, subGap: 30,
    panel: [89, 282, 660, 158], panelTitleSize: 17, condBig: 38, condRest: 15, condRestChars: 18,
    cta: [89, 452, 320, 64], ctaSize: 21, footY: 540, footSize: 16, veil: "h",
  } : {
    cx: 540, margin: 90, anchor: "middle" as const, contentX: 540,
    logoW: 156, logoY: 66, logoCenter: true,
    heroY: 286, heroBase: 152, heroBudget: 900,
    subY: 360, subSize: 29, subChars: 40, subGap: 38,
    panel: [90, 432, 900, 210], panelTitleSize: 22, condBig: 54, condRest: 20, condRestChars: 22,
    cta: [330, 686, 420, 80], ctaSize: 28, footY: 800, footSize: 22, veil: "v",
  };

  // Imagem dirigida (DS P1): grade navy + enquadramento por foco (story = topo do prédio).
  const photoLayer = dsImageLayer(hero, W, H, idBase, F.kind, { grade: true });

  // Logo VITRA oficial (PNG branco) — centralizada (1:1/9:16) ou a esquerda (1.91:1).
  const logoX = L.logoCenter ? L.cx - Math.round(L.logoW / 2) : L.margin;
  const logoH = Math.round(L.logoW * 434 / 2538);
  const logoMarkup = `<image href="${VITRA_WORDMARK_WHITE_PNG}" x="${logoX}" y="${L.logoY}" width="${L.logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`;

  // Tag/selo opcional (pílula dourada) — num CANTO superior, fora da faixa do herói (sem colisão):
  // canto esquerdo nos formatos centrados (logo no centro); canto direito no 1.91:1 (logo à esquerda).
  const tagFs = isWide ? 11 : 13;
  const tagH = isWide ? 26 : 34;
  const tagW = tag ? Math.round(tag.length * tagFs * 0.64 + 30) : 0;
  const tagX = isWide ? (W - L.margin - tagW) : L.margin;
  const tagY = L.logoY;
  const tagMarkup = tag
    ? `<rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}" rx="${Math.round(tagH / 2)}" fill="${DS_COLORS.gold}"/>
      ${textLine(tagX + Math.round(tagW / 2), tagY + Math.round(tagH / 2) + Math.round(tagFs * 0.35), tag, { anchor: "middle", fill: DS_COLORS.ink, family: "Inter", size: tagFs, weight: 800 })}`
    : "";

  // Heroi (bairro) — Anton, branco, gigante, 1 linha (encolhe p/ caber).
  const heroSize = fitDisplaySize(placeRaw, L.heroBase, Math.round(L.heroBase * 0.42), L.heroBudget, 0.79);
  const heroMarkup = textLine(L.contentX, L.heroY, placeRaw, { anchor: L.anchor, fill: "#FFFFFF", family: "Anton", size: heroSize, weight: 400 });
  // Régua dourada de acento sob o herói.
  const ruleW = Math.round(Math.min(L.heroBudget, placeRaw.length * heroSize * 0.5) * 0.36);
  const ruleX = L.anchor === "middle" ? L.cx - Math.round(ruleW / 2) : L.margin;
  const ruleMarkup = `<rect x="${ruleX}" y="${L.heroY + Math.round(heroSize * 0.18)}" width="${ruleW}" height="${Math.max(3, Math.round(heroSize * 0.045))}" rx="2" fill="${GOLD}"/>`;

  // Subtítulo (lifestyle).
  const subLines = wrapText(subtitle, L.subChars, 2);
  const subMarkup = subLines.map((line, i) => textLine(L.contentX, L.subY + i * L.subGap, line, { anchor: L.anchor, fill: "rgba(255,255,255,0.90)", family: "Inter", size: L.subSize, weight: 500 })).join("");

  // Painel "glass" com as condições.
  const [pX, pY, pW, pH] = L.panel;
  const pTitleY = pY + Math.round(pH * 0.20);
  const colTop = pY + Math.round(pH * 0.52);
  let condBlock = "";
  if (cond2) {
    const dividerX = pX + Math.round(pW / 2);
    condBlock = `<line x1="${dividerX}" y1="${pY + Math.round(pH * 0.34)}" x2="${dividerX}" y2="${pY + pH - Math.round(pH * 0.16)}" stroke="rgba(255,255,255,0.20)" stroke-width="1.4"/>
    ${destinoConditionColumn(pX + Math.round(pW * 0.25), colTop, Math.round(pW * 0.46), cond1, L.condBig, L.condRest, L.condRestChars)}
    ${destinoConditionColumn(pX + Math.round(pW * 0.75), colTop, Math.round(pW * 0.46), cond2, L.condBig, L.condRest, L.condRestChars)}`;
  } else {
    condBlock = destinoConditionColumn(pX + Math.round(pW / 2), colTop, pW - 60, cond1, L.condBig, L.condRest, L.condRestChars + 8);
  }
  // Disciplina de dourado: o título do painel é BRANCO (o dourado fica reservado ao DESTAQUE da oferta).
  const panelMarkup = `<rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" rx="${isWide ? 18 : 26}" fill="${DS_COLORS.navyMid}" fill-opacity="0.62" stroke="rgba(255,255,255,0.14)" stroke-width="1.2"/>
  ${textLine(pX + Math.round(pW / 2), pTitleY, panelTitle, { anchor: "middle", fill: "rgba(255,255,255,0.80)", family: "Inter", size: L.panelTitleSize, weight: 700 })}
  ${condBlock}`;

  // Botão-pílula (CTA).
  const [ctaX, ctaY, ctaW, ctaH] = L.cta;
  const ctaMarkup = destinoCtaPill(ctaX, ctaY, ctaW, ctaH, cta, L.ctaSize);
  // Rodapé "*consulte condições" — sobre a foto, por isso recebe SCRIM (placa controlada) atrás.
  const footTxt = "*Consulte condições.";
  const footX = L.anchor === "middle" ? L.cx : L.margin;
  const footMarkup = textLine(footX, L.footY, footTxt, { anchor: L.anchor, fill: DS_COLORS.textFaint, family: "Inter", size: L.footSize, weight: 500 });

  // SCRIM: spotlight escuro localizado atrás do CTA + rodapé — garante contraste sobre a foto (corrige o
  // rodapé que ficava ilegível). Elipse com gradiente radial (centro escuro -> bordas transparentes).
  const scrimCx = L.anchor === "middle" ? L.cx : (L.margin + Math.round(ctaW / 2) + 70);
  const scrimCy = Math.round((ctaY + L.footY) / 2) + 8;
  const scrimRx = isWide ? 380 : Math.round(W * 0.54);
  const scrimRy = Math.round((L.footY + L.footSize - ctaY) / 2) + 48;
  const scrimDef = `<radialGradient id="${idBase}-scrim" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${DS_COLORS.navyDeep}" stop-opacity="0.66"/>
      <stop offset="56%" stop-color="${DS_COLORS.navyDeep}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${DS_COLORS.navyDeep}" stop-opacity="0"/>
    </radialGradient>`;
  const scrimMarkup = `<ellipse cx="${scrimCx}" cy="${scrimCy}" rx="${scrimRx}" ry="${scrimRy}" fill="url(#${idBase}-scrim)"/>`;

  // ---- Creative Lint (P0): monta o relatório de layout e roda a validação objetiva (loga os erros). ----
  const heroW = Math.min(L.heroBudget, Math.round(placeRaw.length * heroSize * 0.52));
  const heroX = L.anchor === "middle" ? L.cx - Math.round(heroW / 2) : L.margin;
  const subWidest = subLines.reduce((m, s) => Math.max(m, s.length), 1);
  const subW = Math.round(subWidest * L.subSize * 0.52);
  const subX = L.anchor === "middle" ? L.cx - Math.round(subW / 2) : L.margin;
  const footW = Math.round(footTxt.length * L.footSize * 0.5);
  const footBoxX = L.anchor === "middle" ? L.cx - Math.round(footW / 2) : L.margin;
  const lintEls: LintElement[] = [
    { role: "hero", box: { x: heroX, y: L.heroY - Math.round(heroSize * 0.80), w: heroW, h: Math.round(heroSize * 0.92) }, critical: true, block: true, display: true, fontSize: heroSize, minFont: Math.round(L.heroBase * 0.42), charLen: placeRaw.length, charLimit: 18 },
    { role: "subtitle", box: { x: subX, y: L.subY - L.subSize, w: subW, h: subLines.length * L.subGap }, critical: true, block: true, display: true, fontSize: L.subSize, charLen: subtitle.length, charLimit: 88 },
    { role: "panel", box: { x: pX, y: pY, w: pW, h: pH }, critical: true, block: true },
    { role: "cta", box: { x: ctaX, y: ctaY, w: ctaW, h: ctaH }, critical: true, block: true, overImage: true, hasScrim: true },
    { role: "footnote", box: { x: footBoxX, y: L.footY - L.footSize, w: footW, h: L.footSize + 6 }, critical: true, overImage: true, hasScrim: true },
  ];
  if (tag) lintEls.push({ role: "badge", box: { x: tagX, y: tagY, w: tagW, h: tagH }, block: true });
  const lint = lintCreative(F.safe, lintEls);
  if (out) out.lint = lint;
  if (!lint.ok) console.warn(`[creativeLint] destino-bairro ${F.kind}: ${lint.errors.join(", ")}`);

  const veilDef = L.veil === "h"
    ? `<linearGradient id="${idBase}-veil" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0A1628" stop-opacity="0.94"/>
        <stop offset="42%" stop-color="#0A1628" stop-opacity="0.74"/>
        <stop offset="72%" stop-color="#0A1628" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#07111F" stop-opacity="0.04"/>
      </linearGradient>`
    : `<linearGradient id="${idBase}-veil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A1628" stop-opacity="1"/>
        <stop offset="${isStory ? "58%" : "44%"}" stop-color="#0A1628" stop-opacity="1"/>
        <stop offset="${isStory ? "74%" : "64%"}" stop-color="#0A1628" stop-opacity="0"/>
        <stop offset="90%" stop-color="#07111F" stop-opacity="0"/>
        <stop offset="100%" stop-color="#07111F" stop-opacity="0.42"/>
      </linearGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="${idBase}-bg" cx="50%" cy="40%" r="74%">
      <stop offset="0%" stop-color="#11264A"/>
      <stop offset="62%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#050C16"/>
    </radialGradient>
    ${veilDef}
    ${scrimDef}
  </defs>
  ${photoLayer}
  <rect width="${W}" height="${H}" fill="url(#${idBase}-veil)"/>
  ${scrimMarkup}
  ${logoMarkup}
  ${tagMarkup}
  ${heroMarkup}
  ${ruleMarkup}
  ${subMarkup}
  ${panelMarkup}
  ${ctaMarkup}
  ${footMarkup}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

function buildVitraImobiliariaApprovedSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, templateFamily = VITRA_IMOBILIARIA_TEMPLATE_BASE, out?: { lint?: ReturnType<typeof lintCreative> }) {
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
  if (templateFamily === "vitra-imobiliaria-lancamento" || templateFamily === "vitra-premium-lancamento") return buildVitraLancamentoSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-vitrine-gallery") return buildVitraVitrineSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-oportunidade-bairro") return buildVitraOportunidadeSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-ficha-imovel") return buildVitraFichaSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-oferta-ancora") return buildVitraOfertaAncoraSvg(asset, campaign, images, W, H, brandProfile, idBase, out);
  if (templateFamily === "vitra-imobiliaria-destino-bairro") return buildVitraDestinoBairroSvg(asset, campaign, images, W, H, brandProfile, idBase, out);
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
  const useApprovedVitraTemplate = usesDirectSvgTemplate(model, brandProfile);
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
      const maxTemplateImages = templateFamily === "vitra-imobiliaria-hero-checklist" || templateFamily === "vitra-imobiliaria-lancamento" || templateFamily === "vitra-premium-lancamento" || templateFamily === "vitra-imobiliaria-oferta-ancora" || templateFamily === "vitra-imobiliaria-destino-bairro"
        ? 1
        : templateFamily === "vitra-imobiliaria-vitrine-gallery" || templateFamily === "vitra-imobiliaria-oportunidade-bairro"
          ? 4
        : templateFamily === "vitra-imobiliaria-financiamento-orla" || templateFamily === "vitra-imobiliaria-patios-gallery" || templateFamily === "vitra-imobiliaria-hero-panel-gallery" || templateFamily === "vitra-imobiliaria-ficha-imovel"
          ? 3
          : 2;
      for (const url of imageUrls) {
        if (imageData.length >= maxTemplateImages) break;
        const dataUri = await toDataUri(url);
        if (dataUri) imageData.push(dataUri);
      }
      while (imageData.length < maxTemplateImages) imageData.push(imageData[0] || null);
      step = "build_approved_template_svg";
      const lintOut: { lint?: ReturnType<typeof lintCreative> } = {};
      const svg = buildVitraImobiliariaApprovedSvg(asset, campaign, imageData, W, H, brandProfile, templateFamily, lintOut);
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
          ...(lintOut.lint ? { lint: lintOut.lint } : {}),
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
