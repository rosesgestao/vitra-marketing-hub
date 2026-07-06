import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Megaphone, LayoutGrid, Wand2, CalendarDays, BarChart3, ArrowRight, ArrowUpRight,
  Building2, Gem, Layers, Images, Bot, Clock, CheckCircle2, AlertTriangle, Sparkles, Layout,
} from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { Button, Badge, EmptyState, ErrorAlert } from '../components/ui/index.js'
import StatTile from '../components/ui/StatTile.jsx'
import { supabase } from '../lib/supabase.js'
import { BRAND_SCOPES, getBrandProfile } from '../lib/brandProfiles.js'
import { loadPremiumWorkspace, isRenderablePendingAsset } from '../lib/premiumData.js'
import { selectableCreativeTemplatesForBrand } from '../lib/creativeTemplateCatalog.js'

// PAGINA INICIAL do dashboard (view 'inicio', hash #/inicio). Central de visao geral da operacao no
// contexto da MARCA-MAE (Vitra Imobiliaria) — consistente com a convencao de que telas transversais
// caem na marca-mae. Le SO dados reais (loadPremiumWorkspace) e degrada para estados vazios uteis
// quando nao ha dado. Nao altera auth, permissoes, schema nem outras telas — apenas navega para elas.
const SCOPE = BRAND_SCOPES.imobiliaria

// Acoes rapidas: destino = viewId ja existente (navegacao por hash do App). Uma CTA primaria (Nova
// campanha), as demais secundarias — hierarquia clara (regra primary-action do ui-ux-pro-max).
const QUICK_ACTIONS = [
  { id: 'nova', label: 'Nova campanha', desc: 'Brief, criativos e esteira', icon: Plus, to: 'imobiliaria-trafego', primary: true },
  { id: 'trafego', label: 'Tráfego Pago', desc: 'Gerar, revisar e publicar', icon: Megaphone, to: 'imobiliaria-trafego' },
  { id: 'catalogo', label: 'Catálogo de Templates', desc: 'Modelos aprovados', icon: LayoutGrid, to: 'criativos:novo' },
  { id: 'criativos', label: 'Novo criativo', desc: 'Estúdio de Criativos', icon: Wand2, to: 'criativos:novo' },
  { id: 'calendario', label: 'Calendário', desc: 'Agenda de publicações', icon: CalendarDays, to: 'calendario' },
  { id: 'metricas', label: 'Métricas', desc: 'Alcance, leads e verba', icon: BarChart3, to: 'metricas' },
]

// Atalhos para todos os modulos (launchpad) — inclui os paineis das DUAS marcas (Premium a 1 clique),
// sem carregar/misturar os dados da Premium (separacao de marca preservada).
const MODULES = [
  { label: 'Conteúdo Imobiliária', icon: Building2, to: 'imobiliaria' },
  { label: 'Tráfego Imobiliária', icon: Megaphone, to: 'imobiliaria-trafego' },
  { label: 'Conteúdo Premium', icon: Gem, to: 'premium' },
  { label: 'Tráfego Premium', icon: Megaphone, to: 'premium-trafego' },
  { label: 'Conteúdos (quadro)', icon: Layers, to: 'kanban' },
  { label: 'Calendário', icon: CalendarDays, to: 'calendario' },
  { label: 'Biblioteca', icon: Images, to: 'biblioteca' },
  { label: 'Estúdio de Peças', icon: Layout, to: 'pecas:overview' },
  { label: 'Agentes', icon: Bot, to: 'agentes' },
  { label: 'Métricas', icon: BarChart3, to: 'metricas' },
]

