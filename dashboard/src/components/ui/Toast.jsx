import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

// Vitra UI — fila de NOTIFICAÇÕES (toast). Antes só havia divs de sucesso/erro inline e inconsistentes.
// Provider no topo do app expõe useToast(): toast/success/error/info + dismiss. Auto-dismiss (4s padrão),
// não rouba foco, região com aria-live="polite" (anúncio sem interromper). Ícones SVG (lucide), sem emoji.

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: CheckCircle2, cls: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100' },
  error: { icon: AlertTriangle, cls: 'border-red-400/30 bg-red-500/12 text-red-100' },
  info: { icon: Info, cls: 'border-gold-500/30 bg-gold-500/10 text-gold-100' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (message, opts = {}) => {
      const id = ++idRef.current
      const duration = opts.duration ?? 4000
      setToasts((list) => [...list, { id, message, variant: opts.variant || 'info' }])
      if (duration > 0) window.setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      toast: push,
      success: (m, o) => push(m, { ...o, variant: 'success' }),
      error: (m, o) => push(m, { ...o, variant: 'error' }),
      info: (m, o) => push(m, { ...o, variant: 'info' }),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2"
      >
        {toasts.map((t) => {
          const V = VARIANTS[t.variant] || VARIANTS.info
          const Icon = V.icon
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg shadow-black/40 backdrop-blur-sm ${V.cls}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 leading-5">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar notificação"
                className="shrink-0 rounded p-0.5 opacity-70 transition hover:bg-white/10 hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Fallback no-op: usar useToast() fora do provider não quebra a tela (só não notifica).
  if (!ctx) return { toast: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} }
  return ctx
}
