import { useEffect, useMemo, useState } from 'react'
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
  ExternalLink,
  FileText,
  Gem,
  Image as ImageIcon,
  Images,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Wand2,
  X,
} from 'lucide-react'
import { supabaseConfig } from '../lib/supabase.js'
import {
  PREMIUM_TABLES,
  approveAsset,
  approveAssets,
  carouselLimit,
  createPremiumCampaign,
  createManualPublication,
  loadPremiumWorkspace,
  renderCampaignAssets,
  saveAssetEdit,
} from '../lib/premiumData.js'
import { PremiumHorizontalLogo } from '../components/PremiumBrand.jsx'

const INITIAL_FORM = {
  name: '',
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

const IMAGE_FIELDS = [
  { id: 'fachada', label: 'Fachada / principal', multiple: false },
  { id: 'living', label: 'Interior / living', multiple: false },
  { id: 'varanda', label: 'Varanda / vista', multiple: false },
  { id: 'infraestrutura', label: 'Infraestrutura / lazer', multiple: false },
  { id: 'extras', label: 'Imagens extras', multiple: true },
]

const TABS = [
  { id: 'campanhas', label: 'Campanhas', icon: Gem },
  { id: 'assets', label: 'Produção', icon: Layers3 },
  { id: 'publicacoes', label: 'Publicações', icon: Send },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
  { id: 'modelo', label: 'Modelo', icon: Database },
]

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
  meta_ads: '#8EC4F0',
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
    <div className="rounded-lg border border-white/10 bg-[#0B0B0C] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
        <Icon size={15} style={{ color: tone }} />
      </div>
      <p className="font-display text-3xl font-semibold leading-none" style={{ color: tone }}>
        {value}
      </p>
      {sub && <p className="mt-2 text-xs text-white/42">{sub}</p>}
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

export default function PremiumDashboard() {
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
  const [activeTab, setActiveTab] = useState('campanhas')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPublication, setSavingPublication] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [assetBusyId, setAssetBusyId] = useState(null)
  const [rendering, setRendering] = useState(false)
  const [notice, setNotice] = useState(null)

  async function refresh(selectCampaignId = selectedCampaignId) {
    setLoading(true)
    setError(null)
    try {
      const data = await loadPremiumWorkspace()
      setWorkspace(data)
      const nextSelected = selectCampaignId || data.campaigns[0]?.id || null
      setSelectedCampaignId(nextSelected)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh(null)
  }, [])

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

  async function handleCreateCampaign(form) {
    setSaving(true)
    setError(null)
    setNotice(null)
    let campaign
    try {
      campaign = await createPremiumCampaign(form)
    } catch (err) {
      setError(err)
      setSaving(false)
      return
    }
    setModalOpen(false)
    setSaving(false)
    await refresh(campaign.id)
    setActiveTab('assets')

    // Trigger automatico: renderiza os criativos da campanha recem-criada em lotes.
    setRendering(true)
    try {
      const result = await renderCampaignAssets(campaign.id, { batch: 5 })
      if (result.error && !result.rendered) throw result.error
      setNotice(`Campanha criada. ${result.rendered} criativo(s) gerado(s) automaticamente${result.failed ? `, ${result.failed} com erro` : ''}.`)
    } catch (renderErr) {
      setNotice('Campanha criada, mas a renderização automática não concluiu. Use “Gerar criativos” para retomar (o progresso é salvo por peça).')
    } finally {
      setRendering(false)
      await refresh(campaign.id)
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

  async function handleRenderCampaign() {
    if (!selectedCampaign) return
    setRendering(true)
    setError(null)
    setNotice(null)
    try {
      const result = await renderCampaignAssets(selectedCampaign.id)
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
      <div className="relative overflow-hidden border-b border-gold-500/15 bg-[#050505]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_0%,rgba(196,148,42,0.12),transparent_24rem)]" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-7 lg:px-8">
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <PremiumHorizontalLogo className="mb-7" />
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-10 bg-gold-500/70" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-gold-400">
                  Operacao de alto padrao
                </p>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                Central de curadoria e campanhas
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/52">
                Campanhas, assets, publicacoes e metricas reais conectados ao Supabase da Vitra Premium.
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
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/10 px-4 py-2 text-sm font-semibold text-gold-200 transition hover:bg-gold-500/20"
              >
                <Plus size={16} />
                Nova campanha
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <StatTile label="Campanhas" value={totals.campaigns} sub="no modelo Premium" icon={Briefcase} />
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
                  {missingSchema ? 'Schema Premium ainda não aplicado' : 'Falha ao carregar a área Premium'}
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

        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition"
                style={{
                  color: active ? '#D4A84A' : 'rgba(255,255,255,0.52)',
                  borderColor: active ? '#C4942A' : 'transparent',
                  background: active ? 'rgba(196,148,42,0.07)' : 'transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-3 text-gold-300">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Carregando base Premium</span>
            </div>
          </div>
        )}

        {!loading && activeTab === 'campanhas' && (
          <CampaignsSection
            campaigns={workspace.campaigns}
            selectedCampaign={selectedCampaign}
            selectedCampaignId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
            onCreate={() => setModalOpen(true)}
            assets={workspace.assets}
            posts={workspace.posts}
            publications={workspace.publications}
          />
        )}

        {!loading && activeTab === 'assets' && (
          <AssetsSection
            campaign={selectedCampaign}
            assets={scoped.assets}
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

        {!loading && activeTab === 'publicacoes' && (
          <PublicationsSection
            campaign={selectedCampaign}
            posts={scoped.posts}
            publications={scoped.publications}
            assets={scoped.assets}
            saving={savingPublication}
            onCreatePublication={handleCreatePublication}
          />
        )}

        {!loading && activeTab === 'metricas' && (
          <MetricsSection campaign={selectedCampaign} publications={scoped.publications} metrics={scoped.metrics} totals={totals} snapshots={workspace.snapshots} />
        )}

        {!loading && activeTab === 'modelo' && (
          <DataModelSection accounts={workspace.accounts} />
        )}
      </div>

      {modalOpen && (
        <NewCampaignModal
          saving={saving}
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
    </div>
  )
}

function CampaignsSection({ campaigns, selectedCampaign, selectedCampaignId, onSelect, onCreate, assets, posts, publications }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        icon={Gem}
        title="Nenhuma campanha Premium cadastrada"
        note="A primeira campanha cria o registro principal, a matriz inicial de assets e os conteúdos planejados."
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
            <button
              key={campaign.id}
              onClick={() => onSelect(campaign.id)}
              className="w-full rounded-lg border p-4 text-left transition"
              style={{
                borderColor: active ? 'rgba(196,148,42,0.55)' : 'rgba(255,255,255,0.10)',
                background: active ? 'rgba(196,148,42,0.08)' : 'rgba(255,255,255,0.025)',
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold leading-tight text-white">{campaign.name}</p>
                  <p className="mt-1 text-xs text-white/42">{campaign.product_name || campaign.property_type || 'Campanha Premium'}</p>
                </div>
                <StatusPill value={campaign.status} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/45">
                <span>{campaignAssets} assets</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{campaignPosts} conteúdos</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{formatDate(campaign.start_date)}</span>
              </div>
            </button>
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
  desktop: '1200×630',
}

const ASPECT_CSS = {
  '1:1': '1 / 1',
  '9:16': '9 / 16',
  '4:5': '4 / 5',
  '16:9': '16 / 9',
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

function AssetsSection({ campaign, assets, jobs, rendering, busyId, notice, onRender, onApprove, onApproveGroup, onEdit }) {
  const [filter, setFilter] = useState('all')

  if (!campaign) return <EmptyState icon={Layers3} title="Nenhuma campanha selecionada" />
  if (!assets.length) return <EmptyState icon={Layers3} title="Sem assets para esta campanha" />

  const total = assets.length
  const queued = assets.filter(a => a.status === 'queued').length
  const generated = assets.filter(a => a.status === 'generated').length
  const approved = assets.filter(a => a.status === 'approved').length
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
          disabled={rendering || queued === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/12 px-4 py-2.5 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          title={queued === 0 ? 'Nenhum asset pendente de renderização' : 'Gerar criativos dos assets pendentes'}
        >
          {rendering ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {rendering ? 'Gerando…' : `Gerar criativos${queued ? ` (${queued})` : ''}`}
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-gold-500/25 bg-gold-500/8 px-4 py-3 text-xs text-gold-100">
          {notice}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Total assets" value={total} sub="na campanha" icon={Layers3} />
        <StatTile label="Pendentes" value={queued} sub="aguardando render" icon={Clock} tone="#E4C06E" />
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

function AssetGrid({ items, campaign, busyId, onApprove, onApproveGroup, onEdit }) {
  const renderItem = item =>
    item.kind === 'carousel' ? (
      <CarouselCard
        key={`carousel-${item.key}`}
        slides={item.slides}
        campaign={campaign}
        busy={item.slides.some(s => s.id === busyId)}
        onApprove={() => onApproveGroup(item.slides)}
        onEdit={onEdit}
      />
    ) : (
      <AssetCard
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

function AssetCard({ asset, campaign, busy, onApprove, onEdit }) {
  const aspect = ASPECT_CSS[asset.aspect_ratio] || '4 / 5'
  const dimension = DIMENSION_LABEL[asset.aspect_ratio]
  const channelTag = CHANNEL_TAG[asset.channel] || (asset.channel || '').toUpperCase()
  const kicker = campaign?.brief?.product_data?.tagline || campaign?.product_name || 'VITRA PREMIUM'
  const approved = asset.status === 'approved'
  const nonVisual = NON_VISUAL.has(asset.channel)
  const hasImage = Boolean(asset.public_url)
  const phase = asset.metadata?.campaign_phase

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0C] transition hover:border-gold-500/30">
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: aspect }}>
        {hasImage ? (
          <img src={asset.public_url} alt={asset.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-5"
            style={{ background: 'linear-gradient(160deg,#0B0B0C 0%,#050505 55%,#000 100%)' }}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70">Vitra Premium</span>
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
              disabled={busy || approved}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed"
              style={{
                background: approved ? 'rgba(196,148,42,0.12)' : 'rgba(29,158,117,0.18)',
                color: approved ? '#F0C95C' : '#6ee7b7',
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

function CarouselCard({ slides, campaign, busy, onApprove, onEdit }) {
  const [idx, setIdx] = useState(0)
  const count = slides.length
  const safeIdx = Math.min(idx, count - 1)
  const current = slides[safeIdx]
  const channel = slides[0]?.channel || 'instagram'
  const limit = carouselLimit(channel)
  const valid = count >= limit.min && count <= limit.max
  const allApproved = slides.every(s => s.status === 'approved')
  const kicker = campaign?.brief?.product_data?.tagline || campaign?.product_name || 'VITRA PREMIUM'
  const limitLabel = channel === 'meta_ads' ? 'Meta Ads · 2–10' : 'Instagram · 2–20'
  const phase = (slides.find(s => s.format === 'carousel_cover') || slides[0])?.metadata?.campaign_phase

  function go(delta) {
    setIdx(prev => {
      const next = (prev + delta + count) % count
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gold-500/25 bg-[#0B0B0C] transition hover:border-gold-500/40">
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '4 / 5' }}>
        {current?.public_url ? (
          <img src={current.public_url} alt={current.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-5" style={{ background: 'linear-gradient(160deg,#0B0B0C 0%,#050505 55%,#000 100%)' }}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70">Vitra Premium</span>
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
              background: allApproved ? 'rgba(196,148,42,0.12)' : valid ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.05)',
              color: allApproved ? '#F0C95C' : valid ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
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
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-white/15 bg-[#101010] shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Editar criativo</h2>
            <p className="mt-0.5 text-xs text-white/45">{asset.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:text-white" title="Fechar">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
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
      <form onSubmit={submit} className="rounded-lg border border-gold-500/20 bg-[#101010] p-4">
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
        <StatTile label="Impressões" value={formatNumber(totals.impressions)} sub={`${metrics.length} coletas`} icon={Activity} tone="#8EC4F0" />
        <StatTile label="Leads" value={formatNumber(totals.leads)} sub="Ads Insights" icon={Sparkles} tone="#D4A84A" />
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

function DataModelSection({ accounts }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
      <div className="rounded-lg border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-sm font-semibold text-white">Modelo Supabase Premium</p>
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
          <p className="text-sm font-semibold text-white">Contas Vitra Premium</p>
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

function NewCampaignModal({ saving, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM)

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function updateImage(field, files) {
    setForm(current => ({
      ...current,
      images: {
        ...current.images,
        [field]: field === 'extras' ? Array.from(files || []) : files?.[0] || null,
      },
    }))
  }

  function submit(event) {
    event.preventDefault()
    onSubmit(form)
  }

  const inputClass = 'w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-white/25 transition focus:border-gold-500/55'
  const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42'
  const sectionTitleClass = 'border-b border-white/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg border border-white/15 bg-[#101010] shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Nova Campanha</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:border-gold-500/35 hover:text-white"
            title="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="flex max-h-[calc(92vh-76px)] flex-col">
          <div className="space-y-7 overflow-y-auto px-6 py-6">
            <section className="space-y-4">
              <p className={sectionTitleClass}>Dados do Produto</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do Produto" labelClass={labelClass}>
                  <input
                    required
                    value={form.product_name}
                    onChange={event => update('product_name', event.target.value)}
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

            <section className="space-y-4">
              <p className={sectionTitleClass}>Upload de Imagens</p>
              <div className="grid gap-3 md:grid-cols-2">
                {IMAGE_FIELDS.map(field => {
                  const value = form.images[field.id]
                  const count = field.multiple ? value.length : value ? 1 : 0
                  const emptyLabel = field.multiple ? '+ Upload (múltiplas)' : '+ Upload'
                  return (
                    <label
                      key={field.id}
                      className="cursor-pointer rounded-lg border border-dashed border-gold-500/25 bg-gold-500/5 p-4 transition hover:border-gold-500/50 hover:bg-gold-500/10"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">{field.label}</span>
                      <span className="mt-3 block text-center text-xs font-semibold text-gold-400">
                        {count ? `${count} arquivo${count > 1 ? 's' : ''}` : emptyLabel}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple={field.multiple}
                        onChange={event => updateImage(field.id, event.target.files)}
                        className="sr-only"
                      />
                    </label>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-[#181818] px-6 py-5 sm:flex-row sm:justify-end">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/45 bg-gold-500/15 px-4 py-2.5 text-sm font-semibold text-gold-100 transition hover:bg-gold-500/20 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Criar Campanha
            </button>
          </div>
        </form>
      </div>
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
