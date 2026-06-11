// Gerador de HTML autossuficiente para criativos imobiliários Vitra.
// Cada função recebe `data` e retorna uma string HTML pronta para abrir em nova aba
// e exportar PNG via html2canvas (fotos e logo embutidos como base64).

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap'
const H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pinSvg(color = '#C4942A') {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/></svg>`
}

function buildBullets({ area, quartos, suites, vagas, diferenciais = [] }) {
  const items = []
  if (area) items.push(`${area} m² privativos`)
  if (quartos) items.push(`${quartos} dormitório${Number(quartos) > 1 ? 's' : ''}`)
  if (suites) items.push(suites)
  if (vagas) items.push(`${vagas} vaga${Number(vagas) > 1 ? 's' : ''}`)
  diferenciais.forEach(d => { if (d?.trim()) items.push(d.trim()) })
  return items
}

function exportScript(w, h, filename) {
  return `async function doExport(){
  const el=document.getElementById('creative'),st=document.getElementById('st');
  st.textContent='Gerando PNG...';
  try{
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;
    for(const im of el.querySelectorAll('img')){if(im.decode)try{await im.decode()}catch(e){}}
    const c=await html2canvas(el,{backgroundColor:'#0A1628',scale:1,useCORS:true,logging:false,width:${w},height:${h}});
    const a=document.createElement('a');a.download='${filename}';a.href=c.toDataURL('image/png');a.click();
    st.textContent='✓ '+c.width+'×'+c.height+' px exportado';
  }catch(e){st.textContent='Erro: '+e.message;console.error(e)}
}`
}

// ─── 1:1  1080 × 1080 ────────────────────────────────────────────────────────
export function buildCreativo1x1(data) {
  const { headline, bairro, cidade, preco, cta = 'Agende sua visita', logoSrc, photos = [] } = data
  const bullets = buildBullets(data)
  const hero = photos[0] || null
  const ap1 = photos[1] || null
  const ap2 = photos[2] || null
  const loc = [bairro, cidade].filter(Boolean).join(' · ')

  const heroEl = hero
    ? `<img class="hero" src="${hero}" alt="">`
    : `<div class="hero-ph">FOTO PRINCIPAL</div>`

  const ap1El = ap1
    ? `<img class="ap" src="${ap1}" alt="">`
    : `<div class="ap-ph">FOTO 2</div>`

  const ap2El = ap2
    ? `<img class="ap" src="${ap2}" alt="">`
    : `<div class="ap-ph">FOTO 3</div>`

  const bulletsHtml = bullets
    .slice(0, 5)
    .map(b => `<div class="bullet"><span class="arw">›</span>${esc(b)}</div>`)
    .join('\n          ')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Criativo Vitra — 1:1</title>
<link href="${FONTS}" rel="stylesheet">
<script src="${H2C}"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--navy:#0A1628;--gold:#C4942A;--gl:#F0C95C;--ow:#F5F5F0;--sans:'Inter',sans-serif;--serif:'Playfair Display',serif}
body{background:#090e18;display:flex;flex-direction:column;align-items:center;gap:20px;padding:32px 14px;font-family:var(--sans);color:#fff;min-height:100vh}
#creative{position:relative;width:1080px;height:1080px;overflow:hidden;color:#fff;
  background:radial-gradient(120% 90% at 50% 86%,rgba(196,148,42,.07) 0%,transparent 55%),
             radial-gradient(130% 120% at 50% 12%,#15315e 0%,#0A1628 48%,#07111F 100%);
  box-shadow:0 30px 80px rgba(0,0,0,.55)}
.logo{position:absolute;top:42px;right:52px;width:230px;height:auto;z-index:4;filter:drop-shadow(0 6px 18px rgba(0,0,0,.5))}
.hero-wrap{position:absolute;top:0;left:0;width:1080px;height:452px;overflow:hidden;border-bottom:3px solid var(--gold)}
.hero{display:block;width:100%;height:100%;object-fit:cover}
.hero-ph{display:flex;align-items:center;justify-content:center;width:100%;height:452px;background:linear-gradient(135deg,#102544,#0a1830);font-size:14px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,201,92,.4)}
.lower{position:absolute;top:452px;left:0;width:1080px;height:540px;display:flex;gap:26px;padding:34px 48px 0 56px}
.textcol{flex:1;display:flex;flex-direction:column;min-width:0}
.photocol{width:368px;display:flex;flex-direction:column;gap:18px;flex-shrink:0}
.headline{font-weight:800;font-size:43px;line-height:1.07;letter-spacing:.5px;text-transform:uppercase;color:var(--ow)}
.rule{width:84px;height:3px;background:var(--gold);margin:18px 0 4px}
.bullets{margin-top:14px;display:flex;flex-direction:column;gap:9px}
.bullet{display:flex;align-items:center;gap:12px;font-weight:600;font-size:20px;letter-spacing:.5px;text-transform:uppercase;color:var(--ow)}
.arw{color:var(--gl);font-weight:800;font-size:22px;line-height:1}
.price{margin-top:auto;padding-bottom:22px}
.price .kicker{font-size:18px;font-weight:600;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,.78)}
.price .value{font-weight:800;font-size:54px;line-height:1;color:var(--gl);margin-top:6px}
.ap{display:block;width:100%;height:235px;object-fit:cover;border-radius:12px;border:2px solid rgba(196,148,42,.55)}
.ap-ph{height:235px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:2px solid rgba(196,148,42,.2);background:linear-gradient(135deg,#102544,#0a1830);font-size:13px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,201,92,.35)}
.footer{position:absolute;bottom:0;left:0;width:1080px;height:88px;display:flex;align-items:center;gap:12px;padding:0 56px;border-top:1px solid rgba(196,148,42,.28);background:rgba(7,17,31,.55)}
.loc{font-size:19px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#fff}
.fcta{margin-left:auto;font-size:17px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gl)}
.panel{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
button{font-family:var(--sans);font-weight:600;font-size:13px;padding:11px 18px;border-radius:8px;border:1px solid rgba(196,148,42,.5);background:#0f2140;color:#f5f5f0;cursor:pointer;transition:.15s}
button:hover{background:#16315f;border-color:var(--gold)}
button.primary{background:var(--gold);color:#1a1205;border-color:var(--gold)}
.status{font-size:12px;color:rgba(255,255,255,.5);min-height:16px;text-align:center}
</style>
</head>
<body>
<div id="creative">
  ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="">` : ''}
  <div class="hero-wrap">${heroEl}</div>
  <div class="lower">
    <div class="textcol">
      <div class="headline">${esc(headline || 'Seu imóvel aqui')}</div>
      <div class="rule"></div>
      <div class="bullets">${bulletsHtml}</div>
      ${preco ? `<div class="price"><div class="kicker">A partir de</div><div class="value">${esc(preco)}</div></div>` : ''}
    </div>
    <div class="photocol">${ap1El}${ap2El}</div>
  </div>
  <div class="footer">
    ${loc ? `${pinSvg()}<span class="loc">${esc(loc)}</span>` : ''}
    <span class="fcta">${esc(cta)}</span>
  </div>
