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

export const DEFAULT_TEMPLATE_IMAGE_SLOTS = [
  { id: 'fachada', label: 'Fachada / principal', multiple: false, required: true },
  { id: 'living', label: 'Interior / living', multiple: false },
  { id: 'varanda', label: 'Varanda / vista', multiple: false },
  { id: 'infraestrutura', label: 'Infraestrutura / lazer', multiple: false },
  { id: 'extras', label: 'Imagens extras', multiple: true },
]

const commonPremiumFieldGroups = [
  {
    id: 'product',
    title: 'Dados do Produto',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Lake Baikal' },
      { key: 'tagline', label: 'Tagline / Empreendimento', type: 'text', placeholder: 'Ex: GOLDEN LAKE - MULTIPLAN' },
      { key: 'location', label: 'Localizacao', type: 'text', placeholder: 'Ex: Orla do Guaiba, Porto Alegre' },
      { key: 'area', label: 'Metragem', type: 'text', placeholder: 'Ex: 195 a 250 m2' },
      { key: 'suites', label: 'Suites', type: 'text', placeholder: 'Ex: 4 suites' },
      { key: 'towers', label: 'Andares / Torres', type: 'text', placeholder: 'Ex: 2 torres de 30 pavimentos' },
      { key: 'differentials', label: 'Diferenciais', type: 'textarea', placeholder: 'Ex: Beach Club, lago cristalino, spa', colSpan: 'full' },
      { key: 'price', label: 'Preco', type: 'money', placeholder: 'Ex: Sob consulta' },
    ],
  },
  {
    id: 'copy',
    title: 'Textos Base',
    fields: [
      { key: 'suggested_headline', label: 'Headline sugerida', type: 'text', placeholder: 'Ex: O proximo capitulo de sofisticacao na Orla', colSpan: 'full' },
      { key: 'suggested_copy', label: 'Copy sugerida', type: 'textarea', placeholder: 'Ex: Residencias de 195 a 250 m2 com 4 suites.', colSpan: 'full' },
      { key: 'cta', label: 'CTA padrao', type: 'text', placeholder: 'Ex: Conheca o projeto', colSpan: 'full' },
    ],
  },
]

const dualPhotoOfferFieldGroups = [
  {
    id: 'offer',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Isla Zona Sul' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 44, helper: 'Headline curta — ate 44 caracteres para caber na arte.', placeholder: 'Ex: More ou invista no coracao da Zona Norte', colSpan: 'full' },
      { key: 'area', label: 'Subtitulo / caracteristica', type: 'text', placeholder: 'Ex: 2 dormitorios com suite, churrasqueira e ate 2 vagas', colSpan: 'full' },
      { key: 'price_from', label: 'Valor de', type: 'money', placeholder: 'Ex: R$ 450 mil' },
      { key: 'price', label: 'Valor por', type: 'money', required: true, placeholder: 'Ex: R$ 399 mil' },
      { key: 'differentials', label: 'Diferenciais', type: 'list', required: true, placeholder: 'Um diferencial por linha', helper: 'Use 2 itens para este layout.', colSpan: 'full' },
      { key: 'cta', label: 'Texto do botao', type: 'text', placeholder: 'Ex: Clique para receber mais informacoes', colSpan: 'full' },
    ],
  },
]

const patiosGalleryFieldGroups = [
  {
    id: 'gallery',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Casa com patio' },
      { key: 'suggested_headline', label: 'Headline principal', type: 'text', required: true, maxLength: 40, helper: 'Headline curta — ate 40 caracteres para caber na arte.', placeholder: 'Ex: 2 dorm. c/ suite com 2 patios', colSpan: 'full' },
      { key: 'price', label: 'Valor de oportunidade', type: 'money', required: true, placeholder: 'Ex: R$ 419.000,00' },
      { key: 'differentials', label: 'Caracteristicas do imovel', type: 'list', required: true, placeholder: '106m2 privativos\nSuite e churrasqueira\nBaixo custo condominio\nVaga escritura coberta', colSpan: 'full' },
      { key: 'location', label: 'Texto de localizacao', type: 'text', placeholder: 'Ex: A 10 min. do Praia de Belas', colSpan: 'full' },
      { key: 'neighborhood', label: 'Bairro', type: 'text', placeholder: 'Ex: Medianeira' },
    ],
  },
]

