import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dashboardRoot = path.resolve('D:/LEONARDO/Vitra/vitra-premium-ferramenta-operacional/dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const referencePath = path.join(
  repoRoot,
  'referencias-criativos-exemplos-vitra-imobiliaria',
  'c6f60649-36c4-42a0-af8d-fcf3fa76bcbe.jpg',
);
const logoPath = path.join(
  dashboardRoot,
  'public',
  'brand',
  'vitra-imobiliaria',
  'logos',
  'horizontal',
  'approved',
  'vitra-mae-horizontal-aprovada-8k.png',
);
const outDir = path.join(dashboardRoot, 'public', 'generated', 'vitra-imobiliaria');

const palette = {
  navy: '#0A1628',
  deepNavy: '#07111F',
  navyMid: '#0F2140',
  gold: '#C4942A',
  goldLight: '#F0C95C',
  offWhite: '#F5F5F0',
  white: '#FFFFFF',
};

const copy = {
  headlineA: '2 DORM. C/ SUÍTE',
  headlineB: 'COM 2 PÁTIOS',
  offerLabel: 'OPORTUNIDADE POR:',
  price: 'R$ 419.000,00',
  bullets: [
    '106M² PRIVATIVOS',
    'SUÍTE E CHURRASQUEIRA',
    'BAIXO CUSTO CONDOMÍNIO',
    'VAGA ESCRITURA COBERTA',
  ],
  locationLine: 'À 10 MIN. DO PRAIA DE BELAS',
  neighborhood: 'MEDIANEIRA',
};

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function bufferToDataUri(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function imageDataUri(filePath, width = null, trim = false) {
  let pipeline = sharp(filePath);
  if (trim) {
    pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 });
  }
  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  const buffer = await pipeline.png().toBuffer();
  return bufferToDataUri(buffer, 'image/png');
}

async function cropDataUri(rect, options = {}) {
  let pipeline = sharp(referencePath).extract(rect);
  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: 'cover',
      position: options.position ?? 'center',
    });
  }
  if (options.blur) {
    pipeline = pipeline.blur(options.blur);
  }
  if (options.modulate) {
    pipeline = pipeline.modulate(options.modulate);
  }
  const buffer = await pipeline.jpeg({ quality: options.quality ?? 88, mozjpeg: true }).toBuffer();
  return bufferToDataUri(buffer, 'image/jpeg');
}

function baseDefs() {
  return `
    <radialGradient id="bgGlow" cx="22%" cy="18%" r="92%">
      <stop offset="0" stop-color="${palette.navyMid}"/>
      <stop offset="0.48" stop-color="${palette.navy}"/>
      <stop offset="1" stop-color="${palette.deepNavy}"/>
    </radialGradient>
    <linearGradient id="blueVeil" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#163E93" stop-opacity="0.58"/>
      <stop offset="0.55" stop-color="${palette.navy}" stop-opacity="0.88"/>
      <stop offset="1" stop-color="${palette.deepNavy}" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="photoStroke" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.goldLight}"/>
      <stop offset="1" stop-color="${palette.gold}"/>
    </linearGradient>
    <filter id="photoShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.22"/>
    </filter>`;
}

function background({ width, height, bgUri }) {
  return `
  <rect width="${width}" height="${height}" fill="url(#bgGlow)"/>
  <image href="${bgUri}" x="${-width * 0.05}" y="${-height * 0.04}" width="${width * 1.1}" height="${height * 1.1}" preserveAspectRatio="xMidYMid slice" opacity="0.22"/>
  <rect width="${width}" height="${height}" fill="url(#blueVeil)"/>
  <path d="M0 0 H${width} V${height} H0 Z" fill="${palette.deepNavy}" opacity="0.16"/>
  <path d="M${-width * 0.08} ${height * 0.09} L${width * 0.3} -40 L${width * 0.2} ${height} H${-width * 0.08} Z" fill="#2E6BB5" opacity="0.10"/>
  <path d="M${width * 0.52} -40 L${width + 20} -40 L${width + 20} ${height} L${width * 0.8} ${height} Z" fill="${palette.gold}" opacity="0.045"/>`;
}

function frame({ width, height, withFrame }) {
  if (!withFrame) return '';
  return `
  <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="28" fill="none" stroke="${palette.gold}" stroke-width="1.3" opacity="0.75"/>
  <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="24" fill="none" stroke="${palette.white}" stroke-width="0.8" opacity="0.08"/>`;
}

function photoStack(photos, rects) {
  return `
  <g filter="url(#photoShadow)">
    ${rects
      .map(
        (rect, index) => `
    <image href="${photos[index]}" x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" preserveAspectRatio="xMidYMid slice"/>
    <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="none" stroke="url(#photoStroke)" stroke-width="${rect.stroke ?? 2}" opacity="0.70"/>`,
      )
      .join('')}
  </g>`;
}

