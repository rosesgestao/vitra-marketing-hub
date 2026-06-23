import { supabase } from './supabase.js'
import { BRAND_SCOPES, getBrandProfile, inferCampaignBrandScope } from './brandProfiles.js'
// Mesma validacao pura que a Edge generate-copy roda no servidor (fonte unica em _shared), reusada no
// cliente para REVALIDAR a copy ao vivo quando o operador edita um rascunho (badges de issue corretos).
import { validateCopyAngle } from '../../../supabase/functions/_shared/copyValidation.ts'
import { META_OBJECTIVE_OPTIONS, DEFAULT_OBJECTIVE } from '../../../supabase/functions/_shared/objectivePlaybook.ts'
import { CONTENT_TYPE_OPTIONS, CONTENT_PILLAR_OPTIONS, CONTENT_FORMAT_OPTIONS, CONTENT_TONES, DEFAULT_CONTENT_TYPE, CONTENT_STATUS_OPTIONS, CONTENT_BOARD_LANES, contentStatusLane, contentStatusLabel, contentTypeOffer } from '../../../supabase/functions/_shared/contentPlaybook.ts'
import { DETAILED_TARGETING_PRESETS, detailedTargetingPreset } from '../../../supabase/functions/_shared/detailedTargetingPresets.ts'
import { PLACEMENT_PRESETS, placementPreset, PLACEMENTS_NEEDING_OTHER_FORMATS } from '../../../supabase/functions/_shared/placementPresets.ts'

// Reexport para a UI (seletor de Objetivo / direcionamento / posicionamentos) — fonte unica com a Edge.
export { META_OBJECTIVE_OPTIONS, DEFAULT_OBJECTIVE, DETAILED_TARGETING_PRESETS, detailedTargetingPreset, PLACEMENT_PRESETS, placementPreset, PLACEMENTS_NEEDING_OTHER_FORMATS }
// Reexport do playbook EDITORIAL (aba Produção) — mesma fonte unica usada pela Edge generate-content.
export { CONTENT_TYPE_OPTIONS, CONTENT_PILLAR_OPTIONS, CONTENT_FORMAT_OPTIONS, CONTENT_TONES, DEFAULT_CONTENT_TYPE }
// Reexport do modelo de STATUS de conteudo (fonte unica) — board Conteúdos, Calendário e aba Produção.
export { CONTENT_STATUS_OPTIONS, CONTENT_BOARD_LANES, contentStatusLane, contentStatusLabel }
import {
  creativeTemplateForTemplateKey,
  selectableCreativeTemplatesForBrand,
  defaultCreativeTemplateForBrand,
  fieldsForTemplate,
  frameForTemplateVariant,
  formKeyForTemplateField,
  imageSlotsForTemplate,
  isApprovedTemplateKeyForBrand,
  normalizeCreativeTemplateSelection,
  referencesForTemplateVariant,
  renderVersionForFamily,
  templateFamilyFromTemplateKey,
  variationContractForTemplate,
  variationRecipesForTemplate,
} from './creativeTemplateCatalog.js'

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
const META_CREATIVE_VARIATION_DEFAULT = 3 // default de menor arrependimento: minimo por padrao (alinhado a UI)
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

export function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.round(number)))
}

export function metaCreativeVariationCount(form) {
  return clampNumber(
    form.creative_variations,
    META_CREATIVE_VARIATION_MIN,
    META_CREATIVE_VARIATION_MAX,
    META_CREATIVE_VARIATION_DEFAULT,
  )
}

export function metaCreativeConceptsForBrand(brandProfile) {
  return brandProfile.scope === BRAND_SCOPES.imobiliaria
    ? VITRA_IMOBILIARIA_META_CREATIVE_CONCEPTS
    : META_CREATIVE_CONCEPTS
}

export function selectedTemplateVariationConcepts(form, brandProfile = getBrandProfile()) {
  if (brandProfile.scope !== BRAND_SCOPES.imobiliaria) return []

  const { template } = selectedCreativeTemplate(form, brandProfile)
  const recipes = variationRecipesForTemplate(template)
  if (!template?.family || !recipes.length) return []

  // Fase 2 (P1): nao gerar mais variacoes do que ha receitas distintas, senao os
  // anuncios repetem headline/copy (so muda a foto). Cap no numero de angulos do template.
  const count = Math.min(metaCreativeVariationCount(form), recipes.length)
  return Array.from({ length: count }, (_, index) => {
    const recipe = recipes[index % recipes.length]
    const cycle = Math.floor(index / recipes.length) + 1
    const label = recipe.label
      ? cycle > 1 ? `${recipe.label} ${cycle}` : recipe.label
      : `Variacao ${index + 1}`
    const recipeKey = slugify(recipe.id || recipe.label || `variacao-${index + 1}`)
    return {
      key: `meta-template-${slugify(template.family)}-${String(index + 1).padStart(2, '0')}-${recipeKey}`,
      label,
      phase: recipe.phase || String((index % 3) + 1),
      templateBase: template.family,
      angle: recipe.angle || 'template',
      slot_focus: recipe.slotFocus || recipe.mutableSlots || [],
      template_recipe: {
        ...recipe,
        index: index + 1,
        total: count,
      },
      variation_index: index,
    }
  })
}

// Copiloto de IA (degrau A): se a campanha tem `ai_copy_angles` (rascunhos aprovados pelo operador),
// usa-os como copy das variacoes EM VEZ das receitas do template. A copy da IA e LITERAL (sem
// {tokens}), entao renderVariationText a devolve como-esta e ela flui pelo pipeline existente
// (buildHeadline/buildAssetCopy checam template_recipe ANTES de tudo — scope-agnostico).
// Imobiliaria: templateBase = family do template aprovado. Premium (sem family, render editorial
// automatico): reusa o conceito generico Premium (templateBase/angle/visual) e so sobrescreve o TEXTO.
export function aiCopyConcepts(form, brandProfile = getBrandProfile()) {
  const angles = Array.isArray(form?.ai_copy_angles)
    ? form.ai_copy_angles.filter(a => a && (cleanText(a.headline) || cleanText(a.body)))
    : []
  if (!angles.length) return []

  const isImob = brandProfile.scope === BRAND_SCOPES.imobiliaria
  const { template } = selectedCreativeTemplate(form, brandProfile)
  if (isImob && !template?.family) return []
  const generic = isImob ? null : metaCreativeConceptsForBrand(brandProfile)

  const count = Math.min(metaCreativeVariationCount(form), angles.length)
  return Array.from({ length: count }, (_, index) => {
    const a = angles[index]
    const recipeKey = slugify(a.key || a.angle || `ia-${index + 1}`)
    const recipe = {
      id: a.key || `ia-${index + 1}`,
      label: a.angle || a.key || `Angulo IA ${index + 1}`,
      angle: a.angle || 'ia',
      headline: cleanText(a.headline),
      copy: cleanText(a.body),
      cta: cleanText(a.cta),
      source: 'ai',
      index: index + 1,
      total: count,
    }
    if (isImob) {
      return {
        key: `meta-ai-${slugify(template.family)}-${String(index + 1).padStart(2, '0')}-${recipeKey}`,
        label: a.angle || a.key || `Angulo IA ${index + 1}`,
        phase: String((index % 3) + 1),
        templateBase: template.family,
        angle: a.angle || 'ia',
        slot_focus: [],
        template_recipe: recipe,
        variation_index: index,
      }
    }
    // Premium: mantem o conceito generico (visual editorial intacto), so troca o texto pela copy da IA.
    const g = generic[index % generic.length]
    return {
      ...g,
      key: `${g.key}-ai-${String(index + 1).padStart(2, '0')}-${recipeKey}`,
      template_recipe: recipe,
      variation_index: index,
    }
  })
}

export function selectedMetaCreativeConcepts(form, brandProfile = getBrandProfile()) {
  const aiConcepts = aiCopyConcepts(form, brandProfile)
  if (aiConcepts.length) return aiConcepts

  const templateConcepts = selectedTemplateVariationConcepts(form, brandProfile)
  if (templateConcepts.length) return templateConcepts

  return metaCreativeConceptsForBrand(brandProfile).slice(0, metaCreativeVariationCount(form))
}

// Gate token das Edges de IA (seguranca): so envia o header quando VITE_COPILOT_GATE existe no .env do
// dashboard. As Edges (generate-copy/extract-facts/suggest-template) exigem esse token quando o secret
// COPILOT_GATE esta setado — assim a chave publishable (publica) sozinha nao autoriza uma chamada paga.
function copilotGateHeaders() {
  const gate = import.meta.env?.VITE_COPILOT_GATE
  return gate ? { 'x-copilot-gate': gate } : undefined
}

// Chama a Edge generate-copy (Claude) e devolve os angulos gerados+validados. A chave da IA fica
// server-side (secret ANTHROPIC_API_KEY); aqui so passamos os fatos do imovel. Lanca erro acionavel.
export async function generateCopyWithAI(form, brandProfile = getBrandProfile()) {
  const { template } = selectedCreativeTemplate(form, brandProfile)
  const headlineField = fieldsForTemplate(template).find(f => f.key === 'suggested_headline')
  const facts = {
    product_name: cleanText(form.product_name),
    price: cleanText(form.price),
    price_from: cleanText(form.price_from),
    neighborhood: cleanText(form.neighborhood),
    location: cleanText(form.location),
    area: cleanText(form.area),
    suites: cleanText(form.suites),
    towers: cleanText(form.towers),
    differentials: splitContentItems(form.differentials),
    financing_claim: cleanText(form.financing_claim) || cleanText(form.tagline),
    condo_argument: cleanText(form.condo_argument) || cleanText(form.offer),
  }
  const { data, error } = await supabase.functions.invoke('generate-copy', {
    headers: copilotGateHeaders(),
    body: {
      brand_scope: brandProfile.scope,
      template: template?.id || null,
      headline_max: headlineField?.maxLength || 40,
      count: metaCreativeVariationCount(form),
      facts,
      angle_hints: variationRecipesForTemplate(template).map(r => r.label).filter(Boolean),
    },
  })
  if (error) {
    let message = error.message || 'Falha ao gerar copy com IA.'
    try { const detail = await error.context?.json?.(); if (detail?.message) message = detail.message } catch (_) { /* sem corpo */ }
    throw new Error(message)
  }
  return Array.isArray(data?.angles) ? data.angles : []
}