const financiamentoOrlaFieldGroups = [
  {
    id: 'financing',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Nova Orla' },
      { key: 'suggested_headline', label: 'Headline', type: 'text', required: true, maxLength: 34, helper: 'Headline curta — ate 34 caracteres para caber na arte deste template.', placeholder: 'Ex: 1 dorm e 2 dorm junto a Nova Orla', colSpan: 'full' },
      { key: 'financing_claim', formKey: 'tagline', label: 'Chamada de financiamento', type: 'text', placeholder: 'Ex: Ate 100% financiado', colSpan: 'full' },
      { key: 'price', label: 'Valor a partir de', type: 'money', required: true, placeholder: 'Ex: R$ 242.050,00' },
      { key: 'neighborhood', label: 'Bairro / localizacao curta', type: 'text', placeholder: 'Ex: Bairro Cristal' },
    ],
  },
]

const meninoDeusFieldGroups = [
  {
    id: 'opportunity',
    title: 'Campos do Template',
    fields: [
      { key: 'product_name', label: 'Nome do Produto', type: 'text', required: true, placeholder: 'Ex: Oportunidade Menino Deus' },
      { key: 'neighborhood', label: 'Bairro em destaque', type: 'text', required: true, placeholder: 'Ex: Menino Deus' },
      { key: 'suites', label: 'Faixa principal', type: 'text', required: true, placeholder: 'Ex: 2 dormitorios c/ suite', colSpan: 'full' },
      { key: 'price', label: 'Valor', type: 'money', required: true, placeholder: 'Ex: R$ 539 mil' },
      { key: 'condo_argument', formKey: 'offer', label: 'Argumento lateral', type: 'text', placeholder: 'Ex: Menor valor do condominio' },
      { key: 'differentials', label: 'Diferenciais', type: 'list', placeholder: '61m2 - Churrasqueira e sacada\nInfraestrutura completa\nImovel nunca habitado\n10o andar com vista livre', colSpan: 'full' },
      { key: 'location', label: 'Endereco / localizacao', type: 'text', required: true, placeholder: 'Ex: Av. Jose de Alencar - Menino Deus', colSpan: 'full' },
    ],
  },
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

const templateVariationContracts = {
  dualPhotoOffer: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem a composicao aprovada e alterna somente argumento comercial, textos, CTA e ordem das fotos.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'safe_zone', 'format_grid'],
    mutableSlots: ['headline', 'subtitle', 'price', 'differentials', 'cta', 'photos'],
    recipes: [
      { id: 'oferta-direta', label: 'Oferta direta', phase: '1', angle: 'editorial', headline: '{headline}', copy: '{offer}. Imovel com informacao clara, fotos do produto e proximo passo simples.', cta: '{cta}' },
      { id: 'valor-comparativo', label: 'Valor comparativo', phase: '2', angle: 'investimento', headline: '{product}: valor para avaliar agora', copy: 'Compare preco, localizacao e diferenciais antes de decidir. A Vitra organiza as informacoes essenciais.', cta: 'Fale com a Vitra' },
      { id: 'localizacao-bairro', label: 'Localizacao e bairro', phase: '1', angle: 'localizacao', headline: '{product} em {place}', copy: 'A localizacao entra como criterio central da decisao. Veja fotos, pontos de interesse e condicoes do imovel.', cta: 'Receber informacoes' },
      { id: 'diferenciais-produto', label: 'Diferenciais do imovel', phase: '2', angle: 'diferenciais', headline: 'Diferenciais que ajudam na decisao', copy: '{details}. Uma leitura objetiva para entender se este imovel combina com sua busca.', cta: 'Conhecer diferenciais' },
      { id: 'decisao-rapida', label: 'Convite para avaliacao', phase: '3', angle: 'escassez', headline: 'Oportunidade para avaliar agora', copy: 'Alguns imoveis pedem uma avaliacao rapida e bem informada. Fale com a Vitra para confirmar disponibilidade.', cta: 'Avaliar agora' },
    ],
  },
  patiosGallery: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem galeria, setas e hierarquia aprovadas, variando chamada, ordem de beneficios e foto principal.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'benefit_arrows', 'photo_grid'],
    mutableSlots: ['headline', 'price', 'features', 'location', 'photos'],
    recipes: [
      { id: 'patios-suite', label: 'Configuracao forte', phase: '1', angle: 'diferenciais', headline: '{headline}', copy: '{details}. Destaques que ajudam a entender valor de uso e decisao.', cta: 'Fale com a Vitra' },
      { id: 'area-privativa', label: 'Area e uso', phase: '2', angle: 'arquitetura', headline: '{area} com boa leitura de uso', copy: 'Planta, area e rotina precisam fazer sentido juntos. Veja os principais pontos deste imovel.', cta: 'Ver detalhes' },
      { id: 'baixo-custo', label: 'Custo de moradia', phase: '2', angle: 'investimento', headline: 'Compra com criterio de custo e valor', copy: 'Compare valor, condominio e diferenciais antes de decidir. A Vitra ajuda nessa leitura.', cta: 'Comparar informacoes' },
      { id: 'localizacao-proxima', label: 'Proximidade', phase: '1', angle: 'localizacao', headline: '{product}: perto do que importa', copy: '{location}. Um argumento de localizacao para avaliar junto das fotos e caracteristicas.', cta: 'Conhecer localizacao' },
      { id: 'visita-decisao', label: 'Chamada para visita', phase: '3', angle: 'escassez', headline: 'Veja se este imovel encaixa na sua rotina', copy: 'Fotos, beneficios e localizacao reunidos para uma avaliacao mais rapida e objetiva.', cta: 'Agendar conversa' },
    ],
  },
  financiamentoOrla: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem bloco de financiamento, fotos duplas e preco aprovado; varia chamada, tese de oportunidade e bairro.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'price_box', 'rounded_photo_frames'],
    mutableSlots: ['headline', 'financing_claim', 'price', 'neighborhood', 'photos'],
    recipes: [
      { id: 'financiamento', label: 'Financiamento', phase: '1', angle: 'investimento', headline: '{headline}', copy: '{financing_claim}. Oportunidade para avaliar condicoes, bairro e fotos do empreendimento.', cta: 'Fale com a Vitra' },
      { id: 'preco-partida', label: 'Preco de partida', phase: '2', angle: 'curadoria', headline: 'Oportunidade a partir de {price}', copy: 'Confira se esta faixa de valor faz sentido para sua busca e receba os detalhes com a Vitra.', cta: 'Receber detalhes' },
      { id: 'bairro', label: 'Bairro e localizacao', phase: '1', angle: 'localizacao', headline: '{product} em {neighborhood}', copy: 'Localizacao, fotos e condicoes em uma peca objetiva para comparar antes de decidir.', cta: 'Conhecer o bairro' },
      { id: 'primeira-compra', label: 'Primeira compra', phase: '2', angle: 'lifestyle', headline: 'Um caminho mais claro para comprar', copy: 'A Vitra organiza as informacoes do imovel para voce entender preco, fotos e proximos passos.', cta: 'Entender condicoes' },
      { id: 'urgencia', label: 'Avaliacao rapida', phase: '3', angle: 'escassez', headline: 'Avalie disponibilidade e condicoes', copy: 'Campanhas com preco de entrada pedem confirmacao rapida. Fale com a Vitra para seguir com seguranca.', cta: 'Confirmar disponibilidade' },
    ],
  },
  meninoDeus: {
    strategy: 'approved_template_slots_only',
    description: 'Mantem foto protagonista, tarjas navy e bloco comercial claro; varia bairro, argumento e diferencais.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette', 'official_blue_bands', 'address_lockup'],
    mutableSlots: ['hero_photo', 'neighborhood', 'headline', 'price', 'condo_argument', 'features', 'address'],
    recipes: [
      { id: 'bairro-destaque', label: 'Bairro em destaque', phase: '1', angle: 'localizacao', headline: 'Oportunidade em {neighborhood}', copy: '{location}. Uma leitura objetiva para quem quer morar ou investir com apoio da Vitra.', cta: 'Fale com a Vitra' },
      { id: 'valor-condominio', label: 'Valor e condominio', phase: '2', angle: 'investimento', headline: '{product}: compare custo e valor', copy: 'Preco, condominio e diferenciais reunidos para uma decisao mais segura.', cta: 'Comparar detalhes' },
      { id: 'suite-configuracao', label: 'Configuracao do imovel', phase: '2', angle: 'diferenciais', headline: '{suites}', copy: '{details}. Veja se a configuracao faz sentido para sua rotina.', cta: 'Ver configuracao' },
      { id: 'foto-protagonista', label: 'Foto protagonista', phase: '1', angle: 'lifestyle', headline: 'Veja o imovel antes de decidir', copy: 'A foto principal conduz a primeira leitura. Depois, a Vitra ajuda a validar valor, bairro e proximos passos.', cta: 'Receber fotos' },
      { id: 'convite-visita', label: 'Convite para visita', phase: '3', angle: 'escassez', headline: 'Confirme se ainda esta disponivel', copy: 'Se a localizacao e o valor fazem sentido, o proximo passo e validar disponibilidade com a Vitra.', cta: 'Confirmar disponibilidade' },
    ],
  },
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
      fieldGroups: commonPremiumFieldGroups,
      imageSlots: DEFAULT_TEMPLATE_IMAGE_SLOTS,
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
      fieldGroups: dualPhotoOfferFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto esquerda / fachada', multiple: false, required: true },
        { id: 'living', label: 'Foto direita / lazer', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.dualPhotoOffer,
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
      fieldGroups: patiosGalleryFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto 1 / ambiente principal', multiple: false, required: true },
        { id: 'living', label: 'Foto 2 / area externa', multiple: false, required: true },
        { id: 'varanda', label: 'Foto 3 / detalhe complementar', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.patiosGallery,
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
      fieldGroups: financiamentoOrlaFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto esquerda / localizacao', multiple: false, required: true },
        { id: 'living', label: 'Foto direita / empreendimento', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.financiamentoOrla,
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
      fieldGroups: meninoDeusFieldGroups,
      imageSlots: [
        { id: 'fachada', label: 'Foto protagonista', multiple: false, required: true },
        { id: 'extras', label: 'Imagens extras', multiple: true },
      ],
      variationContract: templateVariationContracts.meninoDeus,
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

export function fieldGroupsForTemplate(template) {
  return template?.fieldGroups?.length ? template.fieldGroups : []
}

export function fieldsForTemplate(template) {
  return fieldGroupsForTemplate(template).flatMap(group => group.fields || [])
}

export function formKeyForTemplateField(field) {
  return field?.formKey || field?.key
}

export function imageSlotsForTemplate(template) {
  return template?.imageSlots?.length ? template.imageSlots : DEFAULT_TEMPLATE_IMAGE_SLOTS
}

export function variationContractForTemplate(template) {
  return template?.variationContract || {
    strategy: 'default_template_slots_only',
    description: 'Mantem o template selecionado e varia apenas os campos preenchidos no brief.',
    lockedSlots: ['layout', 'logo', 'typography', 'palette'],
    mutableSlots: template?.variableFields || ['photos', 'headline', 'copy', 'cta'],
    recipes: [],
  }
}

export function variationRecipesForTemplate(template) {
  return variationContractForTemplate(template).recipes || []
}

export function frameForTemplateVariant(template, variantId) {
  const variant = template?.variants?.find(item => item.id === variantId) ||
    template?.variants?.find(item => item.id === template?.defaultVariant)
  return variant?.frame || 'none'
}
