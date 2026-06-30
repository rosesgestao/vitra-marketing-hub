import { Copy, ExternalLink, CalendarClock } from 'lucide-react'
import { Drawer, useToast } from './ui/index.js'
import { contentStatusLabel } from '../lib/premiumData.js'

// Detalhe de um conteúdo orgânico — abre a partir de um card (Kanban/Calendário), que antes eram só
// leitura. Mostra o post e dá AÇÕES reais: copiar a legenda e ir para a Produção (deep-link da marca).
// Read-only quanto à edição (a edição/mudança de status fica na aba Produção) — primeiro passo do P1.1.
export default function PostDetailDrawer({ post, open, onClose, onNavigate }) {
  const toast = useToast()
  const visual = post?.metadata?.visual || post?.metadata?.image || null
  const hashtags = Array.isArray(post?.hashtags) ? post.hashtags : []
  const scheduled = post?.scheduled_for ? new Date(post.scheduled_for) : null

  const copyCaption = async () => {
    if (!post?.caption) {
      toast.info('Este conteúdo ainda não tem legenda.')
      return
    }
    try {
      await navigator.clipboard.writeText(post.caption)
      toast.success('Legenda copiada.')
    } catch {
      toast.error('Não foi possível copiar a legenda.')
    }
  }

  const goToProduction = () => {
    const view = post?.brand_scope === 'vitra_premium' ? 'premium' : 'imobiliaria'
    onNavigate?.(view)
    onClose?.()
  }

  const meta = [post?.platform, post?.format].filter(Boolean).join(' · ')

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={post?.title || post?.hook || 'Detalhe do conteúdo'}
      description={[meta, post?.status ? contentStatusLabel(post.status) : null].filter(Boolean).join('  ·  ')}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={copyCaption} className="btn-ghost inline-flex items-center gap-1.5">
            <Copy size={14} aria-hidden="true" />
            Copiar legenda
          </button>
          <button type="button" onClick={goToProduction} className="btn-gold inline-flex items-center gap-1.5">
            <ExternalLink size={14} aria-hidden="true" />
            Ver na Produção
          </button>
        </div>
      }
    >
      {!post ? null : (
        <div className="space-y-5">
          {visual && (
            <img
              src={visual}
              alt={post.title || 'Pré-visualização do conteúdo'}
              loading="lazy"
              className="w-full rounded-lg border border-white/10 object-cover"
            />
          )}

          {scheduled && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <CalendarClock size={14} className="text-gold-400" aria-hidden="true" />
              Agendado para {scheduled.toLocaleDateString('pt-BR')} às{' '}
              {scheduled.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {post.hook && (
            <section>
              <p className="form-label">Gancho</p>
              <p className="text-sm leading-6 text-white/80">{post.hook}</p>
            </section>
          )}

          <section>
            <p className="form-label">Legenda</p>
            {post.caption ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">{post.caption}</p>
            ) : (
              <p className="text-sm italic text-white/35">Sem legenda ainda.</p>
            )}
          </section>

          {hashtags.length > 0 && (
            <section>
              <p className="form-label">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <span key={tag} className="badge border border-gold-500/20 bg-gold-500/5 text-gold-200/80">
                    #{String(tag).replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}
