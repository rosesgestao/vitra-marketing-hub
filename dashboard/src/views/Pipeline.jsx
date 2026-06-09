import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight, Users, Film } from 'lucide-react'
import { PremiumPageHeader, RoadmapNotice } from '../components/PremiumShell.jsx'

const FASES_V2 = [
  { id: 1, label: 'Inteligência',  cor: 'soft', agentes: ['Ag.2 Inteligência'],              tabela: 'inteligencia_mercado', descricao: 'Tendências + análise competitiva' },
  { id: 2, label: 'Planejamento',  cor: 'deep', agentes: ['Ag.3 Planejamento'],              tabela: 'calendario_editorial', descricao: 'Calendário editorial quinzenal' },
  { id: 3, label: 'Produção',      cor: 'warm', agentes: ['Ag.4 Produção', 'Ag.6 Cinema'],   tabela: 'conteudos',            descricao: 'Copy + imagens + vídeos cinema' },
  { id: 4, label: 'Branding',      cor: 'core', agentes: ['Ag.5 Branding'],                  tabela: 'revisoes_marca',       descricao: 'Revisão de qualidade · score ≥ 80' },
  { id: 5, label: 'Aprovação',     cor: 'light', agentes: ['Emilio via Telegram'],             tabela: 'conteudos',            descricao: 'Aprovação final do Emilio' },
  { id: 6, label: 'Publicação',    cor: 'muted', agentes: ['Ag.8 Publicador'],                tabela: 'publicacoes',          descricao: 'Instagram · Facebook · YouTube · TikTok' },
]

const COR = {
  soft:  { border: 'border-gold-500/20', text: 'text-gold-300', dot: 'bg-gold-400', pill: 'bg-gold-500/10 text-gold-200 border-gold-500/25' },
  deep:  { border: 'border-gold-500/20', text: 'text-gold-300', dot: 'bg-gold-400', pill: 'bg-gold-500/10 text-gold-200 border-gold-500/25' },
  warm:  { border: 'border-gold-500/25', text: 'text-gold-300', dot: 'bg-gold-400', pill: 'bg-gold-500/10 text-gold-200 border-gold-500/25' },
  core:  { border: 'border-gold-500/35', text: 'text-gold-300', dot: 'bg-gold-400', pill: 'bg-gold-500/10 text-gold-100 border-gold-500/35' },
  light: { border: 'border-gold-500/20', text: 'text-gold-300', dot: 'bg-gold-400', pill: 'bg-gold-500/10 text-gold-200 border-gold-500/25' },
  muted: { border: 'border-gold-500/20', text: 'text-gold-300', dot: 'bg-gold-400', pill: 'bg-gold-500/10 text-gold-200 border-gold-500/25' },
}

function StatusIcon({ status }) {
  if (status === 'ok')      return <CheckCircle2 size={14} className="text-gold-300" />
  if (status === 'running') return <Clock size={14} className="text-gold-400 animate-pulse" />
  if (status === 'error')   return <AlertCircle size={14} className="text-red-400" />
  return <Circle size={14} className="text-white/45" />
}

export default function Pipeline() {
  const [dados, setDados] = useState({})
  const [aprovacao, setAprovacao] = useState(null)

  useEffect(() => {
    async function carregar() {
      const agora24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString()
      const resultado = {}

      for (const fase of FASES_V2) {
        const { count } = await supabase
          .from(fase.tabela)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', agora24h)
        resultado[fase.id] = count || 0
      }

      const { data: cal } = await supabase
        .from('calendario_editorial')
        .select('status, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      setAprovacao(cal?.[0] || null)
      setDados(resultado)
    }

    carregar()
    const timer = setInterval(carregar, 30_000)
    return () => clearInterval(timer)
  }, [])

  function statusFase(fase) {
    const count = dados[fase.id] || 0
    if (fase.id === 2 && aprovacao) {
      if (aprovacao.status === 'aprovado_emilio') return 'ok'
      if (aprovacao.status === 'planejado') return 'running'
    }
    if (count > 0) return 'ok'
    return 'idle'
  }

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Fluxo automatico"
        title="Pipeline quinzenal"
        subtitle="Orquestracao dos agentes Premium, do monitoramento de mercado ate a publicacao final."
      />

      <RoadmapNotice>
        Este pipeline ilustra o <strong className="text-white/80">fluxo de agentes planejado</strong> (visao de roadmap). As fases ainda nao
        sao executadas por automacoes nesta ferramenta e os contadores dependem de tabelas fora do schema operacional Premium.
      </RoadmapNotice>

      {aprovacao?.status === 'planejado' && (
        <div className="card border-gold-600/40 bg-gold-500/5 flex items-center gap-3 mb-6">
          <Clock size={18} className="text-gold-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-gold-400 font-medium text-sm">Aguardando aprovação do Emilio no Telegram</p>
            <p className="text-gray-500 text-xs mt-0.5">Calendário enviado · timeout em 4h</p>
          </div>
        </div>
      )}

      <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
        {FASES_V2.map((fase, i) => {
          const status = statusFase(fase)
          const c = COR[fase.cor]
          const count = dados[fase.id] || 0

          return (
            <div key={fase.id} className="flex items-stretch gap-2 flex-1 min-w-0">
              <div className={`relative flex min-w-44 flex-1 flex-col overflow-hidden rounded-lg border ${c.border} bg-[color:var(--surface-1)] p-4 transition-all duration-200 hover:border-gold-500/35`}>
                <span
                  className="absolute top-3 right-3 font-display text-2xl font-semibold select-none pointer-events-none"
                  style={{ color: 'rgba(196,148,42,0.10)' }}
                >
                  {fase.id}
                </span>

                <div className="flex items-center justify-between mb-3">
                  <p className={`text-[10px] tracking-[0.15em] font-semibold uppercase ${c.text}`}>
                    Fase {fase.id}
                  </p>
                  <StatusIcon status={status} />
                </div>

                <p className="text-white text-sm font-medium mb-1">{fase.label}</p>
                <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1">{fase.descricao}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {fase.agentes.map(ag => (
                    <span
                      key={ag}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border ${c.pill}`}
                    >
                      {ag}
                    </span>
                  ))}
                </div>

                <div className="h-px bg-gold-500/10 mb-3" />
                <p className={`text-[10px] ${count > 0 ? c.text : 'text-white/45'}`}>
                  {count > 0 ? `${count} registro${count > 1 ? 's' : ''} nas últimas 24h` : 'Sem atividade recente'}
                </p>
              </div>

              {i < FASES_V2.length - 1 && (
                <div className="flex items-center justify-center flex-shrink-0">
                  <ChevronRight size={14} className="text-gold-500/35" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="gold-line mb-6" />
        <p className="label-section mb-4">Agentes continuos</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="card-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-2">
                <Users size={13} className="text-gold-400" />
                <span className="text-sm text-white font-medium">Community Manager Leila</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-5">A cada 15 min · 24h/7</p>
            <p className="text-[10px] text-white/45 ml-5 mt-1">Comentários · DMs · Novos seguidores</p>
          </div>

          <div className="card-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-2">
                <Film size={13} className="text-gold-500" />
                <span className="text-sm text-white font-medium">Cinema jobs</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-5">Verificação a cada 1h</p>
            <p className="text-[10px] text-white/45 ml-5 mt-1">KlingAI · HeyGen · Tours Hollywood</p>
          </div>
        </div>
      </div>
    </div>
  )
}
