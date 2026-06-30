import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Instagram, Youtube, Facebook, Music, Video, Image, FileText, CalendarOff } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { LoadingState, EmptyState } from '../components/ui/index.js'
import PostDetailDrawer from '../components/PostDetailDrawer.jsx'
import { contentStatusLabel } from '../lib/premiumData.js'

// Calendário editorial sobre a fonte UNICA (premium_content_posts), pelos conteudos com scheduled_for.
const PLATAFORMA_ICON = { instagram: Instagram, youtube: Youtube, facebook: Facebook, tiktok: Music }
const PLATAFORMA_COR  = { instagram: '#E1306C', youtube: '#FF0000', facebook: '#1877F2', tiktok: '#69C9D0' }
const FORMATO_ICON = { reels: Video, stories: Image, carrossel: Image, feed: Image, legenda: FileText }
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PLATAFORMAS = ['todos', 'instagram', 'facebook', 'youtube', 'tiktok']

export default function Calendario({ onNavigate }) {
  const [posts, setPosts] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const carregar = useCallback(async () => {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - inicio.getDay() + 1)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + 21)

    const { data } = await supabase
      .from('premium_content_posts')
      .select('id, title, hook, caption, hashtags, platform, format, status, scheduled_for, editorial_pillar, metadata, brand_scope')
      .not('scheduled_for', 'is', null)
      .gte('scheduled_for', inicio.toISOString())
      .lte('scheduled_for', fim.toISOString())
      .order('scheduled_for')

    setPosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
    const timer = setInterval(carregar, 60_000)
    return () => clearInterval(timer)
  }, [carregar])

  const filtrados = filtro === 'todos' ? posts : posts.filter(p => p.platform === filtro)

  const porDia = filtrados.reduce((acc, post) => {
    const d = new Date(post.scheduled_for)
    const key = d.toLocaleDateString('pt-BR')
    if (!acc[key]) acc[key] = { data: d, posts: [] }
    acc[key].posts.push(post)
    return acc
  }, {})

  const hojeStr = new Date().toLocaleDateString('pt-BR')

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Próximas 3 semanas"
        title="Calendário editorial"
        subtitle={`${posts.length} conteúdo(s) agendado(s) na linha editorial.`}
        actions={
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {PLATAFORMAS.map(p => {
              const active = filtro === p
              return (
                <button
                  key={p}
                  onClick={() => setFiltro(p)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ${active ? 'bg-gold-500/15 text-gold-200' : 'text-white/55 hover:text-white'}`}
                >
                  {p === 'todos' ? 'Todos' : p}
                </button>
              )
            })}
          </div>
        }
      />

      {loading && <LoadingState full label="Carregando calendário" />}

      {!loading && Object.keys(porDia).length === 0 && (
        <EmptyState
          icon={CalendarOff}
          title="Nenhum conteúdo agendado nesta janela"
          description="Agende um conteúdo na aba Produção (botão “Agendar”) para vê-lo aqui."
        />
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
                    background: hoje ? 'rgba(196,148,42,0.10)' : 'rgba(255,255,255,0.035)',
                    border: hoje ? '1px solid rgba(196,148,42,0.30)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p className="font-display text-sm font-semibold" style={{ color: hoje ? '#D4A84A' : '#ADB5BD' }}>{DIAS[data.getDay()]}</p>
                  <p className="text-sm" style={{ color: hoje ? '#D4A84A' : '#ADB5BD' }}>{dataStr}</p>
                  {hoje && <span className="label-section" style={{ color: '#C4942A' }}>hoje</span>}
                </div>
                <div className="h-px flex-1 bg-gold-500/10" />
                <span className="label-section">{dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {dayPosts.map(post => {
                  const PlataformaIcon = PLATAFORMA_ICON[post.platform] || FileText
                  const FormatoIcon = FORMATO_ICON[post.format] || FileText
                  const plataformaCor = PLATAFORMA_COR[post.platform] || '#ADB5BD'
                  const hora = new Date(post.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <div
                      key={post.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Abrir detalhe: ${post.title || post.hook || 'conteúdo'}`}
                      onClick={() => setSelected(post)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelected(post)
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-white/10 bg-[color:var(--surface-1)] p-4 transition-all duration-200 hover:border-gold-500/35 hover:shadow-lg hover:shadow-black/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PlataformaIcon size={13} style={{ color: plataformaCor }} />
                          <span className="text-xs text-gray-400 capitalize">{post.platform}</span>
                          {post.format && (
                            <>
                              <FormatoIcon size={11} className="text-white/45" />
                              <span className="text-[10px] text-white/45 capitalize">{post.format}</span>
                            </>
                          )}
                        </div>
                        <span className="label-section">{hora}</span>
                      </div>

                      {post.metadata?.art_url && (
                        <img src={post.metadata.art_url} alt="" className="mb-2 h-24 w-full rounded-md border border-white/10 object-cover" />
                      )}

                      <p className="text-white text-sm font-medium leading-snug mb-2 line-clamp-2">{post.title || post.hook || '—'}</p>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {post.editorial_pillar && (
                          <span className="badge border border-white/10 bg-white/5 text-gray-300 capitalize">{post.editorial_pillar.replace(/_/g, ' ')}</span>
                        )}
                        <span className="badge ml-auto border border-gold-500/20 bg-gold-500/5 text-gold-200/80">{contentStatusLabel(post.status)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <PostDetailDrawer
        post={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onNavigate={onNavigate}
        onChanged={carregar}
      />
    </div>
  )
}
