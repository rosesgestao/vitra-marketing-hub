import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Vitra UI — DRAWER (painel lateral). Mesmas garantias de a11y do Modal: role=dialog + aria-modal, foco
// preso, Esc fecha, foco volta ao gatilho, scroll do body travado, clique no scrim fecha. Desliza da
// direita; em telas estreitas ocupa a largura toda (vira folha). Sem animação de transform (evita o
// pitfall de containing-block com position:fixed, já documentado no index.css).
export default function Drawer({ open, onClose, title, description, children, footer, closeLabel = 'Fechar', className = '' }) {
  const panelRef = useRef(null)
  const restoreRef = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return undefined
    restoreRef.current = document.activeElement
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel?.querySelectorAll(FOCUSABLE) || []).filter((el) => el.offsetParent !== null)

    const focusTimer = window.setTimeout(() => {
      ;(focusables()[0] || panel)?.focus()
    }, 0)

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      } else if (event.key === 'Tab') {
        const f = focusables()
        if (!f.length) {
          event.preventDefault()
          panel?.focus()
          return
        }
        const first = f[0]
        const last = f[f.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey, true)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      const el = restoreRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`flex h-full w-full max-w-md flex-col border-l shadow-2xl shadow-black/70 ${className}`}
        style={{ background: 'var(--surface-1)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gold-500/12 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="truncate font-display text-lg font-semibold text-white">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-1 text-xs text-white/50">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-white/55 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-gold-500/12 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
