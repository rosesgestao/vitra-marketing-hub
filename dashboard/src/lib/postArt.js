// Arte do post ORGÂNICO — gera uma imagem branded a partir do TEXTO do post, 100% no cliente (Canvas 2D).
// É diferente de "Gerar criativos" (render Satori de criativo de Meta Ads / oferta, no Edge): aqui é um
// cartão TIPOGRÁFICO (não precisa de foto) na voz visual da marca, para acompanhar o post orgânico.
// Sem dependência nova e sem o pipeline pago — fiel ao brandbook por marca.

// Tokens por marca (espelham BRAND.md / brandProfiles): Imobiliária = navy+dourado; Premium = preto+dourado.
const THEME = {
  vitra_imobiliaria: { bg: '#0A1628', bg2: '#0E2038', gold: '#C4942A', goldLight: '#E4C06E', ink: '#F4F1EA', sub: 'rgba(244,241,234,0.62)', mark: 'VITRA IMOBILIÁRIA' },
  vitra_premium:     { bg: '#000000', bg2: '#0B0B0B', gold: '#C4942A', goldLight: '#E4C06E', ink: '#F5F5F5', sub: 'rgba(245,245,245,0.58)', mark: 'VITRA PREMIUM' },
}

// Dimensões por formato (px). Cartão tipográfico cobre todos sem precisar de foto.
const DIMS = {
  feed: [1080, 1080], carrossel: [1080, 1350], reels: [1080, 1920], stories: [1080, 1920], legenda: [1080, 1080],
}

export function postArtDims(format) {
  return DIMS[String(format || 'feed')] || DIMS.feed
}

// Garante que Playfair Display + Inter estejam prontas antes de desenhar (senão o canvas usa fallback).
export async function ensureArtFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load('700 80px "Playfair Display"'),
      document.fonts.load('600 32px "Inter"'),
      document.fonts.load('700 28px "Inter"'),
      document.fonts.ready,
    ])
  } catch { /* fontes são best-effort: o fallback serif/sans ainda renderiza */ }
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line); line = w
      if (lines.length === maxLines - 1) break
    } else {
      line = probe
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  // se sobrou texto além do limite de linhas, reticências na última
  const used = lines.join(' ')
  if (used.length < String(text || '').replace(/\s+/g, ' ').trim().length && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:]?$/, '') + '…'
  }
  return lines
}

function firstSentence(caption, max = 140) {
  const t = String(caption || '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  const cut = t.split(/(?<=[.!?])\s/)[0] || t
  return cut.length > max ? cut.slice(0, max - 1).trim() + '…' : cut
}

// Carrega uma imagem com CORS habilitado (Storage Supabase serve CORS *). Rejeita se nao carregar
// (ex.: URL invalida ou sem CORS) — quem chama faz fallback para o cartao tipografico.
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem (verifique a URL e o CORS).'))
    img.src = url
  })
}

// Desenha a imagem cobrindo o retangulo (object-fit: cover), centralizada.
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height
  const r = w / h
  let sw, sh, sx, sy
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0 }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

