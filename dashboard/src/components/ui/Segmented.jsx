// Vitra UI — SEGMENTED: controle de seleção única (filtro de marca, segmento de métricas, etc.).
// Substitui os "button groups" reimplementados à mão em Kanban/Calendário/Métricas. role=group + botões
// com aria-pressed (o ativo fica dourado). Acessível por teclado (Tab + Enter/Espaço nativos do <button>).
export default function Segmented({ options = [], value, onChange, ariaLabel, size = 'md', block = false, className = '' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-2xs' : 'px-3 py-1.5 text-xs'
  return (
    <div role="group" aria-label={ariaLabel} className={`${block ? 'flex w-full' : 'inline-flex'} items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1 ${className}`}>
      {options.map((opt) => {
        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt
        const active = String(o.value) === String(value)
        const Icon = o.icon
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(o.value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition ${block ? 'flex-1' : ''} ${pad} ${
              active ? 'bg-gold-500/18 text-gold-100' : 'text-white/55 hover:text-white'
            }`}
          >
            {Icon && <Icon size={13} aria-hidden="true" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
