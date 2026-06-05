import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dashboardRoot = path.resolve('D:/LEONARDO/Vitra/vitra-premium-ferramenta-operacional/dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const referencePath = path.join(
  repoRoot,
  'referencias-criativos-exemplos-vitra-imobiliaria',
  'WhatsApp Image 2026-06-03 at 18.37.42.jpeg',
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
  blue: '#123B86',
  gold: '#C4942A',
  goldLight: '#F0C95C',
  offWhite: '#F5F5F0',
  white: '#FFFFFF',
};

const copy = {
  programA: 'MINHA CASA',
  programB: 'MINHA VIDA',
  programC: 'FINANCIAMENTO',
  headlineA: '1DORM E 2DORM',
  headlineB: 'JUNTO À NOVA ORLA',
  financeLine: 'ATÉ 100% FINANCIADO',
  offerLabel: 'OPORTUNIDADE A PARTIR',
  price: 'R$ 242.050,00',
  neighborhood: 'BAIRRO CRISTAL',
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
  if (options.blur) pipeline = pipeline.blur(options.blur);
  if (options.modulate) pipeline = pipeline.modulate(options.modulate);
  const buffer = await pipeline.jpeg({ quality: options.quality ?? 88, mozjpeg: true }).toBuffer();
  return bufferToDataUri(buffer, 'image/jpeg');
}

function defs() {
  return `
    <radialGradient id="bgGlow" cx="20%" cy="10%" r="96%">
      <stop offset="0" stop-color="#164599"/>
      <stop offset="0.5" stop-color="${palette.navy}"/>
      <stop offset="1" stop-color="${palette.deepNavy}"/>
    </radialGradient>
    <linearGradient id="blueVeil" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#123F95" stop-opacity="0.72"/>
      <stop offset="0.5" stop-color="${palette.navy}" stop-opacity="0.90"/>
      <stop offset="1" stop-color="${palette.deepNavy}" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="goldStroke" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.goldLight}"/>
      <stop offset="1" stop-color="${palette.gold}"/>
    </linearGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <filter id="priceShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.28"/>
    </filter>`;
}

function background(width, height) {
  return `
  <rect width="${width}" height="${height}" fill="url(#bgGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#blueVeil)"/>
  <path d="M${-width * 0.12} 0 L${width * 0.34} 0 L${width * 0.18} ${height} H${-width * 0.12} Z" fill="#2E6BB5" opacity="0.11"/>
  <path d="M${width * 0.74} 0 L${width + 40} 0 V${height} H${width * 0.88} Z" fill="${palette.gold}" opacity="0.04"/>`;
}

function frame({ width, height, withFrame, inset = 22, radius = 28 }) {
  if (!withFrame) return '';
  return `
  <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="${radius}" fill="none" stroke="${palette.gold}" stroke-width="1.3" opacity="0.78"/>`;
}

function brandProgramBadge(x, y, scale = 1) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="0" y="0" width="156" height="142" rx="22" fill="${palette.offWhite}" stroke="${palette.goldLight}" stroke-width="3"/>
    <circle cx="54" cy="28" r="11" fill="${palette.goldLight}"/>
    <path d="M32 61 C42 42 59 41 74 56 C86 42 105 44 116 61 Z" fill="#2E6BB5"/>
    <path d="M41 69 C50 55 64 55 77 67 C89 55 105 56 115 69 Z" fill="${palette.gold}"/>
    <text x="78" y="86" text-anchor="middle" fill="${palette.deepNavy}" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900">${copy.programA}</text>
    <text x="78" y="104" text-anchor="middle" fill="${palette.deepNavy}" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="900">${copy.programB}</text>
    <rect x="16" y="112" width="124" height="22" rx="11" fill="${palette.navy}"/>
    <text x="78" y="128" text-anchor="middle" fill="${palette.offWhite}" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="800" letter-spacing="1">${copy.programC}</text>
  </g>`;
}

function titleBlock({ x, y, anchor = 'start', sizeA, sizeB, financeSize }) {
  return `
  <g font-family="Arial Narrow, Impact, Inter, Arial, sans-serif" font-weight="900" letter-spacing="-1.4">
    <text x="${x}" y="${y}" text-anchor="${anchor}" fill="${palette.white}" font-size="${sizeA}">${escapeXml(copy.headlineA)}</text>
    <text x="${x}" y="${y + sizeA * 0.92}" text-anchor="${anchor}" fill="${palette.goldLight}" font-size="${sizeB}">${escapeXml(copy.headlineB)}</text>
  </g>
  <text x="${x}" y="${y + sizeA * 1.47}" text-anchor="${anchor}" fill="${palette.offWhite}" font-family="Inter, Arial, sans-serif" font-size="${financeSize}" font-weight="700" letter-spacing="10">${escapeXml(copy.financeLine)}</text>`;
}

function photoFrame(id, uri, { x, y, w, h, rx, stroke = 7 }) {
  return `
  <clipPath id="${id}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>
  </clipPath>
  <g filter="url(#softShadow)">
    <image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="url(#goldStroke)" stroke-width="${stroke}"/>
  </g>`;
}

function priceBox({ x, y, w, h, labelY, priceY, labelSize, priceSize, radius = 36 }) {
  return `
  <text x="${x + w / 2}" y="${labelY}" text-anchor="middle" fill="${palette.offWhite}" font-family="Inter, Arial, sans-serif" font-size="${labelSize}" font-weight="750" letter-spacing="9">${escapeXml(copy.offerLabel)}</text>
  <g filter="url(#priceShadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${palette.navy}" opacity="0.78" stroke="url(#goldStroke)" stroke-width="7"/>
    <text x="${x + w / 2}" y="${priceY}" text-anchor="middle" fill="${palette.goldLight}" font-family="Arial Narrow, Impact, Inter, Arial, sans-serif" font-size="${priceSize}" font-weight="900" letter-spacing="-1">${escapeXml(copy.price)}</text>
  </g>`;
}

function renderSquareSvg({ logoUri, bgUri, photos, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}</defs>
  ${background(1080, 1080)}
  ${frame({ width: 1080, height: 1080, withFrame })}

  <image href="${logoUri}" x="445" y="36" width="190" height="46" preserveAspectRatio="xMidYMid meet"/>
  ${titleBlock({ x: 540, y: 176, anchor: 'middle', sizeA: 82, sizeB: 76, financeSize: 28 })}

  ${photoFrame('sqPhotoA', photos[0], { x: 72, y: 340, w: 452, h: 222, rx: 30 })}
  ${photoFrame('sqPhotoB', photos[1], { x: 556, y: 340, w: 452, h: 222, rx: 30 })}

  ${priceBox({ x: 130, y: 725, w: 820, h: 190, labelY: 692, priceY: 858, labelSize: 31, priceSize: 112 })}
  <text x="540" y="1018" text-anchor="middle" fill="${palette.offWhite}" font-family="Inter, Arial, sans-serif" font-size="29" font-weight="500" letter-spacing="17">${escapeXml(copy.neighborhood)}</text>
</svg>`;
}

