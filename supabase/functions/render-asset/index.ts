// Edge Function: render-asset (Fase 3) - satori -> SVG -> resvg -> PNG, logo + paleta 100% brandbook
import { createClient } from "jsr:@supabase/supabase-js@2";
import satori from "npm:satori@0.10.13";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { decode as decodeWebp } from "npm:@jsquash/webp@1.5.0";
import { encode as encodePng } from "npm:@jsquash/png@3.1.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GOLD = "#C4942A";        // brandbook --gold
const GOLD_LIGHT = "#F0C95C";  // brandbook --gold-light (kicker)
const OFF_WHITE = "#F5F5F0";   // brandbook --off-white (copy)
const SCALE = 0.55;
const PHASE_TAG: Record<string, string> = { "1": "FASE 1 - TEASER", "2": "FASE 2 - REVELACAO", "3": "FASE 3 - URGENCIA" };
const VITRA_IMOBILIARIA_TEMPLATE_BASE = "vitra-imobiliaria-dual-photo-offer";
const VITRA_IMOBILIARIA_TEMPLATE_FAMILIES = [
  VITRA_IMOBILIARIA_TEMPLATE_BASE,
  "vitra-imobiliaria-patios-gallery",
  "vitra-imobiliaria-financiamento-orla",
  "vitra-imobiliaria-menino-deus-offer",
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
let resvgFontCache: Uint8Array | null = null;
async function loadResvgFont() {
  if (resvgFontCache) return resvgFontCache;
  const r = await fetch("https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/700Bold/Inter_700Bold.ttf");
  resvgFontCache = new Uint8Array(await r.arrayBuffer());
  return resvgFontCache;
}
const DIMS: Record<string, [number, number]> = { "1:1": [1080,1080], "9:16": [1080,1920], "4:5": [1080,1350], "16:9": [1280,720], "1.91:1": [1200,628], "desktop": [1200,630] };

function imageUrlCandidates(url: string): string[] {
  const candidates = [url];
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

function compactText(value: unknown, max = 120) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function wrapText(value: unknown, maxChars: number, maxLines: number) {
  const words = compactText(value, maxChars * maxLines + 20).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
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

function imageUrlsForApprovedTemplate(asset: any, campaign: any) {
  return [...new Set([
    asset?.source_image_url,
    ...metadataImageUrls(asset),
    ...briefImageUrls(campaign),
  ].filter(Boolean).map((url) => String(url)))];
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

function approvedTemplateLayout(ar: string) {
  if (ar === "9:16") {
    return {
      logo: [285, 110, 510, 170],
      headline: [540, 345, 72, 72, 24, 2],
      description: [540, 490, 28, 86],
      price: [260, 515, 560, 58],
      photos: [[135, 650, 810, 420, 54], [135, 1096, 810, 420, 54]],
      features: [[540, 1580, "middle"], [540, 1635, "middle"]],
      cta: [235, 1708, 610, 72, 1760, 28],
      slogan: [540, 1830, 16, 8],
    };
  }
  if (ar === "1.91:1") {
    return {
      logo: [70, 50, 330, 110],
      headline: [335, 205, 54, 55, 24, 2],
      description: [335, 320, 22, 70],
      price: [95, 344, 500, 50],
      photos: [[735, 70, 370, 236, 34], [735, 332, 370, 236, 34]],
      features: [[95, 455, "start"], [95, 498, "start"]],
      cta: [120, 535, 430, 48, 566, 18],
      slogan: null,
    };
  }
  return {
    logo: [360, 78, 360, 120],
    headline: [540, 272, 65, 64, 25, 2],
    description: [540, 374, 24, 82],
    price: [285, 398, 510, 58],
    photos: [[135, 428, 385, 310, 46], [560, 428, 385, 310, 46]],
    features: [[135, 810, "start"], [560, 810, "start"]],
    cta: [300, 852, 480, 64, 895, 21],
    slogan: [540, 948, 13, 7],
  };
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

function buildVitraPatiosGallerySvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = campaign?.brief?.product_data ?? asset?.metadata?.product_data ?? {};
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>
  ${outerFrame(W, H, frame, isWide ? 10 : 22, isStory ? 34 : 20)}
  <svg x="${logo[0]}" y="${logo[1]}" width="${logo[2]}" height="${logo[3]}" viewBox="0 0 300 100">${brandProfile.logo}</svg>
  ${textLine(headX, titleY, headline[0] || "OPORTUNIDADE", { anchor, fill: "#FFFFFF", size: isWide ? 58 : isStory ? 78 : 74, weight: 900 })}
  ${textLine(headX, titleY + (isWide ? 70 : 100), headline[1] || "", { anchor, fill: GOLD_LIGHT, size: isWide ? 61 : isStory ? 82 : 77, weight: 900 })}
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
  const pd = campaign?.brief?.product_data ?? asset?.metadata?.product_data ?? {};
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const headline = wrapText((asset.headline || pd.suggested_headline || campaign?.name || "1DORM E 2DORM JUNTO A NOVA ORLA").toString().toUpperCase(), 22, 2);
  const photos = isStory
    ? [[116, 548, 848, 360, 30], [116, 952, 848, 360, 30]]
    : isWide
      ? [[70, 265, 438, 180, 24], [548, 265, 438, 180, 24]]
      : [[72, 340, 452, 222, 30], [556, 340, 452, 222, 30]];
  const photoDefs = photos.map((p, i) => `<clipPath id="${idBase}-p${i}"><rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="${p[4]}" ry="${p[4]}"/></clipPath>`).join("");
  const logo = isStory ? [334, 86, 392, 92] : isWide ? [54, 96, 178, 42] : [445, 36, 190, 46];
  const price = formatMoneyLike(pd.price || campaign?.offer || "");
  const neighborhood = campaign?.neighborhood || pd.neighborhood || "BAIRRO";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs(idBase, photoDefs)}
  <rect width="${W}" height="${H}" fill="url(#${idBase}-bg)"/>
  ${outerFrame(W, H, frame, isWide ? 6 : 22, isStory ? 34 : 20)}
  <svg x="${logo[0]}" y="${logo[1]}" width="${logo[2]}" height="${logo[3]}" viewBox="0 0 300 100">${brandProfile.logo}</svg>
  ${textLine(isWide ? 276 : 540, isStory ? 300 : isWide ? 92 : 176, headline[0] || "OPORTUNIDADE", { fill: "#FFFFFF", size: isWide ? 72 : isStory ? 92 : 82, weight: 900 })}
  ${textLine(isWide ? 276 : 540, isStory ? 390 : isWide ? 160 : 256, headline[1] || "", { fill: GOLD_LIGHT, size: isWide ? 66 : isStory ? 86 : 76, weight: 900 })}
  ${textLine(isWide ? 276 : 540, isStory ? 456 : isWide ? 202 : 310, "ATE 100% FINANCIADO", { fill: OFF_WHITE, size: isWide ? 22 : 30, weight: 800, spacing: isWide ? 5 : 9 })}
  ${photos.map((p, i) => imageLayer(images[i] || images[0], `${idBase}-p${i}`, p[0], p[1], p[2], p[3], p[4])).join("")}
  ${priceChip(isStory ? 126 : isWide ? 230 : 130, isStory ? 1464 : isWide ? 496 : 725, isStory ? 828 : isWide ? 740 : 820, isStory ? 210 : isWide ? 80 : 190, price || "Consulte")}
  ${textLine(W / 2, isStory ? 1766 : isWide ? 612 : 1018, compactText(neighborhood, 28).toUpperCase(), { fill: OFF_WHITE, size: isWide ? 18 : 30, weight: 600, spacing: isWide ? 7 : 16 })}
</svg>`;
}

function buildVitraMeninoDeusSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, idBase: string) {
  const pd = campaign?.brief?.product_data ?? asset?.metadata?.product_data ?? {};
  const frame = templateFrame(asset);
  const isStory = H > W * 1.25;
  const isWide = W > H * 1.35;
  const hero = images[0] || null;
  const heroRect = isStory ? [0, 0, 1080, 900, 0] : isWide ? [0, 0, 628, 628, 0] : [0, 0, 1080, 610, 0];
  const photoDefs = `<clipPath id="${idBase}-hero"><rect x="${heroRect[0]}" y="${heroRect[1]}" width="${heroRect[2]}" height="${heroRect[3]}" rx="${heroRect[4]}" ry="${heroRect[4]}"/></clipPath>`;
  const neighborhood = (campaign?.neighborhood || pd.neighborhood || "OPORTUNIDADE").toString().toUpperCase();
  const feature = (pd.suites || pd.area || asset.headline || "2 DORMITORIOS C/ SUITE").toString().toUpperCase();
  const price = formatMoneyLike(pd.price || campaign?.offer || "");
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
  ${features.slice(0, 4).map((item, index) => textLine(isWide ? 894 : 540, (isWide ? 496 : isStory ? 1338 : 852) + index * (isWide ? 28 : isStory ? 50 : 36), compactText(item, 42), { fill: "#0A1628", size: isWide ? 20 : isStory ? 32 : 25, weight: 800 })).join("")}
  ${textLine(isWide ? 900 : isStory ? 600 : 612, isWide ? 596 : isStory ? 1722 : 1022, compactText(loc || "PORTO ALEGRE", isWide ? 36 : 44).toUpperCase(), { fill: "#0A1628", size: isWide ? 16 : isStory ? 27 : 25, weight: 850 })}
  ${outerFrame(W, H, frame, isWide ? 8 : 22, isStory ? 34 : 20)}
</svg>`;
}

function buildVitraImobiliariaApprovedSvg(asset: any, campaign: any, images: Array<string | null>, W: number, H: number, brandProfile: ReturnType<typeof brandRenderProfile>, templateFamily = VITRA_IMOBILIARIA_TEMPLATE_BASE) {
  const ar = (asset.aspect_ratio || "1:1").toString();
  const layout = approvedTemplateLayout(ar);
  const pd = campaign?.brief?.product_data ?? asset?.metadata?.product_data ?? {};
  const headline = (asset.headline || pd.suggested_headline || campaign?.name || brandProfile.fallbackHeadline).toString().toUpperCase();
  const lines = wrapText(headline, ar === "1.91:1" ? 18 : 24, 2);
  const description = approvedDescription(pd, asset);
  const price = pd.price || campaign?.offer || "";
  const features = productDifferentials(pd, campaign);
  while (features.length < 2) features.push(features[0] || "Atendimento consultivo Vitra");
  const cta = asset.cta || "Fale com a Vitra";
  const [logoX, logoY, logoW, logoH] = layout.logo as number[];
  const [headlineX, headlineY, headlineSize, headlineGap, headlineChars] = layout.headline as number[];
  const [descX, descY, descSize, descChars] = layout.description as number[];
  const [priceX, priceY, priceW, priceH] = layout.price as number[];
  const [ctaX, ctaY, ctaW, ctaH, ctaTextY, ctaSize] = layout.cta as number[];
  const [photoA, photoB] = layout.photos as number[][];
  const idBase = `asset-${String(asset.id || "preview").replace(/[^a-z0-9_-]/gi, "-")}`;
  if (templateFamily === "vitra-imobiliaria-patios-gallery") return buildVitraPatiosGallerySvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-financiamento-orla") return buildVitraFinancingSvg(asset, campaign, images, W, H, brandProfile, idBase);
  if (templateFamily === "vitra-imobiliaria-menino-deus-offer") return buildVitraMeninoDeusSvg(asset, campaign, images, W, H, brandProfile, idBase);
  const frame = templateFrame(asset);
  const slogan = layout.slogan as number[] | null;

  const h1 = lines[0] || "VITRA IMOBILIARIA";
  const h2 = lines[1] || "";
  const h1Size = h1.length > headlineChars ? Math.max(38, Math.round(headlineSize * headlineChars / h1.length)) : headlineSize;
  const h2Size = h2.length > headlineChars ? Math.max(38, Math.round((headlineSize - 2) * headlineChars / h2.length)) : headlineSize - 2;

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
      h("div", { display:"flex", letterSpacing:4*SCALE, fontSize:Math.round(W*0.020), fontWeight:600, color:GOLD_LIGHT, marginBottom:Math.round(H*0.02) }, kicker),
      h("div", { display:"flex", fontFamily:"Playfair Display", fontWeight:700, fontSize:headlineSize, lineHeight:1.06, color:"#FFFFFF", marginBottom:Math.round(H*0.020) }, headline),
      copy ? h("div", { display:"flex", fontSize:Math.round(W*0.022), fontWeight:400, lineHeight:1.42, color:OFF_WHITE, maxWidth:Math.round(W*0.82) }, copy) : h("div", { display:"flex" }, ""),
      (model === "premium-dark-spec" || model === "premium-gallery-proof") ? featureNodes(features, W) : h("div", { display:"flex" }, ""),
      h("div", { display:"flex", marginTop:Math.round(H*0.028) }, h("div", { display:"flex", backgroundColor:GOLD, color:"#080808", fontWeight:700, fontSize:Math.round(W*0.020), padding:`${Math.round(W*0.014)}px ${Math.round(W*0.030)}px`, borderRadius:3 }, cta)),
    ]),
    h("div", { display:"flex", fontSize:Math.round(W*0.011), letterSpacing:2, color:"rgba(245,245,240,0.34)" }, MODEL_LABEL[model]),
  ]));
  return h("div", { display:"flex", width:W, height:H, position:"relative", backgroundColor:brandProfile.bg }, layers);
}

