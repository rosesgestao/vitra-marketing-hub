import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
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
  isRenderablePendingAsset,
  renderCampaignAssets,
  saveAd,
  saveAssetEdit,
  listMetaAdAccounts,
  META_AD_ACCOUNTS,
  generateContentWithAI,
  createContentPost,
  importContentPlan,
  updateContentPost,
  publishContentPost,
  uploadPostArt,
  setActivePostArt,
  uploadMediaAsset,
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
import { renderPostArtToCanvas, postArtBlob, ensureArtFonts, postArtDims } from '../lib/postArt.js'
import VitraSelect from '../components/VitraSelect.jsx'
import { StatusPill } from '../components/StatusPill.jsx'
import { MetaAdCard } from '../components/MetaAdCard.jsx'
import { AdEditModal } from '../components/AdEditModal.jsx'
import { PublishMetaPanel } from '../components/PublishMetaPanel.jsx'
import { NewCampaignModal } from '../components/NewCampaignModal.jsx'
import { Field } from '../components/Field.jsx'
import { errorMessage } from '../lib/errorMessage.js'
import { Modal, Input, ConfirmModal } from '../components/ui/index.js'
import { BRAND_SCOPES, getBrandProfile } from '../lib/brandProfiles.js'
import { peekTrafegoIntent, clearTrafegoIntent, TRAFEGO_INTENT_EVENT } from '../lib/copilotIntent.js'
import { humanizeLintList } from '../lib/lintText.js'
import { evaluateMetaAdReadiness } from '../lib/metaAdReadiness.js'
import { groupMetaAds, groupMetaAdsByCampaign, buildMetaAdsPackagePayload } from '../lib/metaAds.js'

// SLOT_LABELS/humanizeSlot/INITIAL_FORM/CREATIVE_VARIATION_OPTIONS/initialFormForBrand vivem em components/NewCampaignModal.jsx.

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

