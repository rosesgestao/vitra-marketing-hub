import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Plus, Radio, RefreshCw, Repeat2, Target } from 'lucide-react'
import { createManualMetric, loadPremiumWorkspace, syncMetricsFromMeta } from '../lib/premiumData.js'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { FormField, Segmented, StatTile, DataTable, Button, LoadingState, ErrorAlert, EmptyState } from '../components/ui/index.js'
import VitraSelect from '../components/VitraSelect.jsx'

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

// Corte Orgânico x Pago: derivado do tipo da publicacao ligada a metrica. 'paid'/'dark_post' = pago;
// 'organic'/'manual'/demais = organico. Mantem a separacao de mundos (presenca x demanda ativa).
function segmentOfType(type) {
  return type === 'paid' || type === 'dark_post' ? 'pago' : 'organico'
}
const SEGMENTS = [
  { key: 'todos', label: 'Todos' },
  { key: 'organico', label: 'Orgânico' },
  { key: 'pago', label: 'Pago' },
]

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
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [segment, setSegment] = useState('todos')

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

  const filteredMetrics = useMemo(() => {
    if (segment === 'todos') return workspace.metrics
    return workspace.metrics.filter(m => segmentOfType(publicationById.get(m.publication_id)?.publication_type) === segment)
  }, [workspace.metrics, segment, publicationById])

  const totals = useMemo(() => {
    return filteredMetrics.reduce(
      (acc, metric) => {
        acc.reach += Number(metric.reach || 0)
        acc.impressions += Number(metric.impressions || 0)
        acc.engagement += Number(metric.engagement || 0)
        acc.clicks += Number(metric.link_clicks || metric.clicks || 0)
        acc.leads += Number(metric.leads || 0)
        acc.spend += Number(metric.spend || 0)
        acc.likes += Number(metric.likes || 0)
        acc.comments += Number(metric.comments || 0)
        acc.shares += Number(metric.shares || 0)
        acc.saves += Number(metric.saves || 0)
        acc.follows += Number(metric.follows || 0)
        return acc
      },
      { reach: 0, impressions: 0, engagement: 0, clicks: 0, leads: 0, spend: 0, likes: 0, comments: 0, shares: 0, saves: 0, follows: 0 },
    )
  }, [filteredMetrics])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  // Sync de metricas da Meta (read-only). Sem dados (campanha pausada/sem entrega) volta gracioso.
  async function handleSync() {
    setSyncing(true); setError(null); setSyncMsg(null)
    try {
      const r = await syncMetricsFromMeta()
      setSyncMsg(r?.message || `Sincronizadas ${r?.rows || 0} linha(s) de metricas.`)
      await refresh()
    } catch (err) {
      setError(err)
    } finally {
      setSyncing(false)
    }
  }

  const syncButton = (
    <Button
      variant="ghost"
      icon={RefreshCw}
      loading={syncing}
      onClick={handleSync}
      title="Puxa alcance, gasto, cliques e leads da Meta para as publicacoes pagas (read-only)"
    >
      {syncing ? 'Sincronizando…' : 'Sincronizar agora (Meta)'}
    </Button>
  )

  async function submit(event) {
    event.preventDefault()
    if (!form.publication_id) { setError(new Error('Selecione uma publicação.')); return }
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
        <LoadingState full label="Carregando métricas Premium" />
      </div>
    )
  }

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Performance Premium"
        title="Metricas por publicacao"
        subtitle="Leitura por post, asset e campanha — entrada manual ou sync direto da Meta."
        actions={syncButton}
      />

      {syncMsg && (
        <div className="mb-6 rounded-lg border border-gold-500/25 bg-gold-500/8 px-4 py-3 text-xs text-gold-100">{syncMsg}</div>
      )}

      {error && <ErrorAlert message={error.message} onRetry={refresh} className="mb-6" />}

      <Segmented
        className="mb-4"
        ariaLabel="Segmento das métricas"
        value={segment}
        onChange={setSegment}
        options={SEGMENTS.map(s => ({ value: s.key, label: s.label }))}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {segment === 'pago' ? (
          <>
            <StatTile label="Alcance" value={formatNumber(totals.reach)} sub={`${filteredMetrics.length} coletas`} icon={Target} />
            <StatTile label="Cliques" value={formatNumber(totals.clicks)} sub="no link" icon={Repeat2} />
            <StatTile label="Leads" value={formatNumber(totals.leads)} sub="capturados" icon={Activity} />
            <StatTile label="Investimento" value={formatNumber(totals.spend, { style: 'currency', currency: 'BRL' })} sub={totals.leads ? `CPL ${formatNumber(totals.spend / totals.leads, { style: 'currency', currency: 'BRL' })}` : 'sem leads'} icon={BarChart3} />
          </>
        ) : segment === 'organico' ? (
          <>
            <StatTile label="Alcance" value={formatNumber(totals.reach)} sub={`${filteredMetrics.length} coletas`} icon={Target} />
            <StatTile label="Engajamento" value={formatNumber(totals.engagement)} sub={`${formatNumber(totals.likes + totals.comments + totals.shares)} interações`} icon={Repeat2} />
            <StatTile label="Salvos" value={formatNumber(totals.saves)} sub={`${formatNumber(totals.shares)} compart.`} icon={Activity} />
            <StatTile label="Novos seguidores" value={formatNumber(totals.follows)} sub="no período" icon={BarChart3} />
          </>
        ) : (
          <>
            <StatTile label="Alcance" value={formatNumber(totals.reach)} sub={`${filteredMetrics.length} coletas`} icon={Target} />
            <StatTile label="Impressoes" value={formatNumber(totals.impressions)} sub={`${workspace.publications.length} publicacoes`} icon={Activity} />
            <StatTile label="Engajamento" value={formatNumber(totals.engagement)} sub={`${formatNumber(totals.clicks)} cliques`} icon={Repeat2} />
            <StatTile label="Investimento" value={formatNumber(totals.spend, { style: 'currency', currency: 'BRL' })} sub={`${formatNumber(totals.leads)} leads`} icon={BarChart3} />
          </>
        )}
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
              <VitraSelect
                value={form.publication_id}
                onChange={v => update('publication_id', v)}
                placeholder="Selecione"
                ariaLabel="Publicação"
                options={workspace.publications.map(publication => {
                  const campaign = campaignById.get(publication.campaign_id)
                  return { value: publication.id, label: `${publication.platform} · ${campaign?.name || publication.external_post_id || publication.id}` }
                })}
              />
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

            <Button type="submit" variant="gold" icon={Plus} loading={saving} disabled={!workspace.publications.length} className="w-full">
              Registrar métricas
            </Button>
          </div>
        </form>

        <DataTable
          className="bg-white/[0.025]"
          rows={filteredMetrics}
          rowKey={m => m.id}
          columns={[
            { key: 'canal', label: 'Canal', width: '0.8fr' },
            { key: 'campanha', label: 'Campanha', width: '1.2fr' },
            { key: 'alcance', label: 'Alcance', width: '0.8fr' },
            { key: 'engajamento', label: 'Engajamento', width: '0.8fr' },
            { key: 'leads', label: 'Leads', width: '0.8fr' },
            { key: 'coleta', label: 'Coleta', width: '0.8fr' },
          ]}
          renderCell={(metric, col) => {
            const publication = publicationById.get(metric.publication_id)
            const campaign = campaignById.get(metric.campaign_id || publication?.campaign_id)
            switch (col.key) {
              case 'canal': return <PlatformLabel value={metric.platform} />
              case 'campanha': return campaign?.name || 'Campanha Premium'
              case 'alcance': return formatNumber(metric.reach)
              case 'engajamento': return formatNumber(metric.engagement)
              case 'leads': return formatNumber(metric.leads)
              case 'coleta': return formatDate(metric.metric_date || metric.collected_at)
              default: return null
            }
          }}
          empty={
            <EmptyState
              icon={Radio}
              title="Nenhuma métrica Premium registrada"
              description="Cadastre uma publicação real/importada e registre a primeira coleta manual."
            />
          }
        />
      </div>
    </div>
  )
}

// Delega ao primitivo FormField (Vitra UI): associa o <label> ao controle (htmlFor/id) e abre espaço
// para hint/erro. Os call sites seguem <Field label="...">…</Field> — só a implementação mudou.
function Field({ label, children }) {
  return <FormField label={label}>{children}</FormField>
}
