import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { CheckCircle2, AlertCircle, Clock, Minus } from 'lucide-react'
import { PremiumPageHeader, RoadmapNotice } from '../components/PremiumShell.jsx'

const AGENTES_V2 = [
  { id: 1,  nome: 'Orquestrador',            desc: 'Relatórios e agendamento inteligente',       cron: '6h50 + 23h',    tabela: 'calendario_editorial',   cor: 'gold' },
  { id: 2,  nome: 'Inteligência',             desc: 'Tendências + análise competitiva',           cron: '7h + Seg 8h',   tabela: 'inteligencia_mercado',   cor: 'soft' },
  { id: 3,  nome: 'Planejamento',             desc: 'Calendário editorial quinzenal',             cron: 'Seg 9h (pares)', tabela: 'calendario_editorial',  cor: 'deep' },
  { id: 4,  nome: 'Produção Criativa',        desc: 'Copy + imagens (Ideogram/FLUX)',             cron: 'Pós-Ag.3',      tabela: 'conteudos',              cor: 'warm' },
  { id: 5,  nome: 'Branding & Qualidade',     desc: 'Revisão de marca · score ≥ 80/100',         cron: 'Pós-Ag.4+6',    tabela: 'revisoes_marca',         cor: 'amber' },
  { id: 6,  nome: 'Diretor Cinematográfico',  desc: 'KlingAI · HeyGen · Tours Hollywood',        cron: 'Pós-Ag.3 + 1h', tabela: 'video_jobs',             cor: 'muted' },
  { id: 8,  nome: 'Publicador',               desc: 'Instagram · Facebook · YouTube · TikTok',   cron: 'A cada 30min',  tabela: 'publicacoes',            cor: 'light' },
  { id: 9,  nome: 'Leila (Community)',        desc: 'Comentários · DMs · Novos seguidores',      cron: 'A cada 15min',  tabela: 'interacoes_community',   cor: 'core' },
]

const COR_LEFT = {
  gold:   '#C4942A',
  soft:   '#D4A84A',
  deep: '#A87820',
  warm: '#D4A84A',
  amber:  '#E4C06E',
  muted:   '#A87820',
  light:  '#E4C06E',
  core:   '#C4942A',
}

const COR_TEXT = {
  gold:   'text-gold-400',
  soft:   'text-gold-300',
  deep: 'text-gold-600',
  warm: 'text-gold-300',
  amber:  'text-gold-200',
  muted:   'text-gold-600',
  light:  'text-gold-200',
  core:   'text-gold-400',
}

function StatusBadge({ status }) {
  if (status === 'ok') return (
    <span className="badge border border-gold-500/35 bg-gold-500/15 text-gold-100">
      <CheckCircle2 size={9} /> ativo
    </span>
  )
  if (status === 'idle') return (
    <span className="badge border border-white/10 bg-white/5 text-gray-500">
      <Clock size={9} /> aguardando
    </span>
  )
  return (
    <span className="badge border border-white/10 bg-white/5 text-gray-600">
      <Minus size={9} /> standby
    </span>
  )
}

export default function Agentes() {
  const [dados, setDados] = useState({})

  useEffect(() => {
    async function carregar() {
      const agora24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString()
      const resultado = {}
      const tabelas = [...new Set(AGENTES_V2.map(a => a.tabela))]

      await Promise.all(tabelas.map(async tabela => {
        const { count, data } = await supabase
          .from(tabela)
          .select('created_at', { count: 'exact' })
          .gte('created_at', agora24h)
          .order('created_at', { ascending: false })
          .limit(1)
        resultado[tabela] = { count: count || 0, ultimo: data?.[0]?.created_at }
      }))

      setDados(resultado)
    }
    carregar()
    const timer = setInterval(carregar, 30_000)
    return () => clearInterval(timer)
  }, [])

  function statusAgente(ag) {
    const d = dados[ag.tabela]
    if (!d) return 'idle'
    return d.count > 0 ? 'ok' : 'idle'
  }

  function ultimaAtividade(ag) {
    const d = dados[ag.tabela]
    if (!d?.ultimo) return null
    const diff = Date.now() - new Date(d.ultimo).getTime()
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    if (h > 0) return `há ${h}h${m > 0 ? ` ${m}min` : ''}`
    if (m > 0) return `há ${m}min`
    return 'agora'
  }

  const ativos = AGENTES_V2.filter(a => statusAgente(a) === 'ok').length
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Squad de automacao"
        title="Agentes"
        subtitle="Operacao Premium com automacoes, revisao de marca e publicacao assistida."
        actions={
          <div className="text-right">
            <p className="stat-number text-2xl">{ativos}<span className="text-gold-700 text-lg">/{AGENTES_V2.length}</span></p>
            <p className="label-section mt-1">ativos hoje</p>
            <p className="mt-1 text-[10px] capitalize text-gray-600">{dataHoje}</p>
          </div>
        }
      />

      <RoadmapNotice>
        Esta tela representa o <strong className="text-white/80">squad de agentes planejado</strong> (visao de roadmap). Os agentes ainda
        nao estao implementados nesta ferramenta: os indicadores abaixo dependem de tabelas que nao fazem parte do schema
        operacional Premium, entao podem aparecer permanentemente como "aguardando".
      </RoadmapNotice>

      <div className="grid grid-cols-2 gap-3">
        {AGENTES_V2.map(ag => {
          const status = statusAgente(ag)
          const ultima = ultimaAtividade(ag)
          const count  = dados[ag.tabela]?.count || 0
          const leftColor = COR_LEFT[ag.cor] || '#3D3D3D'
          const textCor = COR_TEXT[ag.cor] || 'text-gray-400'

          return (
            <div
              key={ag.id}
              className="flex items-start gap-4 rounded-lg border border-gold-500/15 bg-[#101010] p-4 transition-all duration-200 hover:border-gold-500/35"
              style={{ borderLeft: `2px solid ${leftColor}` }}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gold-500/20 bg-black">
                <span className={`font-display text-base font-semibold ${textCor}`}>{ag.id}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-white text-sm font-medium leading-tight">{ag.nome}</p>
                  <StatusBadge status={status} />
                </div>

                <p className="text-gray-500 text-xs mb-2 leading-relaxed">{ag.desc}</p>

                <div className="flex items-center gap-3">
                  <span className="label-section">{ag.cron}</span>
                  {count > 0 && ultima && (
                    <span className="text-[10px] text-gray-500">{count} reg. · {ultima}</span>
                  )}
                  {count === 0 && (
                    <span className="text-[10px] text-navy-600">sem atividade recente</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