function arrowBullet(x, y, text, scale = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M0 14 H42" stroke="${palette.goldLight}" stroke-width="6" stroke-linecap="round"/>
      <path d="M31 0 L62 14 L31 28 L38 17 H0 V11 H38 Z" fill="${palette.gold}" stroke="${palette.goldLight}" stroke-width="1.4" stroke-linejoin="round"/>
      <text x="82" y="22" fill="${palette.offWhite}" font-family="Inter, Montserrat, Arial, sans-serif" font-size="25" font-weight="650" letter-spacing="0.5">${escapeXml(text)}</text>
    </g>`;
}

function locationBlock({ pinX, pinY, textX, lineY, neighborhoodY, pinScale = 1, lineSize = 27, neighborhoodSize = 35 }) {
  return `
  <g transform="translate(${pinX} ${pinY}) scale(${pinScale})">
    <path d="M34 0 C52 0 68 15 68 35 C68 60 34 98 34 98 C34 98 0 60 0 35 C0 15 16 0 34 0 Z" fill="${palette.gold}" opacity="0.96"/>
    <circle cx="34" cy="34" r="13" fill="${palette.offWhite}"/>
  </g>
  <text x="${textX}" y="${lineY}" text-anchor="middle" fill="${palette.offWhite}" font-family="Inter, Montserrat, Arial, sans-serif" font-size="${lineSize}" font-weight="500" letter-spacing="0.8">${escapeXml(copy.locationLine)}</text>
  <text x="${textX}" y="${neighborhoodY}" text-anchor="middle" fill="${palette.white}" font-family="Inter, Montserrat, Arial, sans-serif" font-size="${neighborhoodSize}" font-weight="850" letter-spacing="1.3">${escapeXml(copy.neighborhood)}</text>`;
}

function renderSquareSvg({ logoUri, bgUri, photos, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>${baseDefs()}</defs>
  ${background({ width: 1080, height: 1080, bgUri })}
  ${frame({ width: 1080, height: 1080, withFrame })}

  <image href="${logoUri}" x="358" y="52" width="364" height="82" preserveAspectRatio="xMidYMid meet"/>

  <g font-family="Arial Narrow, Impact, Inter, Arial, sans-serif" font-weight="900" letter-spacing="-1.4">
    <text x="56" y="225" fill="${palette.white}" font-size="74">${escapeXml(copy.headlineA)}</text>
    <text x="56" y="330" fill="${palette.goldLight}" font-size="77">${escapeXml(copy.headlineB)}</text>
  </g>

  <g font-family="Inter, Montserrat, Arial, sans-serif">
    <text x="110" y="464" fill="${palette.offWhite}" font-size="30" font-weight="400" letter-spacing="1.2">${escapeXml(copy.offerLabel)}</text>
    <text x="110" y="540" fill="${palette.goldLight}" font-size="66" font-weight="900" letter-spacing="-1">${escapeXml(copy.price)}</text>
  </g>

  ${photoStack(photos, [
    { x: 630, y: 188, w: 384, h: 208 },
    { x: 630, y: 424, w: 384, h: 208 },
    { x: 630, y: 660, w: 384, h: 208 },
  ])}

  <g filter="url(#softShadow)">
    ${copy.bullets.map((text, index) => arrowBullet(96, 608 + index * 56, text)).join('')}
  </g>

  ${locationBlock({ pinX: 220, pinY: 874, textX: 540, lineY: 957, neighborhoodY: 1008 })}
</svg>`;
}

