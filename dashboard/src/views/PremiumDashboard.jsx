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
  extractFactsWithAI,
  fetchListingText,
  buildFactsApplyPatch,
  suggestTemplateWithAI,
  revalidateCopyAngle,
  isRenderablePendingAsset,
  renderCampaignAssets,
  saveAd,
  saveAssetEdit,
} from '../lib/premiumData.js'
import { BrandHorizontalLogo } from '../components/PremiumBrand.jsx'
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

const TABS = [
  { id: 'campanhas', label: 'Campanhas', icon: Gem },
  { id: 'assets', label: 'Produção', icon: Layers3 },
  { id: 'trafego', label: 'Tráfego Pago', icon: Megaphone },
  { id: 'publicacoes', label: 'Publicações', icon: Send },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
  { id: 'modelo', label: 'Modelo', icon: Database },
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
      <p className="font-display text-[2rem] font-semibold leading-none tracking-tight text-[#F4EFE3]">
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
  const [activeTab, setActiveTab] = useState(isPaidTrafficMode ? 'trafego' : 'campanhas')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPublication, setSavingPublication] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [editingAd, setEditingAd] = useState(null)
  const [assetBusyId, setAssetBusyId] = useState(null)
  const [rendering, setRendering] = useState(false)
  const [notice, setNotice] = useState(null)
  const [campaignSubmitError, setCampaignSubmitError] = useState(null)
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
      const nextSelected = selectCampaignId || data.campaigns[0]?.id || null
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

  const selectedCampaign = useMemo(
    () => workspace.campaigns.find(campaign => campaign.id === selectedCampaignId) || workspace.campaigns[0] || null,
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
              <button
                onClick={openCampaignModal}
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-[color:var(--surface-0)] transition hover:bg-gold-400"
              >
                <Plus size={16} />
                Nova campanha
              </button>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Campanhas" value={totals.campaigns} sub={`no ambiente ${brandProfile.shortName}`} icon={Briefcase} />
              <StatTile label="Assets" value={totals.assets} sub={selectedCampaign ? 'campanha selecionada' : 'aguardando'} icon={Layers3} />
              <StatTile label="Publicacoes" value={totals.publications} sub={`${totals.posts} conteudos planejados`} icon={Send} tone="#E4C06E" />
              <StatTile
                label="Investimento"
                value={formatNumber(totals.paidSpend, { style: 'currency', currency: 'BRL' })}
                sub={`${formatNumber(totals.leads)} leads importados`}
                icon={BarChart3}
                tone="#D4A84A"
              />
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

        {!loading && !isPaidTrafficMode && activeTab === 'assets' && (
          <AssetsSection
            brandProfile={brandProfile}
            campaign={selectedCampaign}
            assets={scoped.assets.filter(a => a.channel !== 'meta_ads')}
            jobs={scoped.jobs}
            rendering={rendering}
            busyId={assetBusyId}
            notice={notice}
            onRender={handleRenderCampaign}
            onApprove={handleApproveAsset}
            onApproveGroup={handleApproveGroup}
            onEdit={setEditingAsset}
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
            campaign={selectedCampaign}
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

        {!loading && !isPaidTrafficMode && activeTab === 'modelo' && (
          <DataModelSection brandProfile={brandProfile} accounts={workspace.accounts} />
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
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-6">
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

function TrafegoPagoSection({ brandProfile, campaign, assets, rendering, busyId, notice, onRender, onApproveGroup, onEditAd }) {
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

function AdEditModal({ ad, saving, onClose, onSave }) {
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
  const inputClass = 'w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-gold-500/55'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'

  function submit(event) {
    event.preventDefault()
    onSave(ad.assets, form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-lg border border-white/15 bg-[color:var(--surface-1)] shadow-2xl shadow-black/70">
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
            <select value={form.cta} onChange={e => set('cta', e.target.value)} className={inputClass}>
              {CTA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
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
  const inputClass = 'w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-gold-500/55'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'

  function submit(event) {
    event.preventDefault()
    onSave(asset.id, form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-white/15 bg-[color:var(--surface-1)] shadow-2xl shadow-black/70">
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

function PublicationsSection({ campaign, posts, publications, assets, saving, onCreatePublication }) {
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

  if (!campaign) return <EmptyState icon={Send} title="Nenhuma campanha selecionada" />

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    onCreatePublication({
      ...form,
      campaign_id: campaign.id,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
      <form onSubmit={submit} autoComplete="off" className="rounded-lg border border-gold-500/20 bg-[color:var(--surface-1)] p-4">
        <div className="mb-4 border-b border-white/10 pb-3">
          <p className="text-sm font-semibold text-white">Mapear publicação real</p>
          <p className="mt-1 text-xs leading-5 text-white/42">Vincule o conteúdo planejado ao post publicado para destravar métricas por peça.</p>
        </div>

        <div className="space-y-3">
          <Field label="Conteúdo" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <select
              value={form.content_post_id}
              onChange={event => {
                const post = posts.find(item => item.id === event.target.value)
                update('content_post_id', event.target.value)
                if (post?.asset_id) update('asset_id', post.asset_id)
                if (post?.platform) update('platform', post.platform)
              }}
              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
            >
              <option value="">Sem conteúdo vinculado</option>
              {posts.map(post => (
                <option key={post.id} value={post.id}>{post.platform} · {post.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Asset" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <select
              value={form.asset_id}
              onChange={event => update('asset_id', event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white"
            >
              <option value="">Sem asset vinculado</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.channel} · {asset.title}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Plataforma" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
              <select value={form.platform} onChange={event => update('platform', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white">
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
              </select>
            </Field>
            <Field label="Tipo" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
              <select value={form.publication_type} onChange={event => update('publication_type', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white">
                <option value="organic">Orgânico</option>
                <option value="paid">Pago</option>
                <option value="manual">Manual</option>
                <option value="dark_post">Dark post</option>
              </select>
            </Field>
          </div>

          <Field label="ID externo" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <input value={form.external_post_id} onChange={event => update('external_post_id', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white" />
          </Field>
          <Field label="Permalink" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <input value={form.permalink} onChange={event => update('permalink', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white" />
          </Field>
          <Field label="Publicado em" labelClass="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <input type="datetime-local" value={form.published_at} onChange={event => update('published_at', event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white" />
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
        next.issues = revalidateCopyAngle(next, { scope: brandProfile.scope, headlineMax, productName: form.product_name })
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

  const inputClass = 'w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-gold-500/55'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'
  const sectionTitleClass = 'border-b border-white/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg border border-white/15 bg-[color:var(--surface-1)] shadow-2xl shadow-black/70">
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
