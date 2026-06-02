type Candidate = {
  url: string
  source_url: string
  score: number
  reason: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function normalizeUrl(raw: string, baseUrl: string) {
  const value = decodeHtml(String(raw || "")).trim()
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return null

  try {
    return new URL(value, baseUrl).href
  } catch {
    return null
  }
}

function reasonFromUrl(url: string, hint: string) {
  const lowered = url.toLowerCase()
  if (hint) return hint
  if (lowered.includes("og:image")) return "open_graph"
  if (lowered.includes("gallery") || lowered.includes("galeria")) return "gallery"
  if (lowered.includes("foto") || lowered.includes("photo") || lowered.includes("image")) return "image_path"
  return "html_image"
}

function isRejectedImage(url: string) {
  const lowered = url.toLowerCase()
  return [
    ".svg",
    ".gif",
    "logo",
    "favicon",
    "avatar",
    "sprite",
    "placeholder",
    "tracking",
    "pixel",
    "icon",
  ].some(token => lowered.includes(token))
}

function isLikelyImage(url: string) {
  const lowered = url.toLowerCase()
  if (isRejectedImage(lowered)) return false
  if (/\.(jpe?g|png|webp)(\?|#|$)/i.test(lowered)) return true
  return [
    "googleusercontent.com",
    "images",
    "image",
    "foto",
    "photo",
    "gallery",
    "galeria",
    "uploads",
    "cdn",
    "media",
  ].some(token => lowered.includes(token))
}

function scoreCandidate(url: string, reason: string) {
  const lowered = url.toLowerCase()
  let score = 20

  if (reason === "open_graph" || reason === "twitter_image") score += 40
  if (reason === "json_ld_image") score += 35
  if (reason === "drive_file") score += 30
  if (lowered.includes("empreendimento") || lowered.includes("imovel") || lowered.includes("property")) score += 20
  if (lowered.includes("gallery") || lowered.includes("galeria") || lowered.includes("foto")) score += 16
  if (/\.(jpe?g|webp)(\?|#|$)/i.test(lowered)) score += 12
  if (/\.(png)(\?|#|$)/i.test(lowered)) score += 6
  if (lowered.includes("logo") || lowered.includes("icon")) score -= 70

  return score
}

function pushCandidate(candidates: Candidate[], raw: string, baseUrl: string, reason: string) {
  const url = normalizeUrl(raw, baseUrl)
  if (!url || !isLikelyImage(url)) return

  candidates.push({
    url,
    source_url: baseUrl,
    score: scoreCandidate(url, reason),
    reason: reasonFromUrl(url, reason),
  })
}

function extractSrcset(value: string) {
  return value
    .split(",")
    .map(part => part.trim().split(/\s+/)[0])
    .filter(Boolean)
}

function extractDriveCandidates(sourceUrl: string, html: string) {
  const candidates: Candidate[] = []
  const filePatterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/gi,
    /[?&]id=([a-zA-Z0-9_-]+)/gi,
  ]

  for (const pattern of filePatterns) {
    for (const match of sourceUrl.matchAll(pattern)) {
      const id = match[1]
      if (id) {
        pushCandidate(candidates, `https://drive.google.com/uc?export=download&id=${id}`, sourceUrl, "drive_file")
      }
    }
  }

  for (const match of html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/[^"'\\\s<>]+/gi)) {
    pushCandidate(candidates, match[0], sourceUrl, "drive_preview")
  }

  for (const match of html.matchAll(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/gi)) {
    const id = match[1]
    if (id) {
      pushCandidate(candidates, `https://drive.google.com/uc?export=download&id=${id}`, sourceUrl, "drive_file")
    }
  }

  return candidates
}

function extractHtmlCandidates(html: string, sourceUrl: string) {
  const candidates: Candidate[] = []

  const metaPatterns = [
    /<meta\s+[^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]*>/gi,
  ]

  for (const pattern of metaPatterns) {
    for (const match of html.matchAll(pattern)) {
      pushCandidate(candidates, match[1], sourceUrl, pattern.source.includes("twitter") ? "twitter_image" : "open_graph")
    }
  }

  const imgPattern = /<img\s+[^>]*(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi
  for (const match of html.matchAll(imgPattern)) {
    pushCandidate(candidates, match[1], sourceUrl, "html_image")
  }

  const srcsetPattern = /(?:srcset|data-srcset)=["']([^"']+)["']/gi
  for (const match of html.matchAll(srcsetPattern)) {
    for (const item of extractSrcset(match[1])) {
      pushCandidate(candidates, item, sourceUrl, "srcset_image")
    }
  }

  const jsonImagePatterns = [
    /"image"\s*:\s*"([^"]+)"/gi,
    /"image"\s*:\s*\[\s*"([^"]+)"/gi,
    /"contentUrl"\s*:\s*"([^"]+)"/gi,
  ]

  for (const pattern of jsonImagePatterns) {
    for (const match of html.matchAll(pattern)) {
      pushCandidate(candidates, match[1], sourceUrl, "json_ld_image")
    }
  }

  return candidates
}

function dedupeAndRank(candidates: Candidate[], limit: number) {
  const byUrl = new Map<string, Candidate>()

  for (const candidate of candidates) {
    const existing = byUrl.get(candidate.url)
    if (!existing || candidate.score > existing.score) {
      byUrl.set(candidate.url, candidate)
    }
  }

  return [...byUrl.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function isSafeSourceUrl(raw: string) {
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()
    if (!["http:", "https:"].includes(url.protocol)) return false
    if (host === "localhost" || host.endsWith(".local")) return false
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.)/.test(host)) return false
    if (host === "::1" || host.startsWith("[")) return false
    return true
  } catch {
    return false
  }
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "VitraPremiumImageIngestion/1.0 (+https://vitraimobiliaria.com.br)",
      "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} em ${url}`)
  }

  const contentType = response.headers.get("content-type") || ""
  if (contentType.startsWith("image/")) {
    return { html: "", directImage: response.url || url }
  }

  return { html: await response.text(), directImage: null }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ images: [], warnings: ["Metodo nao permitido."] }, 405)

  try {
    const body = await req.json()
    const rawUrls = Array.isArray(body.urls) ? body.urls : []
    const urls: string[] = Array.from(
      new Set<string>(
        rawUrls
          .map((url: unknown) => String(url || "").trim())
          .filter((url: string) => url.length > 0),
      ),
    )
      .slice(0, 6)
    const limit = Math.max(1, Math.min(Number(body.limit || 12), 24))
    const candidates: Candidate[] = []
    const warnings: string[] = []

    for (const sourceUrl of urls) {
      try {
        if (!isSafeSourceUrl(sourceUrl)) {
          warnings.push(`URL ignorada por seguranca: ${sourceUrl}`)
          continue
        }

        const { html, directImage } = await fetchHtml(sourceUrl)

        if (directImage) {
          pushCandidate(candidates, directImage, sourceUrl, "direct_image")
          continue
        }

        candidates.push(...extractHtmlCandidates(html, sourceUrl))

        if (sourceUrl.includes("drive.google.com")) {
          candidates.push(...extractDriveCandidates(sourceUrl, html))
          if (sourceUrl.includes("/folders/")) {
            warnings.push("Pastas do Google Drive funcionam apenas quando os previews publicos ficam expostos; pastas privadas exigem integracao com Drive API.")
          }
        }
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : `Falha ao ler ${sourceUrl}`)
      }
    }

    return json({
      images: dedupeAndRank(candidates, limit),
      warnings,
    })
  } catch (error) {
    return json({
      images: [],
      warnings: [error instanceof Error ? error.message : "Falha ao processar ingestao de imagens."],
    })
  }
})