async function renderAsset(svc: any, asset: any, campaign: any, resvgFont: Uint8Array) {
  let step = "init";
  const brandProfile = brandRenderProfile(campaign, asset);
  const model = modelKey(asset);
  const templateFamily = templateFamilyFromKey(model);
  const ar = (asset.aspect_ratio || "1:1").toString();
  const base = DIMS[ar] || DIMS["1:1"];
  const useApprovedVitraTemplate = isVitraImobiliariaTemplate(model, brandProfile);
  const W = useApprovedVitraTemplate ? base[0] : Math.round(base[0] * SCALE);
  const H = useApprovedVitraTemplate ? base[1] : Math.round(base[1] * SCALE);
  const pad = Math.round(W * 0.075);
  const logoW = Math.round(W * 0.40);
  const logoH = Math.round(logoW / 3);
  try {
    if (useApprovedVitraTemplate) {
      step = "load_template_images";
      const imageUrls = imageUrlsForApprovedTemplate(asset, campaign);
      const imageData: Array<string | null> = [];
      const maxTemplateImages = templateFamily === "vitra-imobiliaria-patios-gallery" ? 3 : 2;
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
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontBuffers: [resvgFont], loadSystemFonts: false, defaultFontFamily: "Inter" } });
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
        public_url:pub.publicUrl,
        metadata:{
          ...(asset.metadata || {}),
          brand_scope:brandProfile.scope,
          brand_name:brandProfile.name,
          rendered_template_family: templateFamily,
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
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontBuffers: [resvgFont], loadSystemFonts: false, defaultFontFamily: "Inter" } });
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
      public_url:pub.publicUrl,
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
    catch (e) {
      const error = String((e as Error)?.message || e);
      failed++;
      results.push({ id:asset.id, ok:false, error });
      await svc.from("premium_campaign_assets").update({
        metadata: { ...(asset.metadata || {}), last_render_error: error },
        updated_at:new Date().toISOString(),
      }).eq("id", asset.id);
    }
  }
  const { count: remaining } = await svc.from("premium_campaign_assets").select("id",{ count:"exact", head:true }).eq("campaign_id", cId).not("channel","in","(whatsapp,email)").eq("status","queued");
  if (!remaining) await svc.from("premium_generation_jobs").update({ status: failed===0 ? "done":"error", progress:100, finished_at:new Date().toISOString(), output_payload:{ rendered, failed, results }, error_message: failed?`${failed} falharam`:null }).eq("campaign_id", cId).eq("job_type","asset_render").eq("status","running");
  return new Response(JSON.stringify({ campaign_id:cId, rendered, failed, remaining: remaining || 0, results }), { headers:cors });
});
