import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Download,
  ExternalLink,
  FileText,
  Gem,
  Image as ImageIcon,
  Images,
  Layers3,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import { supabaseConfig } from '../lib/supabase.js'
import {
  PREMIUM_TABLES,
  approveAsset,
  deleteCampaign,
  approveAssets,
  carouselLimit,
  createPremiumCampaign,
  createManualPublication,
  loadPremiumWorkspace,
  needsVitraImobiliariaApprovedTemplateRender,
  distinctConceptCapacity,
  generateCopyWithAI,
  generateAdCopyAngles,
  extractFactsWithAI,
  fetchListingText,
  buildFactsApplyPatch,
  suggestTemplateWithAI,
  revalidateCopyAngle,
  isRenderablePendingAsset,
  renderCampaignAssets,
  saveAd,
  saveAssetEdit,
  buildMetaDraft,
  activateMetaCampaign,
  suggestMetaAudiences,
  listMetaAudiences,
  listMetaPixels,
  listMetaAdAccounts,
  listMetaPages,
  createWebsiteAudience,
  createLookalikeAudience,
  META_AD_ACCOUNTS,
  META_OBJECTIVE_OPTIONS,
  DEFAULT_OBJECTIVE,
  generateContentWithAI,
  createContentPost,
  importContentPlan,
  updateContentPost,
  publishContentPost,
  uploadPostArt,
  setActivePostArt,
  loadEditorialSettings,
  saveEditorialSettings,
  readMetaCampaignConfig,
  presetBlueprintFromConfig,
  saveMetaPreset,
  listMetaPresets,
  deleteMetaPreset,
  listMetaCampaigns,
  CONTENT_TYPE_OPTIONS,
  CONTENT_PILLAR_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  CONTENT_TONES,
  DEFAULT_CONTENT_TYPE,
} from '../lib/premiumData.js'
import { BrandHorizontalLogo } from '../components/PremiumBrand.jsx'
import { renderPostArtToCanvas, postArtBlob, ensureArtFonts } from '../lib/postArt.js'
import VitraSelect from '../components/VitraSelect.jsx'
import { BRAND_SCOPES, getBrandProfile } from '../lib/brandProfiles.js'
import {
  selectableCreativeTemplatesForBrand,
  defaultCreativeTemplateForBrand,
  fieldGroupsForTemplate,
  fieldsForTemplate,
  formKeyForTemplateField,
  imageSlotsForTemplate,
  normalizeCreativeTemplateSelection,
  referencesForTemplateVariant,
  variationContractForTemplate,
} from '../lib/creativeTemplateCatalog.js'

// Nomes humanos (pt-BR) dos slots do contrato de variacao — em vez do id tecnico cru
// (ex.: safe_zone, format_grid, benefit_arrows). Fase 4 (UX).
const SLOT_LABELS = {
  layout: 'Layout', logo: 'Logo', typography: 'Tipografia', palette: 'Paleta',
  safe_zone: 'Margem de seguranca', format_grid: 'Grade de formatos',
  headline: 'Headline', subtitle: 'Subtitulo', price: 'Preco', differentials: 'Diferenciais',
  cta: 'CTA (botao)', photos: 'Fotos', benefit_arrows: 'Setas de beneficio', photo_grid: 'Galeria de fotos',
  features: 'Caracteristicas', location: 'Localizacao', price_box: 'Caixa de preco',
  rounded_photo_frames: 'Molduras das fotos', financing_claim: 'Chamada de financiamento',
  neighborhood: 'Bairro', official_blue_bands: 'Tarjas azuis oficiais', address_lockup: 'Bloco de endereco',
  hero_photo: 'Foto protagonista', condo_argument: 'Argumento do condominio', address: 'Endereco',
}
const humanizeSlot = (slot) => SLOT_LABELS[slot] || String(slot).replace(/_/g, ' ')

const INITIAL_FORM = {
  name: '',
  source_type: 'manual',
  landing_url: '',
  whatsapp_url: '',
  creative_variations: 3,
  creative_template_id: '',
  creative_template_variant: '',
  product_name: '',
  tagline: '',
  property_type: 'Apartamento alto padrão',
  neighborhood: '',
  city: 'Porto Alegre',
  location: '',
  area: '',
  suites: '',
  towers: '',
  differentials: '',
  price: '',
  price_from: '',
  condo_argument: '',
  financing_claim: '',
  suggested_headline: '',
  suggested_copy: '',
  target_audience: 'Compradores e investidores de alto padrão em Porto Alegre',
  campaign_objective: 'lead_generation',
  offer: '',
  cta: 'Conheça o projeto',
  budget_type: 'organic_and_paid',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString().slice(0, 10),
  images: {
    fachada: null,
    living: null,
    varanda: null,
    infraestrutura: null,
    extras: [],
  },
}

const CREATIVE_VARIATION_OPTIONS = [
  { value: 3, label: '3 variacoes por template - 9 cortes' },
  { value: 5, label: '5 variacoes por template - 15 cortes' },
  { value: 8, label: '8 variacoes por template - 24 cortes' },
  { value: 10, label: '10 variacoes por template - 30 cortes' },
  { value: 12, label: '12 variacoes por template - 36 cortes' },
]

function initialFormForBrand(brandProfile) {
  const defaultTemplate = defaultCreativeTemplateForBrand(brandProfile.scope)
  const defaultVariant = defaultTemplate?.variants?.find(variant => variant.id === defaultTemplate.defaultVariant) ||
    defaultTemplate?.variants?.[0] ||
    null

  return {
    ...INITIAL_FORM,
    creative_template_id: defaultTemplate?.id || '',
    creative_template_variant: defaultVariant?.id || '',
    property_type: brandProfile.defaultProductType,
    target_audience: brandProfile.defaultAudience,
    cta: brandProfile.defaultCta,
  }
}

const SOURCE_TYPE_OPTIONS = [
  { value: 'drive', label: 'Google Drive' },
  { value: 'site', label: 'Site do empreendimento' },
  { value: 'folder', label: 'Pasta local / rede' },
  { value: 'pdf', label: 'PDF comercial' },
  { value: 'manual', label: 'Brief manual' },
]

// "Conteúdo" = canal ORGÂNICO puro (planejar, criar, curar, organizar e acompanhar publicacoes).
// A demanda PAGA e a gestao de ofertas NAO ficam aqui:
// - "Tráfego Pago" e "Métricas" saíram (duplicavam a area de midia paga e a Métricas transversal);
// - "Ofertas" (gestao de campanha/empreendimento) saiu como ABA — a escolha da oferta para a qual se
//   produz conteudo vira um seletor compacto no topo (a criacao segue no botao "Nova campanha" do header).
const TABS = [
  { id: 'assets', label: 'Produção', icon: Layers3 },
  { id: 'publicacoes', label: 'Publicações', icon: Send },
  { id: 'config', label: 'Configurações', icon: Target },
]

// Posicionamentos Meta Ads por formato/aspect ratio
const META_PLACEMENTS = {
  '1:1': { label: 'Quadrado', sub: 'Feed', dim: '1080×1080' },
  '9:16': { label: 'Vertical', sub: 'Stories / Reels', dim: '1080×1920' },
  '1.91:1': { label: 'Horizontal', sub: 'Recomendado', dim: '1200×628' },
}
const AD_GROUP_LABEL = {
  'meta-awareness': 'Awareness',
  'meta-leads': 'Leads',
  'meta-retarget': 'Retargeting',
}

const STATUS_STYLES = {
  draft: 'border-white/10 bg-white/5 text-white/60',
  planning: 'border-gold-500/35 bg-gold-500/10 text-gold-300',
  generation_queued: 'border-gold-500/30 bg-gold-500/10 text-gold-200',
  in_production: 'border-gold-400/35 bg-gold-400/10 text-gold-100',
  ready: 'border-gold-400/40 bg-gold-400/10 text-gold-100',
  active: 'border-gold-400/40 bg-gold-400/10 text-gold-100',
  completed: 'border-white/10 bg-white/5 text-white/60',
  planned: 'border-white/10 bg-white/5 text-white/55',
  queued: 'border-gold-500/30 bg-gold-500/10 text-gold-300',
  rendering: 'border-gold-500/30 bg-gold-500/10 text-gold-200',
  generated: 'border-gold-400/40 bg-gold-400/10 text-gold-100',
  approved: 'border-gold-400/40 bg-gold-400/10 text-gold-200',
  published: 'border-white/20 bg-white/10 text-gray-300',
  done: 'border-gold-400/40 bg-gold-400/10 text-gold-100',
  error: 'border-red-400/30 bg-red-400/10 text-red-300',
}

const PLATFORM_COLOR = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  youtube: '#FF0000',
  tiktok: '#69C9D0',
  whatsapp: '#25D366',
  email: '#D4A84A',
  site: '#C4942A',
  meta_ads: '#F0C95C',
}

function StatusPill({ value }) {
  const style = STATUS_STYLES[value] || STATUS_STYLES.planned
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {String(value || 'sem status').replace(/_/g, ' ')}
    </span>
  )
}

function StatTile({ label, value, sub, icon: Icon, tone = '#C4942A' }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4 transition duration-200 hover:border-gold-500/30 hover:bg-white/[0.045]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
        <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03]" style={{ color: tone }}>
          <Icon size={14} />
        </span>
      </div>
      <p className="font-display text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-[#F4EFE3]">
        {value}
      </p>
      {sub && <p className="mt-2 text-xs leading-5 text-white/45">{sub}</p>}
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-9 rounded-full transition-all duration-200 group-hover:w-16"
        style={{ backgroundColor: tone }}
      />
    </div>
  )
}

function EmptyState({ icon: Icon, title, note }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 p-8 text-center">
      <Icon size={24} className="mb-3 text-gold-500/55" />
      <p className="text-sm font-medium text-white">{title}</p>
      {note && <p className="mt-1 max-w-md text-xs leading-relaxed text-white/42">{note}</p>}
    </div>
  )
}

function formatNumber(value, options) {
  return Number(value || 0).toLocaleString('pt-BR', options)
}

function formatDate(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleDateString('pt-BR')
}

function groupCount(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || 'sem_categoria'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function errorMessage(error) {
  return error?.message || 'Nao foi possivel concluir a acao. Confira os dados e tente novamente.'
}

function sourceTypeLabel(value) {
  return SOURCE_TYPE_OPTIONS.find(option => option.value === value)?.label || 'Fonte manual'
}

function countBriefImages(images) {
  return Object.values(images || {}).reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length
    return total + (value ? 1 : 0)
  }, 0)
}

