// Vitra UI — CHIP: pílula compacta para filtro/tag/contagem. Distinta do Badge (que é rótulo de STATUS
// em maiúsculas). Presentational por padrão; vira botão acessível quando recebe onClick (com aria-pressed).
const TONES = {
  neutral: 'border-white/12 bg-white/[0.03] text-white/60',
  gold: 'border-gold-500/40 bg-gold-500/12 text-gold-200',
}
export default function Chip({ children, active = false, onClick, icon: Icon, tone = 'neutral', count, className = '', ...rest }) {
  const base = active ? TONES.gold : TONES[tone] || TONES.neutral
  const cls = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition ${base} ${className}`
  const body = (
    <>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
      {count != null && <span className="tabular-nums opacity-70">{count}</span>}
    </>
  )
  if (!onClick) return <span className={cls} {...rest}>{body}</span>
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${cls} cursor-pointer hover:border-gold-500/35 hover:text-white`} {...rest}>
      {body}
    </button>
  )
}
