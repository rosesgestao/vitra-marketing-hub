import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dashboardRoot = path.resolve('D:/LEONARDO/Vitra/vitra-premium-ferramenta-operacional/dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const referencePath = path.join(
  repoRoot,
  'referencias-criativos-exemplos-vitra-imobiliaria',
  '2f906bc4-34bb-491b-99e0-776c5df2733a.jpg',
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
const logoNavyPath = path.join(
  dashboardRoot,
  'public',
  'brand',
  'vitra-imobiliaria',
  'logos',
  'horizontal',
  'variants',
  'vitra-mae-horizontal-aprovada-navy-8k.png',
);
const outDir = path.join(dashboardRoot, 'public', 'generated', 'vitra-imobiliaria');

const palette = {
  navy: '#0A1628',
  deepNavy: '#07111F',
  navyMid: '#0F2140',
  charcoal: '#0A1628',
  gold: '#C4942A',
  goldLight: '#F0C95C',
  offWhite: '#F5F5F0',
  white: '#FFFFFF',
};

const copy = {
  tagA: 'OPORTUNIDADE',
  tagB: 'MENINO',
  tagC: 'DEUS',
  feature: '2 DORMIT\u00D3RIOS C/ SU\u00CDTE',
  priceLabel: 'APENAS',
  price: 'R$ 539 MIL',
  priceNoteA: 'MENOR VALOR',
  priceNoteB: 'DO CONDOM\u00CDNIO',
  details: [
    '61M\u00B2 \u00B7 Churrasqueira e Sacada',
    'Infraestrutura Completa',
    'Im\u00F3vel nunca habitado',
    '10\u00BA Andar com Vista Livre',
  ],
  location: 'AV. JOS\u00C9 DE ALENCAR - MENINO DEUS',
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
  if (options.modulate) pipeline = pipeline.modulate(options.modulate);
  const buffer = await pipeline.jpeg({ quality: options.quality ?? 90, mozjpeg: true }).toBuffer();
  return bufferToDataUri(buffer, 'image/jpeg');
}

function defs() {
  return `
    <linearGradient id="photoShade" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.navy}" stop-opacity="0.16"/>
      <stop offset="0.7" stop-color="${palette.deepNavy}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${palette.deepNavy}" stop-opacity="0.30"/>
    </linearGradient>
    <radialGradient id="panelGlow" cx="24%" cy="8%" r="88%">
      <stop offset="0" stop-color="#164599"/>
      <stop offset="0.52" stop-color="${palette.navy}"/>
      <stop offset="1" stop-color="${palette.deepNavy}"/>
    </radialGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
    <filter id="lightShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.16"/>
    </filter>`;
}

function frame({ width, height, withFrame, inset = 22, radius = 28 }) {
  if (!withFrame) return '';
  return `<rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="${radius}" fill="none" stroke="${palette.gold}" stroke-width="1.3" opacity="0.76"/>`;
}

function heroImage({ uri, x, y, w, h, id, radius = 0 }) {
  const clip = radius
    ? `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"/></clipPath>`
    : '';
  const clipAttr = radius ? ` clip-path="url(#${id})"` : '';
  return `
  ${clip}
  <image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"${clipAttr}/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="url(#photoShade)"${clipAttr}/>`;
}

function opportunityTag({ x, y, w, h, scale = 1, tagATracking = 10 }) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})" filter="url(#softShadow)">
    <rect x="0" y="0" width="${w}" height="${h}" fill="${palette.navy}" opacity="0.96"/>
    <text x="${w / 2}" y="${h * 0.30}" text-anchor="middle" fill="${palette.white}" font-family="Inter, Arial, sans-serif" font-size="${32}" font-weight="450" letter-spacing="${tagATracking}">${copy.tagA}</text>
    <text x="${w / 2}" y="${h * 0.61}" text-anchor="middle" fill="${palette.white}" font-family="Inter, Arial, sans-serif" font-size="${54}" font-weight="850" letter-spacing="10">${copy.tagB}</text>
    <text x="${w / 2}" y="${h * 0.87}" text-anchor="middle" fill="${palette.white}" font-family="Inter, Arial, sans-serif" font-size="${54}" font-weight="850" letter-spacing="10">${copy.tagC}</text>
  </g>`;
}

function featureRibbon({ x, y, w, h, fontSize, emoji = false }) {
  return `
  <g filter="url(#lightShadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${palette.navy}"/>
    <text x="${x + w / 2}" y="${y + h * 0.66}" text-anchor="middle" fill="${palette.white}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="760" letter-spacing="8">${escapeXml(copy.feature)}</text>
    ${emoji ? `<circle cx="${x + w - 46}" cy="${y + h / 2}" r="${h * 0.42}" fill="${palette.gold}" opacity="0.95"/><text x="${x + w - 46}" y="${y + h * 0.63}" text-anchor="middle" fill="${palette.navy}" font-family="Inter, Arial, sans-serif" font-size="${fontSize * 0.55}" font-weight="900">V</text>` : ''}
  </g>`;
}

function detailsLines({ x, y, fontSize, gap, anchor = 'middle', fill = palette.charcoal }) {
  return copy.details
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * gap}" text-anchor="${anchor}" fill="${fill}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="680" letter-spacing="1.1">${escapeXml(line)}</text>`,
    )
    .join('');
}

