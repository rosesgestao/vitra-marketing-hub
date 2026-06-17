import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Image, Video, FileText, Instagram, Youtube, Facebook, Music, RefreshCw } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { CONTENT_BOARD_LANES, contentStatusLane, contentStatusLabel } from '../lib/premiumData.js'

// O board lê a fonte UNICA de conteudo organico: premium_content_posts (mesma tabela que a aba Produção
// grava). As colunas agrupam os status do banco via contentStatusLane (fonte unica de status). Read-only.
const LANE_COLOR = {
  rascunho: '#3D3D3D', producao: '#A87820', revisao: '#D4A84A',
  aprovado: '#C4942A', agendado: '#D8B25A', publicado: '#E4C06E',
}
const PLATAFORMA_ICON = { instagram: Instagram, youtube: Youtube, facebook: Facebook, tiktok: Music }
const PLATAFORMA_COR  = { instagram: '#E1306C', youtube: '#FF0000', facebook: '#1877F2', tiktok: '#69C9D0' }
const FORMATO_ICON = { reels: Video, stories: Image, carrossel: Image, feed: Image, legenda: FileText }

export default function Kanban() {
  const [conteudos, setConteudos] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    const { data } = await supabase
      .from('premium_content_posts')
      .select('id, title, hook, caption, platform, format, status, scheduled_for, hashtags, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    setConteudos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    const timer = setInterval(carregar, 30_000)
    return () => clearInterval(timer)
  }, [])

  const porLane = CONTENT_BOARD_LANES.reduce((acc, lane) => {
    acc[lane.key] = conteudos.filter(c => contentStatusLane(c.status) === lane.key)
    return acc
  }, {})

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Produção de conteúdo"
        title="Conteúdos"
        subtitle={`${conteudos.length} conteúdo(s) orgânico(s) entre rascunho, produção e publicação.`}
        actions={
          <button onClick={carregar} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={13} />
            Atualizar
          </button>
        }
      />

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border border-gold-500/40 border-t-gold-400 rounded-full animate-spin" />
            <p className="label-section">carregando</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {CONTENT_BOARD_LANES.map(lane => {
          const items = porLane[lane.key] || []
          const gold = lane.key === 'aprovado' || lane.key === 'publicado'
          const dot = LANE_COLOR[lane.key] || '#3D3D3D'
          return (
            <div
              key={lane.key}
              className="flex w-64 flex-shrink-0 flex-col rounded-xl border p-2.5"
              style={{
                borderColor: gold ? 'rgba(196,148,42,0.28)' : 'rgba(255,255,255,0.07)',
                background: gold ? 'rgba(196,148,42,0.05)' : 'rgba(255,255,255,0.015)',
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: dot }} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{lane.label}</span>
                </div>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-1.5 text-[10px] font-semibold tabular-nums text-white/55">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-9 text-center">
                    <FileText size={15} className="text-white/25" />
                    <p className="text-[11px] text-white/35">Nenhum conteúdo aqui</p>
                  </div>
                )}
                {items.map(item => {
                  const PlataformaIcon = PLATAFORMA_ICON[item.platform] || FileText
                  const FormatoIcon = FORMATO_ICON[item.format] || FileText
                  const plataformaCor = PLATAFORMA_COR[item.platform] || '#ADB5BD'
                  const temImagem = !!item.metadata?.visual
                  const temCopy   = !!item.caption
                  const temHashtags = Array.isArray(item.hashtags) && item.hashtags.length > 0

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/10 bg-[color:var(--surface-1)] p-3 transition-all duration-200 hover:border-gold-500/35 hover:shadow-lg hover:shadow-black/30"
                      style={{ borderLeftWidth: '3px', borderLeftColor: dot }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <PlataformaIcon size={12} style={{ color: plataformaCor }} />
                        <span className="text-[10px] text-gray-400 capitalize">{item.platform || '—'}</span>
                        {item.format && (
                          <>
                            <FormatoIcon size={11} className="text-white/45 ml-1" />
                            <span className="text-[10px] text-white/45 capitalize">{item.format}</span>
                          </>
                        )}
                      </div>

                      <p className="text-white text-xs font-medium leading-snug line-clamp-2 mb-2">
                        {item.title || item.hook || '—'}
                      </p>

                      {item.scheduled_for && (
                        <p className="label-section mb-2.5">{new Date(item.scheduled_for).toLocaleDateString('pt-BR')}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1">
                        {temCopy && <span className="badge bg-white/5 border border-white/10 text-gray-400">legenda</span>}
                        {temImagem && <span className="badge bg-white/5 border border-white/10 text-gray-400">visual</span>}
                        {temHashtags && <span className="badge bg-white/5 border border-white/10 text-gray-400">#{item.hashtags.length}</span>}
                        <span className="badge ml-auto border border-gold-500/20 bg-gold-500/5 text-gold-200/80">{contentStatusLabel(item.status)}</span>
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
