// Vitra UI — BADGE primitivo (Onda 2) sobre a classe .badge existente (inline-flex, raio, uppercase,
// tracking). tone define a moldura/fundo por INTENCAO — neutro, dourado (marca) ou estado semantico
// (success/warning/danger, separados do dourado). Substitui os spans .badge remontados a mao.
const TONES = {
  neutral: 'border border-white/10 bg-white/5 text-white/60',
  gold: 'border border-gold-500/20 bg-gold-500/5 text-gold-200/80',
  success: 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  warning: 'border border-amber-400/25 bg-amber-500/10 text-amber-200',
  danger: 'border border-red-400/25 bg-red-500/10 text-red-200',
}

export default function Badge({ tone = 'neutral', className = '', children, ...rest }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.neutral} ${className}`} {...rest}>
      {children}
    </span>
  )
}
