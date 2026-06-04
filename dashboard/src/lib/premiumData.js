import { supabase } from './supabase.js'
import { BRAND_SCOPES, getBrandProfile, inferCampaignBrandScope } from './brandProfiles.js'

export const PREMIUM_TABLES = [
  {
    name: 'premium_campaigns',
    label: 'Campanhas',
    purpose: 'Brief, objetivo, produto, periodo, status e plano de conteudo.',
  },
  {
    name: 'premium_campaign_assets',
    label: 'Assets',
    purpose: 'Pecas planejadas e renderizadas: Meta Ads, carrosseis, WhatsApp, e-mail e landing.',
  },
  {
    name: 'premium_content_posts',
    label: 'Conteudos',
    purpose: 'Posts editoriais derivados dos assets, com legenda, hashtags, CTA e agenda.',
  },
  {
    name: 'premium_publications',
    label: 'Publicacoes',
    purpose: 'Vinculo entre conteudo planejado e post real publicado ou importado da plataforma.',
  },
  {
    name: 'premium_metrics',
    label: 'Metricas',
    purpose: 'Historico por publicacao, separando coleta organica, paga, manual e importada.',
  },
  {
    name: 'premium_generation_jobs',
    label: 'Jobs',
    purpose: 'Fila de geracao, renderizacao, upload, importacao e sincronizacao de metricas.',
  },
  {
    name: 'social_accounts',
    label: 'Contas sociais',
    purpose: 'Mapeamento das contas Vitra Premium sem armazenar tokens no browser.',
  },
  {
    name: 'social_metric_snapshots',
    label: 'Snapshots sociais',
    purpose: 'Foto historica de seguidores, alcance e impressoes por conta.',
  },
]

