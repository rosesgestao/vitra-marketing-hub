import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight, Users, Film } from 'lucide-react'

const FASES_V2 = [
  { id: 1, label: 'Inteligência',  cor: 'blue',   agentes: ['Ag.2 Inteligência'],              tabela: 'inteligencia_mercado', descricao: 'Tendências + análise competitiva' },
  { id: 2, label: 'Planejamento',  cor: 'purple', agentes: ['Ag.3 Planejamento'],              tabela: 'calendario_editorial', descricao: 'Calendário editorial quinzenal' },
  { id: 3, label: 'Produção',      cor: 'amber',  agentes: ['Ag.4 Produção', 'Ag.6 Cinema'],   tabela: 'conteudos',            descricao: 'Copy + imagens + vídeos cinema' },
  { id: 4, label: 'Branding',      cor: 'gold',   agentes: ['Ag.5 Branding'],                  tabela: 'revisoes_marca',       descricao: 'Revisão de qualidade · score ≥ 80' },
  { id: 5, label: 'Aprovação',     cor: 'green',  agentes: ['Emilio via Telegram'],             tabela: 'conteudos',            descricao: 'Aprovação final do Emilio' },
  { id: 6, label: 'Publicação',    cor: 'teal',   agentes: ['Ag.8 Publicador'],                tabela: 'publicacoes',          descricao: 'Instagram · Facebook · YouTube · TikTok' },
]

const COR = {
  blue:   { border: 'border-blue-700/40',   text: 'text-blue-400',   dot: 'bg-blue-400',   pill: 'bg-blue-900/30 text-blue-300 border-blue-700/30' },
  purple: { border: 'border-purple-700/40', text: 'text-purple-400', dot: 'bg-purple-400', pill: 'bg-purple-900/30 text-purple-300 border-purple-700/30' },
  amber:  { border: 'border-amber-700/40',  text: 'text-amber-400',  dot: 'bg-amber-400',  pill: 'bg-amber-900/30 text-amber-300 border-amber-700/30' },
  gold:   { border: 'border-gold-700/40',   text: 'text-gold-400',   dot: 'bg-gold-400',   pill: 'bg-gold-500/10 text-gold-300 border-gold-700/30' },
  green:  { border: 'border-green-700/40',  text: 'text-green-400',  dot: 'bg-green-400',  pill: 'bg-green-900/30 text-green-300 border-green-700/30' },
  teal:   { border: 'border-teal-700/40',   text: 'text-teal-400',   dot: 'bg-teal-400',   pill: 'bg-teal-900/30 text-teal-300 border-teal-700/30' },
}

function StatusIcon({ status }) {
  if (status === 'ok')      return <CheckCircle2 size={14} className="text-green-400" />
  if (status === 'running') return <Clock size={14} className="text-gold-400 animate-pulse" />
  if (status === 'error')   return <AlertCircle size={14} className="text-red-400" />
  return <Circle size={14} className="text-navy-600" />
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
    <div className="p-8">
      <div className="mb-8">
        <p className="label-section mb-2">Fluxo automático · toda segunda-feira às 9h</p>
        <h1 className="font-display text-2xl text-white font-semibold">Pipeline Quinzenal</h1>
      </div>

      {aprovacao?.status === 'planejado' && (
        <div className="card border-gold-600/40 bg-gold-500/5 flex items-center gap-3 mb-6">
          <Clock size={18} className="text-gold-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-gold-400 font-medium text-sm">Aguardando aprovação do Emilio no Telegram</p>
            <p className="text-gray-500 text-xs mt-0.5">Calendário enviado · timeout em 4h</p>
          </div>
        </div>
      )}

      <div className="flex items-stretch gap-2">
        {FASES_V2.map((fase, i) => {
          const status = statusFase(fase)
          const c = COR[fase.cor]
          const count = dados[fase.id] || 0

          return (
            <div key={fase.id} className="flex items-stretch gap-2 flex-1 min-w-0">
              <div className={`flex-1 bg-navy-900 border ${c.border} rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-200 hover:border-navy-600`}>
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

                <div className="h-px bg-navy-800 mb-3" />
                <p className={`text-[10px] ${count > 0 ? c.text : 'text-navy-600'}`}>
                  {count > 0 ? `${count} registro${count > 1 ? 's' : ''} nas últimas 24h` : 'Sem atividade recente'}
                </p>
              </div>

              {i < FASES_V2.length - 1 && (
                <div className="flex items-center justify-center flex-shrink-0">
                  <ChevronRight size={14} className="text-navy-600" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="gold-line mb-6" />
        <p className="label-section mb-4">Agentes contínuos</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="card-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-2">
                <Users size={13} className="text-green-400" />
                <span className="text-sm text-white font-medium">Community Manager Leila</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-5">A cada 15 min · 24h/7</p>
            <p className="text-[10px] text-navy-600 ml-5 mt-1">Comentários · DMs · Novos seguidores</p>
          </div>

          <div className="card-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-2">
                <Film size={13} className="text-blue-400" />
                <span className="text-sm text-white font-medium">Cinema jobs</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-5">Verificação a cada 1h</p>
            <p className="text-[10px] text-navy-600 ml-5 mt-1">KlingAI · HeyGen · Tours Hollywood</p>
          </div>
        </div>
      </div>
    </div>
  )
}