// Prontidão de publicação Meta (fonte única) vive em lib/metaAdReadiness.js — puro e coberto por
// Vitest. Importado no topo: evaluateMetaAdReadiness.

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
  // Contrato do pacote em lib/metaAds.js (puro + testado); aqui só o download (blob/DOM).
  const payload = buildMetaAdsPackagePayload(campaign, ads, brandProfile)

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
  // Intenção vinda do Copiloto (peek, não limpa: sobrevive ao double-mount do StrictMode). 'select' já
  // entra como seleção inicial; 'create' abre "Nova campanha" preenchida (efeito abaixo). Só no modo pago.
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => {
    const i = focusMode === 'trafego' ? peekTrafegoIntent() : null
    return i && i.type === 'select' && i.campaignId ? i.campaignId : null
  })
  const [createPrefill, setCreatePrefill] = useState(null)
  const [activeTab, setActiveTab] = useState(isPaidTrafficMode ? 'trafego' : 'assets')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPublication, setSavingPublication] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [editingAd, setEditingAd] = useState(null)
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState(null)   // P0.1 — confirmação in-app
  const [deletingCampaign, setDeletingCampaign] = useState(false)
  const [assetBusyId, setAssetBusyId] = useState(null)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(null)   // { processed, total, rendered, failed } durante "Gerar cortes"
  const [notice, setNotice] = useState(null)
  const [campaignSubmitError, setCampaignSubmitError] = useState(null)
  const [editorialSettings, setEditorialSettings] = useState(null)
  const autoRenderCampaignsRef = useRef(new Set())
  const autoRenderRunningRef = useRef(null)

  function openCampaignModal() {
    setCampaignSubmitError(null)
    setError(null)
    setCreatePrefill(null) // abertura MANUAL: sem prefill do copiloto
    setModalOpen(true)
  }

  // Consome a intenção do Copiloto: 'create' abre "Nova campanha" preenchida; 'select' seleciona a
  // campanha. Aplica no MOUNT (quando navegar remontou a view) E via EVENTO (quando o painel já estava
  // montado — navegar p/ a view atual é no-op). peek + clear adiado p/ sobreviver ao StrictMode.
  useEffect(() => {
    if (!isPaidTrafficMode) return undefined
    let clearTimer = null
    const apply = () => {
      const intent = peekTrafegoIntent()
      if (!intent) return
      if (intent.type === 'create') {
        setCreatePrefill(intent.prefill || {}); setCampaignSubmitError(null); setModalOpen(true)
      } else if (intent.type === 'select' && intent.campaignId) {
        setSelectedCampaignId(intent.campaignId)
      }
      if (clearTimer) clearTimeout(clearTimer)
      clearTimer = setTimeout(() => clearTrafegoIntent(), 1500)
    }
    apply()
    window.addEventListener(TRAFEGO_INTENT_EVENT, apply)
    return () => { window.removeEventListener(TRAFEGO_INTENT_EVENT, apply); if (clearTimer) clearTimeout(clearTimer) }
  }, [isPaidTrafficMode])

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
        setRenderProgress({ processed, total, rendered, failed })
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
        setRenderProgress(null)
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

  // P0.1 — abrir a confirmação in-app (foco-preso/Esc, sem clique acidental). A exclusão real vai no confirm.
  function handleDeleteCampaign(campaign) {
    setDeleteCampaignTarget(campaign)
  }
  async function confirmDeleteCampaign() {
    const campaign = deleteCampaignTarget
    if (!campaign) return
    setDeletingCampaign(true)
    setError(null)
    try {
      await deleteCampaign(campaign.id)
      if (selectedCampaignId === campaign.id) setSelectedCampaignId(null)
      await refresh(null)
      setDeleteCampaignTarget(null)
    } catch (err) {
      setError(err)
    } finally {
      setDeletingCampaign(false)
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
    // Gate de validação visual (Creative Lint): não deixa aprovar um corte com lint reprovado.
    const lint = asset.metadata?.lint
    if (lint && lint.ok === false) {
      setError(`Este corte (${asset.aspect_ratio}) não passou na validação visual: ${humanizeLintList(lint.errors).join(', ')}. Ajuste o template/dados e re-renderize antes de aprovar.`)
      return
    }
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
    // Gate de validação visual: bloqueia o grupo se algum corte reprovou no lint.
    const failed = assetsInGroup.filter(a => a.metadata?.lint?.ok === false)
    if (failed.length) {
      setError(`${failed.length} corte(s) reprovaram na validação visual (${failed.map(a => a.aspect_ratio).join(', ')}). Corrija e re-renderize antes de aprovar.`)
      return
    }
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
      let lastRefreshAt = 0
      const result = await renderCampaignAssets(selectedCampaign.id, {
        assetIds,
        // Progresso por corte (P0.4): a barra/rótulo atualizam e as tiles/cards refletem ao vivo.
        onProgress: async ({ processed, total, rendered, failed }) => {
          setRenderProgress({ processed, total, rendered, failed })
          if (processed - lastRefreshAt >= 1 || processed === total) {
            lastRefreshAt = processed
            await refresh(selectedCampaign.id, { silent: true })
          }
        },
      })
      if (result.error && !result.rendered) throw result.error
      if (result.failed) {
        // P0.3: não silenciar — diz quantos falharam, o motivo (se houver) e como recuperar.
        const reason = result.error ? ` Motivo: ${errorMessage(result.error)}.` : ''
        setNotice(`Renderização: ${result.rendered} gerado(s), ${result.failed} com erro.${reason} Os cortes com erro seguem marcados — clique em "Gerar cortes" de novo para tentar outra vez.`)
      } else {
        setNotice(`Renderização concluída: ${result.rendered} criativo(s) gerado(s).`)
      }
      await refresh(selectedCampaign.id)
    } catch (err) {
      setError(err)
    } finally {
      setRendering(false)
      setRenderProgress(null)
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
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="h-px w-10 bg-gold-500/70" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-gold-400">
                  {isPaidTrafficMode ? brandProfile.trafficKicker : brandProfile.areaKicker}
                </p>
                {/* P0.4 — selo de MODO inequívoco: Tráfego (pago) tem peso sólido; Conteúdo (orgânico) é discreto.
                    O operador vê em 1 relance em que mundo está e em qual marca — não age no modo errado. */}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-3xs font-semibold uppercase tracking-[0.16em] ${isPaidTrafficMode ? 'border border-gold-500/55 bg-gold-500/20 text-gold-100' : 'border border-white/15 bg-white/[0.04] text-white/65'}`}>
                  {isPaidTrafficMode ? <Megaphone size={11} /> : <Layers3 size={11} />}
                  {isPaidTrafficMode ? 'Tráfego Pago' : 'Conteúdo orgânico'}
                  <span className="font-medium tracking-normal text-white/40">· {brandProfile.shortName || brandProfile.name}</span>
                </span>
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
            renderProgress={renderProgress}
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
            renderProgress={renderProgress}
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
          prefill={createPrefill}
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

      <ConfirmModal
        open={!!deleteCampaignTarget}
        onClose={() => setDeleteCampaignTarget(null)}
        onConfirm={confirmDeleteCampaign}
        loading={deletingCampaign}
        title="Excluir campanha"
        confirmLabel="Excluir campanha"
        description={deleteCampaignTarget ? `Excluir "${deleteCampaignTarget.name}"? Todos os assets, conteúdos e publicações desta campanha serão removidos. Esta ação não pode ser desfeita.` : ''}
      />
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
  renderProgress,
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
        renderProgress={renderProgress}
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
  const [savingAll, setSavingAll] = useState(false)        // "salvar as 3": salva todos os rascunhos de IA de uma vez
  const [publishTarget, setPublishTarget] = useState(null) // post no modal de publicar (in-app, no lugar do window.prompt)
  const [publishUrl, setPublishUrl] = useState('')
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

  // "Salvar as 3": persiste todos os rascunhos de IA ainda nao salvos num clique (as sugestoes nao
  // salvas somem ao gerar novas — antes so dava para salvar card a card, com risco de perder trabalho).
  async function handleSaveAll() {
    const pending = results.filter(p => !savedKeys.has(p.key))
    if (!pending.length || savingAll) return
    setSavingAll(true); setError(null)
    const done = new Set(savedKeys)
    let last = null
    try {
      for (const post of pending) {
        last = await createContentPost({
          campaignId: linkedCampaign?.id, brandScope: brandProfile.scope, contentType, platform,
          pillar: post.pillar || pillar, format: post.format || format,
          title: post.headline || post.idea, hook: post.headline,
          caption: drafts[post.key] ?? post.caption, hashtags: post.hashtags, cta: post.cta,
          visual: post.visual, script: post.script,
        })
        done.add(post.key)
      }
      flagSaved(last)
      onSaved?.()
    } catch (e) { setError(e) } finally { setSavedKeys(done); setSavingAll(false) }
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
  // Publicar: abre modal IN-APP com input validado (antes era window.prompt nativo — sem identidade,
  // sem validacao, sem cancelar limpo). A confirmacao roda a acao real.
  const publish = post => { setPublishUrl(post.metadata?.published_url || ''); setPublishTarget(post) }
  const confirmPublish = () => {
    const post = publishTarget
    if (!post) return
    setPublishTarget(null)
    return runAction(post.id, () => publishContentPost({ post, url: publishUrl.trim(), brandScope: brandProfile.scope }))
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

      {/* Publicar conteudo — modal in-app (substitui o window.prompt nativo). Reusa <Modal> + <Input>. */}
      <Modal
        open={!!publishTarget}
        onClose={() => setPublishTarget(null)}
        title="Publicar conteúdo"
        description={publishTarget ? (publishTarget.title || publishTarget.hook || 'Conteúdo') : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setPublishTarget(null)}>Cancelar</button>
            <button type="button" className="btn-gold" onClick={confirmPublish}>Marcar como publicado</button>
          </div>
        }
      >
        <label className="block">
          <span className="form-label">Link do post publicado (opcional)</span>
          <Input value={publishUrl} onChange={e => setPublishUrl(e.target.value)} placeholder="https://instagram.com/p/…" autoFocus />
        </label>
        <p className="mt-2 text-2xs leading-4 text-white/45">Marca este conteúdo como publicado. O link é opcional — você pode colar depois.</p>
      </Modal>

      {mode === 'ia' && results.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-2xs text-white/45"><span className="text-white/70">Sugestões da IA ({results.length})</span> — revise, edite a legenda e salve as que quiser. <span className="text-white/40">As não salvas somem ao gerar novas.</span></p>
            {results.some(p => !savedKeys.has(p.key)) && (
              <button type="button" onClick={handleSaveAll} disabled={savingAll || blockedByOffer} className="btn-gold inline-flex flex-shrink-0 items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                {savingAll ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {savingAll ? 'Salvando…' : `Salvar todas (${results.filter(p => !savedKeys.has(p.key)).length})`}
              </button>
            )}
          </div>
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
                  <button type="button" onClick={() => setDetailPost(p)} className="relative block aspect-[4/5] w-full overflow-hidden bg-black/30 text-left" title="Abrir prévia do post">
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
// Upload manual de imagem (drawer): formatos e limite aceitos + validação no cliente.
const POST_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const POST_IMG_MAX_BYTES = 8 * 1024 * 1024   // 8 MB
const POST_IMG_MIN_PX = 1080                  // resolução recomendada (lado menor); abaixo só AVISA
// Valida tipo + tamanho e lê as dimensões reais (objectURL para preview). Resolve {url,w,h} ou rejeita.
function validatePostImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Nenhum arquivo selecionado.'))
    if (!POST_IMG_TYPES.includes(file.type)) return reject(new Error('Formato não suportado. Envie JPG, PNG ou WebP.'))
    if (file.size > POST_IMG_MAX_BYTES) return reject(new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo 8 MB.`))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ url, w: img.naturalWidth, h: img.naturalHeight, img })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem (arquivo corrompido?).')) }
    img.src = url
  })
}