// Desenha a arte no canvas fornecido. opts: { brandScope, format, title, caption, cta, kicker, photoUrl }.
// Com photoUrl: variante "com foto do imovel" (hero no topo + scrim); sem: cartao tipografico.
export async function renderPostArtToCanvas(canvas, opts = {}) {
  const scope = THEME[opts.brandScope] ? opts.brandScope : 'vitra_imobiliaria'
  const t = THEME[scope]
  const [W, H] = postArtDims(opts.format)
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const pad = Math.round(W * 0.1)

  // Fundo (gradiente sutil).
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, t.bg2); g.addColorStop(1, t.bg)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // Variante COM FOTO: hero no topo + scrim que funde para o fundo (texto fica na area inferior).
  let hasPhoto = false
  const photoH = Math.round(H * (H >= 1600 ? 0.56 : 0.52))
  if (opts.photoUrl) {
    try {
      const img = await loadImage(opts.photoUrl)
      drawCover(ctx, img, 0, 0, W, photoH)
      const scrim = ctx.createLinearGradient(0, photoH * 0.45, 0, photoH)
      scrim.addColorStop(0, 'rgba(0,0,0,0)'); scrim.addColorStop(1, t.bg)
      ctx.fillStyle = scrim; ctx.fillRect(0, Math.round(photoH * 0.45), W, photoH - Math.round(photoH * 0.45))
      // continua o fundo solido abaixo do hero
      ctx.fillStyle = t.bg; ctx.fillRect(0, photoH, W, H - photoH)
      hasPhoto = true
    } catch { /* fallback: cartao tipografico (segue sem foto) */ }
  }

  // Moldura dourada fina (safe zone visível).
  ctx.strokeStyle = t.gold; ctx.globalAlpha = 0.5; ctx.lineWidth = 3
  ctx.strokeRect(pad * 0.5, pad * 0.5, W - pad, H - pad)
  ctx.globalAlpha = 1

  // Kicker (eyebrow) + régua dourada. Com foto, ganha sombra para legibilidade sobre a imagem.
  const kicker = String(opts.kicker || t.mark).toUpperCase()
  ctx.fillStyle = t.goldLight
  ctx.font = '700 24px "Inter", Arial, sans-serif'
  ctx.textBaseline = 'alphabetic'
  if (hasPhoto) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8 }
  ctx.save(); ctx.translate(pad, pad * 1.25)
  let kx = 0
  for (const ch of kicker) { ctx.fillText(ch, kx, 0); kx += ctx.measureText(ch).width + 4 }
  ctx.restore()
  if (hasPhoto) ctx.restore()
  ctx.fillStyle = t.gold; ctx.fillRect(pad, pad * 1.45, 84, 4)

  // Título (Playfair Display) — auto-fit por tamanho. Com foto, começa abaixo do hero.
  const title = String(opts.title || opts.caption || 'Conteúdo Vitra').replace(/\s+/g, ' ').trim()
  const maxTextW = W - pad * 2
  const titleTop = hasPhoto ? photoH + Math.round(pad * 0.6) : Math.round(H * (H >= 1600 ? 0.34 : 0.30))
  const titleBudget = (H - pad - titleTop) * (opts.caption ? 0.62 : 0.9)
  let size = title.length > 90 ? 64 : title.length > 50 ? 78 : 96
  let lines = []
  for (; size >= 40; size -= 4) {
    ctx.font = `700 ${size}px "Playfair Display", Georgia, serif`
    lines = wrapLines(ctx, title, maxTextW, hasPhoto ? 3 : (H >= 1600 ? 6 : 4))
    if (lines.length * size * 1.16 <= titleBudget) break
  }
  ctx.fillStyle = t.ink
  ctx.font = `700 ${size}px "Playfair Display", Georgia, serif`
  const lineH = size * 1.16
  let ty = titleTop
  for (const ln of lines) { ctx.fillText(ln, pad, ty); ty += lineH }

  // Linha de apoio (1ª frase da legenda), em Inter.
  const support = firstSentence(opts.caption, H >= 1600 ? 180 : 130)
  if (support) {
    ctx.fillStyle = t.sub
    ctx.font = '400 30px "Inter", Arial, sans-serif'
    const sLines = wrapLines(ctx, support, maxTextW, 3)
    ty += size * 0.4
    for (const ln of sLines) { ctx.fillText(ln, pad, ty); ty += 30 * 1.4 }
  }

  // Rodapé: chip de CTA (se houver) + assinatura da marca.
  const footY = H - pad * 1.15
  const cta = String(opts.cta || '').trim()
  if (cta) {
    ctx.font = '700 26px "Inter", Arial, sans-serif'
    const cw = ctx.measureText(cta).width + 56
    ctx.strokeStyle = t.gold; ctx.lineWidth = 3
    roundRect(ctx, pad, footY - 44, cw, 60, 30); ctx.stroke()
    ctx.fillStyle = t.goldLight
    ctx.fillText(cta, pad + 28, footY - 4)
  }
  // Assinatura da marca (direita).
  ctx.fillStyle = t.sub
  ctx.font = '600 22px "Inter", Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(t.mark, W - pad, footY - 8)
  ctx.textAlign = 'left'

  return canvas
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Gera a arte e devolve um Blob PNG (para download/upload). Cria um canvas off-DOM.
export async function postArtBlob(opts = {}) {
  await ensureArtFonts()
  const canvas = document.createElement('canvas')
  await renderPostArtToCanvas(canvas, opts)
  return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}
