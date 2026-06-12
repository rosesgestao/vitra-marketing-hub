import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, BarChart3, Loader2, Plus, Radio, Repeat2, Target } from 'lucide-react'
import { createManualMetric, loadPremiumWorkspace } from '../lib/premiumData.js'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'

const INITIAL_METRIC = {
  publication_id: '',
  metric_date: new Date().toISOString().slice(0, 10),
  reach: '',
  impressions: '',
  engagement: '',
  likes: '',
  comments: '',
  shares: '',
  saves: '',
  link_clicks: '',
  profile_visits: '',
  follows: '',
  video_views: '',
  clicks: '',
  leads: '',
  spend: '',
  notes: '',
}

function formatNumber(value, options) {
  return Number(value || 0).toLocaleString('pt-BR', options)
}

function formatDate(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleDateString('pt-BR')
}

function MetricTile({ label, value, sub, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4 transition duration-200 hover:border-gold-500/30 hover:bg-white/[0.045]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
        <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-gold-400">
          <Icon size={14} />
        </span>
      </div>
      <p className="font-display text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-[#F4EFE3]">{value}</p>
      {sub && <p className="mt-2 text-xs leading-5 text-white/45">{sub}</p>}
      <span className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-9 rounded-full bg-gold-500 transition-all duration-200 group-hover:w-16" />
    </div>
  )
}

function PlatformLabel({ value }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium capitalize text-white/65">
      <span className="h-2 w-2 rounded-full bg-gold-400" />
      {String(value || 'canal').replace(/_/g, ' ')}
    </span>
  )
}

