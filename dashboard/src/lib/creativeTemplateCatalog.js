import { BRAND_SCOPES } from './brandProfiles.js'

export const TEMPLATE_FRAME_VARIANTS = {
  noFrame: 'sem-moldura',
  goldFrame: 'com-moldura',
}

const FORMAT_SUFFIXES = ['feed', 'story', 'wide']

const variantOptions = [
  { id: TEMPLATE_FRAME_VARIANTS.noFrame, label: 'Sem moldura', frame: 'none' },
  { id: TEMPLATE_FRAME_VARIANTS.goldFrame, label: 'Com moldura', frame: 'gold' },
]

function vitraImobiliariaReference(prefix) {
  return {
    [TEMPLATE_FRAME_VARIANTS.noFrame]: [
      `/generated/vitra-imobiliaria/${prefix}-1x1-sem-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-9x16-sem-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-1-91x1-sem-moldura.png`,
    ],
    [TEMPLATE_FRAME_VARIANTS.goldFrame]: [
      `/generated/vitra-imobiliaria/${prefix}-1x1-com-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-9x16-com-moldura.png`,
      `/generated/vitra-imobiliaria/${prefix}-1-91x1-com-moldura.png`,
    ],
  }
}

export const CREATIVE_TEMPLATE_CATALOG = {
  [BRAND_SCOPES.premium]: [
    {
      id: 'premium-auto-editorial',
      family: null,
      mode: 'auto_by_angle',
      name: 'Sistema editorial Premium',
      shortName: 'Automatico Premium',
      bestFor: 'Campanhas de alto padrao com variacao por objetivo, etapa e angulo de venda.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: 'auto',
      variants: [{ id: 'auto', label: 'Automatico', frame: 'auto' }],
      preview: null,
      variableFields: ['photos', 'headline', 'copy', 'differentials', 'cta'],
      fixedBrandRules: ['black_gold', 'premium_positioning', 'editorial_hierarchy'],
    },
  ],
  [BRAND_SCOPES.imobiliaria]: [
    {
      id: 'vitra-imobiliaria-dual-photo-offer',
      family: 'vitra-imobiliaria-dual-photo-offer',
      mode: 'single_family',
      name: 'Oferta com duas fotos',
      shortName: 'Duas fotos + oferta',
      bestFor: 'Promocoes, preco com comparativo, campanhas de bairro e chamadas diretas de conversao.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-sem-moldura.png',
      references: {
        [TEMPLATE_FRAME_VARIANTS.noFrame]: [
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-sem-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-9x16-sem-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1-91x1-sem-moldura.png',
        ],
        [TEMPLATE_FRAME_VARIANTS.goldFrame]: [
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-com-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-9x16-com-moldura.png',
          '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1-91x1-com-moldura.png',
        ],
      },
      variableFields: ['photos', 'headline', 'description', 'price', 'differentials', 'cta'],
      fixedBrandRules: ['navy_gold', 'approved_horizontal_logo', '135px_safe_zone', 'thin_gold_frame_optional'],
    },
    {
      id: 'vitra-imobiliaria-patios-gallery',
      family: 'vitra-imobiliaria-patios-gallery',
      mode: 'single_family',
      name: 'Galeria com beneficios',
      shortName: 'Patios + galeria',
      bestFor: 'Imoveis com varios ambientes, lista de beneficios e argumento de proximidade/localizacao.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.goldFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-02-patios-galeria-1x1-com-moldura.png',
      references: vitraImobiliariaReference('template-02-patios-galeria'),
      variableFields: ['photos', 'headline', 'price', 'features', 'location'],
      fixedBrandRules: ['navy_gold', 'approved_horizontal_logo', 'safe_zone', 'benefit_arrows'],
    },
    {
      id: 'vitra-imobiliaria-financiamento-orla',
      family: 'vitra-imobiliaria-financiamento-orla',
      mode: 'single_family',
      name: 'Financiamento e oportunidade',
      shortName: 'Financiamento Orla',
      bestFor: 'Campanhas de entrada, Minha Casa Minha Vida removido, preco de oportunidade e bairro.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-03-financiamento-orla-1x1-sem-moldura.png',
      references: vitraImobiliariaReference('template-03-financiamento-orla'),
      variableFields: ['photos', 'headline', 'financing_claim', 'price', 'neighborhood'],
      fixedBrandRules: ['navy_gold', 'approved_horizontal_logo', 'rounded_photo_frames', 'price_box'],
    },
    {
      id: 'vitra-imobiliaria-menino-deus-offer',
      family: 'vitra-imobiliaria-menino-deus-offer',
      mode: 'single_family',
      name: 'Oferta com foto protagonista',
      shortName: 'Menino Deus',
      bestFor: 'Imovel com foto forte, chamada por bairro, tarja de configuracao e bloco comercial claro.',
      formats: ['1:1', '9:16', '1.91:1'],
      defaultVariant: TEMPLATE_FRAME_VARIANTS.noFrame,
      variants: variantOptions,
      preview: '/generated/vitra-imobiliaria/template-04-menino-deus-1x1-sem-moldura.png',
      references: vitraImobiliariaReference('template-04-menino-deus'),
      variableFields: ['hero_photo', 'neighborhood', 'headline', 'price', 'condo_argument', 'features', 'address'],
      fixedBrandRules: ['navy_offwhite', 'official_blue_bands', 'approved_logo', 'address_lockup'],
    },
  ],
}

export function creativeTemplatesForBrand(brandScope) {
  return CREATIVE_TEMPLATE_CATALOG[brandScope] || CREATIVE_TEMPLATE_CATALOG[BRAND_SCOPES.premium]
}

export function defaultCreativeTemplateForBrand(brandScope) {
  return creativeTemplatesForBrand(brandScope)[0] || null
}

export function getCreativeTemplateById(brandScope, templateId) {
  const templates = creativeTemplatesForBrand(brandScope)
  return templates.find(template => template.id === templateId) || defaultCreativeTemplateForBrand(brandScope)
}

export function normalizeCreativeTemplateSelection(brandScope, templateId, variantId) {
  const template = getCreativeTemplateById(brandScope, templateId)
  const variant = template?.variants?.find(item => item.id === variantId) ||
    template?.variants?.find(item => item.id === template.defaultVariant) ||
    template?.variants?.[0] ||
    null

  return { template, variant }
}

export function templateFamilyFromTemplateKey(templateKey) {
  const key = String(templateKey || '')
  const suffix = FORMAT_SUFFIXES.find(format => key.endsWith(`-${format}`))
  return suffix ? key.slice(0, -suffix.length - 1) : key
}

export function creativeTemplateForTemplateKey(brandScope, templateKey) {
  const family = templateFamilyFromTemplateKey(templateKey)
  return creativeTemplatesForBrand(brandScope).find(template => template.family === family) || null
}

export function isApprovedTemplateKeyForBrand(brandScope, templateKey) {
  return Boolean(creativeTemplateForTemplateKey(brandScope, templateKey))
}

export function referencesForTemplateVariant(template, variantId) {
  if (!template?.references) return []
  return template.references[variantId] || template.references[template.defaultVariant] || []
}

export function frameForTemplateVariant(template, variantId) {
  const variant = template?.variants?.find(item => item.id === variantId) ||
    template?.variants?.find(item => item.id === template?.defaultVariant)
  return variant?.frame || 'none'
}