const ASSET_BLUEPRINTS = [
  ['meta-awareness-feed', 'meta_ad', 'meta_ads', 'feed', 'Meta Ads Awareness - 1:1', '1:1', 'premium-editorial-feed'],
  ['meta-awareness-story', 'meta_ad', 'meta_ads', 'story', 'Meta Ads Awareness - 9:16', '9:16', 'premium-editorial-story'],
  ['meta-awareness-wide', 'meta_ad', 'meta_ads', 'wide', 'Meta Ads Awareness - 1.91:1', '1.91:1', 'premium-editorial-wide'],
  ['meta-leads-feed', 'meta_ad', 'meta_ads', 'feed', 'Meta Ads Leads - 1:1', '1:1', 'premium-lead-feed'],
  ['meta-leads-story', 'meta_ad', 'meta_ads', 'story', 'Meta Ads Leads - 9:16', '9:16', 'premium-lead-story'],
  ['meta-leads-wide', 'meta_ad', 'meta_ads', 'wide', 'Meta Ads Leads - 1.91:1', '1.91:1', 'premium-lead-wide'],
  ['meta-retarget-feed', 'meta_ad', 'meta_ads', 'feed', 'Meta Ads Retarget - 1:1', '1:1', 'premium-retarget-feed'],
  ['meta-retarget-story', 'meta_ad', 'meta_ads', 'story', 'Meta Ads Retarget - 9:16', '9:16', 'premium-retarget-story'],
  ['meta-retarget-wide', 'meta_ad', 'meta_ads', 'wide', 'Meta Ads Retarget - 1.91:1', '1.91:1', 'premium-retarget-wide'],
  ['reels-hook', 'short_video', 'instagram', 'reels', 'Reels - Hook de Campanha', '9:16', 'premium-reels-hook'],
  ['reels-proof', 'short_video', 'instagram', 'reels', 'Reels - Prova de Valor', '9:16', 'premium-reels-proof'],
  ['carousel-cover', 'carousel', 'instagram', 'carousel_cover', 'Carrossel - Capa Editorial', '4:5', 'premium-carousel-cover'],
  ['carousel-market', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Mercado e Valorizacao', '4:5', 'premium-carousel-market'],
  ['carousel-lifestyle', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Lifestyle', '4:5', 'premium-carousel-lifestyle'],
  ['carousel-investment', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Investimento', '4:5', 'premium-carousel-investment'],
  ['carousel-authority', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - Autoridade', '4:5', 'premium-carousel-authority'],
  ['carousel-cta', 'carousel', 'instagram', 'carousel_slide', 'Carrossel - CTA Final', '4:5', 'premium-carousel-cta'],
  ['whatsapp-opener', 'whatsapp', 'whatsapp', 'message', 'WhatsApp - Abertura Consultiva', null, 'premium-whatsapp-opener'],
  ['whatsapp-followup', 'whatsapp', 'whatsapp', 'message', 'WhatsApp - Follow-up 24h', null, 'premium-whatsapp-followup'],
  ['whatsapp-visit', 'whatsapp', 'whatsapp', 'message', 'WhatsApp - Convite Visita', null, 'premium-whatsapp-visit'],
  ['email-invite', 'email', 'email', 'html_email', 'E-mail - Convite Curadoria', null, 'premium-email-invite'],
  ['email-proof', 'email', 'email', 'html_email', 'E-mail - Prova e Escassez', null, 'premium-email-proof'],
  ['landing-hero', 'landing_page', 'site', 'landing_section', 'Landing - Hero Premium', 'desktop', 'premium-landing-hero'],
  ['landing-gallery', 'landing_page', 'site', 'landing_section', 'Landing - Galeria e Diferenciais', 'desktop', 'premium-landing-gallery'],
  ['thumbnail-youtube', 'thumbnail', 'youtube', 'thumbnail', 'YouTube - Thumbnail', '16:9', 'premium-youtube-thumb'],
  ['stories-sequence-1', 'story', 'instagram', 'story', 'Stories - Sequencia 1', '9:16', 'premium-stories-1'],
  ['stories-sequence-2', 'story', 'instagram', 'story', 'Stories - Sequencia 2', '9:16', 'premium-stories-2'],
]

const AD_GROUP_LABEL = {
  'meta-awareness': 'Awareness',
  'meta-leads': 'Leads',
  'meta-retarget': 'Retargeting',
}

const META_CREATIVE_VARIATION_MIN = 3
const META_CREATIVE_VARIATION_DEFAULT = 8
const META_CREATIVE_VARIATION_MAX = 12

const META_FORMAT_BLUEPRINTS = [
  { key: 'feed', format: 'feed', title: '1:1', aspectRatio: '1:1', templateSuffix: 'feed' },
  { key: 'story', format: 'story', title: '9:16', aspectRatio: '9:16', templateSuffix: 'story' },
  { key: 'wide', format: 'wide', title: '1.91:1', aspectRatio: '1.91:1', templateSuffix: 'wide' },
]

const META_CREATIVE_CONCEPTS = [
  { key: 'meta-awareness-editorial', label: 'Awareness - Editorial', phase: '1', templateBase: 'premium-editorial', angle: 'editorial' },
  { key: 'meta-leads-curadoria', label: 'Leads - Curadoria', phase: '2', templateBase: 'premium-lead', angle: 'curadoria' },
  { key: 'meta-retarget-criterio', label: 'Retargeting - Criterio', phase: '3', templateBase: 'premium-retarget', angle: 'criterio' },
  { key: 'meta-diferenciais-produto', label: 'Diferenciais - Produto', phase: '2', templateBase: 'premium-lead', angle: 'diferenciais' },
  { key: 'meta-localizacao-valor', label: 'Localizacao - Valor', phase: '1', templateBase: 'premium-editorial', angle: 'localizacao' },
  { key: 'meta-lifestyle-experiencia', label: 'Lifestyle - Experiencia', phase: '2', templateBase: 'premium-editorial', angle: 'lifestyle' },
  { key: 'meta-investimento-patrimonio', label: 'Investimento - Patrimonio', phase: '2', templateBase: 'premium-lead', angle: 'investimento' },
  { key: 'meta-escassez-convite', label: 'Escassez - Convite', phase: '3', templateBase: 'premium-retarget', angle: 'escassez' },
  { key: 'meta-vista-arquitetura', label: 'Vista - Arquitetura', phase: '1', templateBase: 'premium-editorial', angle: 'arquitetura' },
  { key: 'meta-liquidez-decisao', label: 'Liquidez - Decisao', phase: '2', templateBase: 'premium-lead', angle: 'liquidez' },
  { key: 'meta-prova-premium', label: 'Prova - Premium', phase: '2', templateBase: 'premium-retarget', angle: 'prova' },
  { key: 'meta-whatsapp-consultivo', label: 'WhatsApp - Consultivo', phase: '3', templateBase: 'premium-lead', angle: 'whatsapp' },
]

export const VITRA_IMOBILIARIA_TEMPLATE_BASE = 'vitra-imobiliaria-dual-photo-offer'

const VITRA_IMOBILIARIA_META_CREATIVE_CONCEPTS = [
  { key: 'meta-awareness-mercado', label: 'Awareness - Mercado', phase: '1', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'editorial' },
  { key: 'meta-leads-imovel', label: 'Leads - Imóvel', phase: '2', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'curadoria' },
  { key: 'meta-retarget-visita', label: 'Retargeting - Visita', phase: '3', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'criterio' },
  { key: 'meta-diferenciais-produto', label: 'Diferenciais - Produto', phase: '2', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'diferenciais' },
  { key: 'meta-localizacao-valor', label: 'Localização - Valor', phase: '1', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'localizacao' },
  { key: 'meta-bairro-cotidiano', label: 'Bairro - Cotidiano', phase: '2', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'lifestyle' },
  { key: 'meta-investimento-patrimonio', label: 'Investimento - Patrimônio', phase: '2', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'investimento' },
  { key: 'meta-oportunidade-convite', label: 'Oportunidade - Convite', phase: '3', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'escassez' },
  { key: 'meta-planta-espaco', label: 'Planta - Espaço', phase: '1', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'arquitetura' },
  { key: 'meta-liquidez-decisao', label: 'Liquidez - Decisão', phase: '2', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'liquidez' },
  { key: 'meta-prova-portfolio', label: 'Prova - Portfólio', phase: '2', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'prova' },
  { key: 'meta-whatsapp-atendimento', label: 'WhatsApp - Atendimento', phase: '3', templateBase: VITRA_IMOBILIARIA_TEMPLATE_BASE, angle: 'whatsapp' },
]

const SUPPORT_ASSET_BLUEPRINTS = ASSET_BLUEPRINTS.filter(([, , channel]) => channel !== 'meta_ads')

const PREMIUM_VISUAL_MODELS = {
  'premium-photo-offer': {
    key: 'premium-photo-offer',
    label: 'Foto protagonista + oferta',
    purpose: 'Usar quando a imagem do imovel tem alto apelo imediato e pode conduzir a peca.',
    reference_pattern: 'Foto full-bleed, moldura fina, faixa de destaque e CTA discreto.',
  },
  'premium-editorial-panel': {
    key: 'premium-editorial-panel',
    label: 'Painel editorial + imagem',
    purpose: 'Usar para conceitos de awareness, investimento e autoridade.',
    reference_pattern: 'Bloco tipografico sofisticado sobre campo preto com imagem como contraponto.',
  },
  'premium-dark-spec': {
    key: 'premium-dark-spec',
    label: 'Ficha premium escura',
    purpose: 'Usar para diferenciais, argumentos racionais e captura de lead.',
    reference_pattern: 'Imagem escurecida, lista curta de atributos e CTA consultivo.',
  },
  'premium-location-panorama': {
    key: 'premium-location-panorama',
    label: 'Panorama de localizacao',
    purpose: 'Usar para vista, bairro, distancia, orla e argumentos de localizacao.',
    reference_pattern: 'Imagem ampla com base editorial e marcador dourado de localizacao.',
  },
  'premium-gallery-proof': {
    key: 'premium-gallery-proof',
    label: 'Prova visual / galeria',
    purpose: 'Usar quando a campanha precisa reforcar variedade, estrutura ou prova visual.',
    reference_pattern: 'Composicao com area de imagem e painel de prova sem excesso comercial.',
  },
}

const VISUAL_MODEL_BY_ANGLE = {
  editorial: 'premium-editorial-panel',
  curadoria: 'premium-dark-spec',
  criterio: 'premium-editorial-panel',
  diferenciais: 'premium-dark-spec',
  localizacao: 'premium-location-panorama',
  lifestyle: 'premium-photo-offer',
  investimento: 'premium-editorial-panel',
  escassez: 'premium-photo-offer',
  arquitetura: 'premium-photo-offer',
  liquidez: 'premium-dark-spec',
  prova: 'premium-gallery-proof',
  whatsapp: 'premium-dark-spec',
}

// Fase narrativa da campanha por blueprint: 1=Teaser, 2=Revelacao, 3=Urgencia
const PHASE_BY_BLUEPRINT = {
  'meta-awareness-feed': '1',
  'meta-awareness-story': '1',
  'reels-hook': '1',
  'carousel-cover': '1',
  'stories-sequence-1': '1',
  'email-invite': '1',
  'landing-hero': '1',
  'thumbnail-youtube': '1',
  'carousel-market': '2',
  'carousel-lifestyle': '2',
  'carousel-investment': '2',
  'carousel-authority': '2',
  'reels-proof': '2',
  'meta-leads-feed': '2',
  'meta-leads-story': '2',
  'stories-sequence-2': '2',
  'email-proof': '2',
  'landing-gallery': '2',
  'whatsapp-opener': '2',
  'meta-retarget-feed': '3',
  'meta-retarget-story': '3',
  'carousel-cta': '3',
  'whatsapp-followup': '3',
  'whatsapp-visit': '3',
}

export function phaseForBlueprint(key) {
  return PHASE_BY_BLUEPRINT[key] || '2'
}

const POST_BLUEPRINTS = [
  {
    assetKey: 'reels-hook',
    platform: 'instagram',
    format: 'reels',
    editorial_pillar: 'Lifestyle & Alto Padrao',
    title: 'Abertura da campanha',
    hook: 'Um endereco raro pede uma apresentacao a altura.',
  },
  {
    assetKey: 'carousel-market',
    platform: 'instagram',
    format: 'carousel',
    editorial_pillar: 'Mercado & Valorizacao',
    title: 'Por que este ativo merece atencao',
    hook: 'O alto padrao tambem e uma decisao patrimonial.',
  },
  {
    assetKey: 'carousel-investment',
    platform: 'instagram',
    format: 'carousel',
    editorial_pillar: 'Investimento & Patrimonio',
    title: 'Tese de investimento',
    hook: 'Localizacao, liquidez e escassez mudam a conversa.',
  },
  {
    assetKey: 'carousel-lifestyle',
    platform: 'instagram',
    format: 'carousel',
    editorial_pillar: 'Lifestyle & Alto Padrao',
    title: 'Experiencia de morar',
    hook: 'A planta certa organiza a vida antes mesmo da mudanca.',
  },
  {
    assetKey: 'meta-leads-curadoria-feed',
    platform: 'facebook',
    format: 'feed',
    editorial_pillar: 'Imoveis & Produtos',
    title: 'Anuncio de captacao',
    hook: 'Receba uma curadoria reservada da Vitra Premium.',
  },
  {
    assetKey: 'stories-sequence-1',
    platform: 'instagram',
    format: 'stories',
    editorial_pillar: 'Autoridade & Posicionamento',
    title: 'Stories de autoridade',
    hook: 'Nao e volume de oferta. E precisao de curadoria.',
  },
]

export function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

function metaCreativeVariationCount(form) {
  return clampNumber(
    form.creative_variations,
    META_CREATIVE_VARIATION_MIN,
    META_CREATIVE_VARIATION_MAX,
    META_CREATIVE_VARIATION_DEFAULT,
  )
}

function metaCreativeConceptsForBrand(brandProfile) {
  return brandProfile.scope === BRAND_SCOPES.imobiliaria
    ? VITRA_IMOBILIARIA_META_CREATIVE_CONCEPTS
    : META_CREATIVE_CONCEPTS
}

function selectedMetaCreativeConcepts(form, brandProfile = getBrandProfile()) {
  return metaCreativeConceptsForBrand(brandProfile).slice(0, metaCreativeVariationCount(form))
}

function buildMetaAssetBlueprints(form, brandProfile = getBrandProfile()) {
  return selectedMetaCreativeConcepts(form, brandProfile).flatMap(concept => (
    META_FORMAT_BLUEPRINTS.map(format => [
      `${concept.key}-${format.key}`,
      'meta_ad',
      'meta_ads',
      format.format,
      `Meta Ads ${concept.label} - ${format.title}`,
      format.aspectRatio,
      `${concept.templateBase}-${format.templateSuffix}`,
      concept,
    ])
  ))
}

function buildCampaignAssetBlueprints(form, brandProfile = getBrandProfile()) {
  return [
    ...buildMetaAssetBlueprints(form, brandProfile),
    ...SUPPORT_ASSET_BLUEPRINTS,
  ]
}

function visualModelForConcept(concept, brandProfile = getBrandProfile()) {
  const key = VISUAL_MODEL_BY_ANGLE[concept?.angle] || 'premium-editorial-panel'
  const model = PREMIUM_VISUAL_MODELS[key]
  if (brandProfile.scope !== BRAND_SCOPES.imobiliaria) return model
  const labels = {
    'premium-photo-offer': 'Foto protagonista + chamada',
    'premium-editorial-panel': 'Painel institucional + imagem',
    'premium-dark-spec': 'Ficha comercial escura',
    'premium-location-panorama': 'Panorama de localização',
    'premium-gallery-proof': 'Prova visual / portfólio',
  }
  return {
    ...model,
    label: labels[key] || model.label,
    purpose: `Usar em campanhas da ${brandProfile.name}, mantendo navy, dourado e comunicação consultiva.`,
    reference_pattern: 'Foto do imóvel, hierarquia clara de informação e CTA de atendimento.',
  }
}

function visualTemplateForAsset({ channel, templateKey, title, concept, brandProfile = getBrandProfile() }) {
  if (channel === 'meta_ads' && brandProfile.scope === BRAND_SCOPES.imobiliaria) {
    return {
      key: templateKey,
      family: VITRA_IMOBILIARIA_TEMPLATE_BASE,
      label: 'Template aprovado Vitra Imobiliaria - duas fotos + oferta',
      purpose: 'Gerar criativos Meta Ads da marca-mae mantendo estrutura visual padronizada e variaveis por campanha.',
      reference_pattern: 'Logo horizontal aprovada, headline em duas linhas, descricao curta, capsula de preco, duas fotos do imovel, dois diferenciais, CTA dourado e slogan.',
      variable_fields: ['photos', 'headline', 'description', 'price', 'differentials', 'cta'],
      fixed_brand_rules: ['navy_gold', 'approved_horizontal_logo', '135px_safe_zone', 'thin_gold_frame_optional'],
      approved_reference_files: [
        '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1x1-sem-moldura.png',
        '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-9x16-sem-moldura.png',
        '/generated/vitra-imobiliaria/criativo-zona-norte-nova-identidade-1-91x1-sem-moldura.png',
      ],
    }
  }

  return channel === 'meta_ads'
    ? visualModelForConcept(concept, brandProfile)
    : {
        key: templateKey,
        label: title,
        purpose: brandProfile.supportAssetPurpose,
        reference_pattern: brandProfile.supportAssetPattern,
      }
}

export function isVitraImobiliariaApprovedTemplateAsset(asset) {
  const templateKey = String(asset?.template_key || asset?.metadata?.visual_template?.key || '')
  return asset?.channel === 'meta_ads' &&
    templateKey.startsWith(VITRA_IMOBILIARIA_TEMPLATE_BASE)
}

export function needsVitraImobiliariaApprovedTemplateRender(asset) {
  if (!isVitraImobiliariaApprovedTemplateAsset(asset)) return false
  return asset.status === 'queued' ||
    !asset.public_url ||
    asset.metadata?.rendered_template_family !== VITRA_IMOBILIARIA_TEMPLATE_BASE
}

function buildSourceIntake(form) {
  const sourceType = cleanText(form.source_type) || 'manual'
  const sourceUrl = cleanText(form.source_url)
  const landingUrl = cleanText(form.landing_url)
  const whatsappUrl = cleanText(form.whatsapp_url)

  return {
    type: sourceType,
    url: sourceUrl || null,
    landing_url: landingUrl || null,
    whatsapp_url: whatsappUrl || null,
    notes: cleanText(form.automation_notes) || null,
    ingestion_mode: sourceUrl || landingUrl ? 'auto_image_ingestion_plus_manual_upload' : 'manual_brief_upload',
    ingestion_status: sourceUrl || landingUrl ? 'source_registered' : 'manual_input',
    human_touchpoints: ['confirmar_brief', 'aprovar_criativos', 'autorizar_publicacao_e_verba'],
  }
}

function buildAutomationWorkflow(sourceIntake) {
  return {
    mode: 'low_touch_paid_traffic_creative_pipeline',
    source_first: Boolean(sourceIntake.url),
    stages: [
      'captura_de_fonte_e_brief',
      'classificacao_de_midia',
      'geracao_de_cortes_meta_ads',
      'qa_de_marca_e_formatos',
      'aprovacao_em_lote',
      'exportacao_para_meta_ads',
    ],
    publication_policy: 'export_or_draft_first_no_auto_budget',
  }
}

function buildDefaultUrlParams(campaign, blueprintKey) {
  const slug = campaign.slug || slugify(campaign.name || 'vitra-premium')
  return `utm_source=meta&utm_medium=paid_social&utm_campaign=${slug}&utm_content=${blueprintKey}`
}

function buildInitialQaChecks({ channel, aspectRatio, primaryImage, headline, copy, cta, sourceIntake, brandProfile = getBrandProfile() }) {
  if (channel !== 'meta_ads') {
    return [
      { id: 'brand_scope', label: `Escopo ${brandProfile.name}`, ok: true },
      { id: 'copy_base', label: 'Texto base definido', ok: Boolean(headline && copy && cta) },
    ]
  }

  return [
    {
      id: 'source_registered',
      label: 'Fonte do imovel registrada',
      ok: Boolean(sourceIntake.url || primaryImage),
      severity: sourceIntake.url || primaryImage ? 'pass' : 'warning',
    },
    {
      id: 'source_image',
      label: 'Imagem base vinculada',
      ok: Boolean(primaryImage),
      severity: primaryImage ? 'pass' : 'warning',
    },
    {
      id: 'meta_format',
      label: 'Formato Meta Ads definido',
      ok: Boolean(aspectRatio),
      expected: aspectRatio,
    },
    {
      id: 'text_pack',
      label: 'Headline, copy e CTA definidos',
      ok: Boolean(headline && copy && cta),
    },
    {
      id: 'destination',
      label: 'Destino comercial definido',
      ok: Boolean(sourceIntake.landing_url || sourceIntake.whatsapp_url),
      severity: sourceIntake.landing_url || sourceIntake.whatsapp_url ? 'pass' : 'warning',
    },
    {
      id: 'brand_rules',
      label: brandProfile.qaBrandLabel,
      ok: true,
    },
  ]
}

function buildInputSnapshot(form, sourceIntake) {
  const imageSlots = imageGroupsFromForm(form)
  return {
    source_intake: sourceIntake,
    product_name: cleanText(form.product_name),
    tagline: cleanText(form.tagline),
    location: cleanText(form.location),
    area: cleanText(form.area),
    suites: cleanText(form.suites),
    towers: cleanText(form.towers),
    price: cleanText(form.price),
    target_audience: cleanText(form.target_audience),
    campaign_objective: cleanText(form.campaign_objective),
    creative_variations: metaCreativeVariationCount(form),
    image_slots: Object.fromEntries(
      Object.entries(imageSlots).map(([slot, files]) => [slot, files.length]),
    ),
  }
}

function buildProductData(form, product) {
  return {
    name: product,
    tagline: cleanText(form.tagline),
    area: cleanText(form.area),
    suites: cleanText(form.suites),
    towers: cleanText(form.towers),
    differentials: cleanText(form.differentials),
    price: cleanText(form.price),
    suggested_headline: cleanText(form.suggested_headline),
    suggested_copy: cleanText(form.suggested_copy),
    location: cleanText(form.location),
  }
}

function imageGroupsFromForm(form) {
  return {
    fachada: form.images?.fachada ? [form.images.fachada] : [],
    living: form.images?.living ? [form.images.living] : [],
    varanda: form.images?.varanda ? [form.images.varanda] : [],
    infraestrutura: form.images?.infraestrutura ? [form.images.infraestrutura] : [],
    extras: Array.isArray(form.images?.extras) ? form.images.extras : [],
  }
}

async function uploadCampaignImages(campaign, slug, form) {
  const groups = imageGroupsFromForm(form)
  const uploaded = {}

  for (const [slot, files] of Object.entries(groups)) {
    uploaded[slot] = []

    for (const [index, file] of files.entries()) {
      if (!file) continue

      const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg'
      const fileSlug = slugify(file.name?.replace(/\.[^.]+$/, '') || `${slot}-${index + 1}`)
      const storagePath = `premium-campaigns/${slug}/${slot}-${index + 1}-${Date.now()}-${fileSlug}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('cards')
        .upload(storagePath, file, {
          cacheControl: '31536000',
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('cards').getPublicUrl(storagePath)
      uploaded[slot].push({
        slot,
        name: file.name,
        size: file.size,
        type: file.type,
        bucket: 'cards',
        path: storagePath,
        public_url: data.publicUrl,
      })
    }
  }

  const flattened = Object.values(uploaded).flat()
  if (flattened.length) {
    const { error: updateError } = await supabase
      .from('premium_campaigns')
      .update({
        brief: {
          ...(campaign.brief || {}),
          images: uploaded,
          image_count: flattened.length,
        },
      })
      .eq('id', campaign.id)

    if (updateError) throw updateError
  }

  return uploaded
}

function flattenImages(uploadedImages = {}) {
  return Object.values(uploadedImages).flat().filter(Boolean)
}

function imageSourceUrls(sourceIntake = {}) {
  return Array.from(new Set([
    sourceIntake.url,
    sourceIntake.landing_url,
  ].map(cleanText).filter(Boolean)))
}

function mergeExternalImages(imageGroups = {}, externalImages = []) {
  if (!externalImages.length) return imageGroups

  return {
    ...imageGroups,
    auto: [
      ...(Array.isArray(imageGroups.auto) ? imageGroups.auto : []),
      ...externalImages,
    ],
  }
}

async function updateCampaignImageBrief(campaign, images, patch = {}) {
  const flattened = flattenImages(images)
  const brief = {
    ...(campaign.brief || {}),
    images,
    image_count: flattened.length,
    ...patch,
  }

  const { error } = await supabase
    .from('premium_campaigns')
    .update({ brief })
    .eq('id', campaign.id)

  if (error) throw error
  return brief
}

async function ingestExternalImagesFromSources(sourceIntake = {}) {
  const urls = imageSourceUrls(sourceIntake)
  if (!urls.length) return { images: [], warnings: [] }

  const normalize = (data) => {
    const images = (data?.images || [])
      .filter(item => item?.url)
      .map((item, index) => ({
        slot: 'auto',
        name: `imagem-fonte-${index + 1}`,
        size: null,
        type: 'external/image',
        bucket: null,
        path: null,
        public_url: item.url,
        source_url: item.source_url || null,
        score: item.score || 0,
        reason: item.reason || 'auto_selected',
      }))

    return {
      images,
      warnings: data?.warnings || [],
    }
  }

  const localFallback = async (warnings = []) => {
    if (typeof window === 'undefined') return { images: [], warnings }

    try {
      const response = await fetch('/api/ingest-source-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, limit: 12 }),
      })

      if (!response.ok) {
        return {
          images: [],
          warnings: [...warnings, `Ingestao local indisponivel: HTTP ${response.status}.`],
        }
      }

      const data = await response.json()
      const result = normalize(data)
      return {
        images: result.images,
        warnings: [...warnings, ...(result.warnings || [])],
      }
    } catch (error) {
      return {
        images: [],
        warnings: [...warnings, error.message || 'Falha na ingestao local de imagens.'],
      }
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('ingest-source-images', {
      body: { urls, limit: 12 },
    })

    if (error) {
      return localFallback([error.message || 'Nao foi possivel consultar a funcao de ingestao de imagens.'])
    }

    return normalize(data)
  } catch (error) {
    return localFallback([error.message || 'Falha ao buscar imagens nas fontes informadas.'])
  }
}

function sourceImageSelection(image) {
  if (!image?.public_url) return null
  return {
    url: image.public_url,
    slot: image.slot || 'auto',
    source_url: image.source_url || null,
    score: image.score || null,
    reason: image.reason || null,
  }
}

async function ensureCampaignSourceImages(campaignId) {
  const { data: campaign, error: campaignError } = await supabase
    .from('premium_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) return { images: 0, requeued: 0, warnings: [] }

  const { data: assets, error: assetsError } = await supabase
    .from('premium_campaign_assets')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('channel', 'meta_ads')

  if (assetsError || !assets?.length) return { images: 0, requeued: 0, warnings: [] }
  const missingImageAssets = assets.filter(asset => !asset.source_image_url)
  if (!missingImageAssets.length) return { images: 0, requeued: 0, warnings: [] }

  const sourceIntake = campaign.brief?.source_intake || {}
  let imageGroups = campaign.brief?.images || {}
  let sourceImages = flattenImages(imageGroups).filter(image => image.public_url)
  let warnings = []

  if (!sourceImages.length) {
    sourceImages = assets
      .filter(asset => asset.source_image_url)
      .map((asset, index) => ({
        slot: 'asset',
        name: `imagem-asset-${index + 1}`,
        public_url: asset.source_image_url,
        source_url: null,
        score: 0,
        reason: 'existing_asset_source',
      }))
  }

  if (!sourceImages.length) {
    const ingested = await ingestExternalImagesFromSources(sourceIntake)
    warnings = ingested.warnings || []
    imageGroups = mergeExternalImages(imageGroups, ingested.images)
    sourceImages = flattenImages(imageGroups).filter(image => image.public_url)

    if (sourceImages.length) {
      await updateCampaignImageBrief(campaign, imageGroups, {
        source_image_status: 'auto_selected',
        source_image_warnings: warnings,
      })
    }
  }

  if (!sourceImages.length) return { images: 0, requeued: 0, warnings }

  let requeued = 0
  const updates = missingImageAssets.map((asset, index) => {
    const image = sourceImages[index % sourceImages.length]
    const metadata = {
      ...(asset.metadata || {}),
      source_image_selection: sourceImageSelection(image),
      source_image_status: 'auto_selected',
    }
    const patch = {
      source_image_url: image.public_url,
      metadata,
    }

    if (asset.status !== 'approved') {
      patch.status = 'queued'
      patch.public_url = null
      patch.storage_path = null
      requeued += 1
    }

    return supabase
      .from('premium_campaign_assets')
      .update(patch)
      .eq('id', asset.id)
  })

  const results = await Promise.all(updates)
  const failed = results.find(result => result.error)
  if (failed) throw failed.error

  return { images: sourceImages.length, requeued, warnings }
}

export async function loadPremiumWorkspace({ brandScope = BRAND_SCOPES.premium } = {}) {
  const requests = [
    supabase.from('premium_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('premium_campaign_assets').select('*').order('created_at', { ascending: false }).limit(600),
    supabase.from('premium_content_posts').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('premium_publications').select('*').order('published_at', { ascending: false, nullsFirst: false }).limit(300),
    supabase.from('premium_metrics').select('*').order('collected_at', { ascending: false }).limit(500),
    supabase.from('premium_generation_jobs').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('social_accounts').select('*').eq('brand_scope', brandScope).order('created_at', { ascending: false }).limit(50),
    supabase.from('social_metric_snapshots').select('*').order('snapshot_at', { ascending: false }).limit(200),
  ]

  const [
    campaigns,
    assets,
    posts,
    publications,
    metrics,
    jobs,
    accounts,
    snapshots,
  ] = await withTimeout(Promise.all(requests), 8000, 'Tempo esgotado ao consultar o Supabase Premium.')

  const responses = [campaigns, assets, posts, publications, metrics, jobs, accounts, snapshots]
  const failed = responses.find(response => response.error)
  if (failed) {
    const error = new Error(failed.error.message)
    error.supabase = failed.error
    throw error
  }

  const scopedCampaigns = (campaigns.data || []).filter(campaign => inferCampaignBrandScope(campaign) === brandScope)
  const campaignIds = new Set(scopedCampaigns.map(campaign => campaign.id))
  const scopedAssets = (assets.data || []).filter(asset => campaignIds.has(asset.campaign_id) || asset.metadata?.brand_scope === brandScope)
  const scopedPosts = (posts.data || []).filter(post => campaignIds.has(post.campaign_id))
  const scopedPublications = (publications.data || []).filter(publication => campaignIds.has(publication.campaign_id))
  const scopedMetrics = (metrics.data || []).filter(metric => campaignIds.has(metric.campaign_id))
  const scopedJobs = (jobs.data || []).filter(job => campaignIds.has(job.campaign_id))

  return {
    campaigns: scopedCampaigns,
    assets: scopedAssets,
    posts: scopedPosts,
    publications: scopedPublications,
    metrics: scopedMetrics,
    jobs: scopedJobs,
    accounts: accounts.data || [],
    snapshots: snapshots.data || [],
  }
}

function withTimeout(promise, ms, message) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export async function createPremiumCampaign(form, { brandScope = BRAND_SCOPES.premium } = {}) {
  const brandProfile = getBrandProfile(brandScope)
  const product = form.product_name?.trim() || form.name.trim()
  const name = form.name.trim() || product
  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const now = new Date().toISOString()
  const productData = buildProductData(form, product)
  const sourceIntake = buildSourceIntake(form)
  const automationWorkflow = buildAutomationWorkflow(sourceIntake)
  const campaignBlueprints = buildCampaignAssetBlueprints(form, brandProfile)
  const metaCreativeConcepts = selectedMetaCreativeConcepts(form, brandProfile)

  const campaignPayload = {
    name,
    slug,
    product_name: product,
    property_type: form.property_type || null,
    neighborhood: form.neighborhood || null,
    city: form.city || 'Porto Alegre',
    target_audience: form.target_audience || brandProfile.defaultAudience,
    campaign_objective: form.campaign_objective || 'lead_generation',
    offer: form.offer || brandProfile.defaultOffer,
    tone: brandProfile.tone,
    status: 'planning',
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    budget_type: form.budget_type || 'organic_and_paid',
    source: 'dashboard_react',
    brief: {
      brand_scope: brandProfile.scope,
      brand_name: brandProfile.name,
      audience: form.target_audience || brandProfile.defaultAudience,
      promise: form.offer || brandProfile.defaultOffer,
      product_data: productData,
      source_intake: sourceIntake,
      automation_workflow: automationWorkflow,
      creative_validation: {
        variation_count: metaCreativeConcepts.length,
        cuts_per_variation: META_FORMAT_BLUEPRINTS.length,
        total_meta_cuts: metaCreativeConcepts.length * META_FORMAT_BLUEPRINTS.length,
        concepts: metaCreativeConcepts.map(concept => ({
          key: concept.key,
          label: concept.label,
          angle: concept.angle,
          visual_model: visualModelForConcept(concept, brandProfile),
        })),
        visual_models: metaCreativeConcepts.map(concept => visualModelForConcept(concept, brandProfile)),
      },
      suggested_headline: productData.suggested_headline,
      suggested_copy: productData.suggested_copy,
      visual_direction: brandProfile.visualDirection,
      created_from: 'premium_dashboard_phase_2_capture',
      human_review_policy: {
        minimum_intervention: true,
        required_before_publish: ['aprovar_criativos', 'autorizar_publicacao_e_verba'],
        blocked_actions: ['publicacao_automatica_com_verba_sem_confirmacao'],
      },
      qa_policy: {
        formats_required: ['1:1', '9:16', '1.91:1'],
        brand_scope: brandProfile.scope,
        destination_required_for_export: true,
      },
    },
    content_plan: {
      brand_scope: brandProfile.scope,
      blueprint_version: 'premium_phase_2_react',
      asset_count: campaignBlueprints.length,
      post_count: POST_BLUEPRINTS.length,
      automation_level: 'low_touch_paid_traffic',
      meta_ads_formats: ['1:1', '9:16', '1.91:1'],
      meta_ads_variations: metaCreativeConcepts.length,
      meta_ads_cuts: metaCreativeConcepts.length * META_FORMAT_BLUEPRINTS.length,
    },
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('premium_campaigns')
    .insert(campaignPayload)
    .select('*')
    .single()

  if (campaignError) throw campaignError

  const uploadedImages = await uploadCampaignImages(campaign, slug, form)
  const externalImages = await ingestExternalImagesFromSources(sourceIntake)
  const sourceImages = mergeExternalImages(uploadedImages, externalImages.images)

  if (flattenImages(sourceImages).length || externalImages.warnings?.length) {
    await updateCampaignImageBrief(campaign, sourceImages, {
      source_image_status: externalImages.images.length ? 'auto_selected' : 'pending_manual_or_private_source',
      source_image_warnings: externalImages.warnings || [],
    })
  }

  const assetPayload = buildAssetPayloads(campaign, form, sourceImages, sourceIntake, brandProfile)
  const { data: insertedAssets, error: assetsError } = await supabase
    .from('premium_campaign_assets')
    .insert(assetPayload)
    .select('*')

  if (assetsError) throw assetsError

  const postPayload = buildPostPayloads(campaign, insertedAssets || [], form, brandProfile)
  const { data: insertedPosts, error: postsError } = await supabase
    .from('premium_content_posts')
    .insert(postPayload)
    .select('*')

  if (postsError) throw postsError

  const jobPayload = [
    {
      campaign_id: campaign.id,
      job_type: 'campaign_generation',
      provider: 'dashboard_react',
      status: 'done',
      progress: 100,
      started_at: now,
      finished_at: now,
      input_payload: buildInputSnapshot(form, sourceIntake),
      output_payload: {
        brand_scope: brandProfile.scope,
        campaign_id: campaign.id,
        uploaded_images: flattenImages(uploadedImages).length,
        source_images: flattenImages(sourceImages).length,
        auto_selected_images: externalImages.images.length,
        source_image_warnings: externalImages.warnings || [],
        creative_variations: metaCreativeConcepts.length,
        meta_ads_cuts: metaCreativeConcepts.length * META_FORMAT_BLUEPRINTS.length,
        assets: insertedAssets?.length || 0,
        posts: insertedPosts?.length || 0,
      },
    },
    {
      campaign_id: campaign.id,
      job_type: 'asset_render',
      provider: 'card-builder',
      status: 'queued',
      progress: 0,
      input_payload: {
        brand_scope: brandProfile.scope,
        renderer: 'src/integrations/card-builder.js',
        storage_bucket: 'cards',
        asset_ids: (insertedAssets || []).map(asset => asset.id),
        automation_workflow: automationWorkflow,
        creative_validation: campaignPayload.brief.creative_validation,
      },
      output_payload: {
        status: 'waiting_render',
        queued_assets: (insertedAssets || []).filter(asset => asset.storage_bucket === 'cards').length,
        rendered_assets: 0,
        failed_assets: 0,
      },
    },
    {
      campaign_id: campaign.id,
      job_type: 'metrics_sync',
      provider: 'meta-api',
      status: 'queued',
      progress: 0,
      input_payload: {
        brand_scope: brandProfile.scope,
        requires_mapping: true,
        sources: ['instagram_insights', 'facebook_insights', 'ads_insights'],
      },
      output_payload: {
        status: 'waiting_publication_mapping',
        synced_publications: 0,
        synced_metrics: 0,
      },
    },
  ]

  const { error: jobsError } = await supabase
    .from('premium_generation_jobs')
    .insert(jobPayload)

  if (jobsError) throw jobsError

  return campaign
}

export async function createManualMetric(payload) {
  const publication = payload.publication
  if (!publication?.id) throw new Error('Selecione uma publicacao para registrar metricas.')

  const metricPayload = {
    publication_id: publication.id,
    campaign_id: publication.campaign_id,
    social_account_id: publication.social_account_id || null,
    platform: publication.platform,
    source: 'manual',
    metric_date: payload.metric_date || new Date().toISOString().slice(0, 10),
    reach: Number(payload.reach || 0),
    impressions: Number(payload.impressions || 0),
    engagement: Number(payload.engagement || 0),
    likes: Number(payload.likes || 0),
    comments: Number(payload.comments || 0),
    shares: Number(payload.shares || 0),
    saves: Number(payload.saves || 0),
    link_clicks: Number(payload.link_clicks || 0),
    profile_visits: Number(payload.profile_visits || 0),
    follows: Number(payload.follows || 0),
    video_views: Number(payload.video_views || 0),
    clicks: Number(payload.clicks || 0),
    leads: Number(payload.leads || 0),
    spend: Number(payload.spend || 0),
    raw_payload: {
      source: 'dashboard_manual_entry',
      notes: cleanText(payload.notes),
    },
  }

  const { data, error } = await supabase
    .from('premium_metrics')
    .insert(metricPayload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// ---- Acoes sobre assets (vitrine de criativos) ----

export async function updateAsset(assetId, patch) {
  const { data, error } = await supabase
    .from('premium_campaign_assets')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', assetId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export function approveAsset(assetId) {
  return updateAsset(assetId, { status: 'approved' })
}

// Aprova varios assets (ex.: todos os slides de um carrossel) numa unica chamada.
export async function approveAssets(ids) {
  const list = (ids || []).filter(Boolean)
  if (!list.length) return []
  const { data, error } = await supabase
    .from('premium_campaign_assets')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .in('id', list)
    .select('id')
  if (error) throw error
  return data
}

// Salva os campos de publicacao de um anuncio (Meta Ads) nos 3 cortes e reenfileira p/ render.
// `assets` = array dos assets do anuncio (precisa do metadata atual para merge).
// fields: { nome, texto_principal, titulo, descricao, cta, url_params }
export async function saveAd(assets, fields = {}) {
  const list = (assets || []).filter(a => a && a.id)
  if (!list.length) return []
  const out = []
  for (const a of list) {
    const metadata = {
      ...(a.metadata || {}),
      meta_ad: {
        nome: fields.nome ?? a.metadata?.meta_ad?.nome ?? null,
        texto_principal: fields.texto_principal ?? a.metadata?.meta_ad?.texto_principal ?? null,
        descricao: fields.descricao ?? a.metadata?.meta_ad?.descricao ?? null,
        url_params: fields.url_params ?? a.metadata?.meta_ad?.url_params ?? null,
      },
    }
    const { data, error } = await supabase
      .from('premium_campaign_assets')
      .update({
        headline: fields.titulo ?? a.headline,
        cta: fields.cta ?? a.cta,
        status: 'queued',
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', a.id)
      .select('id')
      .single()
    if (error) throw error
    out.push(data)
  }
  return out
}

// Limites de cartoes por canal de carrossel.
export const CAROUSEL_LIMITS = {
  meta_ads: { min: 2, max: 10 },
  default: { min: 2, max: 20 }, // Instagram organico
}

export function carouselLimit(channel) {
  return CAROUSEL_LIMITS[channel] || CAROUSEL_LIMITS.default
}

export function requeueAsset(assetId, patch = {}) {
  return updateAsset(assetId, { ...patch, status: 'queued' })
}

export function saveAssetEdit(assetId, { headline, copy, cta }) {
  // Editar textos e reenfileirar para nova renderizacao
  return updateAsset(assetId, {
    headline: headline ?? null,
    copy: copy ?? null,
    cta: cta ?? null,
    status: 'queued',
  })
}

// Dispara a Edge Function render-asset em lotes pequenos (limite de memoria do worker).
// Usa a publishable key do cliente (functions.invoke envia apikey/Authorization).
export async function renderCampaignAssets(campaignId, { batch = 1, maxBatches = 60, assetIds = [] } = {}) {
  let rendered = 0
  let failed = 0
  let lastError = null
  const ids = [...new Set((assetIds || []).filter(Boolean))]
  const batchSize = Math.max(1, Number(batch) || 1)

  try {
    await ensureCampaignSourceImages(campaignId)
  } catch (error) {
    lastError = error
  }

  if (ids.length) {
    for (let i = 0; i < ids.length; i += batchSize) {
      const chunk = ids.slice(i, i + batchSize)
      try {
        const res = await supabase.functions.invoke('render-asset', {
          body: { campaign_id: campaignId, asset_ids: chunk, limit: chunk.length },
        })
        if (res.error) {
          lastError = res.error
        } else {
          rendered += res.data?.rendered || 0
          failed += res.data?.failed || 0
        }
      } catch (err) {
        lastError = err
      }
    }

    return { rendered, failed, error: rendered === 0 ? lastError : null }
  }

  for (let i = 0; i < maxBatches; i++) {
    let data = null
    try {
      const res = await supabase.functions.invoke('render-asset', {
        body: { campaign_id: campaignId, limit: batch },
      })
      if (res.error) {
        lastError = res.error
      } else {
        data = res.data
      }
    } catch (err) {
      lastError = err
    }

    if (data) {
      rendered += data.rendered || 0
      failed += data.failed || 0
      if ((data.remaining || 0) <= 0) break
    }
    // Em erro (ex.: WORKER_RESOURCE_LIMIT) o progresso por asset persiste:
    // continua tentando ate acabar os lotes.
  }

  return { rendered, failed, error: rendered === 0 ? lastError : null }
}

export async function createManualPublication(payload) {
  if (!payload.campaign_id) throw new Error('Selecione uma campanha para mapear a publicacao.')

  const publicationPayload = {
    campaign_id: payload.campaign_id,
    content_post_id: payload.content_post_id || null,
    asset_id: payload.asset_id || null,
    platform: payload.platform || 'instagram',
    publication_type: payload.publication_type || 'organic',
    external_post_id: cleanText(payload.external_post_id) || null,
    permalink: cleanText(payload.permalink) || null,
    published_at: payload.published_at || new Date().toISOString(),
    status: payload.status || 'mapped',
    metadata: {
      source: 'dashboard_manual_mapping',
      notes: cleanText(payload.notes),
    },
  }

  const { data, error } = await supabase
    .from('premium_publications')
    .insert(publicationPayload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

function buildAssetPayloads(campaign, form, uploadedImages = {}, sourceIntake = buildSourceIntake(form), brandProfile = getBrandProfile()) {
  const product = campaign.product_name || campaign.name
  const place = [campaign.neighborhood, campaign.city].filter(Boolean).join(', ')
  const offer = campaign.offer || form.offer || brandProfile.defaultOffer
  const cta = form.cta || brandProfile.defaultCta
  const productData = buildProductData(form, product)
  const sourceImages = flattenImages(uploadedImages)
  const campaignBlueprints = buildCampaignAssetBlueprints(form, brandProfile)

  return campaignBlueprints.map(([blueprintKey, assetType, channel, format, title, aspectRatio, templateKey, concept], index) => {
    const headline = buildHeadline(product, place, index, form, concept, brandProfile)
    const copy = buildAssetCopy(product, offer, channel, form, concept, brandProfile)
    const adGroup = channel === 'meta_ads' ? concept?.key || blueprintKey.replace(/-(feed|story|wide)$/, '') : null
    const selectedImage = sourceImages.length ? sourceImages[index % sourceImages.length] : null
    const primaryImage = selectedImage?.public_url || null
    const visualTemplate = visualTemplateForAsset({ channel, templateKey, title, concept, brandProfile })
    const metadata = {
      blueprint_key: blueprintKey,
      phase: 'phase_2_react_capture',
      campaign_phase: concept?.phase || phaseForBlueprint(blueprintKey),
      ad_group: adGroup,
      ad_label: concept?.label || null,
      creative_concept: concept ? {
        key: concept.key,
        label: concept.label,
        angle: concept.angle,
      } : null,
      visual_template: visualTemplate,
      brand_scope: brandProfile.scope,
      brand_name: brandProfile.name,
      visual_rules: brandProfile.visualRules,
      product_data: productData,
      source_images: uploadedImages,
      source_image_selection: sourceImageSelection(selectedImage),
      source_intake: sourceIntake,
      automation_stage: channel === 'meta_ads' ? 'queued_for_render_and_qa' : 'planned_support_asset',
      qa_checks: buildInitialQaChecks({ channel, aspectRatio, primaryImage, headline, copy, cta, sourceIntake, brandProfile }),
    }

    if (channel === 'meta_ads') {
      metadata.meta_ad = {
        nome: `${campaign.name} | ${concept?.label || AD_GROUP_LABEL[adGroup] || 'Meta Ads'} | ${format}`,
        texto_principal: copy,
        descricao: cleanText(form.tagline) || null,
        url_params: buildDefaultUrlParams(campaign, blueprintKey),
      }
    }

    return {
      campaign_id: campaign.id,
      asset_type: assetType,
      channel,
      format,
      title,
      headline,
      copy,
      cta,
      status: channel === 'whatsapp' || channel === 'email' ? 'planned' : 'queued',
      aspect_ratio: aspectRatio,
      template_key: templateKey,
      storage_bucket: channel === 'whatsapp' || channel === 'email' ? null : 'cards',
      source_image_url: primaryImage,
      metadata,
    }
  })
}

function buildPostPayloads(campaign, assets, form, brandProfile = getBrandProfile()) {
  const cta = form.cta || brandProfile.defaultCta
  const hashtagCity = campaign.city ? `#${campaign.city.replace(/\s+/g, '')}` : '#PortoAlegre'

  return POST_BLUEPRINTS.map(post => {
    const asset = assets.find(item => item.metadata?.blueprint_key === post.assetKey)
    return {
      campaign_id: campaign.id,
      asset_id: asset?.id || null,
      platform: post.platform,
      format: post.format,
      editorial_pillar: post.editorial_pillar,
      title: `${post.title}: ${campaign.product_name || campaign.name}`,
      hook: post.hook,
      caption: [
        post.hook,
        campaign.offer || brandProfile.defaultOffer,
        cta,
      ].filter(Boolean).join('\n\n'),
      hashtags: [...brandProfile.hashtagSet, hashtagCity],
      cta,
      status: 'planned',
      notes: 'Conteudo criado na migracao React. Renderizacao final entra na Fase 2.',
      metadata: {
        brand_scope: brandProfile.scope,
        blueprint_asset_key: post.assetKey,
        phase: 'phase_1_react_migration',
      },
    }
  })
}

function buildHeadline(product, place, index, form, concept = null, brandProfile = getBrandProfile()) {
  const suggested = cleanText(form.suggested_headline)
  if (suggested && (!concept || concept.angle === 'editorial')) return suggested

  if (concept?.angle) {
    const conceptHeadlines = brandProfile.scope === BRAND_SCOPES.imobiliaria ? {
      editorial: `${product}: oportunidade em destaque`,
      curadoria: `Conheça este imóvel em ${place || 'Porto Alegre'}`,
      criterio: 'Compare antes de decidir',
      diferenciais: 'Diferenciais que fazem sentido',
      localizacao: `Localização em ${place || 'Porto Alegre'}`,
      lifestyle: 'Uma rotina mais prática para morar',
      investimento: 'Compra com visão patrimonial',
      escassez: 'Oportunidade para avaliar agora',
      arquitetura: 'Planta, localização e conforto',
      liquidez: 'Um imóvel com boa leitura de mercado',
      prova: 'Informação clara para escolher melhor',
      whatsapp: 'Fale com a Vitra',
    } : {
      editorial: `${product}: uma categoria acima`,
      curadoria: `Curadoria premium em ${place || 'Porto Alegre'}`,
      criterio: 'Para comprar com criterio',
      diferenciais: 'Diferenciais que sustentam valor',
      localizacao: `Localizacao rara em ${place || 'Porto Alegre'}`,
      lifestyle: 'Experiencia de morar em outro patamar',
      investimento: 'Alto padrao como decisao patrimonial',
      escassez: 'Uma oportunidade para poucos perfis',
      arquitetura: 'Arquitetura, liquidez e presenca',
      liquidez: 'Liquidez com assinatura premium',
      prova: 'O padrao que muda a comparacao',
      whatsapp: 'Receba a curadoria completa',
    }
    return conceptHeadlines[concept.angle] || conceptHeadlines.editorial
  }

  const variants = brandProfile.scope === BRAND_SCOPES.imobiliaria ? [
    `${product}: oportunidade em destaque`,
    `Imóvel em ${place || 'Porto Alegre'}`,
    'Planta, localização e valor',
    'Compare antes de decidir',
  ] : [
    `${product}: uma categoria acima`,
    `Curadoria premium em ${place || 'Porto Alegre'}`,
    'Arquitetura, liquidez e presenca',
    'Para comprar com criterio',
  ]
  return variants[index % variants.length]
}

function buildAssetCopy(product, offer, channel, form, concept = null, brandProfile = getBrandProfile()) {
  const suggested = cleanText(form.suggested_copy)
  if (suggested && (!concept || concept.angle === 'editorial')) return suggested

  if (channel === 'whatsapp') {
    if (brandProfile.scope === BRAND_SCOPES.imobiliaria) {
      return `Ola. Separei as informacoes da Vitra Imobiliaria sobre ${product}. ${offer}`
    }
    return `Ola. Separei uma curadoria Vitra Premium sobre ${product}. ${offer}`
  }

  if (channel === 'email') {
    if (brandProfile.scope === BRAND_SCOPES.imobiliaria) {
      return `Uma leitura objetiva sobre ${product}, com informacoes de localizacao, diferenciais e proximo passo de atendimento.`
    }
    return `Uma leitura consultiva sobre ${product}, com foco em localizacao, escassez e potencial patrimonial.`
  }

  if (channel === 'meta_ads' && concept?.angle) {
    const place = cleanText(form.location) || cleanText(form.neighborhood) || 'Porto Alegre'
    const differentials = cleanText(form.differentials)
    const area = cleanText(form.area)
    const suites = cleanText(form.suites)
    const details = [area, suites, differentials].filter(Boolean).join('. ')
    const conceptCopies = brandProfile.scope === BRAND_SCOPES.imobiliaria ? {
      editorial: `${offer}. Campanha Vitra Imobiliaria com foco em informacao clara, atendimento consultivo e proximo passo simples.`,
      curadoria: `Conheca ${product} com a assessoria da Vitra Imobiliaria. Veja localizacao, diferenciais e condicoes para avaliar com seguranca.`,
      criterio: `Antes de decidir, compare localizacao, planta, valor e rotina. ${product} entra na selecao para quem busca uma compra bem orientada.`,
      diferenciais: details ? `${details}. Diferenciais que ajudam a entender se este imovel combina com sua busca.` : `${product} reune pontos importantes para quem procura um imovel com boa leitura de valor.`,
      localizacao: `Em ${place}, a localizacao pesa na decisao. Conheca os pontos que tornam este imovel relevante para morar ou investir.`,
      lifestyle: `Mais praticidade para a rotina. ${product} combina localizacao, conforto e informacoes objetivas para decidir melhor.`,
      investimento: `Comprar bem tambem e pensar em patrimonio. Avalie ${product} com apoio da Vitra Imobiliaria.`,
      escassez: `Algumas oportunidades pedem avaliacao rapida e informada. Fale com a Vitra para entender disponibilidade e proximo passo.`,
      arquitetura: `Planta, localizacao e conforto precisam fazer sentido juntos. Veja os pontos de destaque de ${product}.`,
      liquidez: `Uma boa decisao imobiliaria considera uso, valor e saida futura. A Vitra organiza essa leitura para voce.`,
      prova: `Compare informacoes antes de escolher. A Vitra Imobiliaria ajuda a transformar dados do imovel em decisao segura.`,
      whatsapp: `Fale com a Vitra Imobiliaria e receba as informacoes essenciais para avaliar ${product}.`,
    } : {
      editorial: `${offer}. Uma campanha Vitra Premium com linguagem editorial, foco em alto padrao e vinculo direto com performance.`,
      curadoria: `Receba uma leitura reservada sobre ${product}. Curadoria Vitra Premium para avaliar contexto, valor e proximo passo com criterio.`,
      criterio: `Antes de decidir, compare localizacao, planta, liquidez e experiencia. ${product} entra na selecao para quem compra com criterio.`,
      diferenciais: details ? `${details}. Diferenciais que ajudam a transformar desejo em decisao de compra.` : `${product} foi selecionado pelos diferenciais que sustentam percepcao de valor e desejo real de compra.`,
      localizacao: `Em ${place}, a localizacao muda a conversa. Conheca uma curadoria premium para avaliar valor, escassez e potencial de decisao.`,
      lifestyle: `Mais do que metragem, uma experiencia de morar. ${product} combina presenca, conforto e leitura premium de estilo de vida.`,
      investimento: `Alto padrao tambem e tese patrimonial. Avalie ${product} com foco em liquidez, escassez e preservacao de valor.`,
      escassez: `Algumas oportunidades nao pedem volume de oferta. Pedem curadoria, timing e uma conversa objetiva sobre disponibilidade.`,
      arquitetura: `Arquitetura, vista e implantacao criam percepcao. Conheca os pontos que fazem ${product} se destacar no alto padrao.`,
      liquidez: `A melhor compra premium combina desejo e saida. Veja por que ${product} pode fazer sentido para quem pensa em liquidez.`,
      prova: `Compare o padrao, a localizacao e os diferenciais antes de decidir. A curadoria Vitra Premium organiza essa leitura para voce.`,
      whatsapp: `Solicite a curadoria completa de ${product} e receba as informacoes essenciais para avaliar a oportunidade com tranquilidade.`,
    }
    return conceptCopies[concept.angle] || conceptCopies.editorial
  }

  if (brandProfile.scope === BRAND_SCOPES.imobiliaria) {
    return `${offer}. Uma campanha Vitra Imobiliaria com informacao clara, foto do imovel e foco em atendimento.`
  }

  return `${offer}. Uma campanha Vitra Premium com linguagem editorial, foco em alto padrao e vinculo direto com performance.`
}