export default function Metricas() {
  const [workspace, setWorkspace] = useState({
    campaigns: [],
    assets: [],
    posts: [],
    publications: [],
    metrics: [],
    snapshots: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(INITIAL_METRIC)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await loadPremiumWorkspace()
      setWorkspace(data)
      setForm(current => ({
        ...current,
        publication_id: current.publication_id || data.publications[0]?.id || '',
      }))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const publicationById = useMemo(
    () => new Map(workspace.publications.map(publication => [publication.id, publication])),
    [workspace.publications],
  )

  const campaignById = useMemo(
    () => new Map(workspace.campaigns.map(campaign => [campaign.id, campaign])),
    [workspace.campaigns],
  )

  const totals = useMemo(() => {
    return workspace.metrics.reduce(
      (acc, metric) => {
        acc.reach += Number(metric.reach || 0)
        acc.impressions += Number(metric.impressions || 0)
        acc.engagement += Number(metric.engagement || 0)
        acc.clicks += Number(metric.link_clicks || metric.clicks || 0)
        acc.leads += Number(metric.leads || 0)
        acc.spend += Number(metric.spend || 0)
        return acc
      },
      { reach: 0, impressions: 0, engagement: 0, clicks: 0, leads: 0, spend: 0 },
    )
  }, [workspace.metrics])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const publication = publicationById.get(form.publication_id)
    setSaving(true)
    setError(null)
    try {
      await createManualMetric({ ...form, publication })
      setForm(current => ({
        ...INITIAL_METRIC,
        publication_id: current.publication_id,
        metric_date: new Date().toISOString().slice(0, 10),
      }))
      await refresh()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="premium-page">
        <PremiumPageHeader
          kicker="Performance Premium"
          title="Metricas por publicacao"
          subtitle="Carregando publicacoes e historico do modelo Premium."
        />
        <div className="flex min-h-72 items-center justify-center text-gold-300">
          <Loader2 size={20} className="mr-3 animate-spin" />
          <span className="text-sm font-medium">Carregando metricas Premium</span>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Performance Premium"
        title="Metricas por publicacao"
        subtitle="Leitura por post, asset e campanha usando somente `premium_publications` e `premium_metrics`."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-400/25 bg-red-950/25 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-300" />
            <div>
              <p className="text-sm font-semibold text-red-100">Falha na area de metricas Premium</p>
              <p className="mt-1 text-xs leading-5 text-red-100/70">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Alcance" value={formatNumber(totals.reach)} sub={`${workspace.metrics.length} coletas`} icon={Target} />
        <MetricTile label="Impressoes" value={formatNumber(totals.impressions)} sub={`${workspace.publications.length} publicacoes`} icon={Activity} />
        <MetricTile label="Engajamento" value={formatNumber(totals.engagement)} sub={`${formatNumber(totals.clicks)} cliques`} icon={Repeat2} />
        <MetricTile
          label="Investimento"
          value={formatNumber(totals.spend, { style: 'currency', currency: 'BRL' })}
          sub={`${formatNumber(totals.leads)} leads`}
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        <form onSubmit={submit} className="rounded-lg border border-gold-500/20 bg-[color:var(--surface-1)] p-5">
          <div className="mb-5 border-b border-white/10 pb-4">
            <p className="text-sm font-semibold text-white">Entrada manual</p>
            <p className="mt-1 text-xs leading-5 text-white/42">
              Use para registrar desempenho real antes da integracao Meta automatica.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="Publicacao">
              <select
                required
                value={form.publication_id}
                onChange={event => update('publication_id', event.target.value)}
                className="form-input"
              >
                <option value="">Selecione</option>
                {workspace.publications.map(publication => {
                  const campaign = campaignById.get(publication.campaign_id)
                  return (
                    <option key={publication.id} value={publication.id}>
                      {publication.platform} · {campaign?.name || publication.external_post_id || publication.id}
                    </option>
                  )
                })}
              </select>
            </Field>

            <Field label="Data da coleta">
              <input
                type="date"
                value={form.metric_date}
                onChange={event => update('metric_date', event.target.value)}
                className="form-input"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['reach', 'Alcance'],
                ['impressions', 'Impressoes'],
                ['engagement', 'Engajamento'],
                ['likes', 'Curtidas'],
                ['comments', 'Comentarios'],
                ['shares', 'Compartilhamentos'],
                ['saves', 'Salvos'],
                ['link_clicks', 'Cliques no link'],
                ['profile_visits', 'Visitas ao perfil'],
                ['follows', 'Novos seguidores'],
                ['video_views', 'Views de video'],
                ['leads', 'Leads'],
                ['spend', 'Investimento'],
              ].map(([field, label]) => (
                <Field key={field} label={label}>
                  <input
                    type="number"
                    min="0"
                    step={field === 'spend' ? '0.01' : '1'}
                    value={form[field]}
                    onChange={event => update(field, event.target.value)}
                    className="form-input"
                  />
                </Field>
              ))}
            </div>

            <Field label="Observacoes">
              <textarea
                value={form.notes}
                onChange={event => update('notes', event.target.value)}
                className="form-input min-h-20 resize-y"
              />
            </Field>

            <button
              type="submit"
              disabled={saving || !workspace.publications.length}
              className="btn-gold flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Registrar metricas
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
          <div className="grid grid-cols-[0.8fr,1.2fr,0.8fr,0.8fr,0.8fr,0.8fr] gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            <span>Canal</span>
            <span>Campanha</span>
            <span>Alcance</span>
            <span>Engajamento</span>
            <span>Leads</span>
            <span>Coleta</span>
          </div>

          {workspace.metrics.length ? (
            <div className="divide-y divide-white/10">
              {workspace.metrics.map(metric => {
                const publication = publicationById.get(metric.publication_id)
                const campaign = campaignById.get(metric.campaign_id || publication?.campaign_id)
                return (
                  <div key={metric.id} className="grid grid-cols-[0.8fr,1.2fr,0.8fr,0.8fr,0.8fr,0.8fr] gap-3 px-4 py-3 text-sm text-white/62">
                    <PlatformLabel value={metric.platform} />
                    <span className="truncate text-white/72">{campaign?.name || 'Campanha Premium'}</span>
                    <span>{formatNumber(metric.reach)}</span>
                    <span>{formatNumber(metric.engagement)}</span>
                    <span>{formatNumber(metric.leads)}</span>
                    <span>{formatDate(metric.metric_date || metric.collected_at)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <Radio size={24} className="mb-3 text-gold-500/55" />
              <p className="text-sm font-medium text-white">Nenhuma metrica Premium registrada</p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-white/42">
                Cadastre uma publicacao real/importada e registre a primeira coleta manual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">{label}</span>
      {children}
    </label>
  )
}
