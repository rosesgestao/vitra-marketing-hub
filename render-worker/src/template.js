// Vitra Premium creative template system.
// HTML -> Puppeteer -> PNG full-res.

const PHASE_TAG = { '1': 'FASE 1 - TEASER', '2': 'FASE 2 - REVELACAO', '3': 'FASE 3 - URGENCIA' }

export const DIMS = {
  '1:1': [1080, 1080],
  '9:16': [1080, 1920],
  '4:5': [1080, 1350],
  '16:9': [1280, 720],
  '1.91:1': [1200, 628],
  desktop: [1200, 630],
}

const MODEL_CLASS = {
  'premium-photo-offer': 'model-photo-offer',
  'premium-editorial-panel': 'model-editorial-panel',
  'premium-dark-spec': 'model-dark-spec',
  'premium-location-panorama': 'model-location-panorama',
  'premium-gallery-proof': 'model-gallery-proof',
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function premiumLogoSvg() {
  return `<svg class="brand-logo" viewBox="0 0 300 100" aria-hidden="true">
    <g transform="translate(3,2) scale(0.87)">
      <polygon points="55,8 94,30.5 94,72.5 55,95 16,72.5 16,30.5" fill="#000000" stroke="#C4942A" stroke-width="2.3"/>
      <polygon points="55,13 90,33 90,70 55,90 20,70 20,33" fill="none" stroke="rgba(212,168,74,0.15)" stroke-width="0.7"/>
      <polygon points="25,37 39,37 32,54" fill="#FFE08A"/>
      <polygon points="25,37 32,54 55,76" fill="#8B6914"/>
      <polygon points="39,37 32,54 55,76" fill="#C4942A"/>
      <polygon points="85,37 71,37 78,54" fill="#F0C95C"/>
      <polygon points="85,37 78,54 55,76" fill="#7A5C10"/>
      <polygon points="71,37 78,54 55,76" fill="#D4A84A"/>
    </g>
    <line x1="105" y1="20" x2="105" y2="80" stroke="rgba(196,148,42,0.2)" stroke-width="1"/>
    <text x="135" y="48" font-family="Inter" font-weight="700" font-size="27" letter-spacing="12" fill="#FFFFFF">VITR</text>
    <path d="M254.99,28.56 L264.98,48.54 L245,48.54 Z M254.99,37.551 L258.4865,44.544 L251.4935,44.544 Z" fill="#FFFFFF" fill-rule="evenodd"/>
    <text x="122.50" y="71" font-family="Inter" font-weight="700" font-size="10.5" letter-spacing="17.6108" fill="#C4942A">PREMIUM</text>
  </svg>`
}

function resolveModel(asset) {
  const key = asset?.metadata?.visual_template?.key || asset?.template_key || 'premium-editorial-panel'
  return MODEL_CLASS[key] ? key : 'premium-editorial-panel'
}

function productFeatures(productData = {}, campaign = {}, max = 4) {
  const location = productData.location || [campaign.neighborhood, campaign.city].filter(Boolean).join(', ')
  const values = [
    productData.area,
    productData.suites,
    productData.towers,
    location,
    productData.price,
    productData.differentials,
  ]
    .filter(Boolean)
    .map(value => String(value).trim())
    .filter(Boolean)

  return [...new Set(values)].slice(0, max)
}

function featureList(features) {
  if (!features.length) return ''

  return `<div class="features">
    ${features.map(item => `<div class="feature"><span></span><p>${esc(item)}</p></div>`).join('')}
  </div>`
}

export function buildCreative(asset, campaign) {
  const ar = asset.aspect_ratio || '1:1'
  const [W, H] = DIMS[ar] || DIMS['1:1']
  const pd = campaign?.brief?.product_data || {}
  const modelKey = resolveModel(asset)
  const modelClass = MODEL_CLASS[modelKey]
  const aspectClass = H > W * 1.25 ? 'is-vertical' : W > H * 1.35 ? 'is-wide' : 'is-square'
  const kicker = String(pd.tagline || campaign?.product_name || 'VITRA PREMIUM').toUpperCase()
  const headline = asset.headline || pd.suggested_headline || campaign?.name || 'Vitra Premium'
  const copy = asset.copy || pd.suggested_copy || ''
  const cta = asset.cta || 'Solicitar curadoria'
  const phase = PHASE_TAG[String(asset?.metadata?.campaign_phase)] || ''
  const bg = asset.source_image_url || campaign?.brief?.images?.fachada?.[0]?.public_url || ''
  const pad = Math.round(W * 0.07)
  const featureMax = modelKey === 'premium-dark-spec' ? 5 : 3
  const features = productFeatures(pd, campaign, featureMax)
  const offer = pd.price || campaign?.offer || 'Curadoria reservada'
  const modelLabel = asset?.metadata?.visual_template?.label || 'Padrao Premium'

  const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;background:#000;overflow:hidden}
  .stage{--pad:${pad}px;position:relative;width:${W}px;height:${H}px;font-family:'Inter',sans-serif;color:#fff;background:#050505;overflow:hidden}
  .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.9) contrast(1.02)}
  .grain{position:absolute;inset:-20%;opacity:.08;background-image:radial-gradient(circle at 20% 20%,rgba(255,255,255,.18) 0 1px,transparent 1px);background-size:18px 18px;mix-blend-mode:screen}
  .scrim{position:absolute;inset:0;background:linear-gradient(155deg,rgba(0,0,0,.78) 0%,rgba(0,0,0,.35) 42%,rgba(0,0,0,.9) 100%)}
  .frame{position:absolute;top:calc(var(--pad)*.46);left:calc(var(--pad)*.46);right:calc(var(--pad)*.46);bottom:calc(var(--pad)*.46);border:1px solid rgba(196,148,42,.34)}
  .content{position:absolute;inset:0;padding:var(--pad);display:flex;flex-direction:column;justify-content:space-between;z-index:2}
  .top{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
  .brand-logo{width:${Math.round(W * 0.27)}px;height:auto;display:block}
  .phase{font-weight:700;letter-spacing:${Math.max(2, Math.round(W * 0.0028))}px;font-size:${Math.round(W * 0.014)}px;color:#F0C95C;border:1px solid rgba(196,148,42,.48);padding:${Math.round(W * 0.009)}px ${Math.round(W * 0.016)}px;border-radius:2px;white-space:nowrap;background:rgba(0,0,0,.38)}
  .main{max-width:78%;position:relative}
  .panel{background:linear-gradient(160deg,rgba(0,0,0,.86),rgba(13,13,13,.70));border-left:2px solid #C4942A;padding:${Math.round(W * 0.04)}px;box-shadow:0 30px 80px rgba(0,0,0,.38)}
  .kicker{font-weight:700;letter-spacing:${Math.max(3, Math.round(W * 0.0045))}px;font-size:${Math.round(W * 0.017)}px;color:#C4942A;text-transform:uppercase;margin-bottom:${Math.round(H * 0.018)}px}
  .headline{font-family:'Playfair Display',serif;font-weight:700;font-size:${Math.round(W * 0.061)}px;line-height:1.02;letter-spacing:0;max-width:100%;text-wrap:balance}
  .copy{margin-top:${Math.round(H * 0.022)}px;font-weight:400;font-size:${Math.round(W * 0.022)}px;line-height:1.42;color:rgba(245,245,240,.84);max-width:92%}
  .cta{display:inline-flex;align-items:center;gap:${Math.round(W * 0.012)}px;margin-top:${Math.round(H * 0.027)}px;background:#C4942A;color:#070707;font-weight:700;font-size:${Math.round(W * 0.019)}px;letter-spacing:.01em;padding:${Math.round(W * 0.014)}px ${Math.round(W * 0.032)}px;border-radius:3px}
  .features{display:grid;gap:${Math.round(W * 0.012)}px;margin-top:${Math.round(H * 0.026)}px;max-width:86%}
  .feature{display:flex;align-items:center;gap:${Math.round(W * 0.012)}px;font-size:${Math.round(W * 0.018)}px;color:rgba(245,245,240,.82);line-height:1.22}
  .feature span{width:${Math.round(W * 0.008)}px;height:${Math.round(W * 0.008)}px;border-radius:50%;background:#C4942A;box-shadow:0 0 0 3px rgba(196,148,42,.16)}
  .offer-chip{position:absolute;right:var(--pad);bottom:var(--pad);background:#C4942A;color:#080808;font-weight:800;letter-spacing:${Math.round(W * 0.002)}px;font-size:${Math.round(W * 0.032)}px;padding:${Math.round(W * 0.017)}px ${Math.round(W * 0.032)}px;text-transform:uppercase}
  .model-tag{position:absolute;left:var(--pad);bottom:calc(var(--pad)*.52);font-size:${Math.round(W * 0.011)}px;letter-spacing:${Math.max(2, Math.round(W * 0.003))}px;color:rgba(245,245,240,.35);text-transform:uppercase}
  .photo-card{position:absolute;right:var(--pad);top:22%;width:34%;height:48%;border:1px solid rgba(196,148,42,.28);background-image:url('${esc(bg)}');background-size:cover;background-position:center;box-shadow:0 24px 70px rgba(0,0,0,.5)}

  .model-photo-offer .scrim{background:linear-gradient(180deg,rgba(0,0,0,.22) 0%,rgba(0,0,0,.34) 42%,rgba(0,0,0,.88) 100%)}
  .model-photo-offer .main{margin-top:auto;max-width:84%}
  .model-photo-offer .headline{font-size:${Math.round(W * 0.064)}px}
  .model-photo-offer .copy{max-width:72%}

  .model-editorial-panel .main{margin-top:auto;max-width:58%}
  .model-editorial-panel .panel{min-height:${Math.round(H * 0.36)}px}

  .model-dark-spec .scrim{background:linear-gradient(90deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.74) 44%,rgba(0,0,0,.34) 100%)}
  .model-dark-spec .main{margin-top:auto;max-width:56%}
  .model-dark-spec .headline{font-size:${Math.round(W * 0.055)}px}

  .model-location-panorama .scrim{background:linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.16) 46%,rgba(0,0,0,.82) 100%)}
  .model-location-panorama .main{margin-top:auto;max-width:78%;padding:0 ${Math.round(W * 0.02)}px ${Math.round(H * 0.01)}px}
  .model-location-panorama .headline{font-size:${Math.round(W * 0.052)}px}
  .model-location-panorama .kicker{display:inline-flex;background:rgba(0,0,0,.62);padding:${Math.round(W * 0.009)}px ${Math.round(W * 0.016)}px}

  .model-gallery-proof .scrim{background:linear-gradient(120deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.58) 55%,rgba(0,0,0,.38) 100%)}
  .model-gallery-proof .main{margin-top:auto;max-width:58%}
  .model-gallery-proof .photo-card{display:block}

  .model-editorial-panel .photo-card,.model-dark-spec .photo-card,.model-location-panorama .photo-card,.model-photo-offer .photo-card{display:none}

  .is-vertical .brand-logo{width:${Math.round(W * 0.38)}px}
  .is-vertical .phase{font-size:${Math.round(W * 0.018)}px}
  .is-vertical .main{max-width:92%}
  .is-vertical .headline{font-size:${Math.round(W * 0.083)}px}
  .is-vertical .copy{font-size:${Math.round(W * 0.028)}px;max-width:92%}
  .is-vertical .feature{font-size:${Math.round(W * 0.024)}px}
  .is-vertical .model-editorial-panel .main,.is-vertical .model-dark-spec .main,.is-vertical .model-gallery-proof .main{max-width:92%}
  .is-vertical .model-gallery-proof .photo-card{top:14%;right:var(--pad);width:44%;height:22%}
  .is-vertical .offer-chip{font-size:${Math.round(W * 0.04)}px}

  .is-wide .brand-logo{width:${Math.round(W * 0.22)}px}
  .is-wide .main{max-width:58%}
  .is-wide .headline{font-size:${Math.round(W * 0.049)}px}
  .is-wide .copy{font-size:${Math.round(W * 0.019)}px;max-width:90%}
  .is-wide .features{grid-template-columns:1fr 1fr;max-width:94%}
  .is-wide .model-photo-offer .main,.is-wide .model-location-panorama .main{max-width:74%}
  .is-wide .offer-chip{font-size:${Math.round(W * 0.026)}px}
</style></head>
<body><div class="stage ${modelClass} ${aspectClass}">
  ${bg ? `<img class="bg" src="${esc(bg)}" crossorigin="anonymous">` : ''}
  <div class="scrim"></div><div class="grain"></div><div class="frame"></div>
  <div class="photo-card"></div>
  ${modelKey === 'premium-photo-offer' ? `<div class="offer-chip">${esc(offer)}</div>` : ''}
  <div class="content">
    <div class="top">${premiumLogoSvg()}${phase ? `<div class="phase">${esc(phase)}</div>` : ''}</div>
    <div class="main ${modelKey === 'premium-photo-offer' || modelKey === 'premium-location-panorama' ? '' : 'panel'}">
      <div class="kicker">${esc(kicker)}</div>
      <div class="headline">${esc(headline)}</div>
      ${copy ? `<div class="copy">${esc(copy)}</div>` : ''}
      ${modelKey === 'premium-dark-spec' || modelKey === 'premium-gallery-proof' ? featureList(features) : ''}
      <div class="cta">${esc(cta)}</div>
    </div>
    <div class="model-tag">${esc(modelLabel)}</div>
  </div>
</div></body></html>`

  return { html, width: W, height: H }
}
