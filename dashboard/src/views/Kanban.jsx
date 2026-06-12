import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Image, Video, FileText, Instagram, Youtube, Facebook, Music, RefreshCw } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'

const COLUNAS = [
  { id: 'planejado',            label: 'Planejado',   borderColor: '#3D3D3D', headerGold: false },
  { id: 'em_criacao',           label: 'Criando',     borderColor: '#A87820', headerGold: false },
  { id: 'aguardando_aprovacao', label: 'Em Revisão',  borderColor: '#D4A84A', headerGold: false },
  { id: 'aprovado',             label: 'Aprovado',    borderColor: '#C4942A', headerGold: true  },
  { id: 'publicado',            label: 'Publicado',   borderColor: '#E4C06E', headerGold: false },
]

const STATUS_LEFT = {
  planejado:            '#3D3D3D',
  em_criacao:           '#A87820',
  aguardando_aprovacao: '#D4A84A',
  aprovado:             '#C4942A',
  publicado:            '#E4C06E',
}

const PLATAFORMA_ICON = { instagram: Instagram, youtube: Youtube, facebook: Facebook, tiktok: Music }
const PLATAFORMA_COR  = { instagram: '#E1306C', youtube: '#FF0000', facebook: '#1877F2', tiktok: '#69C9D0' }
const FORMATO_ICON = {
  reels: Video, video_longo: Video, shorts: Video,
  carrossel: Image, feed: Image, stories: Image,
}

export default function Kanban() {
  const [conteudos, setConteudos] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    const { data } = await supabase
      .from('conteudos')
      .select('*, calendario_editorial(plataforma, formato, tema, data_publicacao)')
      .order('created_at', { ascending: false })
      .limit(100)
    setConteudos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    const timer = setInterval(carregar, 30_000)
    return () => clearInterval(timer)
  }, [])

  const porStatus = COLUNAS.reduce((acc, col) => {
    acc[col.id] = conteudos.filter(c => (c.status || 'planejado') === col.id)
    return acc
  }, {})

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Gestão de conteúdo"
        title="Conteúdos"
        subtitle={`${conteudos.length} peças em produção, revisão e publicação.`}
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
        {COLUNAS.map(col => {
          const items = porStatus[col.id] || []
          return (
            <div
              key={col.id}
              className="flex w-64 flex-shrink-0 flex-col rounded-xl border p-2.5"
              style={{
                borderColor: col.headerGold ? 'rgba(196,148,42,0.28)' : 'rgba(255,255,255,0.07)',
                background: col.headerGold ? 'rgba(196,148,42,0.05)' : 'rgba(255,255,255,0.015)',
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: col.borderColor }} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {col.label}
                  </span>
                </div>
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-1.5 text-[10px] font-semibold tabular-nums text-white/55">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-9 text-center">
                    <FileText size={15} className="text-white/25" />
                    <p className="text-[11px] text-white/35">Nenhuma peça aqui</p>
                  </div>
                )}
                {items.map(item => {
                  const cal = item.calendario_editorial
                  const plataforma = cal?.plataforma
                  const formato = cal?.formato
                  const PlataformaIcon = PLATAFORMA_ICON[plataforma] || FileText
                  const FormatoIcon = FORMATO_ICON[formato] || FileText
                  const plataformaCor = PLATAFORMA_COR[plataforma] || '#ADB5BD'
                  const leftCol = STATUS_LEFT[item.status || 'planejado'] || '#3D3D3D'

                  const temImagem = !!item.url_imagem
                  const temVideo  = !!item.url_video
                  const temCopy   = !!item.copy_instagram || !!item.copy_facebook

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/10 bg-[color:var(--surface-1)] p-3 transition-all duration-200 hover:border-gold-500/35 hover:shadow-lg hover:shadow-black/30"
                      style={{ borderLeftWidth: '3px', borderLeftColor: leftCol }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <PlataformaIcon size={12} style={{ color: plataformaCor }} />
                        <span className="text-[10px] text-gray-400 capitalize">{plataforma || '—'}</span>
                        {formato && (
                          <>
                            <FormatoIcon size={11} className="text-white/45 ml-1" />
                            <span className="text-[10px] text-white/45 capitalize">{formato}</span>
                          </>
                        )}
                      </div>

                      <p className="text-white text-xs font-medium leading-snug line-clamp-2 mb-2">
                        {cal?.tema || item.tema || '—'}
                      </p>

                      {cal?.data_publicacao && (
                        <p className="label-section mb-2.5">
                          {new Date(cal.data_publicacao).toLocaleDateString('pt-BR')}
                        </p>
                      )}

                      <div className="flex gap-1 flex-wrap">
                        {temCopy   && <span className="badge bg-white/5 border border-white/10 text-gray-400">copy</span>}
                        {temImagem && <span className="badge bg-white/5 border border-white/10 text-gray-400">img</span>}
                        {temVideo  && <span className="badge bg-white/5 border border-white/10 text-gray-400">vídeo</span>}
                        {!temCopy && !temImagem && !temVideo && (
                          <span className="badge bg-white/5 border border-white/10 text-white/45">aguardando</span>
                        )}
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