</div>
<div class="panel"><button class="primary" onclick="doExport()">&#11015; Baixar PNG (1080 × 1080)</button></div>
<div class="status" id="st"></div>
<script>${exportScript(1080, 1080, 'criativo-vitra-1080x1080.png')}</script>
</body>
</html>`
}

// ─── 9:16  1080 × 1920 ───────────────────────────────────────────────────────
export function buildCreativo9x16(data) {
  const { headline, bairro, cidade, preco, cta = 'Agende sua visita', logoSrc, photos = [] } = data
  const bullets = buildBullets(data)
  const hero = photos[0] || null
  const secondaries = photos.slice(1, 4)
  const loc = [bairro, cidade].filter(Boolean).join(' · ')

  const heroEl = hero
    ? `<img class="hero" src="${hero}" alt="">`
    : `<div class="hero-ph">FOTO PRINCIPAL</div>`

  const secEls = secondaries.length
    ? secondaries.map(p => `<img class="photo-s" src="${p}" alt="">`).join('\n      ')
    : `<div class="photo-s-ph">FOTO 2</div><div class="photo-s-ph">FOTO 3</div>`

  const bulletsHtml = bullets
    .slice(0, 5)
    .map(b => `<div class="bullet"><span class="arw">&#10142;</span>${esc(b)}</div>`)
    .join('\n        ')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Criativo Vitra — 9:16</title>
