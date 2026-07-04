import { useRef } from 'react'

// Vitra UI — TABS: cabeçalho de abas acessível (role=tablist/tab, aria-selected, setas ←/→/↑/↓ + Home/End
// navegam e ativam, roving tabindex). O consumidor renderiza o painel ativo (condicional por `value`) com
// role="tabpanel" id={`panel-<id>`} aria-labelledby={`tab-<id>`}. Substitui as abas feitas com className à mão.
export default function Tabs({ items = [], value, onChange, ariaLabel, className = '' }) {
  const refs = useRef([])
  const idx = items.findIndex((it) => it.id === value)

  function onKeyDown(e) {
    const last = items.length - 1
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = idx >= last ? 0 : idx + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = idx <= 0 ? last : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next == null) return
    e.preventDefault()
    onChange?.(items[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={`flex gap-1 overflow-x-auto border-b border-white/10 ${className}`}>
      {items.map((it, i) => {
        const active = it.id === value
        const Icon = it.icon
        return (
          <button
            key={it.id}
            ref={(el) => { refs.current[i] = el }}
            role="tab"
            id={`tab-${it.id}`}
            aria-selected={active}
            aria-controls={`panel-${it.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(it.id)}
            className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              active ? 'border-gold-500 text-white' : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {Icon && <Icon size={15} aria-hidden="true" />}
            {it.label}
            {it.badge != null && <span className="ml-0.5 rounded-full bg-white/[0.08] px-1.5 text-3xs tabular-nums text-white/60">{it.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}