// Porta in-app da skill vitra-copy: gera 3 angulos de copy de ANUNCIO (headline/texto/descricao/cta) a
// partir dos fatos de uma CAMPANHA ja criada (brief.product_data), para aplicar a um criativo aprovado.
// Mesma Edge generate-copy (canal pago server-side). Angulos estrategicos: preco-ancora, aspiracao-local,
// escassez/oportunidade — espelham o copy-playbook.
export async function generateAdCopyAngles({ campaign, brandScope = BRAND_SCOPES.imobiliaria } = {}) {
  const pd = campaign?.brief?.product_data || {}
  const facts = {
    product_name: cleanText(pd.name || campaign?.product_name),
    price: cleanText(pd.price),
    price_from: cleanText(pd.price_from),
    neighborhood: cleanText(pd.neighborhood || campaign?.neighborhood),
    location: cleanText(pd.location || campaign?.city),
    area: cleanText(pd.area),
    suites: cleanText(pd.suites),
    towers: cleanText(pd.towers),
    differentials: splitContentItems(pd.differentials),
    financing_claim: cleanText(pd.financing_claim),
    condo_argument: cleanText(pd.condo_argument),
  }
  const { data, error } = await supabase.functions.invoke('generate-copy', {
    headers: copilotGateHeaders(),
    body: {
      brand_scope: brandScope,
      headline_max: 40,
      count: 3,
      facts,
      angle_hints: [
        'preco-ancora (preco em destaque + ancoragem de valor)',
        'aspiracao-local (viver no imovel/bairro, o upgrade)',
        'escassez/oportunidade (ultimas unidades, condicao comercial)',
      ],
    },
  })
  if (error) {
    let message = error.message || 'Falha ao gerar copy com IA.'
    try { const detail = await error.context?.json?.(); if (detail?.message) message = detail.message } catch (_) { /* sem corpo */ }
    throw new Error(message)
  }
  return Array.isArray(data?.angles) ? data.angles : []
}

// Fase A (conteudo organico): chama a Edge generate-content (Claude) e devolve N ideias de post
// (ideia/legenda/CTA/hashtags/roteiro/visual) na voz da marca, ja validadas. tipo/pilar/formato vem do
// contentPlaybook; `context` e o briefing leve (objetivo/publico/tema/imovel) — opcional. Erro acionavel.
export async function generateContentWithAI({ brandScope, contentType, pillar, format, tone, count = 3, context = {} } = {}) {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    headers: copilotGateHeaders(),
    body: {
      brand_scope: brandScope || getBrandProfile().scope,
      content_type: contentType || DEFAULT_CONTENT_TYPE,
      pillar: pillar || undefined,
      format: format || undefined,
      tone: tone || undefined,
      count,
      context,
    },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.posts) ? data.posts : []
}

// Fase B (conteudo organico): salva uma ideia/post editorial em premium_content_posts. Status inicial
// 'draft'. Reusa as colunas existentes da tabela; direcao visual/roteiro ficam em metadata.
// Opcao A (content-first): campaign_id e OPCIONAL (nullable no banco). O vinculo com oferta e CONTEXTUAL
// — exigido apenas para tipos cujo offer='required'; conteudo de marca nasce sem oferta e e escopado
// por metadata.brand_scope. Status segue o CHECK do banco
// (draft|planned|in_copy|in_design|review|approved|scheduled|published|archived).
export async function createContentPost({ campaignId, brandScope, contentType, pillar, format, platform = 'instagram', title, hook, caption, hashtags = [], cta, visual = '', script = '', status = 'draft', scheduledFor = null, source = 'ai_editorial' } = {}) {
  if (!campaignId && contentTypeOffer(contentType) === 'required') {
    throw new Error('Este tipo de conteúdo fala de uma oferta específica — selecione a oferta vinculada.')
  }
  const payload = {
    campaign_id: campaignId || null,
    asset_id: null,
    platform,
    format: format || 'feed',
    editorial_pillar: pillar || null,
    title: title || (caption || '').slice(0, 80) || 'Conteúdo',
    hook: hook || null,
    caption: caption || '',
    hashtags: Array.isArray(hashtags) ? hashtags : [],
    cta: cta || null,
    status,
    scheduled_for: scheduledFor || null,
    notes: 'Criado na aba Produção (IA editorial — Fase B).',
    metadata: { brand_scope: brandScope || getBrandProfile().scope, content_type: contentType || null, visual, script, source },
  }
  const { data, error } = await supabase.from('premium_content_posts').insert(payload).select('*').single()
  if (error) throw new Error(error.message || 'Falha ao salvar o conteúdo.')
  return data
}

// Importa um PLANO editorial (saida da skill vitra-conteudo) em lote: cada item vira um rascunho em
// premium_content_posts. Aceita o JSON no formato createContentPost (contentType/pillar/format/platform/
// title/caption/cta/hashtags/script/visual/scheduled_for/brandScope). Nasce como rascunho (status
// 'draft') com a data preservada (aparece no Calendário); o operador revisa e avanca pelo funil.
// Tolerante a falha por item: nao interrompe o lote; devolve {created, failed, errors}.
export async function importContentPlan(items, { brandScope, campaignId } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Plano vazio: cole um JSON com uma lista de posts (saída da skill vitra-conteudo).')
  }
  const scope = brandScope || getBrandProfile().scope
  let created = 0
  const errors = []
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i] || {}
    try {
      await createContentPost({
        campaignId: it.campaignId || campaignId || null,
        brandScope: it.brandScope || scope,
        contentType: it.contentType || it.content_type,
        pillar: it.pillar,
        format: it.format,
        platform: it.platform || 'instagram',
        title: it.title,
        hook: it.hook || it.headline,
        caption: it.caption,
        hashtags: Array.isArray(it.hashtags) ? it.hashtags : [],
        cta: it.cta,
        visual: it.visual || '',
        script: it.script || '',
        scheduledFor: it.scheduled_for ? new Date(it.scheduled_for).toISOString() : null,
        source: 'editorial_plan_import',
      })
      created += 1
    } catch (e) {
      errors.push(`Item ${i + 1}${it.title ? ` (“${String(it.title).slice(0, 40)}”)` : ''}: ${e.message || e}`)
    }
  }
  return { created, failed: errors.length, errors }
}

// Fase C: atualiza um conteudo (status / agendamento / link publicado). `patch` mescla em metadata
// (ex.: published_url). status segue o CHECK do banco. Usado pelo acompanhamento na aba Produção.
export async function updateContentPost(id, { status, scheduledFor, publishedUrl, metadata, title, hook, caption, cta, hashtags } = {}) {
  if (!id) throw new Error('Conteúdo inválido.')
  const patch = {}
  if (status) patch.status = status
  if (scheduledFor !== undefined) patch.scheduled_for = scheduledFor || null
  if (status === 'approved') patch.approved_at = new Date().toISOString()
  // Edição de texto no mesmo fluxo (Fase 2 do drawer): campos de conteúdo gravados direto nas colunas.
  if (title !== undefined) patch.title = title
  if (hook !== undefined) patch.hook = hook
  if (caption !== undefined) patch.caption = caption
  if (cta !== undefined) patch.cta = cta
  if (hashtags !== undefined) patch.hashtags = Array.isArray(hashtags) ? hashtags : []
  if (publishedUrl !== undefined || metadata !== undefined) {
    // mescla no metadata existente (sem sobrescrever o resto)
    const { data: cur } = await supabase.from('premium_content_posts').select('metadata').eq('id', id).maybeSingle()
    const merged = { ...(cur?.metadata || {}), ...(metadata || {}) }
    if (publishedUrl !== undefined) merged.published_url = publishedUrl
    patch.metadata = merged
  }
  const { data, error } = await supabase.from('premium_content_posts').update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(error.message || 'Falha ao atualizar o conteúdo.')
  return data
}