function renderVerticalSvg({ logoUri, bgUri, photos, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}</defs>
  ${background(1080, 1920)}
  ${frame({ width: 1080, height: 1920, withFrame, radius: 34 })}

  <image href="${logoUri}" x="334" y="86" width="392" height="92" preserveAspectRatio="xMidYMid meet"/>
  ${titleBlock({ x: 540, y: 300, anchor: 'middle', sizeA: 92, sizeB: 86, financeSize: 30 })}

  ${photoFrame('stPhotoA', photos[0], { x: 116, y: 548, w: 848, h: 360, rx: 30 })}
  ${photoFrame('stPhotoB', photos[1], { x: 116, y: 952, w: 848, h: 360, rx: 30 })}

  ${priceBox({ x: 126, y: 1464, w: 828, h: 210, labelY: 1412, priceY: 1608, labelSize: 30, priceSize: 102 })}
  <text x="540" y="1766" text-anchor="middle" fill="${palette.offWhite}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="500" letter-spacing="16">${escapeXml(copy.neighborhood)}</text>
</svg>`;
}

function renderHorizontalSvg({ logoUri, bgUri, photos, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="628" viewBox="0 0 1200 628" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}</defs>
  ${background(1200, 628)}
  ${frame({ width: 1200, height: 628, withFrame, inset: 6, radius: 20 })}

  <image href="${logoUri}" x="54" y="96" width="178" height="42" preserveAspectRatio="xMidYMid meet"/>
  ${titleBlock({ x: 276, y: 92, sizeA: 72, sizeB: 66, financeSize: 22 })}

  ${photoFrame('wdPhotoA', photos[0], { x: 70, y: 265, w: 438, h: 180, rx: 24, stroke: 5 })}
  ${photoFrame('wdPhotoB', photos[1], { x: 548, y: 265, w: 438, h: 180, rx: 24, stroke: 5 })}

  ${priceBox({ x: 230, y: 496, w: 740, h: 80, labelY: 480, priceY: 558, labelSize: 20, priceSize: 56, radius: 22 })}
  <text x="600" y="612" text-anchor="middle" fill="${palette.offWhite}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="500" letter-spacing="7">${escapeXml(copy.neighborhood)}</text>
</svg>`;
}

async function writeAsset(name, svg) {
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);
  await fs.writeFile(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  return pngPath;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const logoUri = await imageDataUri(logoPath, 900, true);
  const photos = [
    await cropDataUri({ left: 63, top: 337, width: 464, height: 232 }, { width: 1200, height: 620, position: 'center' }),
    await cropDataUri({ left: 575, top: 337, width: 462, height: 232 }, { width: 1200, height: 620, position: 'center' }),
  ];

  const outputs = [];
  for (const withFrame of [false, true]) {
    const suffix = withFrame ? 'com-moldura' : 'sem-moldura';
    outputs.push(
      await writeAsset(`template-03-financiamento-orla-1x1-${suffix}`, renderSquareSvg({ logoUri, photos, withFrame })),
      await writeAsset(`template-03-financiamento-orla-9x16-${suffix}`, renderVerticalSvg({ logoUri, photos, withFrame })),
      await writeAsset(`template-03-financiamento-orla-1-91x1-${suffix}`, renderHorizontalSvg({ logoUri, photos, withFrame })),
    );
  }
  outputs.forEach(output => console.log(output));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
