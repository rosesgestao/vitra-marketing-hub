// Edge: fetch-listing-text — busca o TEXTO de uma pagina de imovel (site da construtora) para a IA
// extrair os fatos (degrau B' por LINK do copiloto). Roda no BACKEND (Deno/Supabase) porque a SPA
// estatica de producao NAO tem servidor: o middleware /api/fetch-listing-text do Vite so existe em
// `npm run dev`, entao em producao (Hostinger) a chamada dava 404. Aqui a mesma logica vive num Edge
// que existe em prod. Server-side tambem evita CORS e permite o guard SSRF.
//
// Seguranca: SSRF (bloqueia local/privado/metadata + revalida o destino final apos redirects), timeout,
// teto de tamanho. Sem chave de IA (nao chama Anthropic) — nao exige o gate do copiloto; protegido pelo
// guard de URL + apikey do Supabase. Falha SEMPRE graciosa: devolve 200 { text, warnings } (o fluxo cai
// para "colar o texto"). Fallback opcional ao render-worker (Chrome real) para sites SPA/JS — so se
// WORKER_RENDER_URL/TOKEN estiverem nos secrets do Edge; sem isso, comportamento identico ao fetch simples.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

// ── SSRF: so http/https publico; bloqueia loopback/privado/link-local/metadata ────────────────────────
function isSafeSourceUrl(raw: string) {
  try {
    const url = new URL(raw);
    // Tira o ponto final do host (FQDN absoluto): `localhost.` resolve para loopback mas escaparia a
    // checagem exata. O URL ja normaliza IP decimal/hex/octal para dotted-decimal.
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.)/.test(host)) return false;
    if (host === "::1" || host.startsWith("[")) return false;
    return true;
  } catch {
    return false;
  }
}

// ── HTML -> texto legivel (PORTADO de dashboard/src/lib/listingText.js — puro, sem deps) ──────────────
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  laquo: "«", raquo: "»", ndash: "-", mdash: "—", hellip: "…", deg: "°",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", atilde: "ã", otilde: "õ",
  acirc: "â", ecirc: "ê", ocirc: "ô", ccedil: "ç", agrave: "à",
};

function decodeEntities(value: string) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return " "; } })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return " "; } })
    .replace(/&([a-zA-Z]+);/g, (whole, name) => (name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : whole));
}

function metaContent(html: string, re: RegExp) {
  const m = String(html || "").match(re);
  return m ? decodeEntities(m[1]).replace(/\s+/g, " ").trim() : "";
}

function extractListingMeta(html: string) {
  const s = String(html || "");
  const title = metaContent(s, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    metaContent(s, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    metaContent(s, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const ogDescription =
    metaContent(s, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
    metaContent(s, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  return { title, description: description || ogDescription };
}

function htmlToBodyText(html: string) {
  let s = String(html || "");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<(script|style)\b[\s\S]*$/i, " ");
  s = s.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol|table)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToReadableText(html: string, { maxChars = 8000, maxInput = 300000 } = {}) {
  const src = String(html || "").slice(0, maxInput);
  const meta = extractListingMeta(src);
  const head = [meta.title, meta.description].filter(Boolean).join("\n");
  const body = htmlToBodyText(src);
  return [head, body].filter(Boolean).join("\n\n").trim().slice(0, maxChars);
}

// ── fetch com timeout + revalidacao pos-redirect + teto de tamanho ────────────────────────────────────
async function fetchHtml(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    headers: {
      "User-Agent": "VitraImobiliariaListingFetch/1.0 (+https://vitraimobiliaria.com.br)",
      "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
  });
  // SSRF: revalida o destino FINAL apos redirects (um host publico pode redirecionar para IP interno).
  if (!isSafeSourceUrl(response.url || url)) throw new Error("Redirecionamento para destino nao permitido.");
  if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) return { html: "", directImage: response.url || url };
  const declaredLen = Number(response.headers.get("content-length") || 0);
  if (declaredLen > 5_000_000) throw new Error("Pagina muito grande para ler.");
  return { html: await response.text(), directImage: null as string | null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ text: "", warnings: ["Metodo nao permitido."] }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body?.url || "").trim();
    if (!url) return json({ text: "", warnings: ["Cole o link do imovel."] }, 200);
    if (!isSafeSourceUrl(url)) {
      return json({ text: "", warnings: ["Link bloqueado por seguranca (enderecos locais/privados nao sao permitidos)."] }, 200);
    }

    const { html, directImage } = await fetchHtml(url);
    if (directImage) return json({ text: "", warnings: ["O link aponta para uma imagem, nao uma pagina de imovel."] }, 200);

    let text = htmlToReadableText(html);
    const warnings: string[] = [];

    // v2: se o fetch simples voltou POUCO texto (provavel SPA em JavaScript), tenta o render-worker
    // headless (Chrome real) — so se WORKER_RENDER_URL/TOKEN estiverem nos secrets do Edge.
    if (text.length < 200) {
      const workerUrl = (Deno.env.get("WORKER_RENDER_URL") || "").replace(/\/$/, "");
      const workerToken = Deno.env.get("WORKER_RENDER_TOKEN") || "";
      if (workerUrl && workerToken) {
        try {
          const wr = await fetch(`${workerUrl}/fetch-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-render-token": workerToken },
            body: JSON.stringify({ url }),
            signal: AbortSignal.timeout(30000),
          });
          if (wr.ok) {
            const wdata = await wr.json().catch(() => ({}));
            const wtext = htmlToReadableText(String(wdata?.html || ""));
            if (wtext.length > text.length) text = wtext;
          }
        } catch { /* worker indisponivel: segue com o texto do fetch simples */ }
      }
      if (text.length < 200) {
        warnings.push("A pagina retornou pouco texto (pode exigir JavaScript ou login). Revise ou cole o texto do anuncio.");
      }
    }
    // Ruido: pagina com varios valores costuma listar OUTROS imoveis (a IA pegaria o dado errado).
    if ((text.match(/R\$\s*\d/g) || []).length >= 4) {
      warnings.push("A pagina parece ter varios valores/imoveis — confira que o texto e do imovel certo antes de extrair.");
    }
    return json({ text, warnings }, 200);
  } catch (error) {
    // Falha graciosa: nunca estoura para o cliente — o fluxo cai para "colar o texto".
    return json({ text: "", warnings: [(error as Error)?.message || "Falha ao ler a pagina. Cole o texto do anuncio."] }, 200);
  }
});
