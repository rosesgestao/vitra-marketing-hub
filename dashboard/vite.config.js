import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeUrl(raw, baseUrl) {
  const value = decodeHtml(raw).trim()
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return null

  try {
    return new URL(value, baseUrl).href
  } catch {
    return null
  }
}

function isRejectedImage(url) {
  const lowered = String(url || '').toLowerCase()
  return [
    '.svg',
    '.gif',
    'logo',
    'favicon',
    'avatar',
    'sprite',
    'placeholder',
    'tracking',
    'pixel',
    'icon',
  ].some(token => lowered.includes(token))
}

function isLikelyImage(url) {
  const lowered = String(url || '').toLowerCase()
  if (isRejectedImage(lowered)) return false
  if (/\.(jpe?g|png|webp)(\?|#|$)/i.test(lowered)) return true
  return [
    'googleusercontent.com',
    'images',
    'image',
    'foto',
    'photo',
    'gallery',
    'galeria',
    'uploads',
    'cdn',
    'media',
  ].some(token => lowered.includes(token))
}

function scoreCandidate(url, reason) {
  const lowered = String(url || '').toLowerCase()
  let score = 20

  if (reason === 'open_graph' || reason === 'twitter_image') score += 40
  if (reason === 'json_ld_image') score += 35
  if (reason === 'drive_file') score += 30
  if (lowered.includes('empreendimento') || lowered.includes('imovel') || lowered.includes('property')) score += 20
  if (lowered.includes('gallery') || lowered.includes('galeria') || lowered.includes('foto')) score += 16
  if (/\.(jpe?g|webp)(\?|#|$)/i.test(lowered)) score += 12
  if (/\.(png)(\?|#|$)/i.test(lowered)) score += 6
  if (lowered.includes('logo') || lowered.includes('icon')) score -= 70

  return score
}

function pushCandidate(candidates, raw, baseUrl, reason) {
  const url = normalizeUrl(raw, baseUrl)
  if (!url || !isLikelyImage(url)) return

  candidates.push({
    url,
    source_url: baseUrl,
    score: scoreCandidate(url, reason),
    reason,
  })
}

function extractSrcset(value) {
  return String(value || '')
    .split(',')
    .map(part => part.trim().split(/\s+/)[0])
    .filter(Boolean)
}

function extractHtmlCandidates(html, sourceUrl) {
  const candidates = []
  const metaPatterns = [
    /<meta\s+[^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]*>/gi,
  ]

  for (const pattern of metaPatterns) {
    for (const match of html.matchAll(pattern)) {
      pushCandidate(candidates, match[1], sourceUrl, pattern.source.includes('twitter') ? 'twitter_image' : 'open_graph')
    }
  }

  for (const match of html.matchAll(/<img\s+[^>]*(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi)) {
    pushCandidate(candidates, match[1], sourceUrl, 'html_image')
  }

  for (const match of html.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi)) {
    for (const item of extractSrcset(match[1])) {
      pushCandidate(candidates, item, sourceUrl, 'srcset_image')
    }
  }

  const jsonImagePatterns = [
    /"image"\s*:\s*"([^"]+)"/gi,
    /"image"\s*:\s*\[\s*"([^"]+)"/gi,
    /"contentUrl"\s*:\s*"([^"]+)"/gi,
  ]

  for (const pattern of jsonImagePatterns) {
    for (const match of html.matchAll(pattern)) {
      pushCandidate(candidates, match[1], sourceUrl, 'json_ld_image')
    }
  }

  return candidates
}

function extractDriveCandidates(sourceUrl, html) {
  const candidates = []
  const filePatterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/gi,
    /[?&]id=([a-zA-Z0-9_-]+)/gi,
  ]

  for (const pattern of filePatterns) {
    for (const match of sourceUrl.matchAll(pattern)) {
      if (match[1]) {
        pushCandidate(candidates, `https://drive.google.com/uc?export=download&id=${match[1]}`, sourceUrl, 'drive_file')
      }
    }
  }

  for (const match of html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/[^"'\\\s<>]+/gi)) {
    pushCandidate(candidates, match[0], sourceUrl, 'drive_preview')
  }

  for (const match of html.matchAll(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/gi)) {
    if (match[1]) {
      pushCandidate(candidates, `https://drive.google.com/uc?export=download&id=${match[1]}`, sourceUrl, 'drive_file')
    }
  }

  return candidates
}

function dedupeAndRank(candidates, limit) {
  const byUrl = new Map()

  for (const candidate of candidates) {
    const current = byUrl.get(candidate.url)
    if (!current || candidate.score > current.score) byUrl.set(candidate.url, candidate)
  }

  return [...byUrl.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function isSafeSourceUrl(raw) {
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()
    if (!['http:', 'https:'].includes(url.protocol)) return false
    if (host === 'localhost' || host.endsWith('.local')) return false
    if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.)/.test(host)) return false
    if (host === '::1' || host.startsWith('[')) return false
    return true
  } catch {
    return false
  }
}