<link href="${FONTS}" rel="stylesheet">
<script src="${H2C}"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--navy:#0A1628;--deep:#07111F;--gold:#C4942A;--gl:#F0C95C;--ow:#F5F5F0;--sans:'Inter',sans-serif;--serif:'Playfair Display',serif}
body{background:#090e18;display:flex;flex-direction:column;align-items:center;gap:20px;padding:32px 14px;font-family:var(--sans);color:#fff;min-height:100vh}
.stage{max-width:96vw;overflow:auto}
#creative{position:relative;width:1080px;height:1920px;overflow:hidden;background:#0A1628;box-shadow:0 32px 90px rgba(0,0,0,.6)}
.hero{position:absolute;top:0;left:0;width:1080px;height:740px;object-fit:cover;display:block;z-index:1}
.hero-ph{position:absolute;top:0;left:0;width:1080px;height:740px;z-index:1;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#102544,#0a1830);font-size:16px;letter-spacing:4px;text-transform:uppercase;color:rgba(240,201,92,.4)}
.hero-ov{position:absolute;top:0;left:0;width:1080px;height:740px;z-index:2;
  background:linear-gradient(180deg,rgba(7,17,31,.65) 0%,rgba(7,17,31,.06) 22%,rgba(7,17,31,.04) 52%,rgba(7,17,31,.5) 78%,#0A1628 100%)}
.logo{position:absolute;top:56px;left:56px;width:192px;height:auto;z-index:5;filter:drop-shadow(0 3px 12px rgba(0,0,0,.7))}
.photos-row{position:absolute;top:740px;left:0;width:1080px;height:290px;display:flex;gap:3px;z-index:1;border-bottom:2px solid rgba(196,148,42,.28)}
.photo-s{flex:1;display:block;object-fit:cover;height:290px}
.photo-s-ph{flex:1;height:290px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#102544,#0a1830);font-size:13px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,201,92,.35)}
.divider{position:absolute;top:1030px;left:72px;width:936px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(196,148,42,.3) 18%,rgba(196,148,42,.55) 50%,rgba(196,148,42,.3) 82%,transparent);z-index:3}
.textblock{position:absolute;top:1060px;left:0;width:1080px;padding:0 72px;z-index:3}
.eyebrow{font-size:16px;font-weight:600;letter-spacing:5.5px;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
.headline{font-family:var(--serif);font-style:italic;font-weight:600;font-size:68px;line-height:1.09;color:var(--ow)}
.headline em{color:var(--gl);font-style:italic}
.rule{width:68px;height:3px;background:var(--gold);margin:26px 0 22px}
.price-block{margin-bottom:28px}
.price-kicker{font-size:16px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:7px}
.price-value{font-weight:800;font-size:52px;line-height:1;color:var(--gl)}
.bullets{display:flex;flex-direction:column;gap:13px}
.bullet{display:flex;align-items:center;gap:16px;font-size:21px;font-weight:500;letter-spacing:.15px;color:var(--ow)}
.arw{color:var(--gold);font-size:14px;font-weight:700;flex-shrink:0;margin-top:1px}
.footer{position:absolute;bottom:0;left:0;width:1080px;height:128px;display:flex;align-items:center;justify-content:space-between;padding:0 72px;border-top:1px solid rgba(196,148,42,.25);background:rgba(7,17,31,.75);z-index:4}
.fcta{font-size:21px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--gl)}
.loc-row{display:flex;align-items:center;gap:10px}
.loc{font-size:16px;font-weight:500;letter-spacing:3.5px;text-transform:uppercase;color:rgba(255,255,255,.78)}
.panel{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
button{font-family:var(--sans);font-weight:600;font-size:13px;padding:11px 18px;border-radius:8px;border:1px solid rgba(196,148,42,.5);background:#0f2140;color:#f5f5f0;cursor:pointer;transition:.15s}
button:hover{background:#16315f;border-color:var(--gold)}
button.primary{background:var(--gold);color:#1a1205;border-color:var(--gold)}
.status{font-size:12px;color:rgba(255,255,255,.5);min-height:16px;text-align:center}
</style>
</head>
<body>
<div class="stage"><div id="creative">
  ${heroEl}
  <div class="hero-ov"></div>
  ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="">` : ''}
  <div class="photos-row">${secEls}</div>
  <div class="divider"></div>
  <div class="textblock">
    ${loc ? `<div class="eyebrow">${esc(loc)}</div>` : ''}
    <div class="headline">${esc(headline || 'Seu imóvel aqui')}</div>
    <div class="rule"></div>
    ${preco ? `<div class="price-block"><div class="price-kicker">A partir de</div><div class="price-value">${esc(preco)}</div></div>` : ''}
    <div class="bullets">${bulletsHtml}</div>
  </div>
  <div class="footer">
    <div class="fcta">${esc(cta)}</div>
    ${loc ? `<div class="loc-row">${pinSvg()}<span class="loc">${esc(loc)}</span></div>` : ''}
  </div>
</div></div>
<div class="panel"><button class="primary" onclick="doExport()">&#11015; Baixar PNG (1080 × 1920)</button></div>
<div class="status" id="st"></div>
<script>${exportScript(1080, 1920, 'criativo-vitra-1080x1920.png')}</script>
</body>
</html>`
}

// ─── 1.91:1  1200 × 627 ──────────────────────────────────────────────────────
export function buildCreativo191x1(data) {
  const { headline, bairro, cidade, preco, cta = 'Agende sua visita', logoSrc, photos = [] } = data
  const bullets = buildBullets(data)
  const hero = photos[0] || null
  const loc = [bairro, cidade].filter(Boolean).join(' · ')

  const heroEl = hero
    ? `<img class="hero" src="${hero}" alt="">`
    : `<div class="hero-ph">FOTO PRINCIPAL</div>`

  const bulletsHtml = bullets
    .slice(0, 4)
    .map(b => `<div class="bullet"><span class="arw">›</span>${esc(b)}</div>`)
    .join('\n        ')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Criativo Vitra — 1.91:1</title>
<link href="${FONTS}" rel="stylesheet">
<script src="${H2C}"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--navy:#0A1628;--gold:#C4942A;--gl:#F0C95C;--ow:#F5F5F0;--sans:'Inter',sans-serif;--serif:'Playfair Display',serif}
body{background:#090e18;display:flex;flex-direction:column;align-items:center;gap:20px;padding:32px 14px;font-family:var(--sans);color:#fff;min-height:100vh}
#creative{position:relative;width:1200px;height:627px;overflow:hidden;color:#fff;
  background:radial-gradient(130% 120% at 30% 50%,#15315e 0%,#0A1628 48%,#07111F 100%);
  box-shadow:0 24px 70px rgba(0,0,0,.55)}
.logo{position:absolute;top:44px;left:60px;width:190px;height:auto;z-index:4;filter:drop-shadow(0 4px 14px rgba(0,0,0,.5))}
.textcol{position:absolute;top:0;left:0;width:540px;height:627px;display:flex;flex-direction:column;justify-content:center;padding:0 60px;z-index:2}
.headline{font-weight:800;font-size:38px;line-height:1.08;letter-spacing:.5px;text-transform:uppercase;color:var(--ow);margin-top:80px}
.rule{width:64px;height:3px;background:var(--gold);margin:16px 0 12px}
.bullets{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.bullet{display:flex;align-items:center;gap:10px;font-weight:600;font-size:17px;letter-spacing:.5px;text-transform:uppercase;color:var(--ow)}
.arw{color:var(--gl);font-weight:800;font-size:19px;line-height:1}
.price .kicker{font-size:14px;font-weight:600;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,.7)}
.price .value{font-weight:800;font-size:40px;line-height:1;color:var(--gl);margin-top:4px}
.divider{position:absolute;top:40px;left:540px;width:2px;height:547px;
  background:linear-gradient(180deg,transparent,rgba(196,148,42,.45) 20%,rgba(196,148,42,.55) 50%,rgba(196,148,42,.45) 80%,transparent);z-index:3}
.photocol{position:absolute;top:0;right:0;width:660px;height:627px;overflow:hidden}
.hero{display:block;width:100%;height:100%;object-fit:cover}
.hero-ph{display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,#102544,#0a1830);font-size:14px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,201,92,.4)}
.photo-ov{position:absolute;top:0;left:0;width:50px;height:627px;background:linear-gradient(90deg,#0A1628,transparent);z-index:2}
.footer{position:absolute;bottom:0;left:0;width:540px;height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 60px 0 60px;border-top:1px solid rgba(196,148,42,.22)}
.loc{font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.7)}
.fcta{font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gl)}
.panel{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
button{font-family:var(--sans);font-weight:600;font-size:13px;padding:11px 18px;border-radius:8px;border:1px solid rgba(196,148,42,.5);background:#0f2140;color:#f5f5f0;cursor:pointer;transition:.15s}
button:hover{background:#16315f;border-color:var(--gold)}
button.primary{background:var(--gold);color:#1a1205;border-color:var(--gold)}
.status{font-size:12px;color:rgba(255,255,255,.5);min-height:16px;text-align:center}
</style>
</head>
<body>
<div id="creative">
  ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="">` : ''}
  <div class="textcol">
    <div class="headline">${esc(headline || 'Seu imóvel aqui')}</div>
    <div class="rule"></div>
    <div class="bullets">${bulletsHtml}</div>
    ${preco ? `<div class="price"><div class="kicker">A partir de</div><div class="value">${esc(preco)}</div></div>` : ''}
  </div>
  <div class="divider"></div>
  <div class="photocol">
    <div class="photo-ov"></div>
    ${heroEl}
  </div>
  <div class="footer">
    ${loc ? `<span class="loc">${esc(loc)}</span>` : ''}
    <span class="fcta">${esc(cta)}</span>
  </div>
</div>
<div class="panel"><button class="primary" onclick="doExport()">&#11015; Baixar PNG (1200 × 627)</button></div>
<div class="status" id="st"></div>
<script>${exportScript(1200, 627, 'criativo-vitra-1200x627.png')}</script>
</body>
</html>`
}

// Converte File/Blob para data-URI base64 (usado no upload de fotos).
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Carrega um asset publico (URL relativa ao Vite dev server) e converte para base64.
// Usado para embutir o logo no HTML de exportação (blob URL não serve arquivos locais).
export async function fetchAsBase64(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return fileToBase64(blob)
  } catch {
    return null
  }
}

// Abre a string HTML como blob em nova aba.
export function openHtmlBlob(html) {
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  // Revoga após 60s (aba já terá carregado o conteúdo).
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