// Arte do post organico: faz upload do PNG gerado no cliente (postArt.js) para o bucket publico 'cards'
// e grava a URL em metadata.art_url do conteudo. Reusa o mesmo bucket dos uploads de imagem do projeto.
// E a contraparte do "Gerar arte do post" — NAO usa o render-asset (Satori/pago).
export async function uploadPostArt({ postId, blob, brandScope, title } = {}) {
  if (!postId || !blob) throw new Error('Arte inválida para salvar.')
  const scope = brandScope || getBrandProfile().scope
  // Aceita arte gerada (PNG) OU imagem própria enviada pelo operador (JPG/PNG/WebP) — preserva o tipo real.
  const type = (blob.type && blob.type.startsWith('image/')) ? blob.type : 'image/png'
  const ext = (type.split('/')[1] || 'png').replace('jpeg', 'jpg')
  const path = `organic-art/${scope}/${postId}-${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from('cards').upload(path, blob, {
    contentType: type, upsert: true,
  })
  if (upErr) throw new Error(upErr.message || 'Falha ao enviar a arte para o storage.')
  const { data: pub } = supabase.storage.from('cards').getPublicUrl(path)
  const url = pub?.publicUrl
  // Mescla art_url no metadata existente + EMPILHA no histórico de versões (art_versions, cap 6). A versão
  // recém-gerada vira a ativa (art_url). Fase 2: permite comparar/trocar versões no drawer.
  const { data: cur } = await supabase.from('premium_content_posts').select('metadata').eq('id', postId).maybeSingle()
  const prevVersions = Array.isArray(cur?.metadata?.art_versions) ? cur.metadata.art_versions : []
  const art_versions = [{ url, path, at: new Date().toISOString() }, ...prevVersions.filter(v => v?.url !== url)].slice(0, 6)
  const metadata = { ...(cur?.metadata || {}), art_url: url, art_path: path, art_versions }
  const { error } = await supabase.from('premium_content_posts').update({ metadata }).eq('id', postId)
  if (error) throw new Error(error.message || 'Falha ao vincular a arte ao conteúdo.')
  // Auto-registra a arte na Biblioteca (DAM) — best-effort, nao bloqueia o salvar.
  try { await registerMediaAsset({ brandScope: scope, kind: 'art', title: title || 'Arte do post', url, path }) } catch { /* ignore */ }
  return { url, path }
}

// Fase 2: define qual versão de arte (de metadata.art_versions) é a ativa (art_url) — sem re-render.
// `url` nulo/'' REMOVE a arte ativa do post (art_url volta a null; as versões ficam no histórico).
export async function setActivePostArt(postId, url) {
  if (!postId) throw new Error('Conteúdo inválido.')
  const { data: cur } = await supabase.from('premium_content_posts').select('metadata').eq('id', postId).maybeSingle()
  const versions = Array.isArray(cur?.metadata?.art_versions) ? cur.metadata.art_versions : []
  const v = url ? versions.find(x => x?.url === url) : null
  const metadata = { ...(cur?.metadata || {}), art_url: url || null, art_path: url ? (v?.path || cur?.metadata?.art_path || null) : null }
  const { error } = await supabase.from('premium_content_posts').update({ metadata }).eq('id', postId)
  if (error) throw new Error(error.message || 'Falha ao definir a versão da arte.')
  return { url: url || null }
}

// Biblioteca (DAM): midia organica reutilizavel por marca (premium_media_assets, bucket publico 'cards').
export async function listMediaAssets(brandScope) {
  let q = supabase.from('premium_media_assets').select('*').order('created_at', { ascending: false }).limit(300)
  if (brandScope) q = q.eq('brand_scope', brandScope)
  const { data, error } = await q
  if (error) return []
  return data || []
}

export async function registerMediaAsset({ brandScope, kind = 'art', title, url, path, tags = [] } = {}) {
  if (!url) throw new Error('Mídia inválida (sem URL).')
  const row = {
    brand_scope: brandScope || getBrandProfile().scope,
    kind: kind || 'art', title: title || null, url, path: path || null,
    tags: Array.isArray(tags) ? tags : [],
  }
  const { data, error } = await supabase.from('premium_media_assets').insert(row).select('*').single()
  if (error) throw new Error(error.message || 'Falha ao registrar a mídia na biblioteca.')
  return data
}

export async function uploadMediaAsset({ brandScope, file, title, kind = 'photo' } = {}) {
  if (!file) throw new Error('Selecione um arquivo para enviar.')
  const scope = brandScope || getBrandProfile().scope
  const safeName = (file.name || 'midia').replace(/[^a-z0-9.]+/gi, '-').toLowerCase()
  const path = `library/${scope}/${Date.now()}-${safeName}`
  const { error: upErr } = await supabase.storage.from('cards').upload(path, file, {
    upsert: true, contentType: file.type || undefined,
  })
  if (upErr) throw new Error(upErr.message || 'Falha ao enviar o arquivo.')
  const { data: pub } = supabase.storage.from('cards').getPublicUrl(path)
  return await registerMediaAsset({ brandScope: scope, kind, title: title || file.name || 'Mídia', url: pub?.publicUrl, path })
}

export async function deleteMediaAsset(asset) {
  if (!asset?.id) throw new Error('Mídia inválida.')
  if (asset.path) { try { await supabase.storage.from('cards').remove([asset.path]) } catch { /* objeto pode ja nao existir */ } }
  const { error } = await supabase.from('premium_media_assets').delete().eq('id', asset.id)
  if (error) throw new Error(error.message || 'Falha ao excluir a mídia.')
}

// Configuracoes editoriais por marca (governanca da pauta): pilares ativos, tom padrao, cadencia e
// diretrizes (que entram no prompt da IA via context). 1 linha por brand_scope em premium_editorial_settings.
export async function loadEditorialSettings(brandScope) {
  const scope = brandScope || getBrandProfile().scope
  const { data, error } = await supabase
    .from('premium_editorial_settings').select('*').eq('brand_scope', scope).maybeSingle()
  if (error) return null
  return data || null
}

export async function saveEditorialSettings(brandScope, { activePillars = [], defaultTone = 'padrao', cadencePerWeek = 5, guidelines = '', autoArtOnApprove = true } = {}) {
  const scope = brandScope || getBrandProfile().scope
  const row = {
    brand_scope: scope,
    active_pillars: Array.isArray(activePillars) ? activePillars : [],
    default_tone: defaultTone || 'padrao',
    cadence_per_week: Number(cadencePerWeek) || 5,
    guidelines: guidelines || '',
    auto_art_on_approve: autoArtOnApprove !== false,   // gera a arte automaticamente ao aprovar o texto
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('premium_editorial_settings').upsert(row, { onConflict: 'brand_scope' }).select('*').single()
  if (error) throw new Error(error.message || 'Falha ao salvar as configurações editoriais.')
  return data
}

// Revalida UM angulo de copy no cliente (mesmas regras da Edge): usada ao editar um rascunho para
// atualizar os badges de issue ao vivo (tamanho da headline, nome do produto duplicado, vocabulario
// fora da marca). Devolve o array de issues (vazio = ok).
export function revalidateCopyAngle(angle, { scope, headlineMax, productName, channel = 'organic' } = {}) {
  // `channel:'paid'` espelha a Edge generate-copy: no anuncio pago da Imobiliaria libera os termos
  // genericos de mercado (alto padrao/exclusivo) e mantem bloqueado o lexico editorial Premium.
  return validateCopyAngle(angle, {
    scope: scope || BRAND_SCOPES.imobiliaria,
    headlineMax: Number(headlineMax) || 40,
    productName: productName || '',
    channel,
  }).issues
}

// Conta de anuncio Meta por marca (prefill do painel "Revisar e publicar"). O operador confirma/edita
// a conta e a Pagina antes de criar o rascunho. IDs descobertos via MCP (ads_get_ad_accounts).
export const META_AD_ACCOUNTS = {
  [BRAND_SCOPES.imobiliaria]: { adAccountId: '122035585232240', label: 'Vitra Porto Alegre' },
  [BRAND_SCOPES.premium]: { adAccountId: '1057868298461356', label: 'Vitra Premium' },
}

// Extrai a mensagem/issues acionavel de um erro do supabase.functions.invoke (corpo non-2xx vem em
// error.context). Mesmo padrao do generateCopyWithAI, mas tambem propaga `issues` da validacao de copy.
async function edgeError(error) {
  let message = error?.message || 'Falha ao falar com a Edge de publicacao.'
  let issues = []
  try {
    const detail = await error?.context?.json?.()
    if (detail?.message) message = detail.message
    if (Array.isArray(detail?.issues)) issues = detail.issues
  } catch (_) { /* sem corpo */ }
  const err = new Error(message)
  err.issues = issues
  return err
}

// ===== Tráfego Pago: publicacao Meta via Edge publish-meta-ads =====
// O agente monta tudo PAUSED (sem gasto). Ativar e uma acao SEPARADA (activateMetaCampaign), nunca
// automatica. O token da Meta fica server-side (secret META_ACCESS_TOKEN); aqui so passamos parametros.

// Cria o rascunho na Meta (campanha CBO -> N conjuntos -> criativo -> anuncio), TUDO PAUSED.
// `adSets` = proposta de publicos/posicionamentos por conjunto (de suggestMetaAudiences, revisada pelo
// operador). Sem ela, cai em 1 conjunto amplo (fase 1). Devolve os IDs/contagem.
export async function buildMetaDraft(campaignId, { adAccountId, pageId, dailyBudgetCents, startTime, endTime, destinationUrl, privacyPolicyUrl, pixelId, conversionEvent, targeting, adSets, objective, creativesPerAdset } = {}) {
  const { data, error } = await supabase.functions.invoke('publish-meta-ads', {
    headers: copilotGateHeaders(),
    body: {
      action: 'build_draft',
      campaign_id: campaignId,
      objective: objective || undefined,
      ad_account_id: adAccountId,
      page_id: pageId,
      daily_budget_cents: dailyBudgetCents,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      destination_url: destinationUrl,
      privacy_policy_url: privacyPolicyUrl || undefined,
      pixel_id: pixelId || undefined,
      conversion_event: conversionEvent || undefined,
      targeting: targeting || undefined,
      ad_sets: Array.isArray(adSets) && adSets.length ? adSets : undefined,
      creatives_per_adset: creativesPerAdset || undefined,
    },
  })
  if (error) throw await edgeError(error)
  return data
}

// Preset de campanha de referencia (Fase 2). Le a config real de uma campanha vencedora na Meta
// (read-only) e persiste/lista presets reutilizaveis por marca.
export async function readMetaCampaignConfig(metaCampaignId) {
  const { data, error } = await supabase.functions.invoke('publish-meta-ads', {
    headers: copilotGateHeaders(),
    body: { action: 'read_campaign_config', meta_campaign_id: String(metaCampaignId || '').trim() },
  })
  if (error) throw await edgeError(error)
  return data
}

// Converte o retorno do read_campaign_config no BLUEPRINT padronizado a aplicar (decisoes de gestor:
// faixa unica 25-65 p/ ticket alto, raio 2km no conjunto regional, cidade no macro, FB+IG, generos todos).
export function presetBlueprintFromConfig(config, { regionalRadiusKm = 2 } = {}) {
  const adsets = Array.isArray(config?.adsets) ? config.adsets : []
  const regional = adsets.find(a => a.geo?.type === 'radius_point' || a.geo?.type === 'radius_city') || adsets[0] || null
  const macro = adsets.find(a => a.geo?.type === 'city' && a !== regional) || adsets[1] || null
  return {
    objective: config?.campaign?.objective || 'OUTCOME_LEADS',
    // O build deriva o optimization_goal do objectivePlaybook (LEAD_GENERATION p/ lead form). QUALITY_LEAD
    // exige CRM/conversoes e seria rejeitado pela Meta — normaliza p/ refletir o que sera CONSTRUIDO, mesmo
    // quando a campanha de referencia (ex.: 30.05) usa QUALITY_LEAD.
    optimization_goal: (regional?.optimization_goal || macro?.optimization_goal) === 'QUALITY_LEAD'
      ? 'LEAD_GENERATION'
      : (regional?.optimization_goal || macro?.optimization_goal || 'LEAD_GENERATION'),
    bid_strategy: config?.campaign?.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_cents: config?.campaign?.daily_budget_cents || 1500,
    cbo: config?.campaign?.cbo ?? true,
    age_min: 25, age_max: 65, genders: null, publisher_platforms: ['facebook', 'instagram'],
    creatives: 3, copies: 3,
    lead_form_quality: config?.lead_form?.higher_intent ? 'maior_intencao' : 'mais_volume',
    adsets: [
      { kind: 'regional', geo: 'radius', radius_km: regionalRadiusKm, lat: regional?.geo?.lat ?? null, lng: regional?.geo?.lng ?? null },
      { kind: 'macro', geo: 'city', city_key: macro?.geo?.key ?? null },
    ],
    source: config || null,
  }
}

export async function saveMetaPreset({ brandScope, name, sourceMetaCampaignId, blueprint } = {}) {
  if (!name?.trim()) throw new Error('Dê um nome ao preset.')
  const row = {
    brand_scope: brandScope || getBrandProfile().scope,
    name: name.trim(),
    source_meta_campaign_id: sourceMetaCampaignId || null,
    blueprint: blueprint || {},
  }
  const { data, error } = await supabase.from('premium_meta_presets').insert(row).select('*').single()
  if (error) throw new Error(error.message || 'Falha ao salvar o preset.')
  return data
}

export async function listMetaPresets(brandScope) {
  let q = supabase.from('premium_meta_presets').select('*').order('created_at', { ascending: false }).limit(100)
  if (brandScope) q = q.eq('brand_scope', brandScope)
  const { data, error } = await q
  if (error) return []
  return data || []
}

export async function deleteMetaPreset(id) {
  if (!id) throw new Error('Preset inválido.')
  const { error } = await supabase.from('premium_meta_presets').delete().eq('id', id)
  if (error) throw new Error(error.message || 'Falha ao excluir o preset.')
}

// Apaga um rascunho Meta (campanha + conjuntos + anuncios) e limpa o estado no banco. Destrutivo:
// envia confirm:true. `metaCampaignId` opcional remove um orfao especifico.
export async function deleteMetaDraft(campaignId, metaCampaignId) {
  const { data, error } = await supabase.functions.invoke('publish-meta-ads', {
    headers: copilotGateHeaders(),
    body: { action: 'delete_draft', campaign_id: campaignId, meta_campaign_id: metaCampaignId || undefined, confirm: true },
  })
  if (error) throw await edgeError(error)
  return data
}

// Fase 2b: a IA propoe publico/posicionamento por conjunto (ad_group) da campanha. So propoe — o build
// aplica sob o gate. Devolve { ad_sets: [...] } para o operador revisar.
export async function suggestMetaAudiences(campaignId, objective) {
  const { data, error } = await supabase.functions.invoke('suggest-meta-audiences', {
    headers: copilotGateHeaders(),
    body: { campaign_id: campaignId, objective: objective || undefined },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.ad_sets) ? data.ad_sets : []
}

// Estimativa de público (alcance) de UM conjunto via delivery_estimate da Meta (read-only). Recebe a conta,
// o objetivo e o spec do conjunto (geo/idade/interest_ids/públicos/advantage); devolve {ok, lower, upper}.
export async function estimateAudience({ adAccountId, objective, spec } = {}) {
  const { data, error } = await supabase.functions.invoke('publish-meta-ads', {
    headers: copilotGateHeaders(),
    body: { action: 'estimate_audience', ad_account_id: adAccountId, objective: objective || undefined, spec: spec || {} },
  })
  if (error) throw await edgeError(error)
  return data || { ok: false }
}

// Chave de geolocalizacao da Meta (adgeolocation) para Porto Alegre — validada nos builds PAUSED.
// Usada no conjunto "Porto Alegre" (cidade inteira). cities:[{key}].
export const META_POA_CITY_KEY = '264859'
// Teto do raio do conjunto regional (regra do gestor de trafego: raio <= 2 km do endereco do imovel).
export const REGIONAL_RADIUS_MAX_KM = 2

// Geocodifica um endereco -> {found, lat, lng, label} via Edge geocode-address (Nominatim, server-side).
// Erro acionavel; nao encontrado retorna {found:false, message}.
export async function geocodeAddress(address) {
  const { data, error } = await supabase.functions.invoke('geocode-address', {
    headers: copilotGateHeaders(),
    body: { address },
  })
  if (error) throw await edgeError(error)
  return data || { found: false }
}

// Persiste o alvo geografico no brief da campanha (reuso entre sessoes/builds). Merge em brief.geo_target.
export async function saveCampaignGeo(campaignId, geo) {
  if (!campaignId) return null
  const { data: cur } = await supabase.from('premium_campaigns').select('brief').eq('id', campaignId).maybeSingle()
  const brief = { ...(cur?.brief || {}), geo_target: geo || null }
  const { error } = await supabase.from('premium_campaigns').update({ brief }).eq('id', campaignId)
  if (error) throw new Error(error.message || 'Falha ao salvar a localização da campanha.')
  return geo
}

// Monta os 2 conjuntos canônicos de localização (regra do gestor): "Porto Alegre" (cidade inteira) +
// "Região do imóvel" (raio <= 2 km no lat/lng). Sem lat/lng válido, devolve só o conjunto de Porto Alegre.
export function buildGeoAdSets({ lat, lng, radiusKm = 2, ageMin = 25, ageMax = 65, placementKey = 'fb_ig_recomendado' } = {}) {
  // Frente 1 (default seguro): os 2 conjuntos já nascem com o PRESET de posicionamentos recomendado
  // (FB+IG, sem Messenger/Audience Network, posições feed/stories/reels/marketplace/perfil) — espelha a
  // referência. Assim toda campanha nova sobe com os posicionamentos corretos, sem depender da UI.
  const pl = placementPreset(placementKey) || placementPreset('fb_ig_recomendado')
  const place = pl && !pl.advantage_plus && Array.isArray(pl.publisher_platforms)
    ? { publisher_platforms: pl.publisher_platforms, facebook_positions: pl.facebook_positions, instagram_positions: pl.instagram_positions }
    : {}   // advantage_plus / sem preset => omite posições (Meta otimiza tudo)
  const common = { age_min: ageMin, age_max: ageMax, placements: 'facebook,instagram', ...place }
  const macro = { kind: 'macro', label: 'Porto Alegre', geo: 'city', city_key: META_POA_CITY_KEY, ...common }
  const hasPoint = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
  if (!hasPoint) return [macro]
  const r = Math.max(1, Math.min(REGIONAL_RADIUS_MAX_KM, Number(radiusKm) || REGIONAL_RADIUS_MAX_KM))   // Meta exige raio >= 1km
  const regional = { kind: 'regional', label: `Região do imóvel (raio ${r} km)`, geo: 'radius', lat: Number(lat), lng: Number(lng), radius_km: r, ...common }
  // Região primeiro (mais quente), depois a cidade inteira.
  return [regional, macro]
}

// Auto-descoberta: contas de anuncio que o token acessa (para o operador escolher, sem digitar ID).
export async function listMetaAdAccounts() {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'list_ad_accounts' },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.accounts) ? data.accounts : []
}

// Paginas promoveis na conta (refletem os ativos atribuidos ao system user).
export async function listMetaPages(adAccountId) {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'list_pages', ad_account_id: adAccountId },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.pages) ? data.pages : []
}

// Lista os pixels (datasets) da conta — para o objetivo Vendas/Conversoes escolher qual otimizar.
export async function listMetaPixels(adAccountId) {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'list_pixels', ad_account_id: adAccountId },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.pixels) ? data.pixels : []
}

// Campanhas da conta (read-only) — para escolher a campanha de REFERENCIA do preset por dropdown,
// sem digitar o ID. Mesmo padrao de listMetaPages/listMetaPixels.
export async function listMetaCampaigns(adAccountId) {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'list_campaigns', ad_account_id: adAccountId },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.campaigns) ? data.campaigns : []
}

// ===== Fase 2c: publicos custom/lookalike (Edge manage-audiences, via Graph) =====
// Lista os publicos da conta (para escolher no retargeting).
export async function listMetaAudiences(adAccountId) {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'list', ad_account_id: adAccountId },
  })
  if (error) throw await edgeError(error)
  return Array.isArray(data?.audiences) ? data.audiences : []
}

// Cria um publico de RETARGETING de visitantes do site (precisa do pixel_id).
export async function createWebsiteAudience(adAccountId, { name, pixelId } = {}) {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'create_website', ad_account_id: adAccountId, name, pixel_id: pixelId },
  })
  if (error) throw await edgeError(error)
  return data
}

// Cria um publico SEMELHANTE (lookalike) a partir de uma audiencia-fonte.
export async function createLookalikeAudience(adAccountId, { name, originAudienceId, country, ratio } = {}) {
  const { data, error } = await supabase.functions.invoke('manage-audiences', {
    headers: copilotGateHeaders(),
    body: { action: 'create_lookalike', ad_account_id: adAccountId, name, origin_audience_id: originAudienceId, country: country || 'BR', ratio: ratio || 0.01 },
  })
  if (error) throw await edgeError(error)
  return data
}

// GATE: ativa a campanha na Meta (passa a gastar). Acao explicita do operador — exige confirm:true.
export async function activateMetaCampaign(campaignId) {
  const { data, error } = await supabase.functions.invoke('publish-meta-ads', {
    headers: copilotGateHeaders(),
    body: { action: 'activate', campaign_id: campaignId, confirm: true },
  })
  if (error) throw await edgeError(error)
  return data
}

// Le o estado atual do rascunho/campanha na Meta (para a UI mostrar review/delivery).
export async function getMetaCampaignStatus(campaignId) {
  const { data, error } = await supabase.functions.invoke('publish-meta-ads', {
    headers: copilotGateHeaders(),
    body: { action: 'status', campaign_id: campaignId },
  })
  if (error) throw await edgeError(error)
  return data
}

// Fase 2a: puxa os insights da Meta (Graph) das publicacoes pagas e faz upsert em premium_metrics.
// READ-ONLY na Meta (nao gasta). Sem campaignId, sincroniza todas as publicacoes pagas. Devolve o
// resumo { publications, rows, empty, message } para a UI.
export async function syncMetricsFromMeta(campaignId) {
  const { data, error } = await supabase.functions.invoke('sync-metrics-from-meta', {
    headers: copilotGateHeaders(),
    body: campaignId ? { campaign_id: campaignId } : {},
  })
  if (error) throw await edgeError(error)
  return data
}

// Degrau B' por LINK: busca o texto da pagina do imovel (site da construtora) via middleware server-side
// (Node) — evita CORS/SSRF do browser, reusa o guard de URL e a limpeza HTML->texto. Devolve o texto +
// avisos (ex.: pagina em JS retornou pouco texto). O operador revisa o texto antes de extrair.
export async function fetchListingText(url) {
  const link = cleanText(url)
  if (!link) throw new Error('Cole o link do imovel antes de buscar.')
  if (typeof window === 'undefined') throw new Error('Busca por link disponivel apenas no app (npm run dev).')
  const response = await fetch('/api/fetch-listing-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: link }),
  })
  if (!response.ok && response.status !== 200) {
    throw new Error(`Falha ao ler a pagina: HTTP ${response.status}.`)
  }
  const data = await response.json().catch(() => ({}))
  return {
    text: cleanText(data?.text),
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  }
}

// Degrau B' do copiloto: la a Edge extract-facts (Claude) com o TEXTO colado do anuncio + os field
// specs do template (key=formKey ja resolvido, label, type, maxLength, descricao). A IA so PROPOE
// (valor + evidencia + confianca); a chave fica server-side. Devolve os campos validados (ancorados
// no texto). O operador revisa e aplica no modal (humano no loop). Lanca erro acionavel.
export async function extractFactsWithAI(sourceText, selectedTemplate, brandProfile = getBrandProfile()) {
  const text = cleanText(sourceText)
  if (!text) throw new Error('Cole o texto do anuncio antes de extrair.')

  const seen = new Set()
  const fieldSpecs = []
  for (const field of fieldsForTemplate(selectedTemplate)) {
    const key = formKeyForTemplateField(field)
    if (!key || seen.has(key)) continue
    seen.add(key)
    fieldSpecs.push({
      key,
      label: field.label,
      type: field.type || 'text',
      maxLength: field.maxLength,
      description: field.helper || field.placeholder,
      required: Boolean(field.required),
    })
  }
  if (!fieldSpecs.length) throw new Error('Escolha um template com campos para a IA preencher.')

  const { data, error } = await supabase.functions.invoke('extract-facts', {
    headers: copilotGateHeaders(),
    body: {
      brand_scope: brandProfile.scope,
      source_text: text,
      field_specs: fieldSpecs,
    },
  })
  if (error) {
    let message = error.message || 'Falha ao extrair os dados do anuncio.'
    try { const detail = await error.context?.json?.(); if (detail?.message) message = detail.message } catch (_) { /* sem corpo */ }
    throw new Error(message)
  }
  return {
    fields: data?.fields && typeof data.fields === 'object' ? data.fields : {},
    extracted: Number(data?.extracted || 0),
    flagged: Number(data?.flagged || 0),
    model: data?.model || '',
  }
}

// PURO (testavel sem rede): decide o que aplicar ao form a partir dos campos extraidos. So aplica
// campos present:true e nao-vazios. Modo 'fill-empty' (padrao, anti-regressao): so preenche campos
// que estao VAZIOS no form atual — nunca sobrescreve o que o operador ja digitou. Modo 'overwrite':
// substitui tudo. Listas viram texto separado por '\n' (formato que o textarea + splitContentItems
// esperam). Nunca inclui campo ausente nem apaga valor existente.
export function buildFactsApplyPatch(form, extractedFields, { mode = 'fill-empty' } = {}) {
  const patch = {}
  const appliedKeys = []
  const skippedKeys = []
  for (const [key, field] of Object.entries(extractedFields || {})) {
    if (!field || field.present !== true) { if (field) skippedKeys.push(key); continue }
    const raw = field.value
    const value = Array.isArray(raw) ? raw.filter(Boolean).join('\n') : cleanText(raw)
    if (!value) { skippedKeys.push(key); continue }
    const currentEmpty = cleanText(form?.[key]) === ''
    if (mode === 'fill-empty' && !currentEmpty) { skippedKeys.push(key); continue }
    patch[key] = value
    appliedKeys.push(key)
  }
  return { patch, appliedKeys, skippedKeys }
}

// Degrau B do copiloto: la a Edge suggest-template (Claude) com o TEXTO do anuncio + os templates da
// marca (id/nome/bestFor). A IA RECOMENDA o melhor; o operador confirma. So sugere quando ha 2+
// templates (senao nao ha o que escolher). O template_id e validado contra a lista (server e cliente).
export async function suggestTemplateWithAI(sourceText, brandProfile = getBrandProfile()) {
  const text = cleanText(sourceText)
  if (!text) throw new Error('Cole o texto do anuncio antes de sugerir o template.')

  const templates = selectableCreativeTemplatesForBrand(brandProfile.scope)
    .map(t => ({ id: t.id, name: t.name || t.shortName, bestFor: t.bestFor }))
    .filter(t => t.id)
  if (templates.length < 2) return null

  const { data, error } = await supabase.functions.invoke('suggest-template', {
    headers: copilotGateHeaders(),
    body: { brand_scope: brandProfile.scope, source_text: text, templates },
  })
  if (error) {
    let message = error.message || 'Falha ao sugerir o template.'
    try { const detail = await error.context?.json?.(); if (detail?.message) message = detail.message } catch (_) { /* sem corpo */ }
    throw new Error(message)
  }
  // Defesa cliente: so aceita um id que exista de fato na lista de templates da marca.
  const validId = templates.some(t => t.id === data?.template_id) ? data.template_id : null
  return {
    templateId: validId,
    rationale: cleanText(data?.rationale),
    confidence: data?.confidence || 'low',
    valid: Boolean(validId),
    model: data?.model || '',
  }
}

// Fase 2 (P1): quantos ANGULOS distintos o template oferece (limite util de variacoes
// sem repetir copy). Usado para informar a escolha no modal e evitar duplicatas.
export function distinctConceptCapacity(form, brandProfile = getBrandProfile()) {
  // Com copy de IA aprovada, a capacidade de angulos distintos e a dos rascunhos da IA (qualquer marca).
  const aiAngles = Array.isArray(form?.ai_copy_angles)
    ? form.ai_copy_angles.filter(a => a && (cleanText(a.headline) || cleanText(a.body)))
    : []
  if (aiAngles.length) return aiAngles.length
  if (brandProfile.scope === BRAND_SCOPES.imobiliaria) {
    const { template } = selectedCreativeTemplate(form, brandProfile)
    const recipes = variationRecipesForTemplate(template)
    if (template?.family && recipes.length) return recipes.length
  }
  return metaCreativeConceptsForBrand(brandProfile).length
}

export function selectedCreativeTemplate(form, brandProfile = getBrandProfile()) {
  return normalizeCreativeTemplateSelection(
    brandProfile.scope,
    form.creative_template_id,
    form.creative_template_variant,
  )
}

function selectedCreativeTemplateSummary(form, brandProfile = getBrandProfile()) {
  const { template, variant } = selectedCreativeTemplate(form, brandProfile)
  if (!template) return null
  const variationContract = variationContractForTemplate(template)
  const variationRecipes = variationRecipesForTemplate(template)
  return {
    id: template.id,
    family: template.family,
    mode: template.mode,
    name: template.name,
    variant: variant ? {
      id: variant.id,
      label: variant.label,
      frame: variant.frame,
    } : null,
    formats: template.formats,
    field_keys: fieldsForTemplate(template).map(field => field.key),
    image_slots: imageSlotsForTemplate(template).map(slot => ({
      id: slot.id,
      label: slot.label,
      required: Boolean(slot.required),
      multiple: Boolean(slot.multiple),
    })),
    variation_contract: {
      strategy: variationContract.strategy,
      description: variationContract.description,
      locked_slots: variationContract.lockedSlots || [],
      mutable_slots: variationContract.mutableSlots || template.variableFields || [],
      image_strategy: variationContract.imageStrategy || 'rotate_primary_image_keep_template_slots',
      recipe_count: variationRecipes.length,
      recipes: variationRecipes.map(recipe => ({
        id: recipe.id || null,
        label: recipe.label || null,
        phase: recipe.phase || null,
        angle: recipe.angle || null,
        slot_focus: recipe.slotFocus || recipe.mutableSlots || [],
      })),
    },
  }
}

function selectedTemplateValues(form, brandProfile = getBrandProfile()) {
  const { template } = selectedCreativeTemplate(form, brandProfile)
  if (!template) return {}

  return Object.fromEntries(
    fieldsForTemplate(template)
      .map(field => {
        const key = formKeyForTemplateField(field)
        const value = cleanText(form[key])
        return [field.key, value || null]
      })
      .filter(([, value]) => value !== null),
  )
}

function selectedTemplateImageSlots(form, brandProfile = getBrandProfile()) {
  const { template } = selectedCreativeTemplate(form, brandProfile)
  return imageSlotsForTemplate(template).map(slot => {
    const value = form.images?.[slot.id]
    const count = slot.multiple ? (Array.isArray(value) ? value.length : 0) : value ? 1 : 0
    return {
      id: slot.id,
      label: slot.label,
      required: Boolean(slot.required),
      multiple: Boolean(slot.multiple),
      files: count,
    }
  })
}

export function buildMetaAssetBlueprints(form, brandProfile = getBrandProfile()) {
  const { template } = selectedCreativeTemplate(form, brandProfile)
  const templateBaseOverride = brandProfile.scope === BRAND_SCOPES.imobiliaria && template?.family
    ? template.family
    : null

  return selectedMetaCreativeConcepts(form, brandProfile).flatMap(concept => (
    META_FORMAT_BLUEPRINTS.map(format => [
      `${concept.key}-${format.key}`,
      'meta_ad',
      'meta_ads',
      format.format,
      `Meta Ads ${concept.label} - ${format.title}`,
      format.aspectRatio,
      `${templateBaseOverride || concept.templateBase}-${format.templateSuffix}`,
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

function visualTemplateForAsset({ channel, templateKey, title, concept, form, brandProfile = getBrandProfile() }) {
  if (channel === 'meta_ads' && brandProfile.scope === BRAND_SCOPES.imobiliaria) {
    const { template: selectedTemplate, variant } = selectedCreativeTemplate(form || {}, brandProfile)
    const template = creativeTemplateForTemplateKey(brandProfile.scope, templateKey) ||
      selectedTemplate ||
      defaultCreativeTemplateForBrand(brandProfile.scope)
    const variantId = variant?.id || template?.defaultVariant || null
    const family = template?.family || templateFamilyFromTemplateKey(templateKey)

    return {
      key: templateKey,
      family,
      template_id: template?.id || family,
      variant: variantId,
      variant_label: variant?.label || null,
      frame: frameForTemplateVariant(template, variantId),
      label: template?.name || 'Template aprovado Vitra Imobiliaria',
      purpose: template?.bestFor || 'Gerar criativos Meta Ads da marca-mae mantendo estrutura visual padronizada e variaveis por campanha.',
      reference_pattern: template?.shortName || 'Template visual aprovado pelo Brand System Vitra.',
      variable_fields: template?.variableFields || ['photos', 'headline', 'description', 'price', 'differentials', 'cta'],
      fixed_brand_rules: template?.fixedBrandRules || ['navy_gold', 'approved_horizontal_logo', 'safe_zone'],
      approved_reference_files: referencesForTemplateVariant(template, variantId),
      available_formats: template?.formats || ['1:1', '9:16', '1.91:1'],
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
    isApprovedTemplateKeyForBrand(BRAND_SCOPES.imobiliaria, templateKey)
}

export function needsVitraImobiliariaApprovedTemplateRender(asset) {
  if (!isVitraImobiliariaApprovedTemplateAsset(asset)) return false
  const templateKey = String(asset?.template_key || asset?.metadata?.visual_template?.key || '')
  const family = asset.metadata?.visual_template?.family || templateFamilyFromTemplateKey(templateKey)
  const expectedVersion = renderVersionForFamily(family)
  return asset.status === 'queued' ||
    !asset.public_url ||
    asset.metadata?.rendered_template_family !== family ||
    Boolean(expectedVersion && asset.metadata?.rendered_template_version !== expectedVersion)
}

export const MAX_RENDER_ATTEMPTS = 3
const ORPHAN_RENDERING_MINUTES = 10

export function renderAttemptsFor(asset) {
  return Number(asset?.render_attempts ?? asset?.metadata?.render_attempts ?? 0) || 0
}

// Roteamento do Premium 9:16 para o render-worker (Puppeteer, full-res 1080x1920 real, fora do
// limite da Edge). DESLIGADO por padrao: so ative (VITE_WORKER_RENDER_9X16=true) DEPOIS de hospedar
// o worker e aplicar a migration de particao — senao os 9:16 Premium ficariam 'queued' esperando
// um worker que nao existe. Quando ligado, esses assets ganham metadata.render_engine='worker' e
// saem do dispatch da Edge (o worker os reivindica).
const WORKER_RENDER_9X16 = (() => {
  try { return import.meta.env?.VITE_WORKER_RENDER_9X16 === 'true' } catch { return false }
})()

// Asset cuja renderizacao pertence ao render-worker (nao a Edge). Usado para excluir do dispatch
// da Edge/dashboard. Enquanto WORKER_RENDER_9X16 esta off, nenhum asset recebe a flag (no-op).
export function isWorkerOwnedAsset(asset) {
  return asset?.metadata?.render_engine === 'worker'
}

// Predicado UNICO de pendencia de render (Fase 1). Forward-compatible com a maquina
// de estados da Edge: alem de 'queued' e templates aprovados desatualizados, reconhece
// 'error' com orcamento de retry e 'rendering' orfao (travado alem do timeout), para
// que assets nesses estados voltem a ser renderizados em vez de sumirem para sempre.
export function isRenderablePendingAsset(asset, nowMs = Date.now()) {
  if (!asset) return false
  // Worker-owned (Premium 9:16 roteado): a Edge nao reivindica; quem renderiza e o render-worker.
  if (isWorkerOwnedAsset(asset)) return false
  if (asset.status === 'error') return renderAttemptsFor(asset) < MAX_RENDER_ATTEMPTS
  if (asset.status === 'rendering') {
    const startedAt = Date.parse(asset.metadata?.last_render_attempt_at || asset.updated_at || '') || 0
    return startedAt > 0 && (nowMs - startedAt) > ORPHAN_RENDERING_MINUTES * 60_000
  }
  if (asset.status === 'queued') return true
  return needsVitraImobiliariaApprovedTemplateRender(asset)
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

function buildInputSnapshot(form, sourceIntake, brandProfile = getBrandProfile()) {
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
    template_values: selectedTemplateValues(form, brandProfile),
    template_image_slots: selectedTemplateImageSlots(form, brandProfile),
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
    price_from: cleanText(form.price_from),
    financing_claim: cleanText(form.financing_claim) || cleanText(form.tagline),
    condo_argument: cleanText(form.condo_argument) || cleanText(form.offer),
    suggested_headline: cleanText(form.suggested_headline),
    suggested_copy: cleanText(form.suggested_copy),
    cta: cleanText(form.cta),
    neighborhood: cleanText(form.neighborhood),
    location: cleanText(form.location),
  }
}

function imageGroupsFromForm(form) {
  return Object.fromEntries(
    Object.entries(form.images || {}).map(([slot, value]) => [
      slot,
      Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [],
    ]),
  )
}

// Fase 2 (HEIC): converte fotos HEIC/HEIF (iPhone) para JPEG antes do upload, pois o renderer
// (satori/resvg) so decodifica WebP/PNG/JPEG. Estrategia em duas camadas:
//   1) Servidor (middleware do Vite, /api/convert-heic, via heic-convert do Node) — robusto
//      para HEIC de iPhone, que o decodificador WASM do navegador (heic2any) costuma recusar.
//   2) Navegador (heic2any, import dinamico) — fallback para quando o middleware nao existe
//      (ex.: build estatico sem o servidor de dev).
// Se ambas falharem, lanca um erro acionavel em vez de subir o HEIC silenciosamente (a Edge nao
// o decodifica, geraria criativo quebrado).
async function convertHeicViaServer(file) {
  const response = await fetch('/api/convert-heic', {
    method: 'POST',
    headers: { 'Content-Type': file?.type || 'application/octet-stream' },
    body: file,
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status} ${detail}`.trim())
  }
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    // Sem middleware (build estatico): a rota cai no index.html. Trata como indisponivel.
    throw new Error('middleware /api/convert-heic indisponivel')
  }
  const blob = await response.blob()
  if (!blob.size) throw new Error('imagem convertida vazia')
  return blob
}