function isLocalSourcePath(raw) {
  const value = String(raw || '').trim()
  return /^[a-zA-Z]:[\\/]/.test(value)
}

function isSafeLocalSourcePath(raw) {
  const resolved = path.resolve(String(raw || '').trim())
  const allowedRoot = path.resolve('D:\\LEONARDO')
  const relative = path.relative(allowedRoot, resolved)

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function contentTypeForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

function localImageScore(filePath) {
  const name = path.basename(filePath).toLowerCase()
  let score = 80
  if (name.includes('fachada') || name.includes('principal') || name.includes('capa')) score += 30
  if (name.includes('living') || name.includes('sala') || name.includes('interior')) score += 20
  if (name.includes('varanda') || name.includes('vista')) score += 16
  if (name.includes('lazer') || name.includes('infra')) score += 12
  if (name.includes('logo') || name.includes('planta') || name.includes('mapa')) score -= 60
  return score
}

async function collectLocalImageFiles(sourcePath, limit, depth = 0) {
  const stat = await fs.stat(sourcePath)
  if (stat.isFile()) {
    return /\.(jpe?g|png|webp|heic|heif)$/i.test(sourcePath)
      ? [{ filePath: sourcePath, score: localImageScore(sourcePath) }]
      : []
  }

  if (!stat.isDirectory() || depth > 4) return []

  const entries = await fs.readdir(sourcePath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (files.length >= limit * 3) break
    const child = path.join(sourcePath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectLocalImageFiles(child, limit, depth + 1))
    } else if (entry.isFile() && /\.(jpe?g|png|webp|heic|heif)$/i.test(entry.name)) {
      files.push({ filePath: child, score: localImageScore(child) })
    }
  }

  return files
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

let cachedDashboardEnv = null
async function readDashboardEnv() {
  if (cachedDashboardEnv) return cachedDashboardEnv

  const envPath = path.resolve(process.cwd(), '.env')
  const text = await fs.readFile(envPath, 'utf8')
  const env = {}

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }

  cachedDashboardEnv = {
    url: env.VITE_SUPABASE_URL,
    key: env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY,
  }
  return cachedDashboardEnv
}

function encodeStoragePath(objectPath) {
  return objectPath.split('/').map(encodeURIComponent).join('/')
}

async function optimizeJpegBuffer(input) {
  try {
    const sharp = await import('sharp')
    return await sharp.default(input)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer()
  } catch {
    return input
  }
}

async function prepareLocalImageForUpload(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.heic' || ext === '.heif') {
    const heicConvert = await import('heic-convert')
    const convert = heicConvert.default || heicConvert
    const input = await fs.readFile(filePath)
    const output = await convert({
      buffer: input,
      format: 'JPEG',
      quality: 0.92,
    })
    const bytes = await optimizeJpegBuffer(Buffer.from(output))

    return {
      bytes,
      ext: '.jpg',
      contentType: 'image/jpeg',
    }
  }

  const input = await fs.readFile(filePath)
  const bytes = await optimizeJpegBuffer(input)

  return {
    bytes,
    ext: '.jpg',
    contentType: 'image/jpeg',
  }
}

