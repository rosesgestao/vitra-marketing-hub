// Vitra UI — primitivo de ESTADO VAZIO. Mensagem útil + ação opcional (em vez de uma área em branco).
// Borda tracejada dourada discreta, alinhado à identidade. `action` recebe um nó (ex.: um <button>).
export default function EmptyState({ icon: Icon, title = 'Nada por aqui ainda', description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gold-500/20 bg-white/[0.02] px-6 py-10 text-center ${className}`}
    >
      {Icon && <Icon size={26} className="mb-3 text-gold-500/50" aria-hidden="true" />}
      <p className="text-sm font-semibold text-white/80">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-5 text-white/45">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
