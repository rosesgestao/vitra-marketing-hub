import { useEffect, useState } from 'react'
import { Copy, ExternalLink, CalendarClock, Loader2 } from 'lucide-react'
import { Drawer, useToast } from './ui/index.js'
import VitraSelect from './VitraSelect.jsx'
import { contentStatusLabel, updateContentPost, CONTENT_STATUS_OPTIONS } from '../lib/premiumData.js'

const STATUS_OPTS = CONTENT_STATUS_OPTIONS.map((s) => ({ value: s.key, label: s.label }))

// Detalhe de um conteúdo orgânico — abre a partir de um card (Kanban/Calendário). Além de inspecionar e
// das ações (copiar legenda / ir para a Produção), agora muda o STATUS no lugar (P1.1 fatia 2): otimista,
// com toast e refresh do board via onChanged. Reusa updateContentPost (mesma fonte da aba Produção).
export default function PostDetailDrawer({ post, open, onClose, onNavigate, onChanged }) {
  const toast = useToast()
  const [status, setStatus] = useState(post?.status || 'draft')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(post?.status || 'draft')
  }, [post?.id, post?.status])

  const visual = post?.metadata?.visual || post?.metadata?.image || post?.metadata?.art_url || null
  const hashtags = Array.isArray(post?.hashtags) ? post.hashtags : []
  const scheduled = post?.scheduled_for ? new Date(post.scheduled_for) : null

  const changeStatus = async (next) => {
    if (!post || !next || next === status || saving) return
    const prev = status
    setSaving(true)
    setStatus(next) // otimista
    try {
      await updateContentPost(post.id, { status: next })
      toast.success(`Status atualizado: ${contentStatusLabel(next)}.`)
      onChanged?.()
    } catch {
      setStatus(prev) // reverte
      toast.error('Não foi possível mudar o status.')
    } finally {
      setSaving(false)
    }
  }

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
      description={[meta, contentStatusLabel(status)].filter(Boolean).join('  ·  ')}
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
          <section>
            <p className="form-label">Status</p>
            <div className="flex items-center gap-2">
              <VitraSelect
                value={status}
                onChange={changeStatus}
                options={STATUS_OPTS}
                ariaLabel="Status do conteúdo"
                disabled={saving}
                className="flex-1"
              />
              {saving && <Loader2 size={15} className="animate-spin text-gold-400" aria-hidden="true" />}
            </div>
            <p className="mt-1 text-[11px] leading-4 text-white/40">Move o conteúdo no board e no calendário em tempo real.</p>
          </section>

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
