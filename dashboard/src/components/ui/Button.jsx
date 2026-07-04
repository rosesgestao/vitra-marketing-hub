import { Loader2 } from 'lucide-react'

// Vitra UI — BUTTON primitivo (Onda 2). Encapsula as classes de acao ja existentes (.btn-gold / .btn-ghost)
// num componente React unico, com estados de loading/disabled e icone consistentes. Antes cada view
// remontava o botao a mao (px/py/bg/border repetidos), sem componente. Visualmente identico ao que ja
// existe — so centraliza. As utilities (px/py/opacity) vencem as classes .btn-* por virem na layer
// utilities (posterior a components no cascade do Tailwind), entao size='sm' sobrescreve com seguranca.
const VARIANTS = {
  gold: 'btn-gold',      // CTA primario (dourado solido)
  ghost: 'btn-ghost',    // secundario (contorno)
  subtle: 'rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:border-gold-500/25 hover:bg-white/[0.06] hover:text-white',
  danger: 'rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition-all duration-200 hover:bg-red-500/25',
}
const SIZES = { sm: 'px-3 py-1.5 text-xs', md: '' }

export default function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const base = VARIANTS[variant] || VARIANTS.gold
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 ${base} ${SIZES[size] || ''} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...rest}
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        : Icon ? <Icon size={15} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
