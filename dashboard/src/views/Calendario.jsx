import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Instagram, Youtube, Facebook, Music, Video, Image, FileText, CalendarOff } from 'lucide-react'

const PLATAFORMA_ICON = {
  instagram: Instagram,
  youtube:   Youtube,
  facebook:  Facebook,
  tiktok:    Music,
}

const PLATAFORMA_COR = {
  instagram: '#E1306C',
  youtube:   '#FF0000',
  facebook:  '#1877F2',
  tiktok:    '#69C9D0',
}

const FORMATO_ICON = {
  reels:       Video,
  video_longo: Video,
  shorts:      Video,
  carrossel:   Image,
  feed:        Image,
  stories:     Image,
  podcast:     FileText,
  tiktok:      Video,
}

const PILAR_COR = {
  educacao:   'bg-blue-900/30 text-blue-300 border-blue-700/30',
  portfolio:  'bg-gold-500/15 text-gold-300 border-gold-700/30',
  autoridade: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
  bastidores: 'bg-pink-900/30 text-pink-300 border-pink-700/30',
  mercado:    'bg-cyan-900/30 text-cyan-300 border-cyan-700/30',
}

const STATUS_COR = {
  planejado:            'bg-navy-800 text-gray-400 border-navy-700',
  em_criacao:           'bg-orange-900/40 text-orange-300 border-orange-700/30',
  aguardando_aprovacao: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/30',
  aprovado:             'bg-green-900/40 text-green-300 border-green-700/30',
  publicado:            'bg-blue-900/40 text-blue-300 border-blue-700/30',
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PLATAFORMAS = ['todos', 'instagram', 'youtube', 'facebook', 'tiktok']

export default function Calendario() {
  const [posts, setPosts] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - inicio.getDay() + 1)
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date(inicio)
      fim.setDate(fim.getDate() + 14)

      const { data } = await supabase
        .from('calendario_editorial')
        .select('*, conteudos(status, url_imagem, url_video)')
        .gte('data_publicacao', inicio.toISOString())
        .lte('data_publicacao', fim.toISOString())
        .order('data_publicacao')

      setPosts(data || [])
      setLoading(false)
    }
    carregar()
    const timer = setInterval(carregar, 60_000)
    return () => clearInterval(timer)
  }, [])

  const filtrados = filtro === 'todos' ? posts : posts.filter(p => p.plataforma === filtro)

  const porDia = filtrados.reduce((acc, post) => {
    const d = new Date(post.data_publicacao)
    const key = d.toLocaleDateString('pt-BR')
    if (!acc[key]) acc[key] = { data: d, posts: [] }
    acc[key].posts.push(post)
    return acc
  }, {})

  const hojeStr = new Date().toLocaleDateString('pt-BR')

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="label-section mb-2">Quinzena atual</p>
          <h1 className="font-display text-2xl text-white font-semibold">Calendário Editorial</h1>
          <p className="text-gray-500 text-sm mt-1">{posts.length} posts planejados</p>
        </div>

        <div className="flex items-end gap-0">
          {PLATAFORMAS.map((p, i) => {
            const active = filtro === p
            return (
              <button
                key={p}
                onClick={() => setFiltro(p)}
                className="px-3.5 py-2 text-xs font-medium capitalize transition-all duration-150 relative"
                style={{
                  color: active ? '#D4A84A' : '#ADB5BD',
                  borderBottom: active ? '2px solid #C4942A' : '2px solid transparent',
                  borderRadius: i === 0 ? '8px 0 0 0' : i === PLATAFORMAS.length - 1 ? '0 8px 0 0' : '0',
                  background: active ? 'rgba(13,31,60,0.7)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.color = '#ADB5BD'
                }}
              >
                {p === 'todos' ? 'Todos' : p}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border border-gold-500/40 border-t-gold-400 rounded-full animate-spin" />
            <p className="label-section">carregando calendário</p>
          </div>
        </div>
      )}

      {!loading && Object.keys(porDia).length === 0 && (
        <div className="card flex flex-col items-center justify-center h-52 text-center">
          <CalendarOff size={22} className="text-navy-600 mb-3" />
          <p className="text-gray-400 text-sm font-medium">Nenhum post planejado para esta quinzena</p>
          <p className="text-navy-600 text-xs mt-1.5">Aguardando o Ag.3 Planejamento gerar o calendário</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(porDia).map(([dataStr, { data, posts: dayPosts }]) => {
          const hoje = hojeStr === dataStr

          return (
            <div key={dataStr}>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg"
                  style={{
                    background: hoje ? 'rgba(196,148,42,0.08)' : 'rgba(13,31,60,0.8)',
                    border: hoje ? '1px solid rgba(196,148,42,0.25)' : '1px solid rgba(20,45,88,0.8)',
                  }}
                >
                  <p
                    className="font-display text-sm font-semibold"
                    style={{ color: hoje ? '#D4A84A' : '#ADB5BD' }}
                  >
                    {DIAS[data.getDay()]}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: hoje ? '#D4A84A' : '#ADB5BD' }}
                  >
                    {dataStr}
                  </p>
                  {hoje && (
                    <span className="label-section" style={{ color: '#C4942A' }}>hoje</span>
                  )}
                </div>
                <div className="flex-1 h-px bg-navy-800" />
                <span className="label-section">{dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {dayPosts.map(post => {
                  const PlataformaIcon = PLATAFORMA_ICON[post.plataforma] || FileText
                  const FormatoIcon = FORMATO_ICON[post.formato] || FileText
                  const plataformaCor = PLATAFORMA_COR[post.plataforma] || '#ADB5BD'
                  const status = post.conteudos?.[0]?.status || post.status || 'planejado'
                  const hora = new Date(post.data_publicacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <div
                      key={post.id}
                      className="bg-navy-900 border border-navy-700 rounded-xl p-4 transition-all duration-200 hover:border-navy-600 hover:shadow-lg hover:shadow-black/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PlataformaIcon size={13} style={{ color: plataformaCor }} />
                          <span className="text-xs text-gray-400 capitalize">{post.plataforma}</span>
                          {post.formato && (
                            <>
                              <FormatoIcon size={11} className="text-navy-600" />
                              <span className="text-[10px] text-navy-600 capitalize">{post.formato}</span>
                            </>
                          )}
                        </div>
                        <span className="label-section">{hora}</span>
                      </div>

                      <p className="text-white text-sm font-medium leading-snug mb-2 line-clamp-2">
                        {post.tema}
                      </p>

                      {post.angulo && (
                        <p className="text-gray-500 text-xs mb-3 line-clamp-1">{post.angulo}</p>
                      )}

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {post.pilar && (
                          <span className={`badge border ${PILAR_COR[post.pilar] || 'bg-navy-800 text-gray-400 border-navy-700'} capitalize`}>
                            {post.pilar}
                          </span>
                        )}
                        <span className={`badge border ml-auto capitalize ${STATUS_COR[status] || 'bg-navy-800 text-gray-400 border-navy-700'}`}>
                          {status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