function slugForDownload(value) {
  return String(value || 'vitra-premium')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

function evaluateMetaAdReadiness(ad) {
  const ordered = [...(ad.assets || [])].sort(
    (a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio),
  )
  const first = ordered[0] || {}
  const meta = first.metadata?.meta_ad || {}
  const formats = new Set(ordered.map(asset => asset.aspect_ratio))
  const hasPropertyImage = ordered.every(asset => Boolean(asset.source_image_url))
  const rendered = ordered.every(asset => (
    Boolean(asset.public_url) &&
    ['generated', 'approved'].includes(asset.status) &&
    !needsVitraImobiliariaApprovedTemplateRender(asset)
  ))
  const approved = ordered.every(asset => asset.status === 'approved' && !needsVitraImobiliariaApprovedTemplateRender(asset))
  const hasDestination = Boolean(meta.url_params || first.metadata?.source_intake?.landing_url || first.metadata?.source_intake?.whatsapp_url)
  const checks = [
    { id: 'formats', label: '3 cortes Meta', ok: AD_FORMAT_ORDER.every(format => formats.has(format)) },
    { id: 'property_image', label: 'Foto do imovel', ok: hasPropertyImage },
    { id: 'render', label: 'Imagens renderizadas', ok: rendered },
    { id: 'texts', label: 'Textos + CTA', ok: Boolean(first.headline && (meta.texto_principal || first.copy) && first.cta) },
    { id: 'destination', label: 'Destino / UTM', ok: hasDestination },
    { id: 'approval', label: 'Aprovacao humana', ok: approved },
  ]

  return {
    ok: checks.every(check => check.ok),
    qaReady: checks.filter(check => check.id !== 'approval').every(check => check.ok),
    checks,
  }
}

function buildAutomationSteps(campaign, assets, publications) {
  const brief = campaign?.brief || {}
  const source = brief.source_intake || {}
  const campaignAssets = assets.filter(asset => asset.campaign_id === campaign?.id)
  const metaAssets = campaignAssets.filter(asset => asset.channel === 'meta_ads')
  const metaAds = groupMetaAds(metaAssets)
  const imageCount = countBriefImages(brief.images)
  const renderedCount = metaAssets.filter(asset => Boolean(asset.public_url) && ['generated', 'approved'].includes(asset.status)).length
  const qaReadyCount = metaAds.filter(ad => evaluateMetaAdReadiness(ad).qaReady).length
  const approvedCount = metaAssets.filter(asset => asset.status === 'approved').length

  return [
    {
      label: 'Fonte recebida',
      detail: source.url ? `${sourceTypeLabel(source.type)} registrado` : imageCount ? `${imageCount} imagem(ns) enviada(s)` : 'Aguardando o upload das fotos',
      done: Boolean(source.url || imageCount),
    },
    {
      label: 'Brief estruturado',
      detail: brief.product_data?.name ? 'Dados comerciais prontos' : 'Completar dados do imovel',
      done: Boolean(brief.product_data?.name && (brief.product_data?.location || campaign?.city)),
    },
    {
      label: 'Fotos vinculadas',
      detail: imageCount ? `${imageCount} arquivo(s) no bucket cards` : 'Sem fotos de origem',
      done: imageCount > 0,
    },
    {
      label: 'Criativos gerados',
      detail: `${renderedCount}/${metaAssets.length || 0} cortes Meta renderizados`,
      done: metaAssets.length > 0 && renderedCount === metaAssets.length,
    },
    {
      label: 'QA automatico',
      detail: `${qaReadyCount}/${metaAds.length || 0} anuncios prontos para revisao`,
      done: metaAds.length > 0 && qaReadyCount === metaAds.length,
    },
    {
      label: 'Aprovacao e exportacao',
      detail: `${approvedCount}/${metaAssets.length || 0} cortes aprovados · ${publications.length} publicacao(oes)`,
      done: metaAssets.length > 0 && approvedCount === metaAssets.length,
    },
  ]
}

function downloadMetaAdsPackage(campaign, ads, brandProfile = getBrandProfile()) {
  const payload = {
    export_type: brandProfile.metaPackageType,
    generated_at: new Date().toISOString(),
    brand_scope: brandProfile.scope,
    brand_name: brandProfile.name,
    campaign: {
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      product_name: campaign.product_name,
      objective: campaign.campaign_objective,
      audience: campaign.target_audience,
      period: {
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      },
      source_intake: campaign.brief?.source_intake || null,
      qa_policy: campaign.brief?.qa_policy || null,
      creative_validation: campaign.brief?.creative_validation || null,
    },
    human_gate: {
      publish_policy: 'draft_or_manual_upload_first',
      requires_budget_authorization: true,
      requires_final_creative_approval: true,
    },
    ads: ads.map(ad => {
      const ordered = [...ad.assets].sort(
        (a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio),
      )
      const first = ordered[0] || {}
      const meta = first.metadata?.meta_ad || {}
      return {
        group_key: ad.key,
        group_label: ad.label,
        visual_template: first.metadata?.visual_template || null,
        readiness: evaluateMetaAdReadiness(ad),
        meta_fields: {
          ad_name: meta.nome || `${campaign.name} | ${ad.label}`,
          primary_text: meta.texto_principal || first.copy || '',
          headline: first.headline || '',
          description: meta.descricao || '',
          cta: first.cta || '',
          url_params: meta.url_params || '',
        },
        placements: ordered.map(asset => ({
          asset_id: asset.id,
          format: asset.aspect_ratio,
          placement: META_PLACEMENTS[asset.aspect_ratio] || null,
          status: asset.status,
          public_url: asset.public_url,
          storage_path: asset.storage_path,
          template_key: asset.template_key,
          visual_template: asset.metadata?.visual_template || null,
        })),
      }
    }),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugForDownload(campaign.slug || campaign.name)}-meta-ads-package.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function PremiumDashboard({ focusMode = null, brandScope = BRAND_SCOPES.premium }) {
  const isPaidTrafficMode = focusMode === 'trafego'
  const brandProfile = getBrandProfile(brandScope)
  const [workspace, setWorkspace] = useState({
    campaigns: [],
    assets: [],
    posts: [],
    publications: [],
    metrics: [],
    jobs: [],
    accounts: [],
    snapshots: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [activeTab, setActiveTab] = useState(isPaidTrafficMode ? 'trafego' : 'assets')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPublication, setSavingPublication] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [editingAd, setEditingAd] = useState(null)
  const [assetBusyId, setAssetBusyId] = useState(null)
  const [rendering, setRendering] = useState(false)
  const [notice, setNotice] = useState(null)
  const [campaignSubmitError, setCampaignSubmitError] = useState(null)
  const [editorialSettings, setEditorialSettings] = useState(null)
  const autoRenderCampaignsRef = useRef(new Set())
  const autoRenderRunningRef = useRef(null)

  function openCampaignModal() {
    setCampaignSubmitError(null)
    setError(null)
    setModalOpen(true)
  }

  async function refresh(selectCampaignId = selectedCampaignId, { silent = false } = {}) {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await loadPremiumWorkspace({ brandScope })
      setWorkspace(data)
      // '' = "sem oferta" (preservar). Inicial (null): no ORGANICO comeca SEM oferta (conteudo de marca
      // e o padrao); so o Tráfego Pago precisa de uma oferta selecionada de cara.
      const nextSelected = selectCampaignId != null ? selectCampaignId : (isPaidTrafficMode ? (data.campaigns[0]?.id || null) : '')
      setSelectedCampaignId(nextSelected)
    } catch (err) {
      setError(err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    refresh(null)
  }, [brandScope])

  // Configuracoes editoriais por marca (governanca da pauta): pilares ativos, tom padrao, diretrizes.
  useEffect(() => {
    let alive = true
    loadEditorialSettings(brandScope).then(s => { if (alive) setEditorialSettings(s) })
    return () => { alive = false }
  }, [brandScope])

  const selectedCampaign = useMemo(
    // '' = "sem oferta" escolhido explicitamente -> nenhuma oferta em foco (conteudo de marca).
    () => (selectedCampaignId === '' ? null : (workspace.campaigns.find(campaign => campaign.id === selectedCampaignId) || workspace.campaigns[0] || null)),
    [selectedCampaignId, workspace.campaigns],
  )

  const scoped = useMemo(() => {
    const campaignId = selectedCampaign?.id
    const filterByCampaign = row => !campaignId || row.campaign_id === campaignId
    return {
      assets: workspace.assets.filter(filterByCampaign),
      posts: workspace.posts.filter(filterByCampaign),
      publications: workspace.publications.filter(filterByCampaign),
      metrics: workspace.metrics.filter(filterByCampaign),
      jobs: workspace.jobs.filter(filterByCampaign),
    }
  }, [selectedCampaign, workspace])

  const totals = useMemo(() => {
    const campaignMetrics = scoped.metrics
    const paidSpend = campaignMetrics.reduce((sum, metric) => sum + Number(metric.spend || 0), 0)
    const reach = campaignMetrics.reduce((sum, metric) => sum + Number(metric.reach || 0), 0)
    const impressions = campaignMetrics.reduce((sum, metric) => sum + Number(metric.impressions || 0), 0)
    const leads = campaignMetrics.reduce((sum, metric) => sum + Number(metric.leads || 0), 0)

    return {
      campaigns: workspace.campaigns.length,
      assets: scoped.assets.length,
      posts: scoped.posts.length,
      publications: scoped.publications.length,
      reach,
      impressions,
      leads,
      paidSpend,
    }
  }, [scoped, workspace.campaigns.length])

  // KPIs ORGANICOS do header (modo Conteúdo): contagem de posts por etapa do funil.
  const contentStats = useMemo(() => {
    const posts = scoped.posts
    const isStatus = s => p => p.status === s
    return {
      total: posts.length,
      drafts: posts.filter(p => !['scheduled', 'published', 'archived'].includes(p.status)).length,
      scheduled: posts.filter(isStatus('scheduled')).length,
      published: posts.filter(isStatus('published')).length,
    }
  }, [scoped.posts])

  const paidTrafficOverview = useMemo(() => {
    const metaAssets = workspace.assets.filter(asset => asset.channel === 'meta_ads')
    const adGroups = groupMetaAdsByCampaign(metaAssets)
    const pendingRender = metaAssets.filter(asset => isRenderablePendingAsset(asset)).length
    return {
      campaigns: new Set(metaAssets.map(asset => asset.campaign_id).filter(Boolean)).size,
      cuts: metaAssets.length,
      queued: pendingRender,
      readyAds: adGroups.filter(ad => evaluateMetaAdReadiness(ad).ok).length,
      adGroups: adGroups.length,
    }
  }, [workspace.assets])

  useEffect(() => {
    const shouldAutoRender = isPaidTrafficMode || activeTab === 'trafego'
    const campaignId = selectedCampaign?.id
    if (!shouldAutoRender || !campaignId || loading || saving) return
    if (rendering && autoRenderRunningRef.current !== campaignId) return
    if (autoRenderRunningRef.current === campaignId) return
    if (autoRenderCampaignsRef.current.has(campaignId)) return

    const pendingAssets = scoped.assets.filter(asset => (
      asset.channel === 'meta_ads' &&
      asset.source_image_url &&
      isRenderablePendingAsset(asset)
    ))
    if (!pendingAssets.length) return

    let lastRefreshAt = 0

    autoRenderCampaignsRef.current.add(campaignId)
    autoRenderRunningRef.current = campaignId
    setRendering(true)
    setError(null)
    setNotice(`Gerando cortes automaticamente a partir das fotos enviadas... 0/${pendingAssets.length}`)

    renderCampaignAssets(campaignId, {
      batch: 1,
      assetIds: pendingAssets.map(asset => asset.id),
      onProgress: async ({ processed, total, rendered, failed }) => {
        setNotice(`Gerando cortes automaticamente... ${processed}/${total} processado(s), ${rendered} gerado(s)${failed ? `, ${failed} com erro` : ''}.`)
        if (processed - lastRefreshAt >= 1 || processed === total) {
          lastRefreshAt = processed
          await refresh(campaignId, { silent: true })
        }
      },
    })
      .then(result => {
        if (result.error && !result.rendered) throw result.error
        if (!result.rendered && result.failed) {
          setNotice(`Nenhum corte foi gerado automaticamente. ${result.failed} tentativa(s) falharam; use Gerar cortes para tentar novamente.`)
          return
        }
        setNotice(`Cortes gerados automaticamente: ${result.rendered} criativo(s)${result.failed ? `, ${result.failed} com erro` : ''}.`)
      })
      .catch(err => {
        setError(err)
        setNotice('A geracao automatica nao concluiu. Use Gerar cortes para tentar novamente.')
      })
      .finally(async () => {
        if (autoRenderRunningRef.current === campaignId) autoRenderRunningRef.current = null
        setRendering(false)
        await refresh(campaignId, { silent: true })
      })
  }, [activeTab, isPaidTrafficMode, loading, saving, scoped.assets, selectedCampaign?.id])

  async function handleCreateCampaign(form) {
    setSaving(true)
    setError(null)
    setCampaignSubmitError(null)
    setNotice(null)
    let campaign
    try {
      campaign = await createPremiumCampaign(form, { brandScope })
    } catch (err) {
      setError(err)
      setCampaignSubmitError(err)
      setSaving(false)
      throw err
    }
    setModalOpen(false)
    setSaving(false)
    await refresh(campaign.id)
    setActiveTab(isPaidTrafficMode ? 'trafego' : 'assets')
    setNotice('Campanha criada. A geracao automatica dos cortes vai iniciar em segundo plano.')
  }

  async function handleDeleteCampaign(campaign) {
    if (!window.confirm(`Excluir "${campaign.name}"? Todos os assets, conteúdos e publicações da campanha serão removidos.`)) return
    try {
      await deleteCampaign(campaign.id)
      if (selectedCampaignId === campaign.id) setSelectedCampaignId(null)
      await refresh(null)
    } catch (err) {
      setError(err)
    }
  }

  async function handleCreatePublication(form) {
    setSavingPublication(true)
    setError(null)
    try {
      await createManualPublication(form)
      await refresh(form.campaign_id)
      setActiveTab('publicacoes')
    } catch (err) {
      setError(err)
    } finally {
      setSavingPublication(false)
    }
  }

  async function handleApproveAsset(asset) {
    setAssetBusyId(asset.id)
    setError(null)
    try {
      await approveAsset(asset.id)
      await refresh(selectedCampaignId)
    } catch (err) {
      setError(err)
    } finally {
      setAssetBusyId(null)
    }
  }

  async function handleApproveGroup(assetsInGroup) {
    const ids = assetsInGroup.map(a => a.id)
    if (!ids.length) return
    setAssetBusyId(ids[0])
    setError(null)
    try {
      await approveAssets(ids)
      await refresh(selectedCampaignId)
    } catch (err) {
      setError(err)
    } finally {
      setAssetBusyId(null)
    }
  }

  async function handleSaveAssetEdit(assetId, patch) {
    setAssetBusyId(assetId)
    setError(null)
    try {
      await saveAssetEdit(assetId, patch)
      setEditingAsset(null)
      await refresh(selectedCampaignId)
    } catch (err) {
      setError(err)
    } finally {
      setAssetBusyId(null)
    }
  }

  async function handleSaveAd(assets, fields) {
    if (!assets?.length) return
    setAssetBusyId(assets[0].id)
    setError(null)
    try {
      await saveAd(assets, fields)
      setEditingAd(null)
      await refresh(selectedCampaignId)
    } catch (err) {
      setError(err)
    } finally {
      setAssetBusyId(null)
    }
  }

  async function handleRenderCampaign() {
    if (!selectedCampaign) return
    setRendering(true)
    setError(null)
    setNotice(null)
    try {
      const assetIds = scoped.assets
        .filter(asset => (
          !['whatsapp', 'email'].includes(asset.channel) &&
          isRenderablePendingAsset(asset)
        ))
        .map(asset => asset.id)
      const result = await renderCampaignAssets(selectedCampaign.id, { assetIds })
      if (result.error && !result.rendered) throw result.error
      setNotice(`Renderização concluída: ${result.rendered} criativo(s) gerado(s)${result.failed ? `, ${result.failed} com erro` : ''}.`)
      await refresh(selectedCampaign.id)
    } catch (err) {
      setError(err)
    } finally {
      setRendering(false)
    }
  }

  const missingSchema = error && /premium_|schema cache|does not exist|relation/i.test(error.message || '')

  return (
    <div className="min-h-screen text-white">
      <div className="relative overflow-hidden border-b border-gold-500/15 bg-[color:var(--surface-0)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_0%,rgba(196,148,42,0.12),transparent_24rem)]" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-7 lg:px-8">
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <BrandHorizontalLogo brandScope={brandScope} className="mb-7" />
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-10 bg-gold-500/70" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-gold-400">
                  {isPaidTrafficMode ? brandProfile.trafficKicker : brandProfile.areaKicker}
                </p>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-[3.25rem]">
                {isPaidTrafficMode ? brandProfile.trafficTitle : brandProfile.dashboardTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/52">
                {isPaidTrafficMode
                  ? brandProfile.trafficSubtitle
                  : brandProfile.dashboardSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => refresh()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-white/70 transition hover:border-gold-500/30 hover:text-white"
                title="Atualizar dados"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
              {isPaidTrafficMode ? (
                <button
                  onClick={openCampaignModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400"
                >
                  <Plus size={16} />
                  Nova campanha
                </button>
              ) : (
                /* Seção orgânica: só conteúdo. Criar oferta é ação de campanha (vive no Tráfego Pago). */
                <button
                  onClick={() => { setActiveTab('assets'); requestAnimationFrame(() => document.getElementById('content-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400"
                >
                  <Plus size={16} />
                  Novo conteúdo
                </button>
              )}
            </div>
          </div>

          {isPaidTrafficMode ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Campanhas com Ads" value={paidTrafficOverview.campaigns} sub="com cortes Meta" icon={Briefcase} />
              <StatTile label="Cortes Meta" value={paidTrafficOverview.cuts} sub={`${paidTrafficOverview.queued} aguardando render`} icon={Megaphone} />
              <StatTile label="Anuncios prontos" value={`${paidTrafficOverview.readyAds}/${paidTrafficOverview.adGroups}`} sub="QA + aprovacao" icon={CheckCircle2} tone="#F0C95C" />
              <StatTile
                label="Investimento"
                value={formatNumber(totals.paidSpend, { style: 'currency', currency: 'BRL' })}
                sub={`${formatNumber(totals.leads)} leads importados`}
                icon={BarChart3}
                tone="#D4A84A"
              />
            </div>
          ) : (
            /* KPIs ORGANICOS (conteudo), nao pagos: nada de investimento/leads/campanhas aqui. */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Conteúdos" value={contentStats.total} sub={`no ambiente ${brandProfile.shortName}`} icon={FileText} />
              <StatTile label="Rascunhos" value={contentStats.drafts} sub="em produção" icon={Pencil} />
              <StatTile label="Agendados" value={contentStats.scheduled} sub="na linha do tempo" icon={Clock} tone="#E4C06E" />
              <StatTile label="Publicados" value={contentStats.published} sub="no ar" icon={CheckCircle2} tone="#D4A84A" />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
              <Database size={13} className="text-gold-400" />
              <span>{supabaseConfig.projectRef}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{supabaseConfig.url}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/45">
              {supabaseConfig.hasPublicKey ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-300" />
                  Supabase configurado
                </>
              ) : (
                <>
                  <AlertTriangle size={13} className="text-red-300" />
                  Chave pública ausente
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-400/25 bg-red-950/25 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-300" />
              <div>
                <p className="text-sm font-semibold text-red-100">
                  {missingSchema ? 'Schema operacional ainda não aplicado' : `Falha ao carregar a área ${brandProfile.shortName}`}
                </p>
                <p className="mt-1 text-xs leading-5 text-red-100/70">
                  {missingSchema
                    ? 'Execute supabase/migration-premium-operational.sql no SQL Editor do projeto birxcfkyuzqnhyvetbjv e atualize esta tela.'
                    : error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Item 4 (content-first): NAO ha mais seletor global de oferta no topo do organico — a secao
            opera em visao de MARCA (brand-wide). O vinculo com oferta virou CONTEXTUAL, dentro do card de
            "Novo conteúdo" (por post). Oferta/campanha e nativo do Tráfego Pago. */}
        {!isPaidTrafficMode && (
          <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-4 py-3 text-sm font-medium transition duration-200 ${active ? 'border-gold-500 bg-gold-500/[0.06] text-gold-300' : 'border-transparent text-white/52 hover:border-white/20 hover:text-white/90'}`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {loading && (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gold-300">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Carregando base {brandProfile.shortName}</span>
            </div>
          </div>
        )}

        {!loading && isPaidTrafficMode && (
          <PaidTrafficWorkspace
            brandProfile={brandProfile}
            campaigns={workspace.campaigns}
            selectedCampaign={selectedCampaign}
            selectedCampaignId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
            onCreate={openCampaignModal}
            onDelete={handleDeleteCampaign}
            assets={workspace.assets}
            publications={workspace.publications}
            scopedAssets={scoped.assets}
            rendering={rendering}
            busyId={assetBusyId}
            notice={notice}
            onRender={handleRenderCampaign}
            onApproveGroup={handleApproveGroup}
            onEditAd={setEditingAd}
          />
        )}

        {!loading && !isPaidTrafficMode && activeTab === 'campanhas' && (
          <CampaignsSection
            brandProfile={brandProfile}
            campaigns={workspace.campaigns}
            selectedCampaign={selectedCampaign}
            selectedCampaignId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
            onCreate={openCampaignModal}
            onDelete={handleDeleteCampaign}
            assets={workspace.assets}
            posts={workspace.posts}
            publications={workspace.publications}
          />
        )}

        {/* Conteúdo é ORGANICO: o entregavel e o POST (texto), produzido pelo fluxo de IA editorial /
            manual no funil. A matriz de criativos (render Satori) e conceito de TRAFEGO PAGO/Estudio —
            nao vive aqui (era o que mostrava "0 criativo(s) gerado(s)", pois so renderiza channel=meta_ads). */}
        {!loading && !isPaidTrafficMode && activeTab === 'assets' && (
          <ContentProductionSection
            brandProfile={brandProfile}
            campaigns={workspace.campaigns}
            posts={scoped.posts}
            editorialSettings={editorialSettings}
            onSaved={() => refresh(selectedCampaignId, { silent: true })}
          />
        )}

        {!loading && !isPaidTrafficMode && activeTab === 'config' && (
          <EditorialSettingsSection
            brandProfile={brandProfile}
            settings={editorialSettings}
            onSaved={setEditorialSettings}
          />
        )}

        {!loading && !isPaidTrafficMode && activeTab === 'trafego' && (
          <TrafegoPagoSection
            brandProfile={brandProfile}
            campaign={selectedCampaign}
            assets={scoped.assets}
            rendering={rendering}
            busyId={assetBusyId}
            notice={notice}
            onRender={handleRenderCampaign}
            onApproveGroup={handleApproveGroup}
            onEditAd={setEditingAd}
          />
        )}

        {!loading && !isPaidTrafficMode && activeTab === 'publicacoes' && (
          <PublicationsSection
            posts={scoped.posts}
            publications={scoped.publications}
            assets={scoped.assets}
            saving={savingPublication}
            onCreatePublication={handleCreatePublication}
          />
        )}

        {!loading && !isPaidTrafficMode && activeTab === 'metricas' && (
          <MetricsSection campaign={selectedCampaign} publications={scoped.publications} metrics={scoped.metrics} totals={totals} snapshots={workspace.snapshots} />
        )}

      </div>

      {modalOpen && (
        <NewCampaignModal
          brandProfile={brandProfile}
          saving={saving}
          submitError={campaignSubmitError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateCampaign}
        />
      )}

      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          saving={assetBusyId === editingAsset.id}
          onClose={() => setEditingAsset(null)}
          onSave={handleSaveAssetEdit}
        />
      )}

      {editingAd && (
        <AdEditModal
          ad={editingAd}
          campaign={workspace.campaigns.find(c => c.id === editingAd.assets?.[0]?.campaign_id) || null}
          brandScope={brandScope}
          saving={assetBusyId === editingAd.assets?.[0]?.id}
          onClose={() => setEditingAd(null)}
          onSave={handleSaveAd}
        />
      )}
    </div>
  )
}

function PaidTrafficWorkspace({
  brandProfile,
  campaigns,
  selectedCampaign,
  selectedCampaignId,
  onSelect,
  onCreate,
  onDelete,
  assets,
  publications,
  scopedAssets,
  rendering,
  busyId,
  notice,
  onRender,
  onApproveGroup,
  onEditAd,
}) {
  if (!campaigns.length) {
    return (
      <EmptyState
        icon={Megaphone}
        title={brandProfile.emptyTrafficTitle}
        note={brandProfile.emptyTrafficNote}
      />
    )
  }

  const selectedPublications = selectedCampaign
    ? publications.filter(publication => publication.campaign_id === selectedCampaign.id)
    : []

  return (
    <div className="space-y-6">
      <PaidTrafficCampaignSelector
        brandProfile={brandProfile}
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        assets={assets}
        onSelect={onSelect}
        onCreate={onCreate}
        onDelete={onDelete}
      />

      {selectedCampaign && (
        <AutomationWorkflowPanel
          campaign={selectedCampaign}
          assets={assets}
          publications={selectedPublications}
        />
      )}

      <TrafegoPagoSection
        brandProfile={brandProfile}
        campaign={selectedCampaign}
        assets={scopedAssets}
        rendering={rendering}
        busyId={busyId}
        notice={notice}
        onRender={onRender}
        onApproveGroup={onApproveGroup}
        onEditAd={onEditAd}
      />
    </div>
  )
}

function PaidTrafficCampaignSelector({ brandProfile, campaigns, selectedCampaignId, assets, onSelect, onCreate, onDelete }) {
  return (
    <div className="rounded-lg border border-gold-500/18 bg-[color:var(--surface-1)] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Megaphone size={15} className="text-gold-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300">Campanha de mídia ativa</p>
          </div>
          <p className="text-sm leading-6 text-white/52">
            Escolha a campanha para gerar cortes, revisar QA e exportar o pacote de anúncios. A aba de tráfego fica isolada para {brandProfile.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/10 px-3.5 py-2 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20"
        >
          <Plus size={15} />
          Nova campanha
        </button>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        {campaigns.map(campaign => {
          const campaignAssets = assets.filter(asset => asset.campaign_id === campaign.id && asset.channel === 'meta_ads')
          const adGroups = groupMetaAds(campaignAssets)
          const readyAds = adGroups.filter(ad => evaluateMetaAdReadiness(ad).ok).length
          const active = selectedCampaignId === campaign.id

          return (
            <div
              key={campaign.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(campaign.id)}
              onKeyDown={e => e.key === 'Enter' && onSelect(campaign.id)}
              className="group cursor-pointer rounded-md border p-3 text-left transition"
              style={{
                borderColor: active ? 'rgba(196,148,42,0.55)' : 'rgba(255,255,255,0.09)',
                background: active ? 'rgba(196,148,42,0.10)' : 'rgba(255,255,255,0.025)',
              }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{campaign.name}</p>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {active && <CheckCircle2 size={14} className="text-gold-300" />}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onDelete(campaign) }}
                      className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 text-white/30"
                      title="Excluir campanha"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="truncate text-xs text-white/42">{campaign.product_name || campaign.property_type || brandProfile.campaignFallback}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
                <span>{campaignAssets.length} cortes</span>
                <span className="h-1 w-1 rounded-full bg-white/18" />
                <span>{readyAds}/{adGroups.length || 0} anúncios prontos</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CampaignsSection({ brandProfile, campaigns, selectedCampaign, selectedCampaignId, onSelect, onCreate, onDelete, assets, posts, publications }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        icon={Gem}
        title={brandProfile.emptyCampaignTitle}
        note={brandProfile.emptyCampaignNote}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px),1fr]">
      <div className="space-y-3">
        {campaigns.map(campaign => {
          const active = campaign.id === selectedCampaignId
          const campaignAssets = assets.filter(asset => asset.campaign_id === campaign.id).length
          const campaignPosts = posts.filter(post => post.campaign_id === campaign.id).length
          return (
            <div
              key={campaign.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(campaign.id)}
              onKeyDown={e => e.key === 'Enter' && onSelect(campaign.id)}
              className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border p-4 pl-5 text-left transition duration-200 ${active ? 'border-gold-500/55 bg-gold-500/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-gold-500/25 hover:bg-white/[0.045]'}`}
            >
              <span
                className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gold-500 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
              />
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold leading-tight text-white">{campaign.name}</p>
                  <p className="mt-1 truncate text-xs text-white/42">{campaign.product_name || campaign.property_type || brandProfile.campaignFallback}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <StatusPill value={campaign.status} />
                  {onDelete && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onDelete(campaign) }}
                      className="flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 text-white/30"
                      title="Excluir campanha"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
                <span className="inline-flex items-center gap-1.5"><Layers3 size={12} className="text-white/30" />{campaignAssets} assets</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="inline-flex items-center gap-1.5"><Send size={12} className="text-white/30" />{campaignPosts} conteúdos</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-white/30" />{formatDate(campaign.start_date)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {selectedCampaign ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
          <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-8 bg-gold-500/70" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Brief ativo</p>
              </div>
              <h2 className="font-display text-3xl font-semibold text-white">{selectedCampaign.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{selectedCampaign.offer || 'Oferta consultiva ainda nao definida.'}</p>
            </div>
            <StatusPill value={selectedCampaign.status} />
          </div>

          {selectedCampaign.brief?.product_data?.tagline && (
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">
              {selectedCampaign.brief.product_data.tagline}
            </p>
          )}

          <AutomationWorkflowPanel
            campaign={selectedCampaign}
            assets={assets}
            publications={publications.filter(publication => publication.campaign_id === selectedCampaign.id)}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <BriefItem label="Produto" value={selectedCampaign.product_name} />
            <BriefItem label="Localização" value={selectedCampaign.brief?.product_data?.location || [selectedCampaign.neighborhood, selectedCampaign.city].filter(Boolean).join(', ')} />
            <BriefItem label="Objetivo" value={selectedCampaign.campaign_objective?.replace(/_/g, ' ')} />
            <BriefItem label="Metragem" value={selectedCampaign.brief?.product_data?.area} />
            <BriefItem label="Suítes" value={selectedCampaign.brief?.product_data?.suites} />
            <BriefItem label="Torres / andares" value={selectedCampaign.brief?.product_data?.towers} />
            <BriefItem label="Preço" value={selectedCampaign.brief?.product_data?.price} />
            <BriefItem label="Público" value={selectedCampaign.target_audience} wide />
            <BriefItem label="Diferenciais" value={selectedCampaign.brief?.product_data?.differentials} wide />
            <BriefItem label="Mídia" value={selectedCampaign.budget_type?.replace(/_/g, ' ')} />
            <BriefItem label="Período" value={`${formatDate(selectedCampaign.start_date)} - ${formatDate(selectedCampaign.end_date)}`} />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MiniCount icon={Layers3} label="Assets" value={assets.filter(asset => asset.campaign_id === selectedCampaign.id).length} />
            <MiniCount icon={FileText} label="Conteúdos" value={posts.filter(post => post.campaign_id === selectedCampaign.id).length} />
            <MiniCount icon={Radio} label="Publicações" value={publications.filter(publication => publication.campaign_id === selectedCampaign.id).length} />
          </div>
        </div>
      ) : (
        <EmptyState icon={Target} title="Selecione uma campanha" />
      )}
    </div>
  )
}

function AutomationWorkflowPanel({ campaign, assets, publications }) {
  const source = campaign.brief?.source_intake || {}
  const steps = buildAutomationSteps(campaign, assets, publications)
  const doneCount = steps.filter(step => step.done).length
  const nextStep = steps.find(step => !step.done)

  return (
    <div className="mb-6 rounded-lg border border-gold-500/20 bg-black/20 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Wand2 size={15} className="text-gold-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300">Esteira de automacao</p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-white/58">
            Fluxo pensado para receber fonte, montar brief, gerar cortes Meta Ads, checar prontidao e exportar pacote sem execucao manual de peca por peca.
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/55">
          <span className="text-white/35">Progresso</span>
          <span className="ml-2 font-semibold text-gold-200">{doneCount}/{steps.length}</span>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <BriefItem label="Fonte principal" value={source.url ? sourceTypeLabel(source.type) : 'Brief/upload manual'} />
        <BriefItem label="Destino comercial" value={source.landing_url || source.whatsapp_url || 'Definir antes da subida'} />
        <BriefItem label="Intervencao humana" value="Confirmar brief, aprovar criativos e autorizar verba" />
      </div>

      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-gold-200 transition hover:text-gold-100"
        >
          <ExternalLink size={13} />
          Abrir fonte registrada
        </a>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => {
          const active = !step.done && step === nextStep
          return (
            <div
              key={step.label}
              className="rounded-md border px-3 py-3"
              style={{
                borderColor: step.done ? 'rgba(196,148,42,0.35)' : active ? 'rgba(240,201,92,0.45)' : 'rgba(255,255,255,0.08)',
                background: step.done ? 'rgba(196,148,42,0.08)' : active ? 'rgba(240,201,92,0.08)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Etapa {index + 1}</span>
                {step.done ? <CheckCircle2 size={14} className="text-gold-300" /> : active ? <Clock size={14} className="text-gold-200" /> : <span className="h-2 w-2 rounded-full bg-white/15" />}
              </div>
              <p className="text-sm font-semibold text-white">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/45">{step.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BriefItem({ label, value, wide }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="text-sm leading-6 text-white/72">{value || 'Nao informado'}</p>
    </div>
  )
}

function MiniCount({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-white/45">
        <Icon size={14} className="text-gold-400" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="font-display text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

const DIMENSION_LABEL = {
  '1:1': '1080×1080',
  '9:16': '1080×1920',
  '4:5': '1080×1350',
  '16:9': '1280×720',
  '1.91:1': '1200×628',
  desktop: '1200×630',
}

const ASPECT_CSS = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '4:5': '4 / 5',
  '16:9': '16 / 9',
  '1.91:1': '1.91 / 1',
  desktop: '1200 / 630',
}

const CATEGORY = {
  meta_ad: 'Meta Ads',
  carousel: 'Carrosséis',
  short_video: 'Reels',
  story: 'Stories',
  whatsapp: 'WhatsApp',
  email: 'E-mails',
  thumbnail: 'Thumbnails',
  landing_page: 'Landing',
}

const CHANNEL_TAG = {
  meta_ads: 'META',
  instagram: 'IG',
  facebook: 'FB',
  youtube: 'YT',
  whatsapp: 'WPP',
  email: 'E-MAIL',
  site: 'LANDING',
}

const NON_VISUAL = new Set(['whatsapp', 'email'])

const PHASES = [
  { id: '1', label: 'Teaser', tag: 'FASE 1 — TEASER' },
  { id: '2', label: 'Revelação', tag: 'FASE 2 — REVELAÇÃO' },
  { id: '3', label: 'Urgência', tag: 'FASE 3 — URGÊNCIA' },
]
const PHASE_TAG = Object.fromEntries(PHASES.map(p => [p.id, p.tag]))

function phaseTag(id) {
  return PHASE_TAG[String(id)] || null
}

function itemPhase(item) {
  if (item.kind === 'carousel') {
    const cover = item.slides.find(s => s.format === 'carousel_cover') || item.slides[0]
    return cover?.metadata?.campaign_phase ? String(cover.metadata.campaign_phase) : null
  }
  return item.asset?.metadata?.campaign_phase ? String(item.asset.metadata.campaign_phase) : null
}

// Estacao de Conteúdo ORGANICO (reorg do fluxo): CRIAR (IA ou manual) -> board por ACOES
// (Rascunho -> Aprovado -> Agendado -> Publicado). O status e DERIVADO da acao (o operador nao escolhe
// um estado cru); a data so aparece ao Agendar; "Marcar publicado" tambem registra a publicacao real
// (premium_publications) para destravar metricas. Reusa contentPlaybook + premium_content_posts.
function ContentProductionSection({ brandProfile = getBrandProfile(), campaigns = [], posts = [], editorialSettings = null, onSaved }) {
  const typeMeta = id => CONTENT_TYPE_OPTIONS.find(t => t.key === id)
  const [mode, setMode] = useState('ia')                 // 'ia' | 'manual' | 'import'
  // Item 4: o vinculo com oferta e CONTEXTUAL (por conteudo), nao mais global no topo. Default = sem oferta.
  const [linkedCampaignId, setLinkedCampaignId] = useState('')
  const [contentType, setContentType] = useState(DEFAULT_CONTENT_TYPE)
  const [pillar, setPillar] = useState(typeMeta(DEFAULT_CONTENT_TYPE)?.pillar || '')
  const [format, setFormat] = useState(typeMeta(DEFAULT_CONTENT_TYPE)?.format || 'feed')
  const [platform, setPlatform] = useState('instagram')
  const [tone, setTone] = useState('padrao')
  const [tema, setTema] = useState('')
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [savingKey, setSavingKey] = useState(null)
  const [savedKeys, setSavedKeys] = useState(() => new Set())
  const [drafts, setDrafts] = useState({})
  const [manual, setManual] = useState({ title: '', caption: '', cta: '', hashtags: '' })
  const [savingManual, setSavingManual] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [rowBusy, setRowBusy] = useState(null)
  const [schedulingId, setSchedulingId] = useState(null)
  const [detailPost, setDetailPost] = useState(null)   // Fase 2: drawer "Prévia do post" (texto + arte + versões)
  const [savedNotice, setSavedNotice] = useState(null)   // confirmacao "para onde foi"
  const [highlightId, setHighlightId] = useState(null)    // id do rascunho recem-salvo (rolar + destacar)

  // Ao trocar o tipo, sugere pilar e formato default (operador pode mudar).
  useEffect(() => {
    const t = typeMeta(contentType)
    if (t) { setPillar(t.pillar); setFormat(t.format) }
  }, [contentType])

  // Governanca editorial (Configurações): pilares ativos filtram o seletor; tom padrao da marca; as
  // diretrizes entram no prompt da IA via context.
  const activePillars = editorialSettings?.active_pillars || []
  const pillarOpts = (activePillars.length ? CONTENT_PILLAR_OPTIONS.filter(p => activePillars.includes(p.key)) : CONTENT_PILLAR_OPTIONS)
  useEffect(() => {
    if (editorialSettings?.default_tone) setTone(editorialSettings.default_tone)
  }, [editorialSettings?.default_tone])

  // Ao salvar, quando o board recarrega com o novo rascunho: rola ate ele e destaca por alguns segundos.
  useEffect(() => {
    if (!highlightId) return
    const el = document.getElementById(`post-row-${highlightId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t1 = setTimeout(() => setHighlightId(null), 3500)
    const t2 = setTimeout(() => setSavedNotice(null), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [highlightId, posts])

  // Opcao A (content-first): vinculo com oferta e CONTEXTUAL ao tipo. "required" bloqueia salvar sem
  // oferta; "suggested" so mostra dica (nao bloqueia); "none" ignora o campo (conteudo de marca).
  const offerLink = typeMeta(contentType)?.offer || 'none'
  const offerRequired = offerLink === 'required'
  const offerSuggested = offerLink === 'suggested'
  const linkedCampaign = campaigns.find(c => c.id === linkedCampaignId) || null
  const blockedByOffer = offerRequired && !linkedCampaign
  const campaignName = id => campaigns.find(c => c.id === id)?.name || null

  // Fase 1: arte do post integrada. Auto-arte ao aprovar (config editorial, padrão ligado).
  const autoArtOnApprove = editorialSettings?.auto_art_on_approve !== false
  // Monta o artOpts do postArt.js a partir de uma sugestão da IA OU de um post salvo (prévia + auto-arte).
  function artOptsFor({ brandScope, format: fmt, title, caption, cta, pillarKey } = {}) {
    const scope = brandScope || brandProfile.scope
    const kicker = (CONTENT_PILLAR_OPTIONS.find(x => x.key === pillarKey)?.label) || brandProfile.shortName
    return { brandScope: scope, format: fmt || 'feed', title: title || '', caption: caption || '', cta: cta || '', kicker, photoUrl: null }
  }

  const PLATFORMS = [
    { value: 'instagram', label: 'Instagram' }, { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' }, { value: 'tiktok', label: 'TikTok' },
    { value: 'linkedin', label: 'LinkedIn' }, { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'site', label: 'Site' }, { value: 'email', label: 'E-mail' },
  ]

  // Etapa (chip) DERIVADA do status — o operador pensa no funil, nao no status cru do banco.
  function stageOf(status) {
    if (status === 'published') return 'publicado'
    if (status === 'scheduled') return 'agendado'
    if (status === 'approved') return 'aprovado'
    if (status === 'archived') return 'arquivado'
    return 'rascunho'
  }
  const STAGE = {
    rascunho:  { label: 'Rascunho',  cls: 'border-white/15 text-white/55', order: 0 },
    aprovado:  { label: 'Aprovado',  cls: 'border-sky-400/30 text-sky-200', order: 1 },
    agendado:  { label: 'Agendado',  cls: 'border-gold-500/40 text-gold-200', order: 2 },
    publicado: { label: 'Publicado', cls: 'border-emerald-400/30 text-emerald-200', order: 3 },
    arquivado: { label: 'Arquivado', cls: 'border-white/10 text-white/30', order: 4 },
  }

  async function handleGenerate() {
    setGenerating(true); setError(null); setResults([]); setSavedKeys(new Set())
    try {
      const context = { tema, product_name: linkedCampaign?.product_name || '', bairro: linkedCampaign?.city || '' }
      if (editorialSettings?.guidelines?.trim()) context.diretrizes_da_marca = editorialSettings.guidelines.trim()
      setResults(await generateContentWithAI({ brandScope: brandProfile.scope, contentType, pillar, format, tone, count: 3, context }))
    } catch (e) { setError(e) } finally { setGenerating(false) }
  }

  async function handleSave(post) {
    setSavingKey(post.key); setError(null)
    try {
      const saved = await createContentPost({
        campaignId: linkedCampaign?.id, brandScope: brandProfile.scope, contentType, platform,
        pillar: post.pillar || pillar, format: post.format || format,
        title: post.headline || post.idea, hook: post.headline,
        caption: drafts[post.key] ?? post.caption, hashtags: post.hashtags, cta: post.cta,
        visual: post.visual, script: post.script,
      })
      setSavedKeys(prev => new Set(prev).add(post.key))
      flagSaved(saved)
      onSaved?.()
    } catch (e) { setError(e) } finally { setSavingKey(null) }
  }

  // Confirma "para onde foi" + marca o item para rolar/destacar no funil quando o board recarregar.
  function flagSaved(saved) {
    if (saved?.id) setHighlightId(saved.id)
    setSavedNotice('Rascunho salvo em “Conteúdos em produção” — abaixo. Próximo passo: Aprovar.')
  }

  async function handleManualSave() {
    if (!manual.caption.trim() && !manual.title.trim()) { setError(new Error('Escreva ao menos um título ou uma legenda.')); return }
    setSavingManual(true); setError(null)
    try {
      const saved = await createContentPost({
        campaignId: linkedCampaign?.id, brandScope: brandProfile.scope, contentType, pillar, format, platform,
        title: manual.title || manual.caption.slice(0, 60), caption: manual.caption, cta: manual.cta,
        hashtags: manual.hashtags.split(/[,\s]+/).map(h => h.replace(/^#/, '')).filter(Boolean),
      })
      setManual({ title: '', caption: '', cta: '', hashtags: '' })
      flagSaved(saved)
      onSaved?.()
    } catch (e) { setError(e) } finally { setSavingManual(false) }
  }

  // Importa um plano editorial (JSON da skill vitra-conteudo) em lote -> rascunhos no board.
  async function handleImport() {
    setImporting(true); setError(null); setImportResult(null)
    try {
      let items
      try {
        const parsed = JSON.parse(importJson)
        items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.posts) ? parsed.posts : null)
      } catch { throw new Error('JSON inválido. Cole a lista de posts (saída da skill vitra-conteudo).') }
      if (!items) throw new Error('O JSON precisa ser uma lista de posts (array).')
      const res = await importContentPlan(items, { brandScope: brandProfile.scope, campaignId: linkedCampaign?.id })
      setImportResult(res)
      if (res.created > 0) { setImportJson(''); onSaved?.() }
    } catch (e) { setError(e) } finally { setImporting(false) }
  }

  // Acoes do funil — o status e CONSEQUENCIA da acao, nao um seletor exposto ao operador.
  async function runAction(id, fn) {
    setRowBusy(id); setError(null)
    try { await fn(); onSaved?.() }
    catch (e) { setError(e) } finally { setRowBusy(null) }
  }
  const approve = post => runAction(post.id, async () => {
    await updateContentPost(post.id, { status: 'approved' })
    // Auto-arte ao aprovar: se ligado e o post ainda não tem arte, gera e salva. Best-effort — a
    // aprovação não falha se a arte falhar (o operador pode gerar manualmente depois).
    if (autoArtOnApprove && !post.metadata?.art_url) {
      try {
        const blob = await postArtBlob(artOptsFor({
          brandScope: post.metadata?.brand_scope, format: post.format,
          title: post.title || post.hook || (post.caption || '').slice(0, 60),
          caption: post.caption, cta: post.cta, pillarKey: post.editorial_pillar,
        }))
        await uploadPostArt({ postId: post.id, blob, brandScope: post.metadata?.brand_scope || brandProfile.scope, title: post.title || post.hook })
      } catch { /* arte é best-effort; aprovação não bloqueia */ }
    }
  })
  const schedule = (post, dateStr) => { if (!dateStr) return; setSchedulingId(null); return runAction(post.id, () => updateContentPost(post.id, { scheduledFor: new Date(dateStr).toISOString(), status: 'scheduled' })) }
  const publish = post => {
    const url = window.prompt('Link do post publicado (opcional):', post.metadata?.published_url || '')
    if (url === null) return
    return runAction(post.id, () => publishContentPost({ post, url, brandScope: brandProfile.scope }))
  }
  const backToDraft = post => runAction(post.id, () => updateContentPost(post.id, { status: 'draft' }))

  // Itens que pedem acao primeiro (rascunho -> aprovado -> agendado -> publicado); dentro da etapa, os
  // MAIS RECENTES no topo — assim um rascunho recem-salvo aparece logo e e facil de achar/destacar.
  const sortedPosts = [...posts].sort((a, b) =>
    (STAGE[stageOf(a.status)].order - STAGE[stageOf(b.status)].order) ||
    (Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0)))

  return (
    <div id="content-create" className="card p-5 scroll-mt-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-px w-7 bg-gold-500/70" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Produção editorial</p>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-white">Novo conteúdo</h3>
      <p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/50">
        Crie com a <span className="text-white/75">IA editorial</span> ou <span className="text-white/75">do zero</span>, na voz da {brandProfile.shortName}. Depois avance o card pelo funil: <span className="text-white/70">Aprovar → Agendar → Publicar</span>.
      </p>
      {offerRequired && !linkedCampaign && (
        <p className="mt-2 text-[11px] text-amber-300">Este tipo fala de uma oferta específica — vincule a oferta no campo abaixo para salvar.</p>
      )}
      {offerSuggested && !linkedCampaign && (
        <p className="mt-2 text-[11px] text-white/45">Conteúdo de imóvel: vincular uma oferta abaixo é opcional. Sem vínculo, salva como conteúdo de marca.</p>
      )}

      {/* Entrada tripla: IA, manual ou importar plano (saída da skill vitra-conteudo) */}
      <div className="mt-4 inline-flex flex-wrap rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
        {[{ k: 'ia', label: 'Gerar posts', icon: Wand2 }, { k: 'manual', label: 'Criar do zero', icon: Pencil }, { k: 'import', label: 'Importar plano', icon: Download }].map(({ k, label, icon: Icon }) => (
          <button key={k} type="button" onClick={() => { setMode(k); setError(null) }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${mode === k ? 'bg-gold-500/15 text-gold-200' : 'text-white/50 hover:text-white/80'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${mode === 'import' ? 'hidden' : ''}`}>
        <label className="block"><span className="form-label">Tipo de conteúdo</span>
          <VitraSelect value={contentType} onChange={setContentType} ariaLabel="Tipo de conteúdo"
            options={CONTENT_TYPE_OPTIONS.map(t => ({ value: t.key, label: t.label }))} /></label>
        <label className="block"><span className="form-label">Pilar</span>
          <VitraSelect value={pillar} onChange={setPillar} ariaLabel="Pilar"
            options={pillarOpts.map(p => ({ value: p.key, label: p.label }))} /></label>
        <label className="block"><span className="form-label">Formato</span>
          <VitraSelect value={format} onChange={setFormat} ariaLabel="Formato"
            options={CONTENT_FORMAT_OPTIONS.map(f => ({ value: f.key, label: f.label }))} /></label>
        <label className="block"><span className="form-label">{mode === 'ia' ? 'Tom' : 'Plataforma'}</span>
          {mode === 'ia'
            ? <VitraSelect value={tone} onChange={setTone} ariaLabel="Tom" options={CONTENT_TONES.map(t => ({ value: t.key, label: t.label }))} />
            : <VitraSelect value={platform} onChange={setPlatform} ariaLabel="Plataforma" options={PLATFORMS} />}
        </label>
      </div>

      {/* Vínculo com oferta — CONTEXTUAL (por conteúdo), opcional. Default: sem oferta (conteúdo de marca). */}
      {mode !== 'import' && campaigns.length > 0 && (
        <label className="mt-3 block max-w-md">
          <span className="form-label">Vincular a uma oferta (opcional)</span>
          <VitraSelect value={linkedCampaignId} onChange={setLinkedCampaignId} ariaLabel="Vincular a uma oferta"
            options={[{ value: '', label: 'Sem oferta — conteúdo de marca' }, ...campaigns.map(c => ({ value: c.id, label: c.name }))]} />
        </label>
      )}

      {mode === 'ia' && (
        <>
          <label className="mt-3 block"><span className="form-label">Tema / contexto (opcional)</span>
            <input className="form-input" value={tema} onChange={e => setTema(e.target.value)} placeholder="ex.: valorização do bairro, financiamento, bastidor da entrega de chaves…" /></label>
          <div className="mt-4">
            <button type="button" onClick={handleGenerate} disabled={generating} className="btn-gold inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {generating ? 'Gerando posts…' : 'Gerar posts'}
            </button>
          </div>
        </>
      )}

      {mode === 'manual' && (
        <div className="mt-3 space-y-3">
          <label className="block"><span className="form-label">Título / ideia</span>
            <input className="form-input" value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} placeholder="ex.: 3 cuidados antes de financiar seu primeiro imóvel" /></label>
          <label className="block"><span className="form-label">Legenda</span>
            <textarea className="form-input min-h-[96px] text-sm leading-5" value={manual.caption} onChange={e => setManual(m => ({ ...m, caption: e.target.value }))} placeholder="Escreva a legenda do post…" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="form-label">CTA (opcional)</span>
              <input className="form-input" value={manual.cta} onChange={e => setManual(m => ({ ...m, cta: e.target.value }))} placeholder="ex.: Agende uma visita" /></label>
            <label className="block"><span className="form-label">Hashtags (opcional)</span>
              <input className="form-input" value={manual.hashtags} onChange={e => setManual(m => ({ ...m, hashtags: e.target.value }))} placeholder="imovel, portoalegre, lancamento" /></label>
          </div>
          <button type="button" onClick={handleManualSave} disabled={savingManual || blockedByOffer} className="btn-gold inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            {savingManual ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {savingManual ? 'Salvando…' : 'Salvar rascunho'}
          </button>
        </div>
      )}

      {mode === 'import' && (
        <div className="mt-3 space-y-3">
          <p className="text-[11px] leading-5 text-white/45">
            Cole o <span className="text-white/70">JSON do plano editorial</span> gerado pela skill <span className="text-gold-200">vitra-conteudo</span>. Cada post entra como <span className="text-white/70">rascunho</span> no funil (a data, se houver, aparece no Calendário). Você revisa e avança normalmente.
          </p>
          <textarea className="form-input min-h-[150px] font-mono text-[11px] leading-4" value={importJson} onChange={e => setImportJson(e.target.value)} placeholder='[ { "contentType": "educativo", "format": "carrossel", "title": "…", "caption": "…", "cta": "…", "hashtags": ["…"], "scheduled_for": "2026-07-06" } ]' />
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleImport} disabled={importing || !importJson.trim() || blockedByOffer} className="btn-gold inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              {importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {importing ? 'Importando…' : 'Importar plano'}
            </button>
            {importResult && (
              <span className="text-[11px] text-white/55">
                {importResult.created} rascunho(s) criado(s){importResult.failed ? `, ${importResult.failed} com erro` : ''}.
              </span>
            )}
          </div>
          {importResult?.errors?.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-[10px] text-amber-300">
              {importResult.errors.slice(0, 5).map((er, i) => <li key={i}>⚠ {er}</li>)}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-300">{error.message || String(error)}</p>}

      {savedNotice && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-200">
          <CheckCircle2 size={13} />{savedNotice}
        </p>
      )}

      {mode === 'ia' && results.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[11px] text-white/45"><span className="text-white/70">Sugestões da IA ({results.length})</span> — revise, edite a legenda e salve as que quiser. <span className="text-white/40">As não salvas somem ao gerar novas.</span></p>
          {results.map(post => {
            const saved = savedKeys.has(post.key)
            return (
              <div key={post.key} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <PostArtPreview
                    opts={artOptsFor({ format: post.format || format, title: post.headline || post.idea, caption: drafts[post.key] ?? post.caption, cta: post.cta, pillarKey: post.pillar || pillar })}
                    className="w-full shrink-0 self-start rounded-md border border-white/10 bg-black/30 object-contain sm:w-32"
                    fallback={<div className="flex w-full shrink-0 items-center justify-center self-start rounded-md border border-dashed border-white/10 bg-black/20 py-8 text-[10px] text-white/30 sm:w-32">sem prévia</div>}
                  />
                  <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{post.headline || post.idea}</p>
                  <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-gold-300/80">{post.format}</span>
                </div>
                {post.idea && <p className="mt-1 text-[11px] italic text-white/40">{post.idea}</p>}
                <textarea className="form-input mt-2 min-h-[88px] text-xs leading-5" value={drafts[post.key] ?? post.caption} onChange={e => setDrafts(d => ({ ...d, [post.key]: e.target.value }))} />
                {post.cta && <p className="mt-1.5 text-[11px] text-white/55"><span className="text-white/35">CTA:</span> {post.cta}</p>}
                {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {post.hashtags.map((h, i) => <span key={i} className="rounded bg-gold-500/10 px-1.5 py-0.5 text-[10px] text-gold-200">#{h}</span>)}
                  </div>
                )}
                {post.script && <p className="mt-1.5 whitespace-pre-line text-[11px] text-white/45"><span className="text-white/35">Roteiro:</span> {post.script}</p>}
                {post.visual && <p className="mt-1.5 text-[11px] text-white/45"><span className="text-white/35">Visual:</span> {post.visual}</p>}
                {Array.isArray(post.issues) && post.issues.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-amber-300">⚠ {post.issues.join(' · ')}</p>
                )}
                <div className="mt-3">
                  <button type="button" onClick={() => handleSave(post)} disabled={saved || savingKey === post.key || blockedByOffer} className="btn-ghost inline-flex items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                    {savingKey === post.key ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} className="text-emerald-300" /> : <Plus size={14} />}
                    {saved ? 'Salvo em rascunhos' : savingKey === post.key ? 'Salvando…' : 'Salvar rascunho'}
                  </button>
                  {autoArtOnApprove && <p className="mt-1.5 text-[10px] text-white/35">A arte é gerada automaticamente ao aprovar — ou clique em “Gerar arte” no card abaixo.</p>}
                </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Board por ACOES: cada card mostra a etapa + a proxima acao do funil (status derivado). */}
      {posts.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="form-label">Conteúdos em produção ({posts.length}) — avance pelo funil</p>
          <p className="mb-2 text-[10px] text-white/35">Rascunho → Aprovar → Agendar → Publicar. Acompanhe também em <span className="text-white/55">Conteúdos</span> (board) e <span className="text-white/55">Calendário</span>.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPosts.slice(0, 15).map(p => {
              const stage = stageOf(p.status)
              const meta = STAGE[stage]
              const busy = rowBusy === p.id
              const isNew = p.id === highlightId
              const hasArt = !!p.metadata?.art_url
              const scheduledLabel = p.scheduled_for ? new Date(p.scheduled_for).toLocaleDateString('pt-BR') : null
              return (
                <div key={p.id} id={`post-row-${p.id}`} className={`flex flex-col overflow-hidden rounded-lg border transition ${isNew ? 'border-gold-500/60 bg-gold-500/[0.06]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}>
                  {/* Thumbnail-first: arte salva, ou prévia ao vivo do texto. Clicar abre o drawer "Prévia do post". */}
                  <button type="button" onClick={() => setDetailPost(p)} className="relative block aspect-square w-full overflow-hidden bg-black/30 text-left" title="Abrir prévia do post">
                    {hasArt
                      ? <img src={p.metadata.art_url} alt="" className="h-full w-full object-cover" />
                      : <PostArtPreview opts={artOptsFor({ format: 'feed', title: p.title || p.hook, caption: p.caption, cta: p.cta, pillarKey: p.editorial_pillar })} className="h-full w-full object-cover" fallback={<div className="flex h-full w-full items-center justify-center text-[10px] text-white/25">sem prévia</div>} />}
                    {isNew && <span className="absolute left-2 top-2 rounded-full bg-gold-500/85 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-black">novo</span>}
                    {busy && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Loader2 size={18} className="animate-spin text-gold-200" /></span>}
                  </button>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/35">{p.campaign_id ? (campaignName(p.campaign_id) || 'Oferta') : 'Marca'}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${hasArt ? 'border-emerald-400/30 text-emerald-200/90' : 'border-amber-400/30 text-amber-200/90'}`}>{hasArt ? 'arte pronta' : 'sem arte'}</span>
                    </div>
                    <button type="button" onClick={() => setDetailPost(p)} className="line-clamp-2 text-left text-xs font-medium text-white/80 hover:text-white">{p.title || (p.caption || '').slice(0, 60) || 'Sem título'}</button>
                    {stage === 'agendado' && scheduledLabel && <span className="text-[10px] text-gold-200/80">agendado para {scheduledLabel}</span>}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {stage === 'rascunho' && <button type="button" disabled={busy} onClick={() => approve(p)} className="btn-ghost inline-flex items-center gap-1.5 !py-1 text-[11px] disabled:opacity-50"><Check size={13} />Aprovar</button>}
                      {(stage === 'aprovado' || stage === 'agendado') && schedulingId !== p.id && <button type="button" disabled={busy} onClick={() => setSchedulingId(p.id)} className="btn-ghost inline-flex items-center gap-1.5 !py-1 text-[11px] disabled:opacity-50"><Clock size={13} />{stage === 'agendado' ? 'Reagendar' : 'Agendar'}</button>}
                      {schedulingId === p.id && <input type="date" autoFocus className="form-input !w-auto !py-1 text-[11px]" defaultValue={p.scheduled_for ? new Date(p.scheduled_for).toISOString().slice(0, 10) : ''} onChange={e => schedule(p, e.target.value)} onBlur={() => setSchedulingId(null)} title="Data da publicação" />}
                      {(stage === 'aprovado' || stage === 'agendado') && <button type="button" disabled={busy} onClick={() => publish(p)} className="btn-ghost inline-flex items-center gap-1.5 !py-1 text-[11px] text-emerald-200 disabled:opacity-50"><Send size={13} />Publicado</button>}
                      {stage === 'publicado' && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><CheckCircle2 size={12} />Publicado</span>}
                      <button type="button" onClick={() => setDetailPost(p)} className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-white/50 hover:text-gold-200" title="Abrir prévia (texto + arte)"><ImageIcon size={13} />Prévia</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {posts.length > 15 && <p className="mt-2 text-[10px] text-white/35">Mostrando 15 de {posts.length}. Pipeline completo em Conteúdos (board) e Calendário.</p>}
        </div>
      )}

      {detailPost && (
        <PostDetailDrawer
          post={detailPost}
          brandProfile={brandProfile}
          stage={stageOf(detailPost.status)}
          stageMeta={STAGE[stageOf(detailPost.status)]}
          busy={rowBusy === detailPost.id}
          artOptsFor={artOptsFor}
          onClose={() => setDetailPost(null)}
          onSaved={() => onSaved?.()}
          onApprove={() => approve(detailPost)}
          onPublish={() => publish(detailPost)}
          onBackToDraft={() => backToDraft(detailPost)}
          onSchedule={(dateStr) => schedule(detailPost, dateStr)}
        />
      )}
    </div>
  )
}

// Fase 1 (Produção visual): prévia da arte renderizada inline (Canvas 2D do postArt.js), usada nos cards
// de sugestão e na lista do funil. Best-effort: se falhar (ex.: foto sem CORS), mostra o fallback.
function PostArtPreview({ opts, className = '', fallback = null }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await ensureArtFonts()
        if (!alive || !ref.current) return
        await renderPostArtToCanvas(ref.current, opts)
      } catch { if (alive) setFailed(true) }
    })()
    return () => { alive = false }
  }, [opts?.brandScope, opts?.format, opts?.title, opts?.caption, opts?.cta, opts?.kicker, opts?.photoUrl])
  if (failed) return fallback
  return <canvas ref={ref} className={className} aria-label="Prévia da arte do post" />
}

// Fase 2: drawer "Prévia do post" — unifica edição de TEXTO + ARTE (Canvas 2D), formato feed/story,
// histórico de versões e as ações do funil, no mesmo fluxo. Substitui o antigo modal "Arte do post".
function PostDetailDrawer({ post, brandProfile = getBrandProfile(), stage, stageMeta, busy, onClose, onSaved, onApprove, onPublish, onBackToDraft, onSchedule }) {
  const canvasRef = useRef(null)
  const scope = post?.metadata?.brand_scope || brandProfile.scope
  const kicker = (CONTENT_PILLAR_OPTIONS.find(p => p.key === post?.editorial_pillar)?.label) || brandProfile.shortName
  // Texto editável (mesmo fluxo).
  const [title, setTitle] = useState(post?.title || '')
  const [caption, setCaption] = useState(post?.caption || '')
  const [cta, setCta] = useState(post?.cta || '')
  const [hashtags, setHashtags] = useState(Array.isArray(post?.hashtags) ? post.hashtags.join(' ') : '')
  // Arte.
  const [variant, setVariant] = useState('tipografico')   // 'tipografico' | 'foto'
  const [photoUrl, setPhotoUrl] = useState('')
  const [fmt, setFmt] = useState(post?.format === 'stories' || post?.format === 'reels' ? 'stories' : 'feed')
  const [activeArt, setActiveArt] = useState(post?.metadata?.art_url || '')
  const [versions, setVersions] = useState(Array.isArray(post?.metadata?.art_versions) ? post.metadata.art_versions : [])
  const [savingArt, setSavingArt] = useState(false)
  const [savingText, setSavingText] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState(null)

  const artOpts = {
    brandScope: scope, format: fmt,
    title: title || post?.hook || (caption || '').slice(0, 60),
    caption, cta, kicker,
    photoUrl: variant === 'foto' ? photoUrl.trim() : null,
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try { await ensureArtFonts(); if (alive && canvasRef.current) await renderPostArtToCanvas(canvasRef.current, artOpts) }
      catch (e) { if (alive) setError(e) }
    })()
    return () => { alive = false }
  }, [variant, photoUrl, fmt, title, caption, cta])

  async function handleSaveArt() {
    setSavingArt(true); setError(null)
    try {
      const blob = await postArtBlob(artOpts)
      const { url } = await uploadPostArt({ postId: post.id, blob, brandScope: scope, title: artOpts.title })
      setActiveArt(url)
      setVersions(prev => [{ url, at: new Date().toISOString() }, ...prev.filter(v => v?.url !== url)].slice(0, 6))
      onSaved?.()
    } catch (e) { setError(e) } finally { setSavingArt(false) }
  }
  async function handleDownload() {
    setError(null)
    try {
      const blob = await postArtBlob(artOpts)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `arte-${(title || 'post').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)}.png`
      a.click(); URL.revokeObjectURL(url)
    } catch (e) { setError(e) }
  }
  async function handleUseVersion(v) {
    if (!v?.url || v.url === activeArt) return
    setError(null)
    try { await setActivePostArt(post.id, v.url); setActiveArt(v.url); onSaved?.() }
    catch (e) { setError(e) }
  }
  async function handleSaveText() {
    setSavingText(true); setError(null)
    try {
      await updateContentPost(post.id, {
        title, caption, cta,
        hashtags: hashtags.split(/[,\s]+/).map(h => h.replace(/^#/, '')).filter(Boolean),
      })
      onSaved?.()
    } catch (e) { setError(e) } finally { setSavingText(false) }
  }
  async function runFunnel(fn) { try { await fn(); onClose?.() } catch (e) { setError(e) } }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[color:var(--surface-1)]" onClick={e => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-white">Prévia do post</h3>
            {stageMeta && <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wide ${stageMeta.cls}`}>{stageMeta.label}</span>}
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* ARTE */}
          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="form-label !mb-0">Arte</span>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                  {[{ k: 'tipografico', label: 'Tipográfico' }, { k: 'foto', label: 'Com foto' }].map(({ k, label }) => (
                    <button key={k} type="button" onClick={() => { setVariant(k); setError(null) }} className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${variant === k ? 'bg-gold-500/15 text-gold-200' : 'text-white/50 hover:text-white/80'}`}>{label}</button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                  {[{ k: 'feed', label: 'Feed 1:1' }, { k: 'stories', label: 'Story 9:16' }].map(({ k, label }) => (
                    <button key={k} type="button" onClick={() => setFmt(k)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${fmt === k ? 'bg-gold-500/15 text-gold-200' : 'text-white/50 hover:text-white/80'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            {variant === 'foto' && (
              <label className="mb-2 block">
                <input className="form-input !py-1.5 text-xs" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL pública da foto do imóvel (https://…/foto.jpg)" />
              </label>
            )}
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
              <canvas ref={canvasRef} className="mx-auto block h-auto w-full max-h-[40vh] object-contain" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleSaveArt} disabled={savingArt} className="btn-gold inline-flex items-center gap-2 !py-1.5 text-xs disabled:opacity-50">
                {savingArt ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar arte
              </button>
              <button type="button" onClick={handleDownload} className="btn-ghost inline-flex items-center gap-2 !py-1.5 text-xs"><Download size={14} />Baixar PNG</button>
            </div>
            {/* Versões */}
            {versions.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-white/35">Versões ({versions.length}) — clique para usar</p>
                <div className="flex flex-wrap gap-2">
                  {versions.map((v, i) => (
                    <button key={i} type="button" onClick={() => handleUseVersion(v)} title={v.url === activeArt ? 'Versão ativa' : 'Usar esta versão'}
                      className={`relative h-16 w-16 overflow-hidden rounded-md border transition ${v.url === activeArt ? 'border-gold-500/70 ring-1 ring-gold-500/40' : 'border-white/10 hover:border-white/30'}`}>
                      <img src={v.url} alt="" className="h-full w-full object-cover" />
                      {v.url === activeArt && <span className="absolute bottom-0 left-0 right-0 bg-gold-500/80 text-center text-[8px] font-semibold text-black">ativa</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* TEXTO */}
          <section className="border-t border-white/10 pt-4">
            <span className="form-label">Texto do post</span>
            <div className="space-y-2">
              <input className="form-input !py-1.5 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" />
              <textarea className="form-input min-h-[100px] text-xs leading-5" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Legenda" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="form-input !py-1.5 text-xs" value={cta} onChange={e => setCta(e.target.value)} placeholder="CTA" />
                <input className="form-input !py-1.5 text-xs" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#hashtags separadas por espaço" />
              </div>
              <button type="button" onClick={handleSaveText} disabled={savingText} className="btn-ghost inline-flex items-center gap-2 !py-1.5 text-xs disabled:opacity-50">
                {savingText ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar texto
              </button>
              <p className="text-[10px] text-white/30">Editar o texto atualiza a prévia da arte acima. “Salvar arte” regenera a imagem com o texto atual.</p>
            </div>
          </section>

          {error && <p className="text-xs text-red-300">{error.message || String(error)}</p>}
        </div>

        {/* Rodapé: ações do funil */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-5 py-3">
          {busy && <Loader2 size={15} className="animate-spin text-gold-300" />}
          {stage === 'rascunho' && <button type="button" disabled={busy} onClick={() => runFunnel(onApprove)} className="btn-gold inline-flex items-center gap-2 !py-1.5 text-xs disabled:opacity-50"><Check size={14} />Aprovar</button>}
          {(stage === 'aprovado' || stage === 'agendado') && !scheduling && <button type="button" disabled={busy} onClick={() => setScheduling(true)} className="btn-ghost inline-flex items-center gap-2 !py-1.5 text-xs disabled:opacity-50"><Clock size={14} />{stage === 'agendado' ? 'Reagendar' : 'Agendar'}</button>}
          {scheduling && <input type="date" autoFocus className="form-input !w-auto !py-1 text-xs" defaultValue={post?.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 10) : ''} onChange={e => { if (e.target.value) runFunnel(() => onSchedule(e.target.value)) }} onBlur={() => setScheduling(false)} />}
          {(stage === 'aprovado' || stage === 'agendado') && <button type="button" disabled={busy} onClick={() => runFunnel(onPublish)} className="btn-ghost inline-flex items-center gap-2 !py-1.5 text-xs text-emerald-200 disabled:opacity-50"><Send size={14} />Marcar publicado</button>}
          {stage === 'publicado' && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 size={14} />Publicado</span>
          )}
          {stage !== 'rascunho' && stage !== 'publicado' && <button type="button" disabled={busy} onClick={() => runFunnel(onBackToDraft)} className="ml-auto text-[11px] text-white/35 hover:text-white/60">voltar a rascunho</button>}
          {post?.metadata?.published_url && <a href={post.metadata.published_url} target="_blank" rel="noreferrer" className="text-[11px] text-gold-300 underline">ver post</a>}
        </div>
      </div>
    </div>
  )
}

// Configurações editoriais por marca: governa a pauta orgânica (pilares ativos, tom padrão, cadência e
// diretrizes que entram no prompt da IA). Persiste em premium_editorial_settings (1 linha por marca).
function EditorialSettingsSection({ brandProfile = getBrandProfile(), settings, onSaved }) {
  const [active, setActive] = useState(() => new Set(settings?.active_pillars || []))
  const [tone, setTone] = useState(settings?.default_tone || 'padrao')
  const [cadence, setCadence] = useState(settings?.cadence_per_week ?? 5)
  const [guidelines, setGuidelines] = useState(settings?.guidelines || '')
  const [autoArt, setAutoArt] = useState(settings?.auto_art_on_approve !== false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setActive(new Set(settings?.active_pillars || []))
    setTone(settings?.default_tone || 'padrao')
    setCadence(settings?.cadence_per_week ?? 5)
    setGuidelines(settings?.guidelines || '')
    setAutoArt(settings?.auto_art_on_approve !== false)
  }, [settings])

  function togglePillar(key) {
    setActive(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })
  }

  async function handleSave() {
    setSaving(true); setError(null); setSavedAt(null)
    try {
      const saved = await saveEditorialSettings(brandProfile.scope, {
        activePillars: [...active], defaultTone: tone, cadencePerWeek: cadence, guidelines, autoArtOnApprove: autoArt,
      })
      onSaved?.(saved); setSavedAt(Date.now())
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  return (
    <div className="card max-w-2xl p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-px w-7 bg-gold-500/70" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Linha editorial · {brandProfile.shortName}</p>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-white">Configurações editoriais</h3>
      <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/50">
        Governe a pauta orgânica da {brandProfile.shortName}: quais pilares entram na produção, o tom padrão, a meta de cadência e as diretrizes que orientam a IA ao gerar posts.
      </p>

      <div className="mt-5">
        <span className="form-label">Pilares ativos</span>
        <p className="mb-2 text-[10px] text-white/35">Vazio = todos os pilares disponíveis. Selecione para restringir o que aparece na Produção.</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_PILLAR_OPTIONS.map(p => {
            const on = active.has(p.key)
            return (
              <button key={p.key} type="button" onClick={() => togglePillar(p.key)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition ${on ? 'border-gold-500/50 bg-gold-500/15 text-gold-200' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white/85'}`}>
                {on ? '✓ ' : ''}{p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="form-label">Tom padrão</span>
          <VitraSelect value={tone} onChange={setTone} ariaLabel="Tom padrão"
            options={CONTENT_TONES.map(t => ({ value: t.key, label: t.label }))} /></label>
        <label className="block"><span className="form-label">Cadência (posts/semana)</span>
          <input type="number" min="0" max="40" className="form-input" value={cadence}
            onChange={e => setCadence(Number(e.target.value))} /></label>
      </div>

      <label className="mt-4 block"><span className="form-label">Diretrizes para a IA</span>
        <p className="mb-1.5 text-[10px] text-white/35">Entram no prompt do “Gerar posts”: temas a priorizar/evitar, jeito de falar, do/don’t da marca.</p>
        <textarea className="form-input min-h-[110px] text-sm leading-5" value={guidelines}
          onChange={e => setGuidelines(e.target.value)}
          placeholder="ex.: priorize bairros da Zona Sul; evite jargão; sempre convidar para conversa no WhatsApp; tom consultivo, sem pressão." /></label>

      <button type="button" onClick={() => setAutoArt(v => !v)} className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-3 text-left transition hover:border-white/20">
        <span>
          <span className="block text-sm font-medium text-white/85">Gerar arte ao aprovar</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-white/45">Ao aprovar um conteúdo sem arte, o sistema gera a imagem branded automaticamente. Você pode trocá-la depois.</span>
        </span>
        <span className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${autoArt ? 'bg-gold-500/70' : 'bg-white/15'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${autoArt ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </span>
      </button>

      {error && <p className="mt-3 text-xs text-red-300">{error.message || String(error)}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-gold inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}Salvar configurações
        </button>
        {savedAt && <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300"><CheckCircle2 size={13} />Salvo</span>}
      </div>
    </div>
  )
}

function AssetsSection({ brandProfile = getBrandProfile(), campaign, assets, jobs, rendering, busyId, notice, onRender, onApprove, onApproveGroup, onEdit }) {
  const [filter, setFilter] = useState('all')

  if (!campaign) return <EmptyState icon={Layers3} title="Nenhuma campanha selecionada" />
  if (!assets.length) return <EmptyState icon={Layers3} title="Sem assets para esta campanha" />

  const total = assets.length
  const pendingRender = assets.filter(a => isRenderablePendingAsset(a)).length
  const generated = assets.filter(a => a.status === 'generated' && !needsVitraImobiliariaApprovedTemplateRender(a)).length
  const approved = assets.filter(a => a.status === 'approved' && !needsVitraImobiliariaApprovedTemplateRender(a)).length
  const progress = total ? Math.round((approved / total) * 100) : 0

  const categories = assets.reduce((acc, asset) => {
    const cat = CATEGORY[asset.asset_type] || asset.asset_type || 'Outros'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const visible = filter === 'all'
    ? assets
    : assets.filter(asset => (CATEGORY[asset.asset_type] || asset.asset_type) === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{campaign.name}</h2>
          <p className="mt-1 text-sm text-white/45">
            {campaign.brief?.product_data?.tagline || campaign.product_name} · {campaign.status}
          </p>
        </div>
        <button
          onClick={onRender}
          disabled={rendering || pendingRender === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/12 px-4 py-2.5 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          title={pendingRender === 0 ? 'Nenhum asset pendente de renderização' : 'Gerar criativos dos assets pendentes'}
        >
          {rendering ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {rendering ? 'Gerando…' : `Gerar criativos${pendingRender ? ` (${pendingRender})` : ''}`}
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-gold-500/25 bg-gold-500/8 px-4 py-3 text-xs text-gold-100">
          {notice}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Total assets" value={total} sub="na campanha" icon={Layers3} />
        <StatTile label="Pendentes" value={pendingRender} sub="aguardando render" icon={Clock} tone="#E4C06E" />
        <StatTile label="Gerados" value={generated} sub="criativos prontos" icon={ImageIcon} tone="#D4A84A" />
        <StatTile label="Aprovados" value={approved} sub={`${progress}% da campanha`} icon={CheckCircle2} tone="#F0C95C" />
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip label={`Todos (${total})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        {Object.entries(categories).map(([cat, count]) => (
          <FilterChip key={cat} label={`${cat} (${count})`} active={filter === cat} onClick={() => setFilter(cat)} />
        ))}
      </div>

      <AssetGrid
        brandProfile={brandProfile}
        items={groupCarousels(visible)}
        campaign={campaign}
        busyId={busyId}
        onApprove={onApprove}
        onApproveGroup={onApproveGroup}
        onEdit={onEdit}
      />
    </div>
  )
}

function AssetGrid({ brandProfile = getBrandProfile(), items, campaign, busyId, onApprove, onApproveGroup, onEdit }) {
  const renderItem = item =>
    item.kind === 'carousel' ? (
      <CarouselCard
        brandProfile={brandProfile}
        key={`carousel-${item.key}`}
        slides={item.slides}
        campaign={campaign}
        busy={item.slides.some(s => s.id === busyId)}
        onApprove={() => onApproveGroup(item.slides)}
        onEdit={onEdit}
      />
    ) : (
      <AssetCard
        brandProfile={brandProfile}
        key={item.asset.id}
        asset={item.asset}
        campaign={campaign}
        busy={busyId === item.asset.id}
        onApprove={() => onApprove(item.asset)}
        onEdit={() => onEdit(item.asset)}
      />
    )

  const gridClass = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  const hasPhases = items.some(item => itemPhase(item))

  if (!hasPhases) {
    return <div className={gridClass}>{items.map(renderItem)}</div>
  }

  const sections = PHASES.map(phase => ({ phase, list: items.filter(item => itemPhase(item) === phase.id) }))
  const noPhase = items.filter(item => !itemPhase(item))

  return (
    <div className="space-y-8">
      {sections.filter(s => s.list.length).map(({ phase, list }) => (
        <section key={phase.id}>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-md border border-gold-500/35 bg-gold-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              {phase.tag}
            </span>
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/40">{list.length} peça{list.length > 1 ? 's' : ''}</span>
          </div>
          <div className={gridClass}>{list.map(renderItem)}</div>
        </section>
      ))}
      {noPhase.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Sem fase
            </span>
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/40">{noPhase.length}</span>
          </div>
          <div className={gridClass}>{noPhase.map(renderItem)}</div>
        </section>
      )}
    </div>
  )
}

// Agrupa assets de carrossel (capa + slides) numa unica peca; demais ficam individuais.
function groupCarousels(assets) {
  const groups = new Map()
  const items = []
  for (const asset of assets) {
    if (asset.asset_type === 'carousel') {
      const key = asset.metadata?.carousel_group || 'default'
      if (!groups.has(key)) {
        const entry = { kind: 'carousel', key, slides: [] }
        groups.set(key, entry)
        items.push(entry)
      }
      groups.get(key).slides.push(asset)
    } else {
      items.push({ kind: 'asset', asset })
    }
  }
  // Ordena slides: capa primeiro, depois ordem de criacao
  for (const entry of groups.values()) {
    entry.slides.sort((a, b) => {
      const ca = a.format === 'carousel_cover' ? 0 : 1
      const cb = b.format === 'carousel_cover' ? 0 : 1
      if (ca !== cb) return ca - cb
      return new Date(a.created_at) - new Date(b.created_at)
    })
  }
  return items
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
      style={{
        borderColor: active ? 'rgba(196,148,42,0.55)' : 'rgba(255,255,255,0.12)',
        background: active ? 'rgba(196,148,42,0.15)' : 'transparent',
        color: active ? '#F0C95C' : 'rgba(255,255,255,0.6)',
      }}
    >
      {label}
    </button>
  )
}

function AssetCard({ brandProfile = getBrandProfile(), asset, campaign, busy, onApprove, onEdit }) {
  const aspect = ASPECT_CSS[asset.aspect_ratio] || '4 / 5'
  const dimension = DIMENSION_LABEL[asset.aspect_ratio]
  const channelTag = CHANNEL_TAG[asset.channel] || (asset.channel || '').toUpperCase()
  const kicker = campaign?.brief?.product_data?.tagline || campaign?.product_name || brandProfile.name
  const needsApprovedRender = needsVitraImobiliariaApprovedTemplateRender(asset)
  const approved = asset.status === 'approved' && !needsApprovedRender
  const nonVisual = NON_VISUAL.has(asset.channel)
  const hasImage = Boolean(asset.public_url) && !needsApprovedRender
  const phase = asset.metadata?.campaign_phase

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-1)] transition hover:border-gold-500/30">
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: aspect }}>
        {hasImage ? (
          <img src={asset.public_url} alt={asset.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-5"
            style={{ background: 'linear-gradient(160deg,var(--surface-1) 0%,var(--surface-0) 55%,var(--bg-base) 100%)' }}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70">{brandProfile.name}</span>
            <div>
              <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.28em] text-gold-300">{kicker}</p>
              <p className="font-display text-lg font-semibold leading-tight text-white line-clamp-3">{asset.headline || asset.title}</p>
              {!nonVisual && (
                <p className="mt-3 inline-block rounded bg-gold-500 px-2.5 py-1 text-[9px] font-semibold text-black">
                  {asset.cta || 'Solicitar curadoria'}
                </p>
              )}
            </div>
            <span className="self-end rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[8px] font-medium uppercase tracking-wide text-white/55">
              {nonVisual ? 'sem peça visual' : 'aguardando render'}
            </span>
          </div>
        )}
        {phase && (
          <span className="absolute left-2 top-2 rounded bg-black/55 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-gold-200">
            {phaseTag(phase)}
          </span>
        )}
        <div className="absolute right-2 top-2">
          <StatusPill value={asset.status} />
        </div>
      </div>

      <div className="space-y-3 p-3.5">
        <p className="truncate text-sm font-medium text-white" title={asset.title}>{asset.title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-gold-200">{channelTag}</span>
          <span className="rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/55">{asset.format}</span>
          {dimension && <span className="text-[10px] text-white/40">{dimension}</span>}
        </div>

        {nonVisual ? (
          <p className="text-[11px] leading-5 text-white/45 line-clamp-2">{asset.copy}</p>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onApprove}
              disabled={busy || approved || needsApprovedRender}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed"
              style={{
                background: approved ? 'rgba(196,148,42,0.12)' : '#C4942A',
                color: approved ? '#F0C95C' : '#0A0A0A',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {approved ? 'Aprovado' : 'Aprovar'}
            </button>
            <button
              onClick={onEdit}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-gold-500/35 hover:text-white disabled:opacity-60"
            >
              <Pencil size={13} />
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CarouselCard({ brandProfile = getBrandProfile(), slides, campaign, busy, onApprove, onEdit }) {
  const [idx, setIdx] = useState(0)
  const count = slides.length
  const safeIdx = Math.min(idx, count - 1)
  const current = slides[safeIdx]
  const channel = slides[0]?.channel || 'instagram'
  const limit = carouselLimit(channel)
  const valid = count >= limit.min && count <= limit.max
  const allApproved = slides.every(s => s.status === 'approved')
  const kicker = campaign?.brief?.product_data?.tagline || campaign?.product_name || brandProfile.name
  const limitLabel = channel === 'meta_ads' ? 'Meta Ads · 2–10' : 'Instagram · 2–20'
  const phase = (slides.find(s => s.format === 'carousel_cover') || slides[0])?.metadata?.campaign_phase

  function go(delta) {
    setIdx(prev => {
      const next = (prev + delta + count) % count
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gold-500/25 bg-[color:var(--surface-1)] transition hover:border-gold-500/40">
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '4 / 5' }}>
        {current?.public_url ? (
          <img src={current.public_url} alt={current.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-5" style={{ background: 'linear-gradient(160deg,var(--surface-1) 0%,var(--surface-0) 55%,var(--bg-base) 100%)' }}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70">{brandProfile.name}</span>
            <div>
              <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.28em] text-gold-300">{kicker}</p>
              <p className="font-display text-lg font-semibold leading-tight text-white line-clamp-3">{current?.headline || current?.title}</p>
            </div>
            <span className="self-end rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[8px] uppercase tracking-wide text-white/55">aguardando render</span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 rounded bg-black/55 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gold-200">
            <Images size={11} /> Carrossel
          </span>
          {phase && (
            <span className="rounded bg-black/55 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-gold-200">
              {phaseTag(phase)}
            </span>
          )}
        </div>
        <span className="absolute right-2 top-2 rounded bg-black/55 px-2 py-1 text-[10px] font-medium text-white/80">
          {safeIdx + 1}/{count}
        </span>

        {count > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white/80 transition hover:bg-black/80" aria-label="Slide anterior">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => go(1)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white/80 transition hover:bg-black/80" aria-label="Próximo slide">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {slides.map((s, i) => (
                <span key={s.id} className="h-1.5 w-1.5 rounded-full" style={{ background: i === safeIdx ? '#E4C06E' : 'rgba(255,255,255,0.35)' }} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-white">Carrossel · {campaign?.product_name || 'Campanha'}</p>
          <span className="text-[10px] text-white/40">{limitLabel}</span>
        </div>

        <div className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-medium ${valid ? 'border-gold-500/25 bg-gold-500/8 text-gold-200' : 'border-red-400/30 bg-red-400/10 text-red-300'}`}>
          {valid ? <Check size={12} /> : <AlertTriangle size={12} />}
          {valid
            ? `${count} cartões — dentro do limite`
            : count < limit.min
              ? `Mínimo de ${limit.min} cartões (tem ${count})`
              : `Máximo de ${limit.max} cartões para ${channel === 'meta_ads' ? 'Meta Ads' : 'Instagram'} (tem ${count})`}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onApprove}
            disabled={busy || allApproved || !valid}
            title={!valid ? 'Ajuste o número de cartões para aprovar' : undefined}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed"
            style={{
              background: allApproved ? 'rgba(196,148,42,0.12)' : valid ? '#C4942A' : 'rgba(255,255,255,0.05)',
              color: allApproved ? '#F0C95C' : valid ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {allApproved ? 'Carrossel aprovado' : 'Aprovar carrossel'}
          </button>
          <button
            onClick={() => onEdit(current)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-gold-500/35 hover:text-white disabled:opacity-60"
          >
            <Pencil size={13} />
            Editar slide
          </button>
        </div>
      </div>
    </div>
  )
}

const AD_FORMAT_ORDER = ['1:1', '9:16', '1.91:1']
const CTA_OPTIONS = [
  'Enviar mensagem pelo WhatsApp',
  'Saiba mais',
  'Cadastre-se',
  'Fale conosco',
  'Solicitar curadoria',
  'Conheça o projeto',
]

function groupMetaAds(assets) {
  const map = new Map()
  for (const a of assets) {
    if (a.channel !== 'meta_ads') continue
    const key = a.metadata?.ad_group || 'meta'
    const label = a.metadata?.ad_label || AD_GROUP_LABEL[key] || key.replace(/^meta-/, '')
    if (!map.has(key)) map.set(key, { key, label, assets: [] })
    map.get(key).assets.push(a)
  }
  return [...map.values()]
}

function groupMetaAdsByCampaign(assets) {
  const map = new Map()
  for (const asset of assets) {
    if (asset.channel !== 'meta_ads') continue
    const adKey = asset.metadata?.ad_group || 'meta'
    const campaignKey = asset.campaign_id || 'sem-campanha'
    const key = `${campaignKey}:${adKey}`
    const label = asset.metadata?.ad_label || AD_GROUP_LABEL[adKey] || adKey.replace(/^meta-/, '')
    if (!map.has(key)) {
      map.set(key, {
        key,
        campaign_id: asset.campaign_id,
        label,
        assets: [],
      })
    }
    map.get(key).assets.push(asset)
  }
  return [...map.values()]
}

// Painel "Revisar e publicar": o agente monta a campanha Meta (campanha -> conjunto -> criativo ->
// anuncio) em status PAUSED via Edge publish-meta-ads. O orcamento usa o TETO definido aqui pelo
// operador. Ativar (gastar) e uma acao SEPARADA, com window.confirm — nunca automatica.
function PublishMetaPanel({ campaign, brandProfile, ads, seed }) {
  const readyAds = ads.filter(ad => evaluateMetaAdReadiness(ad).ok).length
  const intake = campaign?.brief?.source_intake || {}
  const acct = META_AD_ACCOUNTS[brandProfile.scope] || META_AD_ACCOUNTS[BRAND_SCOPES.imobiliaria] || {}
  const [adAccountId, setAdAccountId] = useState(acct.adAccountId || '')
  const [pageId, setPageId] = useState('')
  const [destination, setDestination] = useState(intake.whatsapp_url || intake.landing_url || intake.url || '')
  const [budget, setBudget] = useState('20')
  const [creativesPerAdset, setCreativesPerAdset] = useState(3)   // anuncios por conjunto (3x3 da vencedora)
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [proposal, setProposal] = useState([])
  const [suggesting, setSuggesting] = useState(false)
  const [audiences, setAudiences] = useState([])
  const [audBusy, setAudBusy] = useState(false)
  const [audMsg, setAudMsg] = useState(null)
  const [pixelId, setPixelId] = useState('')
  const [lkOrigin, setLkOrigin] = useState('')
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE)
  const [privacyUrl, setPrivacyUrl] = useState('')
  const [pixels, setPixels] = useState([])
  const [convPixelId, setConvPixelId] = useState('')
  const [conversionEvent, setConversionEvent] = useState('LEAD')
  const [metaAccounts, setMetaAccounts] = useState([])
  const [metaPages, setMetaPages] = useState([])

  // Auto-descoberta das contas de anuncio acessiveis (sem digitar ID). Pre-seleciona a conta da marca.
  useEffect(() => {
    let alive = true
    listMetaAdAccounts()
      .then(list => {
        if (!alive) return
        setMetaAccounts(list)
        if (!adAccountId && list.length) {
          const brandAcct = list.find(a => a.id === acct.adAccountId) || list[0]
          setAdAccountId(brandAcct.id)
        }
      })
      .catch(() => { /* sem token/permissao: cai no input manual */ })
    return () => { alive = false }
  }, [])

  // Ao escolher a conta, carrega as Paginas promoveis dela e pre-seleciona a Pagina da MARCA da campanha
  // (quando a conta lista mais de uma marca — ex.: apos atribuir a Pagina Premium, a conta passa a trazer
  // Imobiliaria + Premium). Evita pre-selecionar a marca errada e cair no guard de marca.
  useEffect(() => {
    if (!adAccountId) { setMetaPages([]); return }
    let alive = true
    listMetaPages(adAccountId)
      .then(list => {
        if (!alive) return
        setMetaPages(list)
        if (list.length && !list.some(p => p.id === pageId)) {
          const isPremium = brandProfile.scope === BRAND_SCOPES.premium
          const match = list.find(p => /premium/i.test(p.name || '') === isPremium)
          setPageId((match || list[0]).id)
        }
      })
      .catch(() => { /* fallback input manual */ })
    return () => { alive = false }
  }, [adAccountId])
  // Auto-seed a partir de um PRESET ("Usar preset" no painel de Presets): aplica objetivo, orcamento e os
  // 2 conjuntos por geografia (regional por raio + cidade) como proposta a revisar. O operador confere e
  // gera o rascunho PAUSED. So semeia campos do padrao; criativo/Pagina/destino seguem do fluxo normal.
  useEffect(() => {
    if (!seed) return
    if (seed.objective === 'OUTCOME_LEADS') setObjective('leads_form')
    else if (seed.objective === 'OUTCOME_SALES') setObjective('sales')
    if (seed.daily_budget_cents) setBudget(String(seed.daily_budget_cents / 100))
    const specs = (Array.isArray(seed.adsets) ? seed.adsets : []).map(a => ({
      label: a.kind === 'regional' ? `Regional (raio ${a.radius_km || 2}km)` : 'Cidade (POA)',
      geo: a.geo,
      lat: a.lat ?? undefined, lng: a.lng ?? undefined,
      radius_km: a.radius_km ?? undefined, city_key: a.city_key ?? undefined,
      age_min: seed.age_min, age_max: seed.age_max,
      placements: 'facebook,instagram',
    }))
    if (specs.length) setProposal(specs)
  }, [seed])

  const isLeadForm = objective === 'leads_form'
  const isSales = objective === 'sales'

  const budgetCents = Math.round(Number(String(budget).replace(',', '.')) * 100) || 0

  // Prontidao de PUBLICACAO = contrato REAL do build_draft (nao o QA-polish completo do evaluateMetaAdReadiness,
  // que tambem exige os 3 cortes + foto de origem + UTM por anuncio). O edge publica qualquer asset APROVADO
  // e RENDERIZADO (public_url) com textos validos; conta/pagina/destino/orcamento vem deste painel.
  const publishableAssets = ads
    .flatMap(ad => ad.assets || [])
    .filter(a =>
      ['approved', 'published'].includes(a.status) &&
      Boolean(a.public_url) &&
      !needsVitraImobiliariaApprovedTemplateRender(a) &&
      Boolean(a.headline) &&
      Boolean(a.metadata?.meta_ad?.texto_principal || a.copy) &&
      Boolean(a.cta),
    ).length

  // Lista EXATA do que falta para liberar o botao (em vez de desabilitar sem explicacao).
  const missingToBuild = []
  if (!adAccountId) missingToBuild.push('selecione a conta de anúncio')
  if (!pageId) missingToBuild.push('selecione a Página do Facebook')
  if (!destination) missingToBuild.push('informe o destino (site ou WhatsApp)')
  if (budgetCents < 100) missingToBuild.push('defina o orçamento diário (mínimo R$ 1,00)')
  if (isSales && !convPixelId) missingToBuild.push('selecione o pixel de conversão (objetivo Vendas)')
  if (publishableAssets < 1) missingToBuild.push('aprove ao menos 1 criativo renderizado com título, texto e CTA (use "Aprovar anúncio" no QA)')

  const canBuild = missingToBuild.length === 0 && !loading

  async function handleBuild() {
    setLoading(true); setError(null)
    try {
      const data = await buildMetaDraft(campaign.id, { adAccountId, pageId, dailyBudgetCents: budgetCents, destinationUrl: destination, privacyPolicyUrl: privacyUrl, pixelId: convPixelId, conversionEvent, adSets: proposal, objective, creativesPerAdset })
      setResult(data)
    } catch (e) { setError(e) } finally { setLoading(false) }
  }
  async function handleLoadPixels() {
    setError(null)
    try { const px = await listMetaPixels(adAccountId); setPixels(px); if (px[0] && !convPixelId) setConvPixelId(px[0].id) }
    catch (e) { setError(e) }
  }
  async function handleSuggest() {
    setSuggesting(true); setError(null)
    try { setProposal(await suggestMetaAudiences(campaign.id, objective)) }
    catch (e) { setError(e) } finally { setSuggesting(false) }
  }
  async function handleListAudiences() {
    setAudBusy(true); setError(null); setAudMsg(null)
    try { const a = await listMetaAudiences(adAccountId); setAudiences(a); setAudMsg(`${a.length} público(s) na conta.`) }
    catch (e) { setError(e) } finally { setAudBusy(false) }
  }
  async function handleCreateWebsite() {
    setAudBusy(true); setError(null); setAudMsg(null)
    try { const r = await createWebsiteAudience(adAccountId, { name: `Visitantes do site — ${campaign.name}`.slice(0, 90), pixelId }); setAudMsg(`Público de site criado (${r.audience_id}).`); await handleListAudiences() }
    catch (e) { setError(e) } finally { setAudBusy(false) }
  }
  async function handleCreateLookalike() {
    setAudBusy(true); setError(null); setAudMsg(null)
    try { const r = await createLookalikeAudience(adAccountId, { name: `Semelhante — ${campaign.name}`.slice(0, 90), originAudienceId: lkOrigin }); setAudMsg(`Lookalike criado (${r.audience_id}).`); await handleListAudiences() }
    catch (e) { setError(e) } finally { setAudBusy(false) }
  }
  function assignAudience(i, id) {
    setProposal(prev => prev.map((x, idx) => (idx === i ? { ...x, custom_audience_id: id || undefined } : x)))
  }
  async function handleActivate() {
    if (!result?.meta_campaign_id) return
    const ok = window.confirm(`Ativar a campanha na Meta? A partir daqui ela passa a GASTAR ate R$ ${budget}/dia. Confirmacao do operador.`)
    if (!ok) return
    setActivating(true); setError(null)
    try {
      const data = await activateMetaCampaign(campaign.id)
      setResult(r => ({ ...r, activated: data.activated }))
    } catch (e) { setError(e) } finally { setActivating(false) }
  }

  return (
    <div className="rounded-xl border border-gold-500/25 bg-[color:var(--surface-1)] p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-px w-7 bg-gold-500/70" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Revisar e publicar</p>
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-white">Publicar na Meta (rascunho pausado)</h3>
      <p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/50">
        O agente monta campanha → conjunto → criativo → anúncio na sua conta, <span className="text-white/75">tudo pausado</span>. Objetivo <span className="text-white/75">Leads</span>, posicionamentos automáticos, orçamento com o <span className="text-white/75">teto que você define</span>. Nada gasta até você ativar.
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs">
        {publishableAssets > 0
          ? (<><CheckCircle2 size={14} className="text-emerald-300" /><span className="text-white/70">{publishableAssets} criativo(s) aprovado(s) e renderizado(s) — prontos para publicar{readyAds > 0 ? '' : ' (alguns itens de QA opcionais ainda pendentes)'}</span></>)
          : (<><AlertTriangle size={14} className="text-amber-300" /><span className="text-white/55">Aprove ao menos 1 criativo renderizado (com título, texto e CTA) para liberar a publicação.</span></>)}
      </div>

      <div className="mt-4">
        <span className="form-label">Objetivo da campanha</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {META_OBJECTIVE_OPTIONS.map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => o.available && setObjective(o.key)}
              disabled={!o.available}
              title={o.available ? '' : o.hint}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${objective === o.key ? 'border-gold-500/55 bg-gold-500/15 text-gold-200' : o.available ? 'border-white/10 text-white/60 hover:text-white' : 'cursor-not-allowed border-white/5 text-white/25'}`}
            >
              {o.label}{o.available ? '' : ' 🔒'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Conta de anúncio</span>
          {metaAccounts.length ? (
            <VitraSelect value={adAccountId} onChange={setAdAccountId} placeholder="Selecione a conta" ariaLabel="Conta de anúncio"
              options={metaAccounts.map(a => ({ value: a.id, label: `${a.name || a.id}${a.currency ? ` · ${a.currency}` : ''}` }))} />
          ) : (
            <input className="form-input" value={adAccountId} onChange={e => setAdAccountId(e.target.value)} placeholder="ID da conta" />
          )}
        </label>
        <label className="block">
          <span className="form-label">Página (Facebook)</span>
          {metaPages.length ? (
            <VitraSelect value={pageId} onChange={setPageId} placeholder="Selecione a página" ariaLabel="Página"
              options={metaPages.map(p => ({ value: p.id, label: p.name || p.id }))} />
          ) : (
            <input className="form-input" value={pageId} onChange={e => setPageId(e.target.value)} placeholder="ID da Página" />
          )}
        </label>
        <label className="block"><span className="form-label">Teto de orçamento (R$/dia)</span><input className="form-input" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} /></label>
        <label className="block"><span className="form-label">Destino (site ou WhatsApp)</span><input className="form-input" value={destination} onChange={e => setDestination(e.target.value)} placeholder="https://… ou https://wa.me/55…" /></label>
        <label className="block"><span className="form-label">Criativos por conjunto</span>
          <VitraSelect value={String(creativesPerAdset)} onChange={v => setCreativesPerAdset(Number(v))} ariaLabel="Criativos por conjunto"
            options={[{ value: '1', label: '1 criativo' }, { value: '2', label: '2 criativos' }, { value: '3', label: '3 criativos (padrão)' }, { value: '4', label: '4 criativos' }]} />
          <span className="mt-1 block text-[10px] text-white/35">1 anúncio por criativo aprovado em cada conjunto (até o nº escolhido).</span>
        </label>
      </div>

      {isLeadForm && (
        <label className="mt-3 block">
          <span className="form-label">Política de Privacidade (URL)</span>
          <input className="form-input" value={privacyUrl} onChange={e => setPrivacyUrl(e.target.value)} placeholder="https://… (exigida pela Meta no formulário; usa o destino se vazio)" />
          <span className="mt-1 block text-[11px] text-white/40">Formulário instantâneo com nome, e-mail e telefone. O ToS de Lead da Página é validado no momento de criar o rascunho.</span>
        </label>
      )}

      {isSales && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Pixel (conversões)</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <VitraSelect value={convPixelId} onChange={setConvPixelId} ariaLabel="Pixel de conversão"
                  placeholder={pixels.length ? 'Selecione o pixel' : 'Liste os pixels →'}
                  options={pixels.map(p => ({ value: p.id, label: `${p.name}${p.is_active ? '' : ' (inativo)'}` }))} />
              </div>
              <button type="button" onClick={handleLoadPixels} className="btn-ghost flex-shrink-0 !px-3">Listar</button>
            </div>
          </label>
          <label className="block">
            <span className="form-label">Evento de conversão</span>
            <VitraSelect value={conversionEvent} onChange={setConversionEvent} ariaLabel="Evento de conversão"
              options={['LEAD', 'CONTACT', 'SCHEDULE', 'COMPLETE_REGISTRATION', 'VIEW_CONTENT', 'PURCHASE']} />
            <span className="mt-1 block text-[11px] text-white/40">O site precisa disparar esse evento no pixel para a otimização funcionar.</span>
          </label>
        </div>
      )}

      <div className="mt-4">
        <button type="button" onClick={handleSuggest} disabled={suggesting} className="btn-ghost inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {suggesting ? 'Sugerindo…' : (proposal.length ? 'Re-sugerir públicos (IA)' : 'Sugerir públicos por IA')}
        </button>
        {proposal.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-white/45">{proposal.length} conjunto(s) propostos pela IA — cada um vira um ad set pausado:</p>
            {proposal.map((s, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-white">{s.label || s.group_key}</p>
                  <span className="flex-shrink-0 text-[10px] text-white/45">{s.age_min}–{s.age_max} anos{s.retargeting ? ' · retarget' : ''}</span>
                </div>
                {s.geo && (
                  <p className="mt-1 text-[10px] text-gold-200/70">
                    {s.geo === 'radius' ? `Geo: raio ${s.radius_km || 2}km${(s.lat != null && s.lng != null) ? ` (${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)})` : ''}` : s.geo === 'city' ? 'Geo: cidade inteira' : ''}
                  </p>
                )}
                {Array.isArray(s.interest_keywords) && s.interest_keywords.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {s.interest_keywords.map((k, j) => <span key={j} className="rounded bg-gold-500/10 px-1.5 py-0.5 text-[10px] text-gold-200">{k}</span>)}
                  </div>
                )}
                {s.rationale && <p className="mt-1.5 text-[11px] leading-4 text-white/40">{s.rationale}</p>}
                {s.retargeting && (
                  <div className="mt-2">
                    <VitraSelect
                      className="!py-1.5 text-xs"
                      ariaLabel="Público de retargeting"
                      value={s.custom_audience_id || ''}
                      onChange={v => assignAudience(i, v)}
                      options={[
                        { value: '', label: 'Retarget: público amplo (ou escolha um custom)' },
                        ...audiences.map(a => ({ value: a.id, label: `${a.name} · ${a.subtype}${a.size != null ? ` · ${a.size}` : ''}` })),
                      ]}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.015] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Públicos da Meta</span>
          <button type="button" onClick={handleListAudiences} disabled={audBusy} className="btn-ghost inline-flex items-center gap-1.5 !px-2.5 !py-1 text-xs disabled:opacity-50">
            {audBusy ? <Loader2 size={12} className="animate-spin" /> : null} Listar
          </button>
          {audMsg && <span className="text-[11px] text-white/50">{audMsg}</span>}
        </div>
        {audiences.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {audiences.map(a => <span key={a.id} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55">{a.name} · {a.subtype}</span>)}
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <label className="flex-1 block"><span className="form-label">Pixel (público de site)</span><input className="form-input !py-1.5 text-xs" value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="ID do pixel" /></label>
            <button type="button" onClick={handleCreateWebsite} disabled={audBusy || !pixelId} className="btn-ghost !px-2.5 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">Criar site</button>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex-1 block"><span className="form-label">Lookalike (fonte)</span>
              <VitraSelect value={lkOrigin} onChange={setLkOrigin} placeholder="Selecione a fonte" ariaLabel="Fonte do lookalike" className="!py-1.5 text-xs"
                options={audiences.filter(a => a.subtype !== 'LOOKALIKE').map(a => ({ value: a.id, label: a.name }))} />
            </label>
            <button type="button" onClick={handleCreateLookalike} disabled={audBusy || !lkOrigin} className="btn-ghost !px-2.5 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">Criar LAL</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/25 bg-red-950/25 px-4 py-3 text-xs text-red-100/85">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-300" />
            <div>
              <p>{error.message}</p>
              {error.issues?.length ? <ul className="mt-1 list-disc pl-4 text-red-200/70">{error.issues.map((i, k) => <li key={k}>{i}</li>)}</ul> : null}
            </div>
          </div>
        </div>
      )}

      {!loading && missingToBuild.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-3 text-[11px] leading-4 text-amber-200">
          <p className="font-semibold">Para liberar “Criar rascunho na Meta”, falta:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {missingToBuild.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={handleBuild} disabled={!canBuild} title={canBuild ? '' : `Falta: ${missingToBuild.join('; ')}`} className="btn-gold inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
          {loading ? 'Criando rascunho…' : 'Criar rascunho na Meta (pausado)'}
        </button>
        {result?.meta_campaign_id && (
          <>
            <a href={result.ads_manager_url} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center justify-center gap-2">Abrir no Ads Manager</a>
            <button type="button" onClick={handleActivate} disabled={activating || result.activated} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50">
              {activating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {result.activated ? 'Ativada ✓' : 'Publicar (ativar)'}
            </button>
          </>
        )}
      </div>

      {result?.meta_campaign_id && !result.activated && (
        <p className="mt-3 text-[11px] leading-4 text-white/45">Rascunho criado <span className="text-white/65">PAUSADO</span> (campanha {result.meta_campaign_id}). Revise no Ads Manager; “Publicar (ativar)” inicia o gasto e pede confirmação.</p>
      )}

      {Array.isArray(result?.skipped_creatives) && result.skipped_creatives.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-4 text-amber-200">
          <p className="font-semibold">{result.skipped_creatives.length} criativo(s) não publicado(s) — copy reprovada na validação de marca:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.skipped_creatives.map((s, i) => (
              <li key={i}><span className="text-amber-100">{s.headline || s.asset_id}</span>: {Array.isArray(s.issues) ? s.issues.join('; ') : String(s.issues)}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(result?.targeting_adjustments) && result.targeting_adjustments.length > 0 && (
        <div className="mt-3 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-[11px] leading-4 text-sky-200">
          <p className="font-semibold">Direcionamento ajustado em {result.targeting_adjustments.length} conjunto(s) — a Meta recusou interesses depreciados; mantida a segmentação por geografia:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.targeting_adjustments.map((t, i) => (
              <li key={i}><span className="text-sky-100">{t.label || t.group_key || `Conjunto ${i + 1}`}</span>: {t.note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Padrao reutilizavel de Tráfego Pago: importa a config de uma campanha de REFERENCIA (vencedora) da
// Meta, normaliza num blueprint (decisoes de gestor: age 25-65, raio 2km regional + cidade macro, FB+IG,
// 3x3, form por ticket) e salva como PRESET por marca. Reusa-se ao montar novas campanhas semelhantes.
function MetaPresetsPanel({ brandProfile = getBrandProfile(), onApply }) {
  const [metaCampaignId, setMetaCampaignId] = useState('')
  const [importing, setImporting] = useState(false)
  const [config, setConfig] = useState(null)
  const [blueprint, setBlueprint] = useState(null)
  const [radiusKm, setRadiusKm] = useState(2)
  const [presetName, setPresetName] = useState('')
  const [saving, setSaving] = useState(false)
  const [presets, setPresets] = useState([])
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  // Auto-descoberta (mesmo padrao da Conta/Página no "Publicar na Meta"): conta -> campanhas por dropdown.
  const brandAcct = META_AD_ACCOUNTS[brandProfile.scope] || META_AD_ACCOUNTS[BRAND_SCOPES.imobiliaria] || {}
  const [adAccountId, setAdAccountId] = useState(brandAcct.adAccountId || '')
  const [accounts, setAccounts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [manualMode, setManualMode] = useState(false)   // fallback se a conta nao listar (sem token/permissao)

  async function loadPresets() { try { setPresets(await listMetaPresets(brandProfile.scope)) } catch { /* ignore */ } }
  useEffect(() => { loadPresets() }, [brandProfile.scope])

  // Contas acessiveis -> pre-seleciona a da marca (cai em input manual se nao listar).
  useEffect(() => {
    let alive = true
    listMetaAdAccounts()
      .then(list => { if (!alive) return; setAccounts(list); if (list.length && !list.some(a => a.id === adAccountId)) setAdAccountId((list.find(a => a.id === brandAcct.adAccountId) || list[0]).id) })
      .catch(() => { if (alive) setManualMode(true) })
    return () => { alive = false }
  }, [brandProfile.scope])

  // Ao trocar a conta, recarrega as campanhas dela e zera a selecao anterior.
  useEffect(() => {
    if (!adAccountId) { setCampaigns([]); return }
    let alive = true
    setLoadingCampaigns(true); setMetaCampaignId(''); setConfig(null); setBlueprint(null)
    listMetaCampaigns(adAccountId)
      .then(list => { if (alive) { setCampaigns(list); setManualMode(false) } })
      .catch(() => { if (alive) setManualMode(true) })
      .finally(() => { if (alive) setLoadingCampaigns(false) })
    return () => { alive = false }
  }, [adAccountId])

  const STATUS_LABEL = s => ({ ACTIVE: 'Ativa', PAUSED: 'Pausada', CAMPAIGN_PAUSED: 'Pausada', ADSET_PAUSED: 'Pausada', ARCHIVED: 'Arquivada', DELETED: 'Excluída', IN_PROCESS: 'Em processo', WITH_ISSUES: 'Com pendência' }[s] || s || '—')
  const campaignPeriod = c => {
    // ignora datas invalidas/epoch-0 (campanha sem start_time vinha como "31/12/69").
    const fmt = d => { const t = Date.parse(d || ''); return (t && new Date(t).getFullYear() >= 2015) ? new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null }
    const a = fmt(c.start_time || c.created_time), b = fmt(c.stop_time)
    return a ? (b ? `${a}–${b}` : `desde ${a}`) : ''
  }
  const filteredCampaigns = campaigns.filter(c => statusFilter === 'todos'
    || (statusFilter === 'ativas' && c.status === 'ACTIVE')
    || (statusFilter === 'pausadas' && /PAUSED/.test(String(c.status))))

  async function handleImport() {
    if (!metaCampaignId.trim()) return
    setImporting(true); setError(null); setNotice(null); setConfig(null); setBlueprint(null)
    try {
      const cfg = await readMetaCampaignConfig(metaCampaignId)
      setConfig(cfg)
      setBlueprint(presetBlueprintFromConfig(cfg, { regionalRadiusKm: Number(radiusKm) || 2 }))
      setPresetName(cfg?.campaign?.name ? `Padrão — ${cfg.campaign.name}`.slice(0, 60) : 'Padrão Lead Imóvel')
    } catch (e) { setError(e) } finally { setImporting(false) }
  }

  async function handleSave() {
    if (!blueprint) return
    setSaving(true); setError(null)
    try {
      await saveMetaPreset({ brandScope: brandProfile.scope, name: presetName, sourceMetaCampaignId: metaCampaignId.trim(), blueprint })
      setNotice('Preset salvo. Reutilize-o ao montar novas campanhas semelhantes.')
      setConfig(null); setBlueprint(null); setMetaCampaignId('')
      await loadPresets()
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Excluir o preset "${p.name}"?`)) return
    try { await deleteMetaPreset(p.id); await loadPresets() } catch (e) { setError(e) }
  }

  const bpSummary = bp => bp ? `${bp.objective} · ${bp.optimization_goal} · CBO R$${((bp.daily_budget_cents || 0) / 100).toFixed(0)}/dia · ${bp.age_min}-${bp.age_max} · ${(bp.adsets || []).map(a => a.geo === 'radius' ? `regional ${a.radius_km}km` : 'cidade').join(' + ')} · form: ${bp.lead_form_quality === 'maior_intencao' ? 'maior intenção (SMS)' : 'mais volume'}` : ''

  return (
    <div className="rounded-xl border border-gold-500/20 bg-[color:var(--surface-1)] p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <Target size={15} className="text-gold-400" />
        <p className="text-sm font-semibold text-white">Presets de campanha — clonar a vencedora</p>
      </div>
      <p className="mb-3 max-w-2xl text-xs leading-5 text-white/50">
        Escolha uma <span className="text-white/75">campanha de referência</span> da conta (lista da Meta, sem digitar ID) e salve como <span className="text-white/75">preset</span> — objetivo, otimização, orçamento, faixa etária e os 2 conjuntos por geografia (regional por raio + cidade) viram padrão para novas campanhas semelhantes.
      </p>

      {/* Conta de anúncio + Campanha de referência por DROPDOWN (sem digitar ID) — espelha Conta/Página do "Publicar na Meta". */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="form-label">Conta de anúncio</span>
          {accounts.length > 0
            ? <VitraSelect value={adAccountId} onChange={setAdAccountId} ariaLabel="Conta de anúncio (preset)"
                options={accounts.map(a => ({ value: a.id, label: `${a.name || a.id}${a.currency ? ` · ${a.currency}` : ''}` }))} />
            : <input className="form-input" value={adAccountId} onChange={e => setAdAccountId(e.target.value)} placeholder="ID da conta (act_…)" />}
        </label>
        <label className="block"><span className="form-label">Raio regional (km)</span>
          <input type="number" min="1" max="80" className="form-input" value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))} /></label>
      </div>

      {!manualMode && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="form-label">Campanha de referência</span>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
              {[{ k: 'todos', l: 'Todas' }, { k: 'ativas', l: 'Ativas' }, { k: 'pausadas', l: 'Pausadas' }].map(o => (
                <button key={o.k} type="button" onClick={() => setStatusFilter(o.k)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${statusFilter === o.k ? 'bg-gold-500/15 text-gold-200' : 'text-white/50 hover:text-white/80'}`}>{o.l}</button>
              ))}
            </div>
          </div>
          {loadingCampaigns
            ? <p className="text-[11px] text-white/45"><Loader2 size={12} className="mr-1 inline animate-spin" />Carregando campanhas…</p>
            : filteredCampaigns.length > 0
              ? <VitraSelect value={metaCampaignId} onChange={setMetaCampaignId} ariaLabel="Campanha de referência"
                  options={[{ value: '', label: 'Selecione uma campanha…' }, ...filteredCampaigns.map(c => ({ value: c.id, label: `${c.name || c.id} · ${STATUS_LABEL(c.status)}${campaignPeriod(c) ? ` · ${campaignPeriod(c)}` : ''}` }))]} />
              : <p className="text-[11px] text-white/45">{campaigns.length ? 'Nenhuma campanha neste filtro.' : 'Nenhuma campanha nesta conta.'}</p>}
        </div>
      )}

      {manualMode && (
        <label className="mt-3 block max-w-md"><span className="form-label">ID da campanha de referência (Meta)</span>
          <input className="form-input" value={metaCampaignId} onChange={e => setMetaCampaignId(e.target.value)} placeholder="ex.: 120240689084870221" />
          <span className="mt-1 block text-[10px] text-white/35">Não foi possível listar campanhas desta conta — cole o ID manualmente.</span>
        </label>
      )}

      <div className="mt-3">
        <button type="button" onClick={handleImport} disabled={importing || !metaCampaignId.trim()} className="btn-ghost inline-flex items-center gap-2 text-sm disabled:opacity-50">
          {importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}Importar config
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-300">{error.message || String(error)}</p>}
      {notice && <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-emerald-200"><CheckCircle2 size={13} />{notice}</p>}

      {blueprint && (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <p className="text-[11px] uppercase tracking-wide text-gold-300/80">Blueprint padronizado</p>
          <p className="mt-1 text-xs leading-5 text-white/70">{bpSummary(blueprint)}</p>
          {config?.adsets?.length > 0 && (
            <p className="mt-1 text-[10px] text-white/40">Origem: {config.adsets.length} conjunto(s) · {(config.lead_form ? 'form lido' : 'form não localizado na leitura')}.</p>
          )}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block"><span className="form-label">Nome do preset</span>
              <input className="form-input !w-72" value={presetName} onChange={e => setPresetName(e.target.value)} /></label>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-gold inline-flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}Salvar preset
            </button>
          </div>
        </div>
      )}

      {presets.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="form-label mb-2">Presets salvos ({presets.length})</p>
          <div className="space-y-2">
            {presets.map(p => (
              <div key={p.id} className="rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-white/80">{p.name}</span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button type="button" onClick={() => { onApply?.(p.blueprint); setNotice(`Preset "${p.name}" aplicado no painel abaixo — revise e gere o rascunho.`) }} className="inline-flex items-center gap-1 rounded-md border border-gold-500/40 px-2 py-1 text-[10px] text-gold-200 hover:bg-gold-500/10">
                      <Check size={11} />Usar preset
                    </button>
                    <button type="button" onClick={() => handleDelete(p)} className="text-[10px] text-white/40 hover:text-red-300">excluir</button>
                  </div>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-white/45">{bpSummary(p.blueprint)}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-white/35">Use o preset como referência ao preencher o painel “Revisar e publicar” abaixo (build PAUSED).</p>
        </div>
      )}
    </div>
  )
}

function TrafegoPagoSection({ brandProfile, campaign, assets, rendering, busyId, notice, onRender, onApproveGroup, onEditAd }) {
  const [presetSeed, setPresetSeed] = useState(null)
  if (!campaign) return <EmptyState icon={Megaphone} title="Nenhuma campanha selecionada" />
  const ads = groupMetaAds(assets)
  if (!ads.length) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Sem criativos de Meta Ads nesta campanha"
        note="Crie uma campanha para gerar os anúncios de tráfego pago — cada um sai nos 3 cortes (1:1, 9:16 e 1,91:1)."
      />
    )
  }
  const placements = assets.filter(a => a.channel === 'meta_ads')
  const pendingRender = placements.filter(a => isRenderablePendingAsset(a)).length
  const generated = placements.filter(a => a.status === 'generated' && !needsVitraImobiliariaApprovedTemplateRender(a)).length
  const approved = placements.filter(a => a.status === 'approved' && !needsVitraImobiliariaApprovedTemplateRender(a)).length
  const readyAds = ads.filter(ad => evaluateMetaAdReadiness(ad).ok).length
  // Fase 2 (P4): cortes prontos (gerados, sem pendencia de render) ainda nao aprovados.
  const approvableAssets = placements.filter(a => a.status === 'generated' && !needsVitraImobiliariaApprovedTemplateRender(a))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Tráfego Pago · Meta Ads</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">
            Cada anúncio sai nos 3 cortes que o Gerenciador pede — <span className="text-white/70">Quadrado 1:1 (feed)</span>, <span className="text-white/70">Vertical 9:16 (stories/reels)</span> e <span className="text-white/70">Horizontal 1,91:1 (recomendado)</span> — prontos para o passo de corte de mídia.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onRender}
            disabled={rendering || pendingRender === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/12 px-4 py-2.5 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rendering ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {rendering ? 'Gerando…' : `Gerar cortes${pendingRender ? ` (${pendingRender})` : ''}`}
          </button>
          <button
            type="button"
            onClick={() => onApproveGroup(approvableAssets)}
            disabled={Boolean(busyId) || !approvableAssets.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: approvableAssets.length ? '#C4942A' : 'rgba(196,148,42,0.18)', color: approvableAssets.length ? '#0A0A0A' : '#F0C95C' }}
            title="Aprova de uma vez todos os cortes ja gerados desta campanha"
          >
            <CheckCircle2 size={16} />
            Aprovar todos{approvableAssets.length ? ` (${approvableAssets.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => downloadMetaAdsPackage(campaign, ads, brandProfile)}
            disabled={!ads.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.035] px-4 py-2.5 text-sm font-semibold text-white/72 transition hover:border-gold-500/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download size={16} />
            Exportar pacote
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-gold-500/25 bg-gold-500/8 px-4 py-3 text-xs text-gold-100">{notice}</div>
      )}

      <div className="grid gap-3 md:grid-cols-5">
        <StatTile label="Anúncios" value={ads.length} sub={`${placements.length} cortes`} icon={Megaphone} />
        <StatTile label="Pendentes" value={pendingRender} sub="aguardando corte" icon={Clock} tone="#E4C06E" />
        <StatTile label="Gerados" value={generated} sub="cortes prontos" icon={ImageIcon} tone="#D4A84A" />
        <StatTile label="Aprovados" value={approved} sub="prontos p/ subir" icon={CheckCircle2} tone="#F0C95C" />
        <StatTile label="QA final" value={`${readyAds}/${ads.length}`} sub="anuncios exportaveis" icon={Target} tone="#C4942A" />
      </div>

      <MetaPresetsPanel brandProfile={brandProfile} onApply={setPresetSeed} />

      <PublishMetaPanel campaign={campaign} brandProfile={brandProfile} ads={ads} seed={presetSeed} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {ads.map(ad => (
          <MetaAdCard
            key={ad.key}
            ad={ad}
            busy={ad.assets.some(a => a.id === busyId)}
            onApprove={() => onApproveGroup(ad.assets)}
            onEdit={() => onEditAd(ad)}
          />
        ))}
      </div>
    </div>
  )
}

function MetaAdCard({ ad, busy, onApprove, onEdit }) {
  const ordered = [...ad.assets].sort(
    (a, b) => AD_FORMAT_ORDER.indexOf(a.aspect_ratio) - AD_FORMAT_ORDER.indexOf(b.aspect_ratio),
  )
  const [idx, setIdx] = useState(0)
  const safeIdx = Math.min(idx, ordered.length - 1)
  const current = ordered[safeIdx]
  const place = META_PLACEMENTS[current?.aspect_ratio] || {}
  const currentNeedsRender = needsVitraImobiliariaApprovedTemplateRender(current)
  const hasPendingRender = ad.assets.some(a => isRenderablePendingAsset(a))
  const hasRenderableImage = Boolean(current?.public_url) && !currentNeedsRender
  const allApproved = ad.assets.every(a => a.status === 'approved' && !needsVitraImobiliariaApprovedTemplateRender(a))
  const meta = ad.assets[0]?.metadata?.meta_ad || {}
  const headline = ad.assets[0]?.headline || ''
  const cta = ad.assets[0]?.cta || ''
  const visualTemplate = ad.assets[0]?.metadata?.visual_template || {}
  const readiness = evaluateMetaAdReadiness(ad)
  const pendingChecks = readiness.checks.filter(check => !check.ok).length
  const fileName = `${ad.key}-${(current?.aspect_ratio || '').replace(':', 'x')}.png`

  return (
    <div className="overflow-hidden rounded-xl border border-gold-500/20 bg-[color:var(--surface-1)]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Megaphone size={14} className="text-gold-400" />
          <p className="text-sm font-semibold text-white">Anúncio · {ad.label}</p>
        </div>
        <StatusPill value={allApproved ? 'approved' : currentNeedsRender ? 'queued' : current?.status} />
      </div>

      <div className="flex gap-1 px-3 pt-3">
        {ordered.map((a, i) => {
          const p = META_PLACEMENTS[a.aspect_ratio] || {}
          const active = i === safeIdx
          return (
            <button
              key={a.id}
              onClick={() => setIdx(i)}
              className="flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition"
              style={{
                background: active ? 'rgba(196,148,42,0.15)' : 'rgba(255,255,255,0.04)',
                color: active ? '#F0C95C' : 'rgba(255,255,255,0.55)',
                border: active ? '1px solid rgba(196,148,42,0.45)' : '1px solid transparent',
              }}
            >
              {a.aspect_ratio}
              <span className="ml-1 hidden font-normal text-white/40 sm:inline">{p.label}</span>
            </button>
          )
        })}
      </div>

      <div className="relative mx-3 mt-3 flex h-60 items-center justify-center overflow-hidden rounded-lg bg-black">
        {hasRenderableImage ? (
          <img src={current.public_url} alt={current.title} className="max-h-full max-w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <ImageIcon size={22} className="text-gold-500/50" />
            <span className="text-[11px]">{currentNeedsRender || current?.status === 'queued' ? 'aguardando corte' : 'sem render'}</span>
          </div>
        )}
        <span className="absolute right-2 top-2 rounded bg-black/55 px-2 py-1 text-[10px] text-white/80">{place.dim}</span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[11px] text-white/45">
          <span className="text-white/70">{place.label}</span> · {place.sub}
        </p>
        {visualTemplate.label && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gold-400/70">{visualTemplate.label}</p>
        )}
      </div>

      <div className="space-y-2 border-t border-white/10 px-4 py-3">
        <AdField label="Título" value={headline} />
        <AdField label="Texto principal" value={meta.texto_principal} clamp />
        <AdField label="CTA" value={cta} />
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {readiness.ok ? <CheckCircle2 size={14} className="text-gold-300" /> : <AlertTriangle size={14} className="text-gold-200" />}
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">QA operacional</p>
          </div>
          <span className="text-[10px] text-white/38">{readiness.ok ? 'exportavel' : `${pendingChecks} pendencia(s)`}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {readiness.checks.map(check => (
            <span
              key={check.id}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] ${
                check.ok
                  ? 'border-gold-500/25 bg-gold-500/8 text-gold-100'
                  : 'border-white/10 bg-white/[0.025] text-white/38'
              }`}
            >
              {check.ok ? <Check size={11} /> : <Clock size={11} />}
              {check.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
        <button
          onClick={onApprove}
          disabled={busy || allApproved || hasPendingRender}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed"
          style={{
            background: allApproved ? 'rgba(196,148,42,0.12)' : hasPendingRender ? 'rgba(255,255,255,0.05)' : '#C4942A',
            color: allApproved ? '#F0C95C' : hasPendingRender ? 'rgba(255,255,255,0.4)' : '#0A0A0A',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {allApproved ? 'Aprovado' : 'Aprovar anúncio'}
        </button>
        {hasRenderableImage ? (
          <a
            href={current.public_url}
            download={fileName}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-gold-500/35 hover:text-white"
          >
            <Download size={13} /> Baixar
          </a>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/30">
            <Download size={13} /> Baixar
          </span>
        )}
        <button
          onClick={onEdit}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/12 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:border-gold-500/35 hover:text-white disabled:opacity-60"
        >
          <Pencil size={13} /> Editar
        </button>
      </div>
    </div>
  )
}

function AdField({ label, value, clamp }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className={`text-xs leading-5 text-white/72 ${clamp ? 'line-clamp-2' : 'truncate'}`}>{value || '—'}</p>
    </div>
  )
}

function AdEditModal({ ad, campaign = null, brandScope = BRAND_SCOPES.imobiliaria, saving, onClose, onSave }) {
  const a0 = ad.assets[0] || {}
  const m = a0.metadata?.meta_ad || {}
  const [form, setForm] = useState({
    nome: m.nome || `${ad.label} | Meta Ads`,
    texto_principal: m.texto_principal || a0.copy || '',
    titulo: a0.headline || '',
    descricao: m.descricao || '',
    cta: a0.cta || CTA_OPTIONS[0],
    url_params: m.url_params || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inputClass = 'form-input'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'

  // Porta in-app da skill vitra-copy: gera 3 angulos a partir dos fatos da campanha e aplica ao anuncio.
  const [ai, setAi] = useState({ loading: false, error: null, drafts: null })
  async function handleGenerateAdCopy() {
    if (!campaign) return
    setAi(s => ({ ...s, loading: true, error: null }))
    try {
      const angles = await generateAdCopyAngles({ campaign, brandScope })
      if (!angles.length) throw new Error('A IA nao retornou angulos. Tente de novo.')
      const productName = campaign?.product_name || campaign?.brief?.product_data?.name || ''
      const drafts = angles.map(a => ({
        ...a,
        issues: revalidateCopyAngle(
          { headline: a.headline, body: a.body, cta: a.cta },
          { scope: brandScope, headlineMax: 40, productName, channel: 'paid' },
        ),
      }))
      setAi({ loading: false, error: null, drafts })
    } catch (err) {
      setAi(s => ({ ...s, loading: false, error: errorMessage(err) }))
    }
  }
  function applyAngle(d) {
    // CTA do angulo e uma FRASE de copy, nao o enum de CTA da Meta — por isso aplicamos so os 3 campos de
    // texto e mantemos o seletor de CTA (enum) como esta. Conjunto volta para a fila no Salvar (re-render).
    setForm(f => ({ ...f, titulo: d.headline || f.titulo, texto_principal: d.body || f.texto_principal, descricao: d.description || f.descricao }))
  }

  function submit(event) {
    event.preventDefault()
    onSave(ad.assets, form)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-h-[92vh] w-full max-w-lg">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Editar anúncio · {ad.label}</h2>
            <p className="mt-0.5 text-xs text-white/45">Campos do Gerenciador da Meta · aplica aos 3 cortes</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:text-white" title="Fechar">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} autoComplete="off" className="max-h-[calc(92vh-72px)] space-y-4 overflow-y-auto px-6 py-5">
          {/* Porta in-app da vitra-copy: 3 ângulos validados a partir dos fatos da campanha → aplica ao anúncio */}
          <div className="rounded-xl border border-gold-500/25 bg-gold-500/[0.06] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/80">Copy por IA · vitra-copy</p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/45">3 ângulos (preço-âncora · aspiração · escassez) a partir dos dados do imóvel.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAdCopy}
                disabled={ai.loading || !campaign}
                title={!campaign ? 'Abra o anúncio pelo fluxo da campanha para gerar copy' : ''}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/15 px-3 py-1.5 text-xs font-semibold text-gold-100 transition hover:bg-gold-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ai.loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {ai.loading ? 'Gerando…' : ai.drafts ? 'Gerar de novo' : 'Gerar 3 ângulos'}
              </button>
            </div>
            {!campaign && <p className="mt-2 text-[11px] text-amber-200/80">Sem campanha vinculada a este anúncio — não dá para puxar os fatos do imóvel.</p>}
            {ai.error && <p className="mt-2 rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">{ai.error}</p>}
            {Array.isArray(ai.drafts) && ai.drafts.length > 0 && (
              <ul className="mt-3 space-y-2">
                {ai.drafts.map((d, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-200/70">{d.angle || d.key || `Ângulo ${i + 1}`}</span>
                      <button type="button" onClick={() => applyAngle(d)} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">Aplicar a este anúncio</button>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-white/85">{d.headline} <span className="text-[10px] font-normal text-white/35">({(d.headline || '').length}/40)</span></p>
                    <p className="mt-1 text-[11px] leading-5 text-white/60">{d.body}</p>
                    {d.description && <p className="mt-1 text-[11px] leading-4 text-white/40">↳ {d.description}</p>}
                    {d.cta && <p className="mt-1 text-[10px] text-white/45">CTA sugerido: <span className="text-white/65">{d.cta}</span></p>}
                    {Array.isArray(d.issues) && d.issues.length > 0 && (
                      <p className="mt-1.5 text-[10px] leading-4 text-amber-300">⚠ {d.issues.join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Field label="Nome do anúncio" labelClass={labelClass}>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Texto principal" labelClass={labelClass}>
            <textarea value={form.texto_principal} onChange={e => set('texto_principal', e.target.value)} className={`${inputClass} min-h-28 resize-y`} placeholder="Legenda do anúncio (com emojis, benefícios, etc.)" />
          </Field>
          <Field label="Título" labelClass={labelClass}>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className={inputClass} placeholder="Ex: Converse conosco" />
          </Field>
          <Field label="Descrição" labelClass={labelClass}>
            <input value={form.descricao} onChange={e => set('descricao', e.target.value)} className={inputClass} placeholder="Detalhes adicionais (opcional)" />
          </Field>
          <Field label="Chamada para ação (CTA)" labelClass={labelClass}>
            <VitraSelect value={form.cta} onChange={v => set('cta', v)} ariaLabel="CTA" options={CTA_OPTIONS} />
          </Field>
          <Field label="Parâmetros de URL (UTM)" labelClass={labelClass}>
            <input value={form.url_params} onChange={e => set('url_params', e.target.value)} className={inputClass} placeholder="utm_source=meta&utm_medium=paid&utm_campaign=..." />
          </Field>
          <p className="text-[11px] leading-5 text-white/40">
            Título e CTA entram no criativo e o conjunto volta para a fila para re-render nos 3 cortes. Texto principal, descrição e UTM ficam salvos para você colar no Gerenciador.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/65 transition hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/15 px-4 py-2 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Salvar anúncio
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssetEditModal({ asset, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    headline: asset.headline || '',
    copy: asset.copy || '',
    cta: asset.cta || '',
  })
  const inputClass = 'form-input'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'

  function submit(event) {
    event.preventDefault()
    onSave(asset.id, form)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel w-full max-w-lg">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Editar criativo</h2>
            <p className="mt-0.5 text-xs text-white/45">{asset.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:text-white" title="Fechar">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} autoComplete="off" className="space-y-4 px-6 py-5">
          <Field label="Headline" labelClass={labelClass}>
            <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Copy" labelClass={labelClass}>
            <textarea value={form.copy} onChange={e => setForm(f => ({ ...f, copy: e.target.value }))} className={`${inputClass} min-h-24 resize-y`} />
          </Field>
          <Field label="CTA" labelClass={labelClass}>
            <input value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} className={inputClass} />
          </Field>
          <p className="text-[11px] leading-5 text-white/40">
            Ao salvar, o criativo volta para a fila e é re-renderizado com os novos textos no próximo “Gerar criativos”.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/65 transition hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/15 px-4 py-2 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Salvar e reenfileirar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PublicationsSection({ posts, publications, assets, saving, onCreatePublication }) {
  const [form, setForm] = useState({
    content_post_id: posts[0]?.id || '',
    asset_id: assets[0]?.id || '',
    platform: posts[0]?.platform || 'instagram',
    publication_type: 'organic',
    external_post_id: '',
    permalink: '',
    published_at: new Date().toISOString().slice(0, 16),
    notes: '',
  })

  useEffect(() => {
    setForm(current => ({
      ...current,
      content_post_id: current.content_post_id || posts[0]?.id || '',
      asset_id: current.asset_id || assets[0]?.id || '',
      platform: current.platform || posts[0]?.platform || 'instagram',
    }))
  }, [posts, assets])

  if (!posts.length) return <EmptyState icon={Send} title="Nenhum conteúdo para mapear" />

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    // Item 4: a publicacao herda a oferta (se houver) do conteudo vinculado; conteudo de marca = sem oferta.
    const post = posts.find(p => p.id === form.content_post_id)
    onCreatePublication({
      ...form,
      campaign_id: post?.campaign_id || null,
      brand_scope: post?.metadata?.brand_scope || null,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
      <form onSubmit={submit} autoComplete="off" className="rounded-xl border border-gold-500/20 bg-[color:var(--surface-1)] p-4">
        <div className="mb-4 border-b border-white/10 pb-3">
          <p className="text-sm font-semibold text-white">Mapear publicação real</p>
          <p className="mt-1 text-xs leading-5 text-white/42">Vincule o conteúdo planejado ao post publicado para destravar métricas por peça.</p>
        </div>

        <div className="space-y-3">
          <Field label="Conteúdo" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <VitraSelect
              value={form.content_post_id}
              ariaLabel="Conteúdo vinculado"
              onChange={v => {
                const post = posts.find(item => item.id === v)
                update('content_post_id', v)
                if (post?.asset_id) update('asset_id', post.asset_id)
                if (post?.platform) update('platform', post.platform)
              }}
              options={[
                { value: '', label: 'Sem conteúdo vinculado' },
                ...posts.map(post => ({ value: post.id, label: `${post.platform} · ${post.title}` })),
              ]}
            />
          </Field>

          <Field label="Asset" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <VitraSelect
              value={form.asset_id}
              onChange={v => update('asset_id', v)}
              ariaLabel="Asset vinculado"
              options={[
                { value: '', label: 'Sem asset vinculado' },
                ...assets.map(asset => ({ value: asset.id, label: `${asset.channel} · ${asset.title}` })),
              ]}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plataforma" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
              <VitraSelect value={form.platform} onChange={v => update('platform', v)} ariaLabel="Plataforma"
                options={[
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'email', label: 'E-mail' },
                ]} />
            </Field>
            <Field label="Tipo" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
              <VitraSelect value={form.publication_type} onChange={v => update('publication_type', v)} ariaLabel="Tipo de publicação"
                options={[
                  { value: 'organic', label: 'Orgânico' },
                  { value: 'paid', label: 'Pago' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'dark_post', label: 'Dark post' },
                ]} />
            </Field>
          </div>

          <Field label="ID externo" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <input value={form.external_post_id} onChange={event => update('external_post_id', event.target.value)} className="form-input" />
          </Field>
          <Field label="Permalink" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <input value={form.permalink} onChange={event => update('permalink', event.target.value)} className="form-input" />
          </Field>
          <Field label="Publicado em" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <input type="datetime-local" value={form.published_at} onChange={event => update('published_at', event.target.value)} className="form-input" />
          </Field>
          <button type="submit" disabled={saving} className="btn-gold flex w-full items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Mapear publicação
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-sm font-semibold text-white">Conteúdos planejados</p>
        </div>
        {posts.length ? (
          <div className="divide-y divide-white/10">
            {posts.map(post => (
              <div key={post.id} className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PlatformLabel value={post.platform} />
                  <span className="text-xs text-white/40">{post.format}</span>
                  <StatusPill value={post.status} />
                </div>
                <p className="text-sm font-medium text-white">{post.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{post.hook}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState icon={FileText} title="Sem conteúdos planejados" />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-sm font-semibold text-white">Publicações reais</p>
        </div>
        {publications.length ? (
          <div className="divide-y divide-white/10">
            {publications.map(publication => {
              const asset = assets.find(item => item.id === publication.asset_id)
              return (
                <div key={publication.id} className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <PlatformLabel value={publication.platform} />
                    <span className="text-xs capitalize text-white/40">{publication.publication_type}</span>
                    <StatusPill value={publication.status} />
                  </div>
                  <p className="text-sm font-medium text-white">{asset?.title || publication.external_post_id || 'Publicação mapeada'}</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/42">
                    <span>{formatDate(publication.published_at)}</span>
                    {publication.permalink && (
                      <a href={publication.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold-300 hover:text-gold-200">
                        Abrir <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState icon={Radio} title="Nenhuma publicação vinculada" note="A Fase 4 fará a importação Meta por post real." />
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function MetricsSection({ campaign, publications, metrics, totals, snapshots }) {
  if (!campaign) return <EmptyState icon={BarChart3} title="Nenhuma campanha selecionada" />

  const organic = metrics.filter(metric => metric.source === 'organic' || metric.source === 'manual')
  const paid = metrics.filter(metric => metric.source === 'paid')

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Alcance" value={formatNumber(totals.reach)} sub="snapshots por publicação" icon={Target} />
        <StatTile label="Impressões" value={formatNumber(totals.impressions)} sub={`${metrics.length} coletas`} icon={Activity} tone="#E4C06E" />
        <StatTile label="Leads" value={formatNumber(totals.leads)} sub="entrada manual" icon={Sparkles} tone="#D4A84A" />
        <StatTile label="Posts vinculados" value={publications.length} sub={`${organic.length} orgânico · ${paid.length} pago`} icon={Radio} tone="#E4C06E" />
      </div>

      {metrics.length ? (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="grid grid-cols-[0.8fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr] gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <span>Fonte</span>
            <span>Plataforma</span>
            <span>Alcance</span>
            <span>Cliques</span>
            <span>Leads</span>
            <span>Coleta</span>
          </div>
          <div className="divide-y divide-white/10">
            {metrics.map(metric => (
              <div key={metric.id} className="grid grid-cols-[0.8fr,0.8fr,0.8fr,0.8fr,0.8fr,0.8fr] gap-3 px-4 py-3 text-sm text-white/62">
                <StatusPill value={metric.source} />
                <PlatformLabel value={metric.platform} />
                <span>{formatNumber(metric.reach)}</span>
                <span>{formatNumber(metric.link_clicks || metric.clicks)}</span>
                <span>{formatNumber(metric.leads)}</span>
                <span>{formatDate(metric.collected_at)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Métricas aguardando vínculo com posts reais"
          note="Quando a publicação for mapeada por post_id externo, os snapshots entram por publicação."
        />
      )}

      <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={15} className="text-gold-400" />
          <p className="text-sm font-semibold text-white">Snapshots de conta</p>
        </div>
        <p className="text-xs text-white/42">{snapshots.length} registros historicos disponíveis para contas sociais.</p>
      </div>
    </div>
  )
}

function DataModelSection({ brandProfile = getBrandProfile(), accounts }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
      <div className="rounded-lg border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-sm font-semibold text-white">Modelo Supabase multi-marca</p>
        </div>
        <div className="divide-y divide-white/10">
          {PREMIUM_TABLES.map(table => (
            <div key={table.name} className="grid gap-3 px-4 py-4 md:grid-cols-[240px,1fr]">
              <div>
                <p className="font-mono text-xs text-gold-300">{table.name}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{table.label}</p>
              </div>
              <p className="text-sm leading-6 text-white/55">{table.purpose}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Contas {brandProfile.name}</p>
          <Database size={15} className="text-gold-400" />
        </div>
        {accounts.length ? (
          <div className="space-y-3">
            {accounts.map(account => (
              <div key={account.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <PlatformLabel value={account.platform} />
                  <StatusPill value={account.connection_status} />
                </div>
                <p className="text-sm font-medium text-white">{account.account_name}</p>
                <p className="mt-1 text-xs text-white/40">{account.username || account.external_account_id || 'Aguardando conexão'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-5 text-white/42">Nenhuma conta social mapeada.</p>
        )}
      </div>
    </div>
  )
}

function PlatformLabel({ value }) {
  const color = PLATFORM_COLOR[value] || '#C4942A'
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium capitalize text-white/65">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {String(value || 'canal').replace(/_/g, ' ')}
    </span>
  )
}

function NewCampaignModal({ brandProfile, saving, submitError, onClose, onSubmit }) {
  const [form, setForm] = useState(() => initialFormForBrand(brandProfile))
  const [localError, setLocalError] = useState(null)
  const templateOptions = useMemo(() => selectableCreativeTemplatesForBrand(brandProfile.scope), [brandProfile.scope])
  const { template: selectedTemplate, variant: selectedTemplateVariant } = useMemo(
    () => normalizeCreativeTemplateSelection(brandProfile.scope, form.creative_template_id, form.creative_template_variant),
    [brandProfile.scope, form.creative_template_id, form.creative_template_variant],
  )
  const selectedFieldGroups = useMemo(() => fieldGroupsForTemplate(selectedTemplate), [selectedTemplate])
  const selectedImageSlots = useMemo(() => imageSlotsForTemplate(selectedTemplate), [selectedTemplate])
  const selectedVariationContract = useMemo(
    () => variationContractForTemplate(selectedTemplate),
    [selectedTemplate],
  )

  // Degrau B' (importar de anuncio): estado da extracao + keys preenchidas pela IA. aiFilledKeys fica
  // FORA do form (state local) para nao vazar no payload de submit.
  const [extract, setExtract] = useState({ loading: false, error: null, result: null, sourceText: '', applied: null, phase: null, url: '', fetching: false })
  const [extractMode, setExtractMode] = useState('fill-empty')
  const [aiFilledKeys, setAiFilledKeys] = useState([])
  // Degrau B: sugestao de template por IA (a IA recomenda; o operador confirma).
  const [suggest, setSuggest] = useState({ loading: false, error: null, result: null })
  // Fluxo unico: ao gerar a copy, rola ate o painel "Copiloto de copy" (que fica abaixo dos campos)
  // para o operador ver que a copy foi gerada. O ref-flag dispara o scroll so apos a copy renderizar.
  const copyPanelRef = useRef(null)
  const pendingCopyScrollRef = useRef(false)

  useEffect(() => {
    if (pendingCopyScrollRef.current && aiCopy.drafts?.length) {
      pendingCopyScrollRef.current = false
      copyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })

  useEffect(() => {
    setForm(initialFormForBrand(brandProfile))
    setLocalError(null)
    setExtract({ loading: false, error: null, result: null, sourceText: '', applied: null, phase: null, url: '', fetching: false })
    setExtractMode('fill-empty')
    setAiFilledKeys([])
    setSuggest({ loading: false, error: null, result: null })
  }, [brandProfile.scope])

  // Trocar de TEMPLATE muda o conjunto de campos: a extracao anterior (keyed por outras formKeys) e as
  // marcas IA ficam obsoletas. Limpa o resultado/marcas (preserva o texto colado p/ re-extrair).
  useEffect(() => {
    setExtract(state => ({ ...state, result: null, error: null, applied: null }))
    setAiFilledKeys([])
    setSuggest({ loading: false, error: null, result: null })
    // Os rascunhos de copy foram gerados para os fatos do template anterior — limpa pra nao confundir
    // (a copy ja aplicada em form.ai_copy_angles e preservada; e escolha deliberada do operador).
    setAiCopy(state => ({ ...state, drafts: null, error: null }))
  }, [form.creative_template_id])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
    // Editar um campo preenchido pela IA tira a marca "IA" (sinaliza edicao/aprovacao humana).
    setAiFilledKeys(current => (current.includes(field) ? current.filter(k => k !== field) : current))
  }

  // Copiloto de IA (degrau A): gera, revisa/edita e aplica os angulos de copy na voz da marca.
  // Vale Imobiliaria E Premium (a Edge generate-copy tem a voz de cada marca, alinhada ao brandbook).
  const aiCopyEnabled = true
  const [aiCopy, setAiCopy] = useState({ loading: false, error: null, drafts: null })
  const aiApplied = Array.isArray(form.ai_copy_angles) && form.ai_copy_angles.length > 0

  async function handleGenerateCopy() {
    setAiCopy(state => ({ ...state, loading: true, error: null }))
    try {
      const angles = await generateCopyWithAI(form, brandProfile)
      if (!angles.length) throw new Error('A IA nao retornou angulos. Tente novamente.')
      setAiCopy({ loading: false, error: null, drafts: angles })
    } catch (err) {
      setAiCopy(state => ({ ...state, loading: false, error: errorMessage(err) }))
    }
  }

  function editDraft(index, field, value) {
    // Revalida AO VIVO com as MESMAS regras da Edge (tamanho da headline, nome duplicado, vocabulario
    // fora da marca), em vez de so limpar os badges — guia o operador a manter a edicao dentro da marca.
    const headlineMax = fieldsForTemplate(selectedTemplate).find(f => f.key === 'suggested_headline')?.maxLength || 40
    setAiCopy(state => ({
      ...state,
      drafts: (state.drafts || []).map((d, i) => {
        if (i !== index) return d
        const next = { ...d, [field]: value }
        next.issues = revalidateCopyAngle(next, { scope: brandProfile.scope, headlineMax, productName: form.product_name, channel: 'paid' })
        return next
      }),
    }))
  }

  function applyAiDrafts() {
    const angles = (aiCopy.drafts || []).map(({ key, angle, headline, body, cta }) => ({ key, angle, headline, body, cta }))
    update('ai_copy_angles', angles)
  }

  function clearAiCopy() {
    setAiCopy({ loading: false, error: null, drafts: null })
    update('ai_copy_angles', undefined)
  }

  // Degrau B' do copiloto: a IA le o anuncio colado e PROPOE os campos; o operador revisa e aplica.
  const extractEnabled = selectedFieldGroups.length > 0

  // Degrau B' por LINK: busca o texto da pagina do imovel e PREENCHE a caixa de texto. O operador
  // revisa o que foi lido antes de extrair (rede de seguranca contra fetch fino/ruido).
  async function handleFetchListing() {
    if (!extract.url.trim()) {
      setExtract(state => ({ ...state, error: 'Cole o link do imovel antes de buscar.' }))
      return
    }
    setExtract(state => ({ ...state, fetching: true, error: null }))
    try {
      const { text, warnings } = await fetchListingText(extract.url)
      if (!text) {
        setExtract(state => ({ ...state, fetching: false, error: warnings[0] || 'Nao consegui ler a pagina. Cole o texto do anuncio.' }))
        return
      }
      setExtract(state => ({ ...state, fetching: false, sourceText: text, error: warnings.length ? warnings[0] : null }))
    } catch (err) {
      setExtract(state => ({ ...state, fetching: false, error: errorMessage(err) }))
    }
  }

  async function handleExtractFacts() {
    if (!extract.sourceText.trim()) {
      setExtract(state => ({ ...state, error: 'Cole o texto do anuncio antes de extrair.' }))
      return
    }
    // Reseta `applied` (de uma extracao/aplicacao anterior) para o novo resultado nascer "nao aplicado"
    // e reexibir o botao "Aplicar" + o toggle de modo (gated por !extract.applied).
    setExtract(state => ({ ...state, loading: true, error: null, applied: null }))
    try {
      const result = await extractFactsWithAI(extract.sourceText, selectedTemplate, brandProfile)
      setExtract(state => ({ ...state, loading: false, result }))
    } catch (err) {
      setExtract(state => ({ ...state, loading: false, error: errorMessage(err) }))
    }
  }

  function applyExtracted() {
    const fields = extract.result?.fields || {}
    // Defesa: so aplica campos do template ATUAL (evita keys orfas de um template que foi trocado).
    const allowed = new Set(fieldsForTemplate(selectedTemplate).map(formKeyForTemplateField))
    const scoped = Object.fromEntries(Object.entries(fields).filter(([key]) => allowed.has(key)))
    const { patch, appliedKeys } = buildFactsApplyPatch(form, scoped, { mode: extractMode })
    if (!appliedKeys.length) {
      setExtract(state => ({
        ...state,
        error: extractMode === 'fill-empty'
          ? 'Nada a preencher: os campos encontrados ja estao preenchidos (use "Sobrescrever" para substituir).'
          : 'Nenhum campo com dado ancorado no texto para aplicar.',
      }))
      return
    }
    const prevValues = {}
    appliedKeys.forEach(key => { prevValues[key] = form[key] ?? '' })
    setForm(current => ({ ...current, ...patch }))
    setAiFilledKeys(current => Array.from(new Set([...current, ...appliedKeys])))
    // Acumula o historico de undo: uniao das keys + prevValues com PRIMEIRA captura por key (a
    // captura original vence, mesmo apos applies sucessivos), para o "Desfazer" voltar ao original.
    setExtract(state => ({
      ...state,
      error: null,
      applied: {
        keys: Array.from(new Set([...(state.applied?.keys || []), ...appliedKeys])),
        prevValues: { ...prevValues, ...(state.applied?.prevValues || {}) },
      },
    }))
  }

  function undoExtracted() {
    const applied = extract.applied
    if (!applied) return
    setForm(current => {
      const restore = {}
      // So restaura as keys ainda marcadas como IA (nao mexe no que o operador editou depois).
      applied.keys.forEach(key => { if (aiFilledKeys.includes(key)) restore[key] = applied.prevValues[key] ?? '' })
      return { ...current, ...restore }
    })
    setAiFilledKeys(current => current.filter(key => !applied.keys.includes(key)))
    setExtract(state => ({ ...state, applied: null }))
  }

  function clearExtract() {
    setExtract({ loading: false, error: null, result: null, sourceText: '', applied: null, phase: null, url: '', fetching: false })
    setAiFilledKeys([])
    setSuggest({ loading: false, error: null, result: null })
  }

  // Degrau B: a IA le o anuncio e RECOMENDA o template ideal; o operador confirma ("Usar este template").
  async function handleSuggestTemplate() {
    if (!extract.sourceText.trim()) {
      setSuggest(state => ({ ...state, error: 'Cole o texto do anuncio antes de sugerir o template.' }))
      return
    }
    setSuggest(state => ({ ...state, loading: true, error: null }))
    try {
      const res = await suggestTemplateWithAI(extract.sourceText, brandProfile)
      if (!res || !res.valid || !res.templateId) {
        setSuggest({ loading: false, error: 'A IA nao conseguiu recomendar um template. Escolha manualmente abaixo.', result: null })
        return
      }
      const tpl = templateOptions.find(t => t.id === res.templateId)
      setSuggest({
        loading: false,
        error: null,
        result: { templateId: res.templateId, name: tpl?.name || tpl?.shortName || res.templateId, rationale: res.rationale, confidence: res.confidence },
      })
    } catch (err) {
      setSuggest({ loading: false, error: errorMessage(err), result: null })
    }
  }

  function applySuggestedTemplate() {
    const id = suggest.result?.templateId
    const tpl = id && templateOptions.find(t => t.id === id)
    if (tpl) selectTemplate(tpl) // troca o template (o useEffect de creative_template_id reseta extracao/sugestao)
    setSuggest({ loading: false, error: null, result: null })
  }

  function dismissSuggestion() {
    setSuggest({ loading: false, error: null, result: null })
  }

  // Fluxo unico (degrau B' -> A): extrai os fatos do anuncio, aplica (fill-empty) e JA gera a copy a
  // partir do form preenchido — tudo num clique. Vale Imobiliaria E Premium (a Edge tem a voz de cada
  // marca). Usa o nextForm computado localmente (o state setForm e assincrono) para a copy ver os fatos.
  async function handleExtractAndGenerate() {
    if (!extract.sourceText.trim()) {
      setExtract(state => ({ ...state, error: 'Cole o texto do anuncio antes de extrair.' }))
      return
    }
    // Reseta `applied` (fresh start) e limpa drafts antigos (senao copy de outro imovel fica visivel
    // se o guard de product_name interromper o fluxo).
    setExtract(state => ({ ...state, loading: true, error: null, phase: 'extracting', applied: null }))
    setAiCopy({ loading: false, error: null, drafts: null })
    try {
      // 1. Extrair os fatos do texto.
      const result = await extractFactsWithAI(extract.sourceText, selectedTemplate, brandProfile)
      // 2. Aplicar (fill-empty) — computa o form ja preenchido para a copy ser gerada a partir dele.
      const allowed = new Set(fieldsForTemplate(selectedTemplate).map(formKeyForTemplateField))
      const scoped = Object.fromEntries(Object.entries(result.fields).filter(([key]) => allowed.has(key)))
      const { patch, appliedKeys } = buildFactsApplyPatch(form, scoped, { mode: 'fill-empty' })
      const nextForm = { ...form, ...patch }
      const prevValues = {}
      appliedKeys.forEach(key => { prevValues[key] = form[key] ?? '' })
      setForm(nextForm)
      if (appliedKeys.length) setAiFilledKeys(current => Array.from(new Set([...current, ...appliedKeys])))
      setExtract(state => ({
        ...state,
        result,
        phase: 'generating',
        applied: appliedKeys.length
          ? {
              keys: Array.from(new Set([...(state.applied?.keys || []), ...appliedKeys])),
              prevValues: { ...prevValues, ...(state.applied?.prevValues || {}) },
            }
          : state.applied,
      }))
      // Sem nome do produto, a copy fica fraca: para o fluxo aqui (a extracao ja foi aplicada).
      if (!String(nextForm.product_name || '').trim()) {
        setExtract(state => ({
          ...state,
          loading: false,
          phase: null,
          error: 'Extrai os fatos, mas nao achei o Nome do Produto no texto. Preencha-o e use "Gerar copy com IA" abaixo.',
        }))
        return
      }
      // 3. Gerar a copy a partir do form ja preenchido com os fatos.
      setAiCopy(state => ({ ...state, loading: true, error: null }))
      const angles = await generateCopyWithAI(nextForm, brandProfile)
      if (angles.length) pendingCopyScrollRef.current = true
      setAiCopy({ loading: false, error: angles.length ? null : 'A IA nao retornou angulos. Tente novamente.', drafts: angles.length ? angles : null })
      setExtract(state => ({ ...state, loading: false, phase: null }))
    } catch (err) {
      setExtract(state => ({ ...state, loading: false, phase: null, error: errorMessage(err) }))
      setAiCopy(state => ({ ...state, loading: false }))
    }
  }

  function selectTemplate(template) {
    const variant = template.variants?.find(item => item.id === template.defaultVariant) ||
      template.variants?.[0] ||
      null
    setForm(current => ({
      ...current,
      creative_template_id: template.id,
      creative_template_variant: variant?.id || '',
    }))
  }

  function updateImage(field, files, multiple = false) {
    setForm(current => ({
      ...current,
      images: {
        ...current.images,
        [field]: multiple ? Array.from(files || []) : files?.[0] || null,
      },
    }))
  }

  function updateTemplateField(field, value) {
    update(formKeyForTemplateField(field), value)
  }

  function templateFieldValue(field) {
    return form[formKeyForTemplateField(field)] ?? ''
  }

  function imageSlotCount(slot) {
    const value = form.images?.[slot.id]
    return slot.multiple ? (value?.length || 0) : value ? 1 : 0
  }

  function renderTemplateField(field) {
    const commonProps = {
      value: templateFieldValue(field),
      onChange: event => updateTemplateField(field, event.target.value),
      className: inputClass,
      placeholder: field.placeholder || '',
      required: Boolean(field.required),
      maxLength: field.maxLength,
      autoComplete: 'off',
    }

    if (field.type === 'textarea' || field.type === 'list') {
      return (
        <>
          <textarea
            {...commonProps}
            className={`${inputClass} min-h-20 resize-y`}
          />
          {field.helper && <span className="mt-1.5 block text-[11px] leading-4 text-white/35">{field.helper}</span>}
        </>
      )
    }

    if (field.type === 'select') {
      return (
        <BrandedSelect
          value={commonProps.value}
          onChange={value => updateTemplateField(field, value)}
          options={field.options || []}
          placeholder={field.placeholder || 'Selecionar'}
        />
      )
    }

    return (
      <>
        <input {...commonProps} inputMode={field.type === 'money' ? 'text' : undefined} />
        {field.helper && <span className="mt-1.5 block text-[11px] leading-4 text-white/35">{field.helper}</span>}
      </>
    )
  }

  async function submit(event) {
    event.preventDefault()
    const productName = form.product_name.trim()
    if (!productName) {
      setLocalError('Informe o Nome do Produto no inicio do formulario para criar a campanha.')
      return
    }

    // Fase 4 (UX): valida TODOS os obrigatorios de uma vez (antes era um por vez, .find), para o
    // operador corrigir tudo num passo so em vez de re-submeter campo a campo.
    const missingFields = selectedFieldGroups
      .flatMap(group => group.fields || [])
      .filter(field => field.required && !String(form[formKeyForTemplateField(field)] || '').trim())
      .map(field => field.label)

    // Fluxo so com upload manual: os slots de imagem obrigatorios sao sempre exigidos.
    const missingImageSlots = selectedImageSlots
      .filter(slot => slot.required && imageSlotCount(slot) === 0)
      .map(slot => slot.label)

    const allMissing = [...missingFields, ...missingImageSlots]
    if (allMissing.length) {
      const base = allMissing.length === 1
        ? `Preencha o campo obrigatorio: ${allMissing[0]}.`
        : `Preencha os ${allMissing.length} campos obrigatorios: ${allMissing.join(', ')}.`
      setLocalError(missingImageSlots.length
        ? `${base} Faca o upload das fotos do imovel.`
        : base)
      return
    }

    setLocalError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setLocalError(errorMessage(err))
    }
  }

  const inputClass = 'form-input'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'
  const sectionTitleClass = 'border-b border-white/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400'

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-h-[92vh] w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="h-px w-7 bg-gold-500/70" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">{brandProfile.shortName}</span>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white">Nova campanha</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:border-gold-500/35 hover:text-white"
            title="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} noValidate autoComplete="off" className="flex max-h-[calc(92vh-76px)] flex-col">
          <div className="space-y-7 overflow-y-auto px-6 py-6">
            <section className="space-y-4">
              <p className={sectionTitleClass}>Variacoes do criativo</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Variacoes por template aprovado" labelClass={labelClass}>
                  <BrandedSelect
                    value={form.creative_variations}
                    onChange={value => update('creative_variations', Number(value))}
                    options={CREATIVE_VARIATION_OPTIONS}
                  />
                  <span className="mt-1.5 block text-[11px] leading-4 text-white/35">
                    Layout, marca e formatos permanecem fixos; a ferramenta varia argumentos, fotos, copy e CTA permitidos pelo template.
                  </span>
                  {(() => {
                    const cap = distinctConceptCapacity(form, brandProfile)
                    const ads = Math.min(Number(form.creative_variations) || 0, cap)
                    const overflow = Number(form.creative_variations) > cap
                    return (
                      <>
                        <span className="mt-1.5 block text-[11px] font-semibold leading-4 text-gold-300/90">
                          Serao gerados {ads} anuncios &times; 3 formatos = {ads * 3} cortes (1:1, 9:16 e 1.91:1).
                        </span>
                        {overflow && (
                          <span className="mt-1 block text-[11px] leading-4 text-amber-300/80">
                            Este template tem {cap} angulos distintos — acima disso a copy se repetiria, entao o total foi limitado a {cap}.
                          </span>
                        )}
                      </>
                    )
                  })()}
                </Field>
              </div>
              <p className="text-xs leading-5 text-white/42">
                A ferramenta usa as fotos enviadas como materia-prima, gera as variacoes e deixa o pacote pronto para QA, aprovacao e exportacao. Publicacao com verba continua exigindo autorizacao humana.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">Catalogo de Templates</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/35">{brandProfile.name}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {templateOptions.map(template => {
                  const selected = selectedTemplate?.id === template.id
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={`group overflow-hidden rounded-lg border text-left transition ${
                        selected
                          ? 'border-gold-500/70 bg-gold-500/12 shadow-[0_0_0_1px_rgba(196,148,42,0.18)]'
                          : 'border-white/10 bg-black/24 hover:border-gold-500/35 hover:bg-gold-500/6'
                      }`}
                    >
                      <div className="grid grid-cols-[118px_1fr] gap-0">
                        <div className="flex h-full min-h-[118px] items-center justify-center border-r border-white/10 bg-[color:var(--surface-0)]">
                          {template.preview ? (
                            <img
                              src={template.preview}
                              alt=""
                              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center px-4">
                              <BrandHorizontalLogo brandScope={brandProfile.scope} className="scale-90" />
                            </div>
                          )}
                        </div>
                        <div className="flex min-h-[118px] flex-col justify-between p-4">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{template.name}</p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-400/85">{template.shortName}</p>
                              </div>
                              <span className={`mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                selected ? 'border-gold-500/50 text-gold-200' : 'border-white/10 text-white/35'
                              }`}>
                                {selected ? 'Selecionado' : 'Escolher'}
                              </span>
                            </div>
                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/48">{template.bestFor}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {template.formats.map(format => (
                              <span key={format} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/45">
                                {format}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedTemplate?.variants?.length > 1 && (
                <div className="inline-flex rounded-lg border border-white/10 bg-black/35 p-1">
                  {selectedTemplate.variants.map(variant => {
                    const selected = selectedTemplateVariant?.id === variant.id
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => update('creative_template_variant', variant.id)}
                        className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                          selected
                            ? 'bg-gold-500/18 text-gold-100'
                            : 'text-white/48 hover:bg-white/5 hover:text-white/70'
                        }`}
                      >
                        {variant.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {(() => {
                const refs = selectedTemplate ? referencesForTemplateVariant(selectedTemplate, selectedTemplateVariant?.id) : []
                if (!refs.length) return null
                const formatLabels = ['1:1 Feed', '9:16 Story', '1.91:1 Wide']
                return (
                  <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400/85">
                        Preview do template{selectedTemplateVariant?.label ? ` · ${selectedTemplateVariant.label}` : ''}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">referencia aprovada</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {refs.slice(0, 3).map((src, index) => (
                        <div key={src} className="overflow-hidden rounded border border-white/10 bg-[color:var(--surface-0)]">
                          <div className="flex aspect-square items-center justify-center">
                            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                          </div>
                          <span className="block bg-black/45 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                            {formatLabels[index] || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {selectedVariationContract && (
                <div className="rounded-lg border border-white/10 bg-black/24 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400/85">
                    Variacao controlada pelo template
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Pode variar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedVariationContract.mutableSlots || []).map(slot => (
                          <span key={slot} className="rounded border border-gold-500/25 bg-gold-500/10 px-2 py-1 text-[10px] font-semibold text-gold-100/80">
                            {humanizeSlot(slot)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Permanece fixo</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedVariationContract.lockedSlots || []).map(slot => (
                          <span key={slot} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/45">
                            {humanizeSlot(slot)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {extractEnabled && (
              <section className="space-y-4 rounded-2xl border border-gold-400/25 bg-gold-400/[0.04] p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">Importar de um anúncio · IA</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Cole um anúncio/briefing, <strong className="text-white/70">ou o link do imóvel</strong> no site da construtora. {aiCopyEnabled
                      ? <>A IA pode <strong className="text-white/70">só extrair os fatos</strong> — ou <strong className="text-white/70">extrair e já escrever a copy</strong> num passo só.</>
                      : <>A IA lê e <strong className="text-white/70">propõe</strong> os campos abaixo — só o que estiver no texto.</>} Você revisa tudo antes; nada é preenchido sem o seu clique.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={extract.url}
                      onChange={event => setExtract(state => ({ ...state, url: event.target.value }))}
                      className={`${inputClass} flex-1 min-w-[55%]`}
                      placeholder="Cole o link do imóvel no site da construtora (opcional)"
                    />
                    <button
                      type="button"
                      onClick={handleFetchListing}
                      disabled={extract.fetching || !extract.url.trim()}
                      className="shrink-0 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {extract.fetching ? 'Lendo a página…' : 'Buscar do link'}
                    </button>
                  </div>
                  <p className="text-[11px] leading-4 text-white/35">
                    A IA lê a página oficial e preenche a caixa abaixo — você revisa antes de extrair. Sites em JavaScript podem não funcionar; nesse caso, cole o texto.
                  </p>
                </div>

                <textarea
                  value={extract.sourceText}
                  onChange={event => setExtract(state => ({ ...state, sourceText: event.target.value }))}
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Ex: Apartamento no Menino Deus, 2 dormitórios com suíte, 61m², churrasqueira e sacada. R$ 539 mil. Próximo ao Parque da Redenção... (ou use o link acima)"
                />

                {templateOptions.length > 1 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleSuggestTemplate}
                      disabled={suggest.loading || extract.loading || !extract.sourceText.trim()}
                      className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-gold-400/40 hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggest.loading ? 'Analisando…' : '💡 Sugerir o template ideal'}
                    </button>
                    {suggest.error && (
                      <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{suggest.error}</p>
                    )}
                    {suggest.result && (() => {
                      const alreadySelected = form.creative_template_id === suggest.result.templateId
                      const confClass = suggest.result.confidence === 'high'
                        ? 'border-emerald-400/40 text-emerald-300'
                        : suggest.result.confidence === 'medium'
                          ? 'border-amber-400/40 text-amber-300'
                          : 'border-red-400/40 text-red-300'
                      return (
                        <div className="space-y-2 rounded-xl border border-gold-400/30 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400/85">Template recomendado</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${confClass}`}>{suggest.result.confidence}</span>
                          </div>
                          <p className="text-sm font-semibold text-white/90">{suggest.result.name}</p>
                          {suggest.result.rationale && <p className="text-[11px] leading-4 text-white/45">{suggest.result.rationale}</p>}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {alreadySelected ? (
                              <span className="text-[11px] font-medium text-emerald-300">✓ já é o template selecionado</span>
                            ) : (
                              <button type="button" onClick={applySuggestedTemplate} className="rounded-full bg-gold-400 px-3 py-1.5 text-[11px] font-semibold text-black transition hover:bg-gold-300">
                                Usar este template
                              </button>
                            )}
                            <button type="button" onClick={dismissSuggestion} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/55 transition hover:text-white">
                              Dispensar
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {aiCopyEnabled && (
                    <button
                      type="button"
                      onClick={handleExtractAndGenerate}
                      disabled={extract.loading || aiCopy.loading || !extract.sourceText.trim()}
                      className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {extract.loading
                        ? (extract.phase === 'generating' ? 'Gerando copy…' : 'Extraindo…')
                        : '✨ Extrair e gerar copy'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExtractFacts}
                    disabled={extract.loading || !extract.sourceText.trim()}
                    className="rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {extract.loading && !aiCopyEnabled ? 'Extraindo…' : (aiCopyEnabled ? 'Só extrair fatos' : 'Extrair fatos com IA')}
                  </button>
                  {(extract.result || extract.sourceText) && (
                    <button
                      type="button"
                      onClick={clearExtract}
                      disabled={extract.loading}
                      className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/55 transition hover:text-white disabled:opacity-50"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {extract.error && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{extract.error}</p>
                )}

                {extract.applied && (
                  <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    <span>{extract.applied.keys.length} campo(s) preenchidos pela IA — revise abaixo antes de gerar.</span>
                    <button type="button" onClick={undoExtracted} className="font-semibold underline underline-offset-2 hover:text-emerald-200">Desfazer</button>
                  </p>
                )}

                {extract.result && (() => {
                  const entries = Object.entries(extract.result.fields).filter(([, f]) => f.present)
                  if (!entries.length) {
                    return <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">A IA não encontrou dados ancorados no texto. Cole um anúncio mais completo e tente de novo.</p>
                  }
                  const labelByKey = {}
                  selectedFieldGroups.flatMap(g => g.fields || []).forEach(f => { labelByKey[formKeyForTemplateField(f)] = f.label })
                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">{entries.length} campo(s) encontrados</span>
                        {!extract.applied && (
                          <div className="flex items-center gap-1 rounded-full border border-white/10 p-0.5">
                            {[['fill-empty', 'Preencher vazios'], ['overwrite', 'Sobrescrever']].map(([mode, label]) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setExtractMode(mode)}
                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${extractMode === mode ? 'bg-gold-400 text-black' : 'text-white/50 hover:text-white'}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {entries.map(([key, f]) => {
                          const confClass = f.confidence === 'high'
                            ? 'border-emerald-400/40 text-emerald-300'
                            : f.confidence === 'medium'
                              ? 'border-amber-400/40 text-amber-300'
                              : 'border-red-400/40 text-red-300'
                          const value = Array.isArray(f.value) ? f.value.join(' · ') : f.value
                          return (
                            <div key={key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{labelByKey[key] || key}</span>
                                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${confClass}`}>{f.confidence}</span>
                              </div>
                              <p className="mt-1.5 text-sm text-white/85">{value}</p>
                              {f.evidence && <p className="mt-1 text-[11px] italic leading-4 text-white/35">“{f.evidence}”</p>}
                              {Array.isArray(f.issues) && f.issues.length > 0 && (
                                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] leading-4 text-amber-300/80">
                                  {f.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {!extract.applied && (
                        <button
                          type="button"
                          onClick={applyExtracted}
                          className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gold-300"
                        >
                          Aplicar ao formulário
                        </button>
                      )}
                    </div>
                  )
                })()}
              </section>
            )}

            {selectedFieldGroups.map(group => (
              <section key={group.id} className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">{group.title}</p>
                  {group.description && <p className="mt-2 text-xs leading-5 text-white/42">{group.description}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(group.fields || []).map(field => {
                    const key = formKeyForTemplateField(field)
                    const full = field.colSpan === 'full' || field.type === 'textarea' || field.type === 'list'
                    const aiFilled = aiFilledKeys.includes(key)
                    return (
                      <Field
                        key={`${group.id}-${field.key}`}
                        label={`${field.label}${field.required ? ' *' : ''}`}
                        labelClass={labelClass}
                        className={full ? 'md:col-span-2' : ''}
                      >
                        <div
                          className={`relative rounded-lg ${aiFilled ? 'ring-1 ring-gold-400/45' : ''}`}
                          aria-invalid={key === 'product_name' && Boolean(localError && !form.product_name.trim())}
                        >
                          {aiFilled && (
                            <button
                              type="button"
                              onClick={() => update(key, '')}
                              title="Preenchido pela IA — clique para limpar este campo"
                              className="absolute -top-2 right-2 z-10 rounded-full border border-gold-400/45 bg-[color:var(--surface-1)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-300 transition hover:text-gold-200"
                            >
                              IA ✕
                            </button>
                          )}
                          {renderTemplateField(field)}
                        </div>
                      </Field>
                    )
                  })}
                </div>
              </section>
            ))}

            {!selectedFieldGroups.length && (
              <>
            <section className="space-y-4">
              <p className={sectionTitleClass}>Dados do Produto</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do Produto" labelClass={labelClass}>
                  <input
                    value={form.product_name}
                    onChange={event => update('product_name', event.target.value)}
                    aria-invalid={Boolean(localError && !form.product_name.trim())}
                    className={inputClass}
                    placeholder="Ex: Lake Baikal"
                  />
                </Field>

                <Field label="Tagline / Empreendimento" labelClass={labelClass}>
                  <input
                    value={form.tagline}
                    onChange={event => update('tagline', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: GOLDEN LAKE · MULTIPLAN"
                  />
                </Field>

                <Field label="Localização" labelClass={labelClass}>
                  <input
                    value={form.location}
                    onChange={event => update('location', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: Orla do Guaíba, Porto Alegre"
                  />
                </Field>

                <Field label="Metragem" labelClass={labelClass}>
                  <input
                    value={form.area}
                    onChange={event => update('area', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: 195 a 250 m²"
                  />
                </Field>

                <Field label="Suítes" labelClass={labelClass}>
                  <input
                    value={form.suites}
                    onChange={event => update('suites', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: 4 suítes"
                  />
                </Field>

                <Field label="Andares / Torres" labelClass={labelClass}>
                  <input
                    value={form.towers}
                    onChange={event => update('towers', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: 2 torres de 30 pavimentos"
                  />
                </Field>

                <Field label="Diferenciais" labelClass={labelClass}>
                  <textarea
                    value={form.differentials}
                    onChange={event => update('differentials', event.target.value)}
                    className={`${inputClass} min-h-20 resize-y`}
                    placeholder="Ex: Beach Club, Lago cristalino, Spa, Piscina térmica"
                  />
                </Field>

                <Field label="Preço" labelClass={labelClass}>
                  <input
                    value={form.price}
                    onChange={event => update('price', event.target.value)}
                    className={inputClass}
                    placeholder="Ex: R$ 3M"
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <p className={sectionTitleClass}>Textos Base</p>
              <Field label="Headline sugerida" labelClass={labelClass}>
                <input
                  value={form.suggested_headline}
                  onChange={event => update('suggested_headline', event.target.value)}
                  className={inputClass}
                  placeholder="Ex: O próximo capítulo de sofisticação na Orla"
                />
              </Field>

              <Field label="Copy sugerida" labelClass={labelClass}>
                <textarea
                  value={form.suggested_copy}
                  onChange={event => update('suggested_copy', event.target.value)}
                  className={`${inputClass} min-h-20 resize-y`}
                  placeholder="Ex: 2 torres de 30 pavimentos. Residências de 195 a 250 m² com 4 suítes."
                />
              </Field>

              <Field label="CTA padrão" labelClass={labelClass}>
                <input
                  value={form.cta}
                  onChange={event => update('cta', event.target.value)}
                  className={inputClass}
                  placeholder="Ex: Conheça o projeto"
                />
              </Field>
            </section>
              </>
            )}

            {aiCopyEnabled && (
              <section ref={copyPanelRef} className="space-y-4 rounded-2xl border border-gold-400/25 bg-gold-400/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400">Copiloto de copy · IA</p>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      Gera ângulos de copy na voz da {brandProfile.name} a partir dos dados acima. Você revisa, edita e aprova — nada vai pro ar sem o seu OK.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateCopy}
                    disabled={aiCopy.loading || extract.loading}
                    className="shrink-0 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-200 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiCopy.loading ? 'Gerando…' : aiCopy.drafts ? 'Gerar de novo' : 'Gerar copy com IA'}
                  </button>
                </div>

                {aiCopy.error && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{aiCopy.error}</p>
                )}

                {aiApplied && (
                  <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    {form.ai_copy_angles.length} ângulo(s) de IA aplicados — as variações usarão estes textos. Edite e clique em “Usar estes ângulos” de novo para atualizar.
                  </p>
                )}

                {Array.isArray(aiCopy.drafts) && aiCopy.drafts.length > 0 && (
                  <div className="space-y-4">
                    {aiCopy.drafts.map((draft, index) => (
                      <div key={draft.key || index} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
                            {draft.angle || `Ângulo ${index + 1}`}
                          </span>
                          {Array.isArray(draft.issues) && draft.issues.length > 0 && (
                            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                              {draft.issues.length} ajuste(s) sugerido(s)
                            </span>
                          )}
                        </div>
                        <Field label="Headline" labelClass={labelClass}>
                          <input
                            value={draft.headline || ''}
                            onChange={event => editDraft(index, 'headline', event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Texto" labelClass={labelClass}>
                          <textarea
                            value={draft.body || ''}
                            onChange={event => editDraft(index, 'body', event.target.value)}
                            className={`${inputClass} min-h-16 resize-y`}
                          />
                        </Field>
                        <Field label="CTA" labelClass={labelClass}>
                          <input
                            value={draft.cta || ''}
                            onChange={event => editDraft(index, 'cta', event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        {Array.isArray(draft.issues) && draft.issues.length > 0 && (
                          <ul className="list-disc space-y-1 pl-4 text-[11px] leading-4 text-amber-300/80">
                            {draft.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={applyAiDrafts}
                        className="rounded-full bg-gold-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gold-300"
                      >
                        Usar estes ângulos
                      </button>
                      <button
                        type="button"
                        onClick={clearAiCopy}
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/55 transition hover:text-white"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="space-y-4">
              <p className={sectionTitleClass}>Upload de Imagens</p>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedImageSlots.map(field => {
                  const count = imageSlotCount(field)
                  const emptyLabel = field.multiple ? '+ Upload (múltiplas)' : '+ Upload'
                  return (
                    <label
                      key={field.id}
                      className="cursor-pointer rounded-lg border border-dashed border-gold-500/25 bg-gold-500/5 p-4 transition hover:border-gold-500/50 hover:bg-gold-500/10"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">{field.label}{field.required ? ' *' : ''}</span>
                      <span className="mt-3 block text-center text-xs font-semibold text-gold-400">
                        {count ? `${count} arquivo${count > 1 ? 's' : ''}` : emptyLabel}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple={field.multiple}
                        onChange={event => updateImage(field.id, event.target.files, field.multiple)}
                        className="sr-only"
                      />
                    </label>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="border-t border-white/10 bg-[color:var(--surface-2)] px-6 py-5">
            {(localError || submitError) && (
              <div className="mb-4 rounded-lg border border-red-400/25 bg-red-950/30 px-4 py-3 text-xs leading-5 text-red-100/82">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-300" />
                  <span>{localError || errorMessage(submitError)}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/65 transition hover:border-white/20 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Criando campanha…' : 'Criar Campanha'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function BrandedSelect({ value, options = [], onChange, placeholder = 'Selecionar', disabled = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const normalizedOptions = options.map(option => (
    typeof option === 'string' ? { value: option, label: option } : option
  ))
  const selectedOption = normalizedOptions.find(option => String(option.value) === String(value))

  useEffect(() => {
    if (!open) return undefined

    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    window.addEventListener('pointerdown', closeOnOutsideClick)
    return () => window.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  function choose(optionValue) {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gold-500/25 disabled:cursor-not-allowed disabled:opacity-55 ${
          open
            ? 'border-gold-500/65 bg-[color:var(--surface-0)] text-gold-50 shadow-[0_0_0_1px_rgba(196,148,42,0.18)]'
            : 'border-white/10 bg-black/35 text-white hover:border-gold-500/38 hover:bg-[color:var(--surface-0)]'
        }`}
      >
        <span className={selectedOption ? 'truncate text-white' : 'truncate text-white/30'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gold-300/80 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-64 overflow-y-auto rounded-lg border border-gold-500/35 bg-[color:var(--surface-0)] py-1 shadow-2xl shadow-black/80"
        >
          {normalizedOptions.map(option => {
            const selected = String(option.value) === String(value)
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(option.value)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition focus:outline-none ${
                  selected
                    ? 'bg-gold-500/18 text-gold-100'
                    : 'text-white/72 hover:bg-white/[0.055] hover:text-white focus:bg-white/[0.055] focus:text-white'
                }`}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {selected && <Check size={14} className="shrink-0 text-gold-300" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ label, labelClass, className = '', children }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}