function renderVerticalSvg({ logoUri, bgUri, photos, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>${baseDefs()}</defs>
  ${background({ width: 1080, height: 1920, bgUri })}
  ${frame({ width: 1080, height: 1920, withFrame })}

  <image href="${logoUri}" x="318" y="78" width="444" height="100" preserveAspectRatio="xMidYMid meet"/>

  <g font-family="Arial Narrow, Impact, Inter, Arial, sans-serif" font-weight="900" letter-spacing="-1.2">
    <text x="540" y="318" text-anchor="middle" fill="${palette.white}" font-size="78">${escapeXml(copy.headlineA)}</text>
    <text x="540" y="418" text-anchor="middle" fill="${palette.goldLight}" font-size="82">${escapeXml(copy.headlineB)}</text>
  </g>

  <g font-family="Inter, Montserrat, Arial, sans-serif">
    <text x="540" y="535" text-anchor="middle" fill="${palette.offWhite}" font-size="30" font-weight="400" letter-spacing="1.2">${escapeXml(copy.offerLabel)}</text>
    <text x="540" y="610" text-anchor="middle" fill="${palette.goldLight}" font-size="70" font-weight="900" letter-spacing="-1">${escapeXml(copy.price)}</text>
  </g>

  ${photoStack(photos, [
    { x: 120, y: 690, w: 840, h: 258 },
    { x: 120, y: 978, w: 840, h: 258 },
    { x: 120, y: 1266, w: 840, h: 258 },
  ])}

  <g filter="url(#softShadow)" transform="translate(78 0)">
    ${copy.bullets.map((text, index) => arrowBullet(250, 1576 + index * 54, text, 0.86)).join('')}
  </g>

  ${locationBlock({ pinX: 360, pinY: 1782, textX: 578, lineY: 1825, neighborhoodY: 1864, pinScale: 0.58, lineSize: 21, neighborhoodSize: 30 })}
</svg>`;
}

function renderHorizontalSvg({ logoUri, bgUri, photos, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="628" viewBox="0 0 1200 628" xmlns="http://www.w3.org/2000/svg">
  <defs>${baseDefs()}</defs>
  ${background({ width: 1200, height: 628, bgUri })}
  ${frame({ width: 1200, height: 628, withFrame })}

  <image href="${logoUri}" x="74" y="54" width="300" height="68" preserveAspectRatio="xMidYMid meet"/>

  <g font-family="Arial Narrow, Impact, Inter, Arial, sans-serif" font-weight="900" letter-spacing="-1">
    <text x="64" y="190" fill="${palette.white}" font-size="58">${escapeXml(copy.headlineA)}</text>
    <text x="64" y="260" fill="${palette.goldLight}" font-size="61">${escapeXml(copy.headlineB)}</text>
  </g>

  <g font-family="Inter, Montserrat, Arial, sans-serif">
    <text x="74" y="350" fill="${palette.offWhite}" font-size="22" font-weight="400" letter-spacing="1.1">${escapeXml(copy.offerLabel)}</text>
    <text x="74" y="405" fill="${palette.goldLight}" font-size="50" font-weight="900" letter-spacing="-0.8">${escapeXml(copy.price)}</text>
  </g>

  ${photoStack(photos, [
    { x: 768, y: 66, w: 374, h: 146, stroke: 1.6 },
    { x: 768, y: 242, w: 374, h: 146, stroke: 1.6 },
    { x: 768, y: 418, w: 374, h: 146, stroke: 1.6 },
  ])}

  <g filter="url(#softShadow)">
    ${arrowBullet(74, 454, copy.bullets[0], 0.66)}
    ${arrowBullet(74, 496, copy.bullets[1], 0.66)}
    ${arrowBullet(442, 454, copy.bullets[2], 0.66)}
    ${arrowBullet(442, 496, copy.bullets[3], 0.66)}
  </g>

  ${locationBlock({ pinX: 500, pinY: 520, textX: 646, lineY: 548, neighborhoodY: 572, pinScale: 0.3, lineSize: 14, neighborhoodSize: 18 })}
</svg>`;
}

async function prepareAssets() {
  const logoUri = await imageDataUri(logoPath, 920, true);
  const bgUri = await cropDataUri(
    { left: 0, top: 0, width: 1080, height: 1080 },
    {
      width: 1200,
      height: 1920,
      blur: 28,
      modulate: { brightness: 0.62, saturation: 0.8 },
      quality: 82,
    },
  );
  const photos = await Promise.all([
    cropDataUri({ left: 656, top: 180, width: 392, height: 230 }, { width: 900, height: 520 }),
    cropDataUri({ left: 656, top: 420, width: 392, height: 228 }, { width: 900, height: 520 }),
    cropDataUri({ left: 656, top: 664, width: 392, height: 224 }, { width: 900, height: 520 }),
  ]);

  return { logoUri, bgUri, photos };
}

async function writeCreative({ format, withFrame, renderer, assets }) {
  const suffix = withFrame ? 'com-moldura' : 'sem-moldura';
  const basename = `template-02-patios-galeria-${format}-${suffix}`;
  const svg = renderer({ ...assets, withFrame });
  const svgPath = path.join(outDir, `${basename}.svg`);
  const pngPath = path.join(outDir, `${basename}.png`);

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);

  return { svgPath, pngPath };
}

const assets = await prepareAssets();
const outputs = [];
for (const withFrame of [false, true]) {
  outputs.push(await writeCreative({ format: '1x1', withFrame, renderer: renderSquareSvg, assets }));
  outputs.push(await writeCreative({ format: '9x16', withFrame, renderer: renderVerticalSvg, assets }));
  outputs.push(await writeCreative({ format: '1-91x1', withFrame, renderer: renderHorizontalSvg, assets }));
}

for (const output of outputs) {
  console.log(output.pngPath);
}
