import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Image, Video, FileText, Instagram, Youtube, Facebook, Music, RefreshCw } from 'lucide-react'

const COLUNAS = [
  { id: 'planejado',            label: 'Planejado',   borderColor: '#142D58', headerGold: false },
  { id: 'em_criacao',           label: 'Criando',     borderColor: '#FB923C', headerGold: false },
  { id: 'aguardando_aprovacao', label: 'Em Revisão',  borderColor: '#FBBF24', headerGold: false },
  { id: 'aprovado',             label: 'Aprovado',    borderColor: '#C4942A', headerGold: true  },
  { id: 'publicado',            label: 'Publicado',   borderColor: '#60A5FA', headerGold: false },
]

const STATUS_LEFT = {
  planejado:            '#142D58',
  em_criacao:           '#FB923C',
  aguardando_aprovacao: '#FBBF24',
  aprovado:             '#C4942A',
  publicado:            '#60A5FA',
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
    <div className="p-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="label-section mb-2">Gestão de conteúdo</p>
          <h1 className="font-display text-2xl text-white font-semibold">Conteúdos</h1>
          <p className="text-gray-500 text-sm mt-1">{conteudos.length} peças no sistema</p>
        </div>
        <button
          onClick={carregar}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw size={13} />
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border border-gold-500/40 border-t-gold-400 rounded-full animate-spin" />
            <p className="label-section">carregando</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {COLUNAS.map(col => {
          const items = porStatus[col.id] || []
          return (
            <div key={col.id} className="flex-shrink-0 w-60">
              <div
                className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-lg bg-navy-900"
                style={{
                  border: col.headerGold
                    ? '1px solid rgba(196,148,42,0.35)'
                    : '1px solid rgba(20,45,88,0.8)',
                  borderBottom: col.headerGold
                    ? '2px solid rgba(196,148,42,0.6)'
                    : undefined,
                }}
              >
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: col.headerGold ? '#D4A84A' : '#ADB5BD' }}
                >
                  {col.label}
                </span>
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold bg-navy-800 border border-navy-700"
                  style={{ color: col.headerGold ? '#C4942A' : '#ADB5BD' }}
                >
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-navy-600">
                    <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center mb-2">
                      <FileText size={14} className="text-navy-600" />
                    </div>
                    <p className="text-[10px]">vazio</p>
                  </div>
                )}
                {items.map(item => {
                  const cal = item.calendario_editorial
                  const plataforma = cal?.plataforma
                  const formato = cal?.formato
                  const PlataformaIcon = PLATAFORMA_ICON[plataforma] || FileText
                  const FormatoIcon = FORMATO_ICON[formato] || FileText
                  const plataformaCor = PLATAFORMA_COR[plataforma] || '#ADB5BD'
                  const leftCol = STATUS_LEFT[item.status || 'planejado'] || '#142D58'

                  const temImagem = !!item.url_imagem
                  const temVideo  = !!item.url_video
                  const temCopy   = !!item.copy_instagram || !!item.copy_facebook

                  return (
                    <div
                      key={item.id}
                      className="bg-navy-900 border border-navy-700 rounded-xl p-3 transition-all duration-200 hover:border-navy-600 hover:shadow-lg hover:shadow-black/20"
                      style={{ borderLeft: `1px solid ${leftCol}` }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <PlataformaIcon size={12} style={{ color: plataformaCor }} />
                        <span className="text-[10px] text-gray-400 capitalize">{plataforma || '—'}</span>
                        {formato && (
                          <>
                            <FormatoIcon size={11} className="text-navy-600 ml-1" />
                            <span className="text-[10px] text-navy-600 capitalize">{formato}</span>
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
                        {temCopy   && <span className="badge bg-navy-800 border border-navy-700 text-gray-400">copy</span>}
                        {temImagem && <span className="badge bg-navy-800 border border-navy-700 text-gray-400">img</span>}
                        {temVideo  && <span className="badge bg-navy-800 border border-navy-700 text-gray-400">vídeo</span>}
                        {!temCopy && !temImagem && !temVideo && (
                          <span className="badge bg-navy-800 border border-navy-700 text-navy-600">aguardando</span>
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