async function uploadLocalImageToStorage(filePath, score) {
  const env = await readDashboardEnv()
  if (!env.url || !env.key) throw new Error('Supabase URL/chave publica nao configuradas no dashboard/.env.')

  const prepared = await prepareLocalImageForUpload(filePath)
  const bytes = prepared.bytes
  const hash = crypto.createHash('sha1').update(filePath).update(bytes.subarray(0, Math.min(bytes.length, 4096))).digest('hex').slice(0, 12)
  const sourceExt = path.extname(filePath).toLowerCase() || prepared.ext
  const safeName = path.basename(filePath, sourceExt)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'imagem'
  const objectPath = `premium-campaigns/source-ingestion/${Date.now()}-${hash}-${safeName}${prepared.ext}`
  const encodedPath = encodeStoragePath(objectPath)
  const uploadUrl = `${env.url}/storage/v1/object/cards/${encodedPath}`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      'Content-Type': prepared.contentType,
      'x-upsert': 'true',
      'cache-control': '31536000',
    },
    body: bytes,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Falha ao enviar ${path.basename(filePath)} ao Storage: HTTP ${response.status} ${detail}`)
  }

  return {
    url: `${env.url}/storage/v1/object/public/cards/${encodedPath}`,
    source_url: filePath,
    score,
    reason: 'local_folder_upload',
  }
}

async function ingestLocalSourcePath(sourcePath, limit) {
  if (!isSafeLocalSourcePath(sourcePath)) {
    return {
      images: [],
      warnings: [`Pasta local fora da area permitida: ${sourcePath}`],
    }
  }

  const files = await collectLocalImageFiles(path.resolve(sourcePath), limit)
  const images = []
  const warnings = []

  for (const file of files) {
    try {
      images.push(await uploadLocalImageToStorage(file.filePath, file.score))
    } catch (error) {
      warnings.push(error.message || `Falha ao enviar ${file.filePath}`)
    }
  }

  if (!files.length) warnings.push(`Nenhuma imagem JPG/PNG/WebP encontrada em ${sourcePath}`)
  return { images, warnings }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 128 * 1024) {
        reject(new Error('Payload muito grande.'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'VitraPremiumImageIngestion/1.0 (+https://vitraimobiliaria.com.br)',
      Accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`)

  const contentType = response.headers.get('content-type') || ''
  if (contentType.startsWith('image/')) {
    return { html: '', directImage: response.url || url }
  }

  return { html: await response.text(), directImage: null }
}

function sourceImageIngestionPlugin() {
  return {
    name: 'vitra-premium-source-image-ingestion',
    configureServer(server) {
      server.middlewares.use('/api/ingest-source-images', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ images: [], warnings: ['Metodo nao permitido.'] }))
          return
        }

        try {
          const body = await readJsonBody(req)
          const urls = [...new Set((body.urls || []).map(url => String(url || '').trim()).filter(Boolean))].slice(0, 6)
          const limit = Math.max(1, Math.min(Number(body.limit || 12), 24))
          const candidates = []
          const warnings = []

          for (const sourceUrl of urls) {
            try {
              if (isLocalSourcePath(sourceUrl)) {
                const local = await ingestLocalSourcePath(sourceUrl, limit)
                candidates.push(...local.images)
                warnings.push(...local.warnings)
                continue
              }

              if (!isSafeSourceUrl(sourceUrl)) {
                warnings.push(`URL ignorada por seguranca: ${sourceUrl}`)
                continue
              }

              const { html, directImage } = await fetchHtml(sourceUrl)
              if (directImage) {
                pushCandidate(candidates, directImage, sourceUrl, 'direct_image')
                continue
              }

              candidates.push(...extractHtmlCandidates(html, sourceUrl))
              if (sourceUrl.includes('drive.google.com')) {
                candidates.push(...extractDriveCandidates(sourceUrl, html))
                if (sourceUrl.includes('/folders/')) {
                  warnings.push('Pastas do Google Drive dependem de previews publicos; pastas privadas exigem integracao com Drive API.')
                }
              }
            } catch (error) {
              warnings.push(error.message || `Falha ao ler ${sourceUrl}`)
            }
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ images: dedupeAndRank(candidates, limit), warnings }))
        } catch (error) {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ images: [], warnings: [error.message || 'Falha ao processar ingestao de imagens.'] }))
        }
      })

      // Conversao HEIC/HEIF -> JPEG no servidor (heic-convert do Node), usada pelo upload do
      // navegador quando o heic2any (decodificador WASM) recusa fotos de iPhone. Recebe os bytes
      // crus no corpo e devolve o JPEG ja otimizado (auto-rotacao + resize + mozjpeg).
      server.middlewares.use('/api/convert-heic', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Metodo nao permitido.' }))
          return
        }
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const input = Buffer.concat(chunks)
          if (!input.length) throw new Error('Corpo vazio (nenhum byte recebido).')

          const heicConvert = await import('heic-convert')
          const convert = heicConvert.default || heicConvert
          const jpeg = await convert({ buffer: input, format: 'JPEG', quality: 0.92 })
          const bytes = await optimizeJpegBuffer(Buffer.from(jpeg))

          res.statusCode = 200
          res.setHeader('Content-Type', 'image/jpeg')
          res.setHeader('Cache-Control', 'no-store')
          res.end(bytes)
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error?.message || 'Falha ao converter HEIC.' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sourceImageIngestionPlugin()],
  server: { port: 5173 },
})