// Desenha a imagem recortada (cover) no canvas alvo, com ZOOM (scale>=1) e PONTO FOCAL (fx,fy em 0..1).
// Mesma função para a prévia e para o arquivo salvo — garante que o que o operador vê é o que é gravado.
function drawCroppedImage(ctx, img, TW, TH, scale, fx, fy) {
  const iw = img.naturalWidth, ih = img.naturalHeight
  const frameAR = TW / TH, imgAR = iw / ih
  let sw0, sh0
  if (imgAR > frameAR) { sh0 = ih; sw0 = ih * frameAR } else { sw0 = iw; sh0 = iw / frameAR }
  const s = Math.max(1, Number(scale) || 1)
  const sw = sw0 / s, sh = sh0 / s
  const sx = (iw - sw) * Math.min(1, Math.max(0, fx))
  const sy = (ih - sh) * Math.min(1, Math.max(0, fy))
  ctx.clearRect(0, 0, TW, TH)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TW, TH)
}

function PostDetailDrawer({ post, brandProfile = getBrandProfile(), stage, stageMeta, busy, onClose, onSaved, onApprove, onPublish, onBackToDraft, onSchedule }) {
  const canvasRef = useRef(null)
  const scope = post?.metadata?.brand_scope || brandProfile.scope
  const kicker = (CONTENT_PILLAR_OPTIONS.find(p => p.key === post?.editorial_pillar)?.label) || brandProfile.shortName
  // Texto editável (mesmo fluxo).
  const [title, setTitle] = useState(post?.title || '')
  const [caption, setCaption] = useState(post?.caption || '')
  const [cta, setCta] = useState(post?.cta || '')
  const [hashtags, setHashtags] = useState(Array.isArray(post?.hashtags) ? post.hashtags.join(' ') : '')
  // Arte. variant: 'tipografico' | 'foto' (card branded) | 'propria' (imagem enviada pelo operador, sem branding)
  const [variant, setVariant] = useState('tipografico')
  const [photoUrl, setPhotoUrl] = useState('')
  const [fmt, setFmt] = useState(post?.format === 'stories' || post?.format === 'reels' ? 'stories' : 'feed')
  const [activeArt, setActiveArt] = useState(post?.metadata?.art_url || '')
  const [versions, setVersions] = useState(Array.isArray(post?.metadata?.art_versions) ? post.metadata.art_versions : [])
  const [savingArt, setSavingArt] = useState(false)
  const [savingText, setSavingText] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState(null)
  // Upload manual de imagem.
  const [uploadingImg, setUploadingImg] = useState(false)
  const [ownFile, setOwnFile] = useState(null)       // arquivo pendente (preview antes de salvar)
  const [ownPreview, setOwnPreview] = useState('')   // objectURL local da imagem pendente
  const [ownImg, setOwnImg] = useState(null)         // HTMLImageElement carregado (para recortar)
  const [imgWarn, setImgWarn] = useState(null)       // aviso de resolução baixa (não bloqueia)
  const [crop, setCrop] = useState({ scale: 1, fx: 0.5, fy: 0.5 })   // zoom + ponto focal do recorte
  const heroInputRef = useRef(null)
  const ownInputRef = useRef(null)
  const cropCanvasRef = useRef(null)
  const dragRef = useRef(null)

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

  // Cropper da imagem própria: redesenha a prévia ao trocar imagem/zoom/foco/formato.
  useEffect(() => {
    if (variant !== 'propria' || !ownImg || !cropCanvasRef.current) return
    const [TW, TH] = postArtDims(fmt === 'stories' ? 'stories' : 'feed')
    const c = cropCanvasRef.current
    c.width = TW; c.height = TH
    drawCroppedImage(c.getContext('2d'), ownImg, TW, TH, crop.scale, crop.fx, crop.fy)
  }, [variant, ownImg, fmt, crop])

  function pushVersion(url) {
    setActiveArt(url)
    setVersions(prev => [{ url, at: new Date().toISOString() }, ...prev.filter(v => v?.url !== url)].slice(0, 6))
  }
  async function handleSaveArt() {
    setSavingArt(true); setError(null)
    try {
      let blob
      if (variant === 'propria') {
        // Imagem própria: grava o RECORTE escolhido (zoom + ponto focal) no tamanho do formato — sem branding.
        if (!ownImg) throw new Error('Envie uma imagem para salvar como arte do post.')
        const [TW, TH] = postArtDims(fmt === 'stories' ? 'stories' : 'feed')
        const c = document.createElement('canvas'); c.width = TW; c.height = TH
        drawCroppedImage(c.getContext('2d'), ownImg, TW, TH, crop.scale, crop.fx, crop.fy)
        blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.92))
      } else {
        blob = await postArtBlob(artOpts)   // card branded (Tipográfico / Com foto)
      }
      const { url } = await uploadPostArt({ postId: post.id, blob, brandScope: scope, title: title || 'Arte do post' })
      pushVersion(url)
      if (variant === 'propria') { if (ownPreview) URL.revokeObjectURL(ownPreview); setOwnFile(null); setOwnPreview(''); setOwnImg(null); setImgWarn(null) }
      onSaved?.()
    } catch (e) { setError(e) } finally { setSavingArt(false) }
  }
  // Upload da FOTO do card branded ("Com foto"): vira o hero do cartão (precisa de URL pública).
  async function handleHeroFile(file) {
    setError(null); setUploadingImg(true)
    try {
      await validatePostImageFile(file)
      const r = await uploadMediaAsset({ brandScope: scope, file, kind: 'photo', title: `Foto · ${title || 'post'}`.slice(0, 80) })
      setPhotoUrl(r.url)
    } catch (e) { setError(e) } finally { setUploadingImg(false); if (heroInputRef.current) heroInputRef.current.value = '' }
  }
  // Imagem PRÓPRIA: valida + carrega para o cropper (preview com zoom/ponto focal). Commit só no "Salvar".
  async function handleOwnFile(file) {
    setError(null); setImgWarn(null)
    try {
      const { url, w, h, img } = await validatePostImageFile(file)
      if (ownPreview) URL.revokeObjectURL(ownPreview)
      setOwnFile(file); setOwnPreview(url); setOwnImg(img); setCrop({ scale: 1, fx: 0.5, fy: 0.5 })
      if (Math.min(w, h) < POST_IMG_MIN_PX) setImgWarn(`Resolução baixa (${w}×${h}). Para qualidade ideal use ≥ ${POST_IMG_MIN_PX}px no lado menor.`)
    } catch (e) { setError(e) } finally { if (ownInputRef.current) ownInputRef.current.value = '' }
  }
  function handleRemoveOwn() {
    if (ownPreview) URL.revokeObjectURL(ownPreview)
    setOwnFile(null); setOwnPreview(''); setOwnImg(null); setImgWarn(null); setError(null); setCrop({ scale: 1, fx: 0.5, fy: 0.5 })
  }
  // Arrastar para reposicionar (pan) o ponto focal do recorte.
  function onCropPointerDown(e) { dragRef.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  function onCropPointerMove(e) {
    if (!dragRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - dragRef.current.x) / rect.width
    const dy = (e.clientY - dragRef.current.y) / rect.height
    dragRef.current = { x: e.clientX, y: e.clientY }
    setCrop(c => ({ ...c, fx: Math.min(1, Math.max(0, c.fx - dx)), fy: Math.min(1, Math.max(0, c.fy - dy)) }))
  }
  function onCropPointerUp() { dragRef.current = null }
  async function handleRemoveActiveArt() {
    setError(null); setSavingArt(true)
    try { await setActivePostArt(post.id, null); setActiveArt(''); onSaved?.() }
    catch (e) { setError(e) } finally { setSavingArt(false) }
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
                  {[{ k: 'tipografico', label: 'Tipográfico' }, { k: 'foto', label: 'Com foto' }, { k: 'propria', label: 'Imagem própria' }].map(({ k, label }) => (
                    <button key={k} type="button" onClick={() => { setVariant(k); setError(null) }} className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${variant === k ? 'bg-gold-500/15 text-gold-200' : 'text-white/50 hover:text-white/80'}`}>{label}</button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                  {[{ k: 'feed', label: 'Feed 4:5' }, { k: 'stories', label: 'Story 9:16' }].map(({ k, label }) => (
                    <button key={k} type="button" onClick={() => setFmt(k)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${fmt === k ? 'bg-gold-500/15 text-gold-200' : 'text-white/50 hover:text-white/80'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            {variant === 'foto' && (
              <div className="mb-2 flex items-center gap-2">
                <input className="form-input !py-1.5 flex-1 text-xs" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL pública da foto (https://…/foto.jpg)" />
                <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroFile(f) }} />
                <button type="button" onClick={() => heroInputRef.current?.click()} disabled={uploadingImg} className="btn-ghost inline-flex shrink-0 items-center gap-1.5 !py-1.5 text-xs disabled:opacity-50">
                  {uploadingImg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}Enviar arquivo
                </button>
              </div>
            )}
            {/* Preview: canvas (branded) ou a imagem própria, no enquadramento do formato (feed/story) */}
            {variant === 'propria' ? (
              <div>
                <div className="relative mx-auto overflow-hidden rounded-lg border border-white/10 bg-black/30" style={{ aspectRatio: fmt === 'stories' ? '9 / 16' : '4 / 5', maxHeight: '42vh' }}>
                  {ownImg ? (
                    <canvas ref={cropCanvasRef}
                      onPointerDown={onCropPointerDown} onPointerMove={onCropPointerMove} onPointerUp={onCropPointerUp} onPointerLeave={onCropPointerUp}
                      className="h-full w-full cursor-move touch-none object-cover" />
                  ) : activeArt ? (
                    <img src={activeArt} alt="Arte atual do post" className="h-full w-full object-cover" />
                  ) : (
                    <button type="button" onClick={() => ownInputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40 transition hover:text-white/70">
                      <ImageIcon size={28} />
                      <span className="text-xs font-medium">Fazer upload de imagem</span>
                      <span className="text-[10px] text-white/30">JPG, PNG ou WebP · até 8 MB · ideal ≥ 1080px</span>
                    </button>
                  )}
                </div>
                {ownImg && (
                  <>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wide text-white/35">Zoom</span>
                      <input type="range" min="1" max="3" step="0.05" value={crop.scale} onChange={e => setCrop(c => ({ ...c, scale: Number(e.target.value) }))} className="flex-1 accent-gold-500" aria-label="Zoom da imagem" />
                      <button type="button" onClick={() => setCrop({ scale: 1, fx: 0.5, fy: 0.5 })} className="text-[11px] text-white/45 hover:text-white/75">centralizar</button>
                    </div>
                    <p className="mt-1 text-[10px] text-white/30">Arraste a imagem para reposicionar e use o zoom — o recorte respeita o formato ({fmt === 'stories' ? 'Story 9:16' : 'Feed 4:5'}).</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                <canvas ref={canvasRef} className="mx-auto block h-auto w-full max-h-[40vh] object-contain" />
              </div>
            )}
            <input ref={ownInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleOwnFile(f) }} />
            {imgWarn && <p className="mt-1.5 text-[11px] text-amber-300">⚠ {imgWarn}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {variant === 'propria' ? (
                <>
                  <button type="button" onClick={handleSaveArt} disabled={savingArt || !ownFile} className="btn-gold inline-flex items-center gap-2 !py-1.5 text-xs disabled:opacity-50" title={!ownFile ? 'Envie uma imagem primeiro' : ''}>
                    {savingArt ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar como arte
                  </button>
                  {(ownPreview || activeArt) && (
                    <button type="button" onClick={() => ownInputRef.current?.click()} className="btn-ghost inline-flex items-center gap-1.5 !py-1.5 text-xs"><ImageIcon size={14} />Substituir</button>
                  )}
                  {ownFile && <button type="button" onClick={handleRemoveOwn} className="text-[11px] text-white/40 hover:text-white/70">descartar envio</button>}
                  {activeArt && !ownFile && <button type="button" onClick={handleRemoveActiveArt} disabled={savingArt} className="text-[11px] text-red-300/80 hover:text-red-200 disabled:opacity-50">remover arte do post</button>}
                </>
              ) : (
                <>
                  <button type="button" onClick={handleSaveArt} disabled={savingArt} className="btn-gold inline-flex items-center gap-2 !py-1.5 text-xs disabled:opacity-50">
                    {savingArt ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar arte
                  </button>
                  <button type="button" onClick={handleDownload} className="btn-ghost inline-flex items-center gap-2 !py-1.5 text-xs"><Download size={14} />Baixar PNG</button>
                </>
              )}
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

// Agrupamento de anúncios Meta (groupMetaAds/groupMetaAdsByCampaign + AD_GROUP_LABEL) vive em
// lib/metaAds.js — puro e coberto por Vitest. Importado no topo.

// PublishMetaPanel vive em components/PublishMetaPanel.jsx — importado no topo.

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
  const [deletePresetTarget, setDeletePresetTarget] = useState(null)   // P0.1 — confirmação in-app
  const [deletingPreset, setDeletingPreset] = useState(false)
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

  async function confirmDeletePreset() {
    const p = deletePresetTarget
    if (!p) return
    setDeletingPreset(true); setError(null)
    try { await deleteMetaPreset(p.id); await loadPresets(); setDeletePresetTarget(null) }
    catch (e) { setError(e) } finally { setDeletingPreset(false) }
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
                    <button type="button" onClick={() => setDeletePresetTarget(p)} className="text-[10px] text-white/40 hover:text-red-300">excluir</button>
                  </div>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-white/45">{bpSummary(p.blueprint)}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-white/35">Use o preset como referência ao preencher o painel “Revisar e publicar” abaixo (build PAUSED).</p>
        </div>
      )}
      <ConfirmModal
        open={!!deletePresetTarget}
        onClose={() => setDeletePresetTarget(null)}
        onConfirm={confirmDeletePreset}
        loading={deletingPreset}
        title="Excluir preset"
        confirmLabel="Excluir preset"
        description={deletePresetTarget ? `Excluir o preset "${deletePresetTarget.name}"? Ele deixa de aparecer ao montar novas campanhas.` : ''}
      />
    </div>
  )
}

function TrafegoPagoSection({ brandProfile, campaign, assets, rendering, renderProgress, busyId, notice, onRender, onApproveGroup, onEditAd }) {
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
  // Gate ÚNICO de export (P0.5): só libera o pacote quando TODOS os anúncios passam no QA (renderizados +
  // lint ok + textos + destino) — antes exportava com `ads.length>0` (criativo não-validado vazava).
  const exportReady = ads.length > 0 && ads.every(ad => evaluateMetaAdReadiness(ad).qaReady)
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
          {/* CTA por ESTADO do funil (P1 UX): so o botao do passo atual fica dourado solido (primario);
              os outros ficam secundarios. render pendente -> Gerar · gerado -> Aprovar · tudo pronto ->
              Exportar. Evita 3 CTAs competindo com peso visual igual. */}
          <button
            onClick={onRender}
            disabled={rendering || pendingRender === 0}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${pendingRender > 0 ? 'bg-gold-500 text-[color:var(--surface-0)] hover:bg-gold-400' : 'border border-gold-500/45 bg-gold-500/12 text-gold-100 hover:bg-gold-500/20'}`}
          >
            {rendering ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {rendering ? (renderProgress?.total ? `Gerando… (${renderProgress.processed}/${renderProgress.total})` : 'Gerando…') : `Gerar cortes${pendingRender ? ` (${pendingRender})` : ''}`}
          </button>
          <button
            type="button"
            onClick={() => onApproveGroup(approvableAssets)}
            disabled={Boolean(busyId) || !approvableAssets.length}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${pendingRender === 0 && approvableAssets.length ? 'bg-gold-500 text-[color:var(--surface-0)] hover:bg-gold-400' : 'border border-gold-500/45 bg-gold-500/12 text-gold-100 hover:bg-gold-500/20'}`}
            title="Aprova de uma vez todos os cortes ja gerados desta campanha"
          >
            <CheckCircle2 size={16} />
            Aprovar todos{approvableAssets.length ? ` (${approvableAssets.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => downloadMetaAdsPackage(campaign, ads, brandProfile)}
            disabled={!exportReady}
            title={exportReady ? 'Baixa o JSON com os anúncios + URLs dos cortes' : 'Disponível quando todos os cortes estiverem renderizados e validados no QA (lint, textos e destino).'}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${pendingRender === 0 && !approvableAssets.length && exportReady ? 'bg-gold-500 text-[color:var(--surface-0)] hover:bg-gold-400' : 'border border-white/12 bg-white/[0.035] text-white/72 hover:border-gold-500/35 hover:text-white'}`}
          >
            <Download size={16} />
            Exportar pacote
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-gold-500/25 bg-gold-500/8 px-4 py-3 text-xs text-gold-100">{notice}</div>
      )}

      {/* P0.4 — progresso por corte: barra + contagem ao vivo enquanto renderiza (dados reais do onProgress). */}
      {rendering && renderProgress && renderProgress.total > 0 && (
        <div className="rounded-lg border border-gold-500/25 bg-gold-500/[0.06] px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-2xs font-medium text-gold-100">
            <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" />Gerando cortes…</span>
            <span className="tabular-nums text-white/60">{renderProgress.processed} de {renderProgress.total} · {renderProgress.rendered} gerado(s){renderProgress.failed ? ` · ${renderProgress.failed} com erro` : ''}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold-500 transition-all duration-300" style={{ width: `${Math.round((renderProgress.processed / renderProgress.total) * 100)}%` }} />
          </div>
        </div>
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
            rendering={rendering}
            onApprove={() => onApproveGroup(ad.assets)}
            onEdit={() => onEditAd(ad)}
          />
        ))}
      </div>
    </div>
  )
}

// Dica (tooltip) por check de QA + o que cada pendência significa — some legibilidade e vira ação (P1.5/P2.3).
// MetaAdCard (+ AdField + META_QA_HINTS) vive em components/MetaAdCard.jsx — importado no topo.

// AdEditModal (+ CTA_OPTIONS) vive em components/AdEditModal.jsx — importado no topo.

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

  // Migrado para o primitivo <Modal> (Onda 2): ganha foco-preso, Esc, scroll-lock, restauracao de foco e
  // role=dialog/aria-modal — que o overlay cru nao tinha. Estrutura preservada (o form, com seus botoes,
  // vira o corpo do modal). `open` fixo: o pai ja renderiza condicionalmente ({editingAsset && ...}).
  return (
    <Modal open onClose={onClose} title="Editar criativo" description={asset.title} size="md">
      <form onSubmit={submit} autoComplete="off" className="space-y-4">
        <Field label="Headline" labelClass={labelClass}>
          <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} className={inputClass} />
        </Field>
        <Field label="Copy" labelClass={labelClass}>
          <textarea value={form.copy} onChange={e => setForm(f => ({ ...f, copy: e.target.value }))} className={`${inputClass} min-h-24 resize-y`} />
        </Field>
        <Field label="CTA" labelClass={labelClass}>
          <input value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} className={inputClass} />
        </Field>
        <p className="text-2xs leading-5 text-white/40">
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
    </Modal>
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
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <div className="grid min-w-[600px] grid-cols-6 gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-2xs font-semibold uppercase tracking-[0.16em] text-white/42">
            <span>Fonte</span>
            <span>Plataforma</span>
            <span>Alcance</span>
            <span>Cliques</span>
            <span>Leads</span>
            <span>Coleta</span>
          </div>
          <div className="divide-y divide-white/10">
            {metrics.map(metric => (
              <div key={metric.id} className="grid min-w-[600px] grid-cols-6 gap-3 px-4 py-3 text-sm tabular-nums text-white/62">
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

// NewCampaignModal (+ BrandedSelect) vive em components/NewCampaignModal.jsx — importado no topo.

// Field (campo rotulado) vive em components/Field.jsx — importado no topo.
