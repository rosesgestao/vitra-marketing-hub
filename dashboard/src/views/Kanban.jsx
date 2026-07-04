import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Image, Video, FileText, Instagram, Youtube, Facebook, Music, RefreshCw } from 'lucide-react'
import { PremiumPageHeader } from '../components/PremiumShell.jsx'
import { LoadingState, ErrorAlert, Badge, Segmented, Button, Chip } from '../components/ui/index.js'
import PostDetailDrawer from '../components/PostDetailDrawer.jsx'
import { CONTENT_BOARD_LANES, contentStatusLane, contentStatusLabel } from '../lib/premiumData.js'
import { BRAND_SCOPES } from '../lib/brandProfiles.js'

// O board lê a fonte UNICA de conteudo organico: premium_content_posts (mesma tabela que a aba Produção
// grava). As colunas agrupam os status do banco via contentStatusLane (fonte unica de status). Read-only.
// Filtro de MARCA (separacao Imobiliaria x Premium): sem ele o board mistura as duas marcas no mesmo
// quadro, com risco de aprovar/publicar a marca errada. Espelha o padrao ja usado em Biblioteca.
const BRAND_FILTERS = [
  { key: 'todos', label: 'Todas', scope: null },
  { key: 'imob', label: 'Imobiliária', scope: BRAND_SCOPES.imobiliaria },
  { key: 'premium', label: 'Premium', scope: BRAND_SCOPES.premium },
]
const BRAND_BADGE = { [BRAND_SCOPES.imobiliaria]: 'Imob', [BRAND_SCOPES.premium]: 'Premium' }
const LANE_COLOR = {
  rascunho: '#3D3D3D', producao: '#A87820', revisao: '#D4A84A',
  aprovado: '#C4942A', agendado: '#D8B25A', publicado: '#E4C06E',
}
const PLATAFORMA_ICON = { instagram: Instagram, youtube: Youtube, facebook: Facebook, tiktok: Music }
const PLATAFORMA_COR  = { instagram: '#E1306C', youtube: '#FF0000', facebook: '#1877F2', tiktok: '#69C9D0' }
const FORMATO_ICON = { reels: Video, stories: Image, carrossel: Image, feed: Image, legenda: FileText }

export default function Kanban({ onNavigate }) {
  const [conteudos, setConteudos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [brand, setBrand] = useState('todos')

  async function carregar() {
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('premium_content_posts')
        .select('id, title, hook, caption, platform, format, status, scheduled_for, hashtags, metadata, brand_scope, created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      if (queryError) throw queryError
      setConteudos(data || [])
    } catch {
      // Antes a falha de carga era silenciosa (board vazio sem motivo). Agora vira um erro acionável.
      setError('Não foi possível carregar os conteúdos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    const timer = setInterval(carregar, 30_000)
    return () => clearInterval(timer)
  }, [])

  const brandScope = BRAND_FILTERS.find(b => b.key === brand)?.scope || null
  const visiveis = brandScope ? conteudos.filter(c => c.brand_scope === brandScope) : conteudos
  const porLane = CONTENT_BOARD_LANES.reduce((acc, lane) => {
    acc[lane.key] = visiveis.filter(c => contentStatusLane(c.status) === lane.key)
    return acc
  }, {})

  return (
    <div className="premium-page">
      <PremiumPageHeader
        kicker="Produção de conteúdo"
        title="Conteúdos"
        subtitle={`${visiveis.length} conteúdo(s) orgânico(s) entre rascunho, produção e publicação.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              ariaLabel="Filtrar por marca"
              value={brand}
              onChange={setBrand}
              options={BRAND_FILTERS.map(b => ({ value: b.key, label: b.label }))}
            />
            <Button variant="ghost" icon={RefreshCw} onClick={carregar}>Atualizar</Button>
          </div>
        }
      />

      {loading && <LoadingState full label="Carregando conteúdos" />}

      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            setLoading(true)
            carregar()
          }}
          className="mb-4"
        />
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
                  <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-white/70">{lane.label}</span>
                </div>
                <Chip className="min-w-[22px] justify-center tabular-nums">{items.length}</Chip>
              </div>

              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-9 text-center">
                    <FileText size={15} className="text-white/25" />
                    <p className="text-2xs text-white/35">Nenhum conteúdo aqui</p>
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
                      role="button"
                      tabIndex={0}
                      aria-label={`Abrir detalhe: ${item.title || item.hook || 'conteúdo'}`}
                      onClick={() => setSelected(item)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelected(item)
                        }
                      }}
                      className="cursor-pointer rounded-lg border border-white/10 bg-[color:var(--surface-1)] p-3 transition-all duration-200 hover:border-gold-500/35 hover:shadow-lg hover:shadow-black/30"
                      style={{ borderLeftWidth: '3px', borderLeftColor: dot }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <PlataformaIcon size={12} style={{ color: plataformaCor }} />
                        <span className="text-3xs text-gray-400 capitalize">{item.platform || '—'}</span>
                        {item.format && (
                          <>
                            <FormatoIcon size={11} className="text-white/45 ml-1" />
                            <span className="text-3xs text-white/45 capitalize">{item.format}</span>
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
                        {item.brand_scope && <Badge tone="neutral">{BRAND_BADGE[item.brand_scope] || '—'}</Badge>}
                        {temCopy && <Badge tone="neutral">legenda</Badge>}
                        {temImagem && <Badge tone="neutral">visual</Badge>}
                        {temHashtags && <Badge tone="neutral">#{item.hashtags.length}</Badge>}
                        <Badge tone="gold" className="ml-auto">{contentStatusLabel(item.status)}</Badge>
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