function priceBlock({ x, y, priceSize, noteSize, labelSize, compact = false, dividerOffset = null }) {
  const dividerX = x + (dividerOffset ?? (compact ? 306 : 425));
  const noteX = dividerX + (compact ? 25 : 34);
  return `
  <g font-family="Inter, Arial, sans-serif">
    <text x="${x}" y="${y}" fill="${palette.charcoal}" font-size="${labelSize}" font-weight="460" letter-spacing="5">${copy.priceLabel}</text>
    <text x="${x}" y="${y + priceSize * 0.92}" fill="${palette.charcoal}" font-size="${priceSize}" font-weight="900" letter-spacing="-1">${copy.price}</text>
    <line x1="${dividerX}" y1="${y + 10}" x2="${dividerX}" y2="${y + priceSize * 0.96}" stroke="${palette.charcoal}" stroke-width="${compact ? 3 : 4}"/>
    <text x="${noteX}" y="${y + noteSize * 1.15}" fill="${palette.charcoal}" font-size="${noteSize}" font-weight="800" letter-spacing="1.1">${copy.priceNoteA}</text>
    <text x="${noteX}" y="${y + noteSize * 2.35}" fill="${palette.charcoal}" font-size="${noteSize}" font-weight="800" letter-spacing="1.1">${copy.priceNoteB}</text>
  </g>`;
}

function locationRow({ x, y, size = 30, fill = palette.charcoal, anchor = 'middle', pinX = x - 52, pinScale = 1 }) {
  return `
  <g>
    <g transform="translate(${pinX} ${y - 3}) scale(${pinScale}) translate(${-pinX} ${-(y - 3)})">
      <path d="M${pinX} ${y - 32} C${pinX + 17} ${y - 32} ${pinX + 30} ${y - 18} ${pinX + 30} ${y - 2} C${pinX + 30} ${y + 22} ${pinX} ${y + 58} ${pinX} ${y + 58} C${pinX} ${y + 58} ${pinX - 30} ${y + 22} ${pinX - 30} ${y - 2} C${pinX - 30} ${y - 18} ${pinX - 15} ${y - 32} ${pinX} ${y - 32} Z" fill="${palette.gold}"/>
      <circle cx="${pinX}" cy="${y - 3}" r="11" fill="${palette.offWhite}"/>
    </g>
    <text x="${x}" y="${y + 10}" text-anchor="${anchor}" fill="${fill}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="780" letter-spacing="1.2">${escapeXml(copy.location)}</text>
  </g>`;
}