function greetingForHour(date) {
  const h = date.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(session) {
  const full = session?.user?.user_metadata?.full_name
  if (full && full.trim()) return full.trim().split(/\s+/)[0]
  const email = session?.user?.email
  if (email) return email.split('@')[0]
  return null
}

function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const days = Math.floor((Date.now() - then) / 86400000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  return months <= 1 ? 'há 1 mês' : `há ${months} meses`
}

function campaignStatusBadge(campaign) {
  const raw = String(campaign?.status || '').toUpperCase()
  if (raw === 'ACTIVE') return { label: 'Ativa', tone: 'success' }
  if (raw === 'PAUSED') return { label: 'Pausada', tone: 'warning' }
  if (raw === 'ARCHIVED') return { label: 'Arquivada', tone: 'neutral' }
  return { label: 'Rascunho', tone: 'neutral' }
}

export default function Inicio({ onNavigate }) {
  const brandProfile = getBrandProfile(SCOPE)
  const [name, setName] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Nome do usuario logado para a saudacao (sessao Supabase ja persistida pelo AuthGate).
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setName(firstName(data?.session))
    }).catch(() => {})
    return () => { active = false }
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await loadPremiumWorkspace({ brandScope: SCOPE })
      setWorkspace(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const templates = selectableCreativeTemplatesForBrand(SCOPE).length
    if (!workspace) return { campaigns: 0, generated: 0, awaitingReview: 0, pendingRender: 0, templates, recent: [], alerts: [], hasMetrics: false }

    const { campaigns = [], assets = [], metrics = [] } = workspace
    const assetsByCampaign = new Map()
    for (const asset of assets) {
      const list = assetsByCampaign.get(asset.campaign_id) || []
      list.push(asset)
      assetsByCampaign.set(asset.campaign_id, list)
    }

    const generated = assets.filter(a => Boolean(a.public_url) && ['generated', 'approved'].includes(a.status)).length
    const awaitingReview = assets.filter(a => a.status === 'generated').length
    const pendingRender = assets.filter(a => isRenderablePendingAsset(a)).length
    const campaignsNoApproved = campaigns.filter(c => !(assetsByCampaign.get(c.id) || []).some(a => a.status === 'approved')).length

    const recent = campaigns.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name || c.product_name || brandProfile.campaignFallback,
      when: timeAgo(c.updated_at || c.created_at),
      creatives: (assetsByCampaign.get(c.id) || []).length,
      status: campaignStatusBadge(c),
    }))

    const alerts = []
    if (awaitingReview > 0) alerts.push({ id: 'review', icon: Clock, tone: 'warning', text: `${awaitingReview} criativo(s) aguardando aprovação`, to: 'imobiliaria-trafego', cta: 'Revisar' })
    if (pendingRender > 0) alerts.push({ id: 'render', icon: Sparkles, tone: 'warning', text: `${pendingRender} criativo(s) aguardando geração`, to: 'imobiliaria-trafego', cta: 'Gerar' })
    if (campaigns.length > 0 && campaignsNoApproved > 0) alerts.push({ id: 'noapproved', icon: AlertTriangle, tone: 'warning', text: `${campaignsNoApproved} campanha(s) sem criativo aprovado`, to: 'imobiliaria-trafego', cta: 'Abrir' })

    return { campaigns: campaigns.length, generated, awaitingReview, pendingRender, templates, recent, alerts, hasMetrics: metrics.length > 0 }
  }, [workspace, brandProfile.campaignFallback])

  const nextSteps = useMemo(() => {
    if (!workspace) return []
    const steps = []
    if (stats.campaigns === 0) {
      steps.push('Crie sua primeira campanha para gerar o brief, a matriz de criativos e a esteira de tráfego pago.')
      steps.push('Explore o Catálogo de Templates para conhecer os modelos aprovados da marca.')
      return steps
    }
    if (stats.pendingRender > 0) steps.push(`Gere ${stats.pendingRender} criativo(s) pendentes a partir das fotos enviadas.`)
    if (stats.awaitingReview > 0) steps.push(`Revise e aprove ${stats.awaitingReview} criativo(s) já gerados.`)
    if (!stats.hasMetrics) steps.push('Sincronize as métricas da Meta em Métricas para acompanhar alcance, leads e investimento.')
    if (steps.length === 0) steps.push('Operação em dia — planeje conteúdo no Calendário ou inicie uma nova campanha.')
    return steps
  }, [workspace, stats])

  const go = to => () => onNavigate?.(to)
  const now = new Date()
  const dateLabel = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const greeting = name ? `${greetingForHour(now)}, ${name}` : `${greetingForHour(now)}`

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker={`Central de operação · ${brandProfile.name}`}
        title={greeting}
        subtitle={`Visão geral da operação · ${dateLabel}`}
        actions={
          <Button variant="gold" icon={Plus} onClick={go('imobiliaria-trafego')}>
            Nova campanha
          </Button>
        }
      />

      {error ? (
        <ErrorAlert message={error.message || 'Não foi possível carregar a visão geral.'} onRetry={load} className="mb-6" />
      ) : null}

      {/* 2 — Indicadores principais (dados reais) */}
      {loading ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[118px] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Campanhas" value={stats.campaigns} sub="no total" icon={Building2} />
          <StatTile label="Criativos gerados" value={stats.generated} sub="prontos para uso" icon={Images} />
          <StatTile
            label="Aguardando revisão"
            value={stats.awaitingReview}
            sub={stats.awaitingReview > 0 ? 'precisam de aprovação' : 'nada pendente'}
            icon={Clock}
            tone={stats.awaitingReview > 0 ? '#E4C06E' : '#C4942A'}
          />
          <StatTile label="Templates" value={stats.templates} sub="modelos disponíveis" icon={LayoutGrid} />
        </div>
      )}

      {/* 3 — Ações rápidas */}
      <section aria-labelledby="inicio-acoes" className="mb-8">
        <h2 id="inicio-acoes" className="mb-3 text-2xs font-semibold uppercase tracking-[0.2em] text-white/45">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                type="button"
                onClick={go(action.to)}
                className={`group flex min-h-[92px] flex-col justify-between rounded-xl border p-3.5 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 ${
                  action.primary
                    ? 'border-gold-500/40 bg-gold-500/[0.08] hover:border-gold-500/60 hover:bg-gold-500/[0.12]'
                    : 'border-white/10 bg-[color:var(--surface-1)] hover:border-gold-500/30 hover:bg-white/[0.045]'
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-md border ${action.primary ? 'border-gold-500/40 bg-gold-500/15 text-gold-200' : 'border-white/10 bg-white/[0.03] text-gold-300'}`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="mt-2.5">
                  <span className="block text-sm font-semibold text-white">{action.label}</span>
                  <span className="mt-0.5 block text-2xs leading-4 text-white/45">{action.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 4 + 5 — Campanhas recentes (esq.) · Status operacional (dir.) */}
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="inicio-campanhas" className="rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="inicio-campanhas" className="text-sm font-semibold text-white">Campanhas recentes</h2>
            {stats.recent.length > 0 && (
              <button type="button" onClick={go('imobiliaria-trafego')} className="inline-flex items-center gap-1 rounded text-xs font-medium text-gold-300 transition hover:text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50">
                Ver todas <ArrowRight size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />)}
            </div>
          ) : stats.recent.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhuma campanha ainda"
              description={brandProfile.emptyCampaignNote}
              action={<Button variant="gold" size="sm" icon={Plus} onClick={go('imobiliaria-trafego')}>Criar primeira campanha</Button>}
            />
          ) : (
            <ul className="space-y-2">
              {stats.recent.map(campaign => (
                <li key={campaign.id}>
                  <button
                    type="button"
                    onClick={go('imobiliaria-trafego')}
                    className="group flex w-full items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3.5 py-3 text-left transition duration-200 hover:border-gold-500/25 hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{campaign.name}</p>
                      <p className="mt-0.5 text-2xs text-white/45">
                        {campaign.creatives} criativo(s){campaign.when ? ` · atualizada ${campaign.when}` : ''}
                      </p>
                    </div>
                    <Badge tone={campaign.status.tone}>{campaign.status.label}</Badge>
                    <ArrowUpRight size={15} className="flex-shrink-0 text-white/30 transition group-hover:text-gold-300" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="inicio-status" className="rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-5">
          <h2 id="inicio-status" className="mb-4 text-sm font-semibold text-white">Status da operação</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />)}
            </div>
          ) : stats.alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-8 text-center">
              <CheckCircle2 size={24} className="mb-2 text-emerald-300" aria-hidden="true" />
              <p className="text-sm font-semibold text-white/85">Operação em dia</p>
              <p className="mt-1 text-xs text-white/45">Nenhuma pendência de criativo ou campanha.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {stats.alerts.map(alert => {
                const Icon = alert.icon
                return (
                  <li key={alert.id}>
                    <button
                      type="button"
                      onClick={go(alert.to)}
                      className="flex w-full items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-3.5 py-3 text-left transition hover:border-amber-400/40 hover:bg-amber-500/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
                    >
                      <Icon size={16} className="flex-shrink-0 text-amber-300" aria-hidden="true" />
                      <span className="min-w-0 flex-1 text-sm text-white/85">{alert.text}</span>
                      <span className="flex-shrink-0 text-xs font-semibold text-amber-200">{alert.cta}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* 6 — Módulos (launchpad) */}
      <section aria-labelledby="inicio-modulos" className="mb-8">
        <h2 id="inicio-modulos" className="mb-3 text-2xs font-semibold uppercase tracking-[0.2em] text-white/45">Módulos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MODULES.map(module => {
            const Icon = module.icon
            return (
              <button
                key={module.label}
                type="button"
                onClick={go(module.to)}
                className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-[color:var(--surface-1)] px-3.5 py-3 text-left transition duration-200 hover:border-gold-500/30 hover:bg-white/[0.045] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
              >
                <Icon size={15} className="flex-shrink-0 text-gold-300" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/80 group-hover:text-white">{module.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 7 — Próximos passos / orientação */}
      <section aria-labelledby="inicio-passos" className="rounded-xl border border-gold-500/20 bg-gold-500/[0.04] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-gold-300" aria-hidden="true" />
          <h2 id="inicio-passos" className="text-sm font-semibold text-white">Próximos passos</h2>
        </div>
        {loading ? (
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
        ) : (
          <ol className="space-y-2">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-6 text-white/70">
                <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border border-gold-500/30 bg-gold-500/10 text-2xs font-semibold text-gold-200 tabular-nums">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
