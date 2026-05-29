import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  FileText,
  Gem,
  Layers3,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { supabaseConfig } from '../lib/supabase.js'
import {
  PREMIUM_TABLES,
  createPremiumCampaign,
  createManualPublication,
  loadPremiumWorkspace,
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
    try {
      const campaign = await createPremiumCampaign(form)
      setModalOpen(false)
      await refresh(campaign.id)
      setActiveTab('assets')
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
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
          <AssetsSection campaign={selectedCampaign} assets={scoped.assets} jobs={scoped.jobs} />
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

function AssetsSection({ campaign, assets, jobs }) {
  if (!campaign) return <EmptyState icon={Layers3} title="Nenhuma campanha selecionada" />
  if (!assets.length) return <EmptyState icon={Layers3} title="Sem assets para esta campanha" />

  const byType = groupCount(assets, 'asset_type')
  const latestJobs = jobs.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(byType).slice(0, 8).map(([type, count]) => (
          <div key={type} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{type.replace(/_/g, ' ')}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-gold-300">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="grid grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr] gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <span>Asset</span>
            <span>Canal</span>
            <span>Formato</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/10">
            {assets.map(asset => (
              <div key={asset.id} className="grid grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr] gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{asset.title}</p>
                  <p className="mt-1 truncate text-xs text-white/40">{asset.headline}</p>
                </div>
                <PlatformLabel value={asset.channel} />
                <span className="text-white/55">{asset.format}</span>
                <StatusPill value={asset.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Jobs</p>
            <Activity size={15} className="text-gold-400" />
          </div>
          {latestJobs.length ? (
            <div className="space-y-3">
              {latestJobs.map(job => (
                <div key={job.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-white">{job.job_type.replace(/_/g, ' ')}</p>
                    <StatusPill value={job.status} />
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${job.progress || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-white/42">Nenhum job criado para esta campanha.</p>
          )}
        </div>
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
