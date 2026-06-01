// Template editorial Vitra Premium (HTML para Puppeteer -> PNG full-res)
const PHASE_TAG = { '1': 'FASE 1 — TEASER', '2': 'FASE 2 — REVELAÇÃO', '3': 'FASE 3 — URGÊNCIA' }

export const DIMS = {
  '1:1': [1080, 1080],
  '9:16': [1080, 1920],
  '4:5': [1080, 1350],
  '16:9': [1280, 720],
  desktop: [1200, 630],
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function buildCreative(asset, campaign) {
  const ar = asset.aspect_ratio || '1:1'
  const [W, H] = DIMS[ar] || DIMS['1:1']
  const pd = (campaign && campaign.brief && campaign.brief.product_data) || {}
  const kicker = String(pd.tagline || (campaign && campaign.product_name) || 'VITRA PREMIUM').toUpperCase()
  const headline = asset.headline || pd.suggested_headline || (campaign && campaign.name) || 'Vitra Premium'
  const copy = asset.copy || pd.suggested_copy || ''
  const cta = asset.cta || 'Solicitar curadoria'
  const phase = PHASE_TAG[String(asset && asset.metadata && asset.metadata.campaign_phase)] || ''
  const bg = asset.source_image_url || (campaign && campaign.brief && campaign.brief.images && campaign.brief.images.fachada && campaign.brief.images.fachada[0] && campaign.brief.images.fachada[0].public_url) || ''
  const pad = Math.round(W * 0.075)

  const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;background:#000;overflow:hidden}
  .stage{position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;color:#fff}
  .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .scrim{position:absolute;inset:0;background:linear-gradient(160deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.22) 42%,rgba(0,0,0,.9) 100%)}
  .vignette{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 38%,transparent 55%,rgba(0,0,0,.55) 100%)}
  .frame{position:absolute;top:${Math.round(pad*0.45)}px;left:${Math.round(pad*0.45)}px;right:${Math.round(pad*0.45)}px;bottom:${Math.round(pad*0.45)}px;border:1px solid rgba(196,148,42,.35)}
  .content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:${pad}px}
  .top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
  .wm{font-weight:600;letter-spacing:${Math.round(W*0.006)}px;font-size:${Math.round(W*0.026)}px}
  .phase{font-weight:600;letter-spacing:1px;font-size:${Math.round(W*0.018)}px;color:#E4C06E;border:1px solid rgba(196,148,42,.5);padding:${Math.round(W*0.008)}px ${Math.round(W*0.016)}px;border-radius:4px;white-space:nowrap}
  .kicker{font-weight:600;letter-spacing:${Math.round(W*0.005)}px;font-size:${Math.round(W*0.02)}px;color:#E4C06E;margin-bottom:${Math.round(H*0.02)}px}
  .headline{font-family:'Playfair Display',serif;font-weight:700;font-size:${Math.round(W*0.066)}px;line-height:1.08;margin-bottom:${Math.round(H*0.022)}px;max-width:92%}
  .copy{font-weight:400;font-size:${Math.round(W*0.026)}px;line-height:1.45;color:#E8E8E8;max-width:82%}
  .cta{align-self:flex-start;background:#C4942A;color:#0A0A0A;font-weight:600;font-size:${Math.round(W*0.024)}px;padding:${Math.round(W*0.018)}px ${Math.round(W*0.04)}px;border-radius:6px;margin-top:${Math.round(H*0.03)}px}
</style></head>
<body><div class="stage">
  ${bg ? `<img class="bg" src="${esc(bg)}" crossorigin="anonymous">` : ''}
  <div class="scrim"></div><div class="vignette"></div><div class="frame"></div>
  <div class="content">
    <div class="top"><div class="wm">VITRA PREMIUM</div>${phase ? `<div class="phase">${esc(phase)}</div>` : ''}</div>
    <div>
      <div class="kicker">${esc(kicker)}</div>
      <div class="headline">${esc(headline)}</div>
      ${copy ? `<div class="copy">${esc(copy)}</div>` : ''}
      <div class="cta">${esc(cta)}</div>
    </div>
    <div></div>
  </div>
</div></body></html>`

  return { html, width: W, height: H }
}