function renderSquareSvg({ logoUri, heroUri, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}</defs>
  <rect width="1080" height="1080" fill="${palette.offWhite}"/>
  ${heroImage({ uri: heroUri, x: 0, y: 0, w: 1080, h: 610, id: 'sqHero' })}
  <rect x="0" y="580" width="1080" height="48" fill="${palette.navy}"/>
  ${opportunityTag({ x: 52, y: 42, w: 324, h: 244, scale: 1, tagATracking: 4.5 })}
  <image href="${logoUri}" x="806" y="64" width="196" height="46" preserveAspectRatio="xMidYMid meet"/>
  ${featureRibbon({ x: 196, y: 594, w: 724, h: 74, fontSize: 38 })}
  ${priceBlock({ x: 246, y: 742, priceSize: 65, noteSize: 29, labelSize: 25 })}
  ${detailsLines({ x: 540, y: 852, fontSize: 25, gap: 36 })}
  ${locationRow({ x: 612, y: 1012, size: 25, pinX: 328, pinScale: 0.56 })}
  ${frame({ width: 1080, height: 1080, withFrame })}
</svg>`;
}

function renderVerticalSvg({ logoUri, heroUri, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}</defs>
  <rect width="1080" height="1920" fill="${palette.offWhite}"/>
  ${heroImage({ uri: heroUri, x: 0, y: 0, w: 1080, h: 900, id: 'stHero' })}
  <rect x="0" y="852" width="1080" height="64" fill="${palette.navy}"/>
  ${opportunityTag({ x: 64, y: 68, w: 330, h: 252, scale: 1, tagATracking: 4.5 })}
  <image href="${logoUri}" x="736" y="82" width="224" height="52" preserveAspectRatio="xMidYMid meet"/>
  ${featureRibbon({ x: 130, y: 858, w: 820, h: 96, fontSize: 42 })}
  ${priceBlock({ x: 170, y: 1102, priceSize: 78, noteSize: 34, labelSize: 31, dividerOffset: 465 })}
  ${detailsLines({ x: 540, y: 1338, fontSize: 32, gap: 50 })}
  ${locationRow({ x: 600, y: 1712, size: 27, pinX: 260, pinScale: 0.58 })}
  ${frame({ width: 1080, height: 1920, withFrame, radius: 34 })}
</svg>`;
}

function renderHorizontalSvg({ logoUri, logoNavyUri, heroUri, withFrame }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="628" viewBox="0 0 1200 628" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs()}</defs>
  <rect width="1200" height="628" fill="${palette.offWhite}"/>
  ${heroImage({ uri: heroUri, x: 0, y: 0, w: 628, h: 628, id: 'wdHero' })}
  <rect x="0" y="600" width="628" height="28" fill="${palette.navy}"/>
  <rect x="628" y="0" width="572" height="628" fill="${palette.offWhite}"/>
  ${opportunityTag({ x: 38, y: 42, w: 480, h: 218, scale: 0.64 })}
  <image href="${logoNavyUri}" x="900" y="48" width="180" height="42" preserveAspectRatio="xMidYMid meet"/>
  ${featureRibbon({ x: 458, y: 210, w: 664, h: 68, fontSize: 31 })}
  ${priceBlock({ x: 650, y: 370, priceSize: 52, noteSize: 18, labelSize: 20, compact: true })}
  ${detailsLines({ x: 894, y: 496, fontSize: 20, gap: 28 })}
  ${locationRow({ x: 900, y: 586, size: 16, pinX: 700, pinScale: 0.42 })}
  ${frame({ width: 1200, height: 628, withFrame, inset: 8, radius: 20 })}
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
  const logoNavyUri = await imageDataUri(logoNavyPath, 900, true);
  const heroUri = await cropDataUri(
    { left: 0, top: 250, width: 1080, height: 360 },
    { width: 1600, height: 900, position: 'center' },
  );

  const outputs = [];
  for (const withFrame of [false, true]) {
    const suffix = withFrame ? 'com-moldura' : 'sem-moldura';
    outputs.push(
      await writeAsset(`template-04-menino-deus-1x1-${suffix}`, renderSquareSvg({ logoUri, heroUri, withFrame })),
      await writeAsset(`template-04-menino-deus-9x16-${suffix}`, renderVerticalSvg({ logoUri, heroUri, withFrame })),
      await writeAsset(`template-04-menino-deus-1-91x1-${suffix}`, renderHorizontalSvg({ logoUri, logoNavyUri, heroUri, withFrame })),
    );
  }
  outputs.forEach(output => console.log(output));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