async function convertHeicIfNeeded(file) {
  const name = (file?.name || '').toLowerCase()
  const isHeic = file?.type === 'image/heic' || file?.type === 'image/heif' ||
    name.endsWith('.heic') || name.endsWith('.heif')
  if (!isHeic) return file
  const newName = (file?.name || 'foto').replace(/\.(heic|heif)$/i, '') + '.jpg'
  console.info('[HEIC] Convertendo para JPEG:', file?.name)

  // 1) Servidor (heic-convert do Node) — caminho a prova de navegador.
  try {
    const blob = await convertHeicViaServer(file)
    console.info('[HEIC] Convertido no servidor:', newName)
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (serverError) {
    console.warn('[HEIC] Servidor indisponivel/falhou, tentando navegador:', serverError?.message || serverError)
  }

  // 2) Navegador (heic2any) — fallback.
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    console.info('[HEIC] Convertido no navegador:', newName)
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (browserError) {
    console.error('[HEIC] Falha na conversao (servidor e navegador):', file?.name, browserError)
    throw new Error(`Nao foi possivel converter a foto HEIC "${file?.name || 'sem nome'}". Reinicie o servidor (Ctrl+C, npm run dev) ou envie essa foto em JPG/PNG.`)
  }
}

async function uploadCampaignImages(campaign, slug, form) {
  const groups = imageGroupsFromForm(form)
  const uploaded = {}

  for (const [slot, files] of Object.entries(groups)) {
    uploaded[slot] = []

    for (const [index, originalFile] of files.entries()) {
      if (!originalFile) continue
      const file = await convertHeicIfNeeded(originalFile)

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

export function flattenImages(uploadedImages = {}) {
  return Object.values(uploadedImages).flat().filter(Boolean)
}

function imageSourceUrls(sourceIntake = {}) {
  return Array.from(new Set([
    sourceIntake.url,
    sourceIntake.landing_url,
  ].map(cleanText).filter(Boolean)))
}

function isLocalSourcePath(value) {
  return /^[a-zA-Z]:[\\/]/.test(cleanText(value))
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

  if (urls.some(isLocalSourcePath)) {
    return localFallback()
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

function splitContentItems(value) {
  return cleanText(value)
    .split(/[\n;,]+/)
    .map(item => item.replace(/^[-\u2022\s]+/, '').trim())
    .filter(Boolean)
}

export function rotateItems(items, index = 0) {
  if (!items.length) return []
  const offset = Math.abs(Number(index) || 0) % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

export function variationTokens(product, place, form, brandProfile = getBrandProfile()) {
  const differentials = splitContentItems(form.differentials)
  const location = cleanText(form.location)
  const neighborhood = cleanText(form.neighborhood)
  const area = cleanText(form.area)
  const suites = cleanText(form.suites)
  const towers = cleanText(form.towers)
  const details = [area, suites, towers, differentials.slice(0, 2).join(', ')].filter(Boolean).join('. ')

  return {
    product: cleanText(product) || 'Imovel Vitra',
    place: place || location || neighborhood || 'Porto Alegre',
    location: location || neighborhood || place || 'Porto Alegre',
    neighborhood: neighborhood || location || 'Porto Alegre',
    area,
    suites,
    towers,
    price: cleanText(form.price),
    price_from: cleanText(form.price_from),
    headline: cleanText(form.suggested_headline) || cleanText(product),
    // Fase 2 (bug cross-cutting): headline SEM fallback para o nome do produto. Receitas que
    // usam {headline_only} nao vazam o nome cru do empreendimento como headline da arte quando o
    // operador nao preenche a headline sugerida — buildHeadline cai no fallback por angulo.
    headline_only: cleanText(form.suggested_headline),
    copy: cleanText(form.suggested_copy),
    offer: cleanText(form.offer) || brandProfile.defaultOffer,
    cta: cleanText(form.cta) || brandProfile.defaultCta,
    details,
    financing_claim: cleanText(form.financing_claim) || cleanText(form.tagline),
    tagline: cleanText(form.tagline),
    differential1: differentials[0] || area || suites,
    differential2: differentials[1] || suites || neighborhood,
    differential3: differentials[2] || towers || location,
    differential4: differentials[3] || cleanText(form.price),
  }
}

export function renderVariationText(template, tokens) {
  return cleanText(template)
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => cleanText(tokens[key]) || '')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/^[.,;:]\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function templateRecipeText(concept, field, product, place, form, brandProfile = getBrandProfile()) {
  const recipe = concept?.template_recipe
  if (!recipe?.[field]) return ''
  return renderVariationText(recipe[field], variationTokens(product, place, form, brandProfile))
}

function templateVariationMetadata(concept) {
  const recipe = concept?.template_recipe
  if (!recipe) return null
  return {
    id: recipe.id || null,
    label: recipe.label || null,
    phase: recipe.phase || null,
    angle: recipe.angle || null,
    index: recipe.index || null,
    total: recipe.total || null,
    slot_focus: concept?.slot_focus || recipe.slotFocus || recipe.mutableSlots || [],
  }
}

function buildTemplateVariationProductData(productData, concept, form, index, headline, copy, cta, brandProfile = getBrandProfile()) {
  const recipe = concept?.template_recipe
  if (!recipe) {
    return {
      ...productData,
      suggested_headline: headline || productData.suggested_headline,
      suggested_copy: copy || productData.suggested_copy,
      cta: cta || productData.cta,
    }
  }

  const tokens = variationTokens(productData.name, productData.location || productData.neighborhood, form, brandProfile)
  const variationIndex = Number(concept?.variation_index ?? index) || 0
  const differentials = splitContentItems(productData.differentials)
  const rotatedDifferentials = rotateItems(differentials, variationIndex)
  const slotOverrides = Object.fromEntries(
    Object.entries(recipe.slotOverrides || {})
      .map(([key, value]) => [key, renderVariationText(value, tokens)])
      .filter(([, value]) => Boolean(value)),
  )

  return {
    ...productData,
    ...slotOverrides,
    differentials: rotatedDifferentials.length ? rotatedDifferentials.join('\n') : productData.differentials,
    suggested_headline: headline || productData.suggested_headline,
    suggested_copy: copy || productData.suggested_copy,
    cta: cta || productData.cta,
  }
}

export function selectTemplateVariationImage(sourceImages, concept, format, index) {
  if (!sourceImages.length) return null
  const formatOffset = { feed: 0, story: 1, wide: 2 }[format] || 0
  const variationIndex = Number(concept?.variation_index ?? index) || 0
  const recipeOffset = Number(concept?.template_recipe?.photoOffset || 0)
  return sourceImages[(variationIndex + formatOffset + recipeOffset) % sourceImages.length]
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
  // Fase 1: nao mexer em assets ja renderizados/aprovados (evita zerar public_url de
  // arte pronta) nem ressuscitar dead-letters (error com tentativas esgotadas). So anexa
  // foto e reenfileira assets que ainda precisam e podem renderizar.
  const missingImageAssets = assets.filter(asset =>
    !asset.source_image_url &&
    asset.status !== 'approved' &&
    asset.status !== 'generated' &&
    !(asset.status === 'error' && renderAttemptsFor(asset) >= MAX_RENDER_ATTEMPTS))
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
  // Carga RESILIENTE: cada query tem timeout proprio e degrada para vazio em caso de lentidao/erro
  // (em vez de um Promise.all + timeout global que derrubava o dashboard inteiro quando UMA query
  // lenta — ex.: assets/metricas — estourava). Assim campanhas e conteudo aparecem mesmo que uma
  // fatia falhe. Limites reduzidos para baixar o payload e o tempo de resposta.
  const safeQuery = async (builder, ms = 12000) => {
    try { return await withTimeout(builder, ms, 'timeout') }
    catch (error) { return { data: [], error } }
  }

  const [
    campaigns,
    assets,
    posts,
    publications,
    metrics,
    jobs,
    accounts,
    snapshots,
  ] = await Promise.all([
    // Campanhas e o essencial: timeout generoso (as queries rodam em PARALELO, entao o total ~ a mais
    // lenta, nao a soma). As pesadas (assets/metricas) usam payload menor e degradam para vazio se lentas.
    safeQuery(supabase.from('premium_campaigns').select('*').order('created_at', { ascending: false }).limit(50), 25000),
    safeQuery(supabase.from('premium_campaign_assets').select('*').order('created_at', { ascending: false }).limit(150), 18000),
    safeQuery(supabase.from('premium_content_posts').select('*').order('created_at', { ascending: false }).limit(200), 18000),
    safeQuery(supabase.from('premium_publications').select('*').order('published_at', { ascending: false, nullsFirst: false }).limit(150), 15000),
    safeQuery(supabase.from('premium_metrics').select('*').order('collected_at', { ascending: false }).limit(120), 15000),
    safeQuery(supabase.from('premium_generation_jobs').select('*').order('created_at', { ascending: false }).limit(80), 12000),
    safeQuery(supabase.from('social_accounts').select('*').eq('brand_scope', brandScope).order('created_at', { ascending: false }).limit(50), 12000),
    safeQuery(supabase.from('social_metric_snapshots').select('*').order('snapshot_at', { ascending: false }).limit(120), 12000),
  ])

  // So a falha das CAMPANHAS e critica (sem elas nao ha workspace); as demais degradam para vazio.
  if (campaigns.error) {
    const error = new Error(campaigns.error.message || 'Tempo esgotado ao consultar o Supabase Premium.')
    error.supabase = campaigns.error
    throw error
  }

  const scopedCampaigns = (campaigns.data || []).filter(campaign => inferCampaignBrandScope(campaign) === brandScope)
  const campaignIds = new Set(scopedCampaigns.map(campaign => campaign.id))
  const scopedAssets = (assets.data || []).filter(asset => campaignIds.has(asset.campaign_id) || asset.metadata?.brand_scope === brandScope)
  // Conteudo de marca (Opcao A) pode nao ter oferta — escopa por metadata.brand_scope quando campaign_id e nulo.
  const scopedPosts = (posts.data || []).filter(post => campaignIds.has(post.campaign_id) || (!post.campaign_id && post.metadata?.brand_scope === brandScope))
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

export async function deleteCampaign(campaignId) {
  const { error } = await supabase
    .from(PREMIUM_TABLES.campaigns)
    .delete()
    .eq('id', campaignId)
  if (error) throw error
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
  const creativeTemplate = selectedCreativeTemplateSummary(form, brandProfile)
  const templateValues = selectedTemplateValues(form, brandProfile)
  const templateImageSlots = selectedTemplateImageSlots(form, brandProfile)

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
      creative_template: creativeTemplate,
      template_values: templateValues,
      template_image_slots: templateImageSlots,
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
      creative_template: creativeTemplate,
      template_values: templateValues,
      template_image_slots: templateImageSlots,
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
      input_payload: buildInputSnapshot(form, sourceIntake, brandProfile),
      output_payload: {
        brand_scope: brandProfile.scope,
        campaign_id: campaign.id,
        uploaded_images: flattenImages(uploadedImages).length,
        source_images: flattenImages(sourceImages).length,
        auto_selected_images: externalImages.images.length,
        source_image_warnings: externalImages.warnings || [],
        creative_template: creativeTemplate,
        template_values: templateValues,
        template_image_slots: templateImageSlots,
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
        creative_template: creativeTemplate,
        template_values: templateValues,
        template_image_slots: templateImageSlots,
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

async function pendingRenderableAssetIds(campaignId, assetIds = []) {
  const ids = [...new Set((assetIds || []).filter(Boolean))]
  let query = supabase
    .from('premium_campaign_assets')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('channel', 'meta_ads')

  if (ids.length) query = query.in('id', ids)

  const { data, error } = await query
  if (error) throw error

  return (data || [])
    .filter(asset => isRenderablePendingAsset(asset))
    .map(asset => asset.id)
}

const waitForRenderRetry = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function isTransientRenderInvokeError(error) {
  const status = Number(error?.context?.status || error?.status || 0)
  const message = String(error?.message || error || '').toLowerCase()
  return status === 546 || status === 502 || status === 503 || status === 504 ||
    message.includes('failed to fetch') ||
    message.includes('worker_resource_limit') || message.includes('compute resources') ||
    message.includes('resource limit')
}

// OOM do 9:16 (WORKER_RESOURCE_LIMIT) mata o isolate: o asset fica preso em 'rendering' e um retry
// imediato nao o reclama. Reseta os cortes do chunk de volta para 'queued' para que a proxima
// tentativa (isolate quente + raster reduzido no edge) os renderize — sem reenfileiramento manual.
async function requeueStuckRenderingAssets(chunk) {
  try {
    await supabase.from('premium_campaign_assets')
      .update({ status: 'queued', updated_at: new Date().toISOString() })
      .in('id', chunk).eq('status', 'rendering')
  } catch { /* best-effort: o reaper do edge recupera de qualquer forma */ }
}

async function invokeRenderAssetChunk(campaignId, chunk) {
  let lastError = null
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase.functions.invoke('render-asset', {
      body: { campaign_id: campaignId, asset_ids: chunk, limit: chunk.length },
    })
    if (!error) return data || { rendered: 0, failed: chunk.length, remaining: chunk.length }
    lastError = error
    if (!isTransientRenderInvokeError(error) || attempt === 3) break
    await requeueStuckRenderingAssets(chunk) // libera os 'rendering' presos por OOM antes de tentar de novo
    await waitForRenderRetry(1500 + attempt * 2000)
  }
  throw lastError
}

function renderAssetErrorMessage(error) {
  if (!error) return 'Falha desconhecida na renderizacao do criativo.'
  const details = [
    error.message,
    error.context?.status ? `HTTP ${error.context.status}` : null,
    error.context?.statusText,
  ].filter(Boolean)
  return details.join(' - ') || String(error)
}

// Serializa TODAS as execucoes de render no app numa fila unica. Execucoes concorrentes (auto-render
// por efeito + disparo manual, ou re-triggers) abrem isolates paralelos do edge render-asset que
// competem pelo limite de CPU/memoria do worker e estouram em 546 — que volta SEM header CORS, e o
// browser reporta como erro de "CORS". Render ja e 1-a-1 por design, entao enfileirar nao muda o
// resultado: so remove a contencao e mantem o isolate quente entre cortes.
let renderChain = Promise.resolve()
export function renderCampaignAssets(campaignId, opts = {}) {
  const run = () => _renderCampaignAssets(campaignId, opts)
  const p = renderChain.then(run, run)
  renderChain = p.then(() => {}, () => {})
  return p
}

// Dispara a Edge Function render-asset em lotes pequenos (limite de memoria do worker).
// Envia asset_ids explicitos para evitar que campanhas com upload manual fiquem presas
// em queued quando o disparo automatico inicial nao completa o ciclo.
async function _renderCampaignAssets(campaignId, { batch = 1, maxBatches = 60, assetIds = [], onProgress = null } = {}) {
  let rendered = 0
  let failed = 0
  let lastError = null
  const batchSize = Math.max(1, Number(batch) || 1)

  try {
    await ensureCampaignSourceImages(campaignId)
  } catch (error) {
    lastError = error
  }

  let ids = []
  try {
    ids = await pendingRenderableAssetIds(campaignId, assetIds)
  } catch (error) {
    lastError = error
  }

  const limitedIds = ids.slice(0, batchSize * maxBatches)
  const total = limitedIds.length
  let processed = 0
  for (let i = 0; i < limitedIds.length; i += batchSize) {
    const chunk = limitedIds.slice(i, i + batchSize)
    try {
      const data = await invokeRenderAssetChunk(campaignId, chunk)
      rendered += data.rendered || 0
      failed += data.failed || 0
    } catch (err) {
      lastError = err
      failed += chunk.length
    }
    processed += chunk.length
    if (typeof onProgress === 'function') {
      try {
        await onProgress({ campaignId, processed, total, rendered, failed, error: lastError })
      } catch {
        // Atualizacao visual de progresso nao deve interromper o processamento.
      }
    }
  }

  return {
    rendered,
    failed,
    error: rendered === 0 ? lastError : null,
    errorMessage: rendered === 0 && lastError ? renderAssetErrorMessage(lastError) : null,
  }
}

export async function createManualPublication(payload) {
  // Content-first: a publicacao pode nascer de um conteudo de marca (sem oferta). Exige conteudo OU oferta.
  if (!payload.campaign_id && !payload.content_post_id) {
    throw new Error('Vincule um conteúdo ou uma oferta para mapear a publicação.')
  }

  const publicationPayload = {
    campaign_id: payload.campaign_id || null,
    content_post_id: payload.content_post_id || null,
    asset_id: payload.asset_id || null,
    platform: payload.platform || 'instagram',
    publication_type: payload.publication_type || 'organic',
    external_post_id: cleanText(payload.external_post_id) || null,
    permalink: cleanText(payload.permalink) || null,
    published_at: payload.published_at || new Date().toISOString(),
    status: payload.status || 'mapped',
    // brand_scope e coluna GENERATED (COALESCE(metadata->>'brand_scope','vitra_premium')) — vai em metadata.
    metadata: {
      source: payload.source || 'dashboard_manual_mapping',
      notes: cleanText(payload.notes),
      ...(payload.brand_scope ? { brand_scope: payload.brand_scope } : {}),
      ...(payload.artUrl ? { art_url: payload.artUrl } : {}),
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

// Fase 3 (publicar unificado): marca o conteudo como PUBLICADO e, no mesmo passo, registra a publicacao
// real em premium_publications (destrava metricas por peca) — sem o operador abrir a aba Publicações.
// Idempotente: se ja houver publicacao para o conteudo, so atualiza o link; senao, cria uma.
export async function publishContentPost({ post, url = '', brandScope } = {}) {
  if (!post?.id) throw new Error('Conteúdo inválido para publicação.')
  await updateContentPost(post.id, { status: 'published', publishedUrl: url })

  const { data: existing } = await supabase
    .from('premium_publications')
    .select('id')
    .eq('content_post_id', post.id)
    .limit(1)

  const permalink = cleanText(url) || null
  if (Array.isArray(existing) && existing.length > 0) {
    await supabase
      .from('premium_publications')
      .update({ permalink, published_at: new Date().toISOString() })
      .eq('id', existing[0].id)
    return { created: false, updated: true }
  }

  const scope = brandScope || post.metadata?.brand_scope || getBrandProfile().scope
  const publication = await createManualPublication({
    campaign_id: post.campaign_id || null,
    content_post_id: post.id,
    asset_id: post.asset_id || null,
    platform: post.platform || 'instagram',
    publication_type: 'organic',
    permalink,
    brand_scope: scope,
    artUrl: post.metadata?.art_url || null,   // a arte gerada vira a midia de referencia da publicacao
    source: 'content_publish',
  })
  return { created: true, id: publication?.id }
}

function buildAssetPayloads(campaign, form, uploadedImages = {}, sourceIntake = buildSourceIntake(form), brandProfile = getBrandProfile()) {
  const product = campaign.product_name || campaign.name
  const place = [campaign.neighborhood, campaign.city].filter(Boolean).join(', ')
  const offer = campaign.offer || form.offer || brandProfile.defaultOffer
  const cta = form.cta || brandProfile.defaultCta
  const productData = buildProductData(form, product)
  const sourceImages = flattenImages(uploadedImages)
  const campaignBlueprints = buildCampaignAssetBlueprints(form, brandProfile)
  const creativeTemplate = selectedCreativeTemplateSummary(form, brandProfile)
  const templateValues = selectedTemplateValues(form, brandProfile)
  const templateImageSlots = selectedTemplateImageSlots(form, brandProfile)

  return campaignBlueprints.map(([blueprintKey, assetType, channel, format, title, aspectRatio, templateKey, concept], index) => {
    const headline = buildHeadline(product, place, index, form, concept, brandProfile)
    const copy = buildAssetCopy(product, offer, channel, form, concept, brandProfile)
    const assetCta = templateRecipeText(concept, 'cta', product, place, form, brandProfile) || cta
    const assetProductData = buildTemplateVariationProductData(
      productData,
      concept,
      form,
      index,
      headline,
      copy,
      assetCta,
      brandProfile,
    )
    const templateVariation = templateVariationMetadata(concept)
    const adGroup = channel === 'meta_ads' ? concept?.key || blueprintKey.replace(/-(feed|story|wide)$/, '') : null
    const selectedImage = selectTemplateVariationImage(sourceImages, concept, format, index)
    const primaryImage = selectedImage?.public_url || null
    const visualTemplate = visualTemplateForAsset({ channel, templateKey, title, concept, form, brandProfile })
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
        slot_focus: concept.slot_focus || [],
        variation_index: concept.variation_index ?? null,
      } : null,
      template_variation: templateVariation,
      visual_template: visualTemplate,
      creative_template_selection: creativeTemplate,
      template_values: templateValues,
      template_image_slots: templateImageSlots,
      brand_scope: brandProfile.scope,
      brand_name: brandProfile.name,
      visual_rules: brandProfile.visualRules,
      product_data: assetProductData,
      source_images: uploadedImages,
      source_image_selection: sourceImageSelection(selectedImage),
      source_intake: sourceIntake,
      automation_stage: channel === 'meta_ads' ? 'queued_for_render_and_qa' : 'planned_support_asset',
      qa_checks: buildInitialQaChecks({ channel, aspectRatio, primaryImage, headline, copy, cta: assetCta, sourceIntake, brandProfile }),
    }

    if (channel === 'meta_ads') {
      metadata.meta_ad = {
        nome: `${campaign.name} | ${concept?.label || AD_GROUP_LABEL[adGroup] || 'Meta Ads'} | ${format}`,
        texto_principal: copy,
        descricao: cleanText(form.tagline) || null,
        url_params: buildDefaultUrlParams(campaign, blueprintKey),
      }
      // Roteamento dormente: so o Premium 9:16 (que estoura o satori da Edge) vai para o
      // render-worker, e somente com a flag ligada. Imobiliaria 9:16 ja e full-res na Edge.
      if (WORKER_RENDER_9X16 && aspectRatio === '9:16' && brandProfile.scope === BRAND_SCOPES.premium) {
        metadata.render_engine = 'worker'
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
      cta: assetCta,
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
  const recipeHeadline = templateRecipeText(concept, 'headline', product, place, form, brandProfile)
  if (recipeHeadline) return recipeHeadline

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
  const place = cleanText(form.location) || cleanText(form.neighborhood) || 'Porto Alegre'
  const recipeCopy = templateRecipeText(concept, 'copy', product, place, form, brandProfile)
  if (recipeCopy) return recipeCopy

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
