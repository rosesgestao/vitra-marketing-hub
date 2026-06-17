import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Dropdown custom com a identidade Vitra (pixel-perfect) — substitui o <select> nativo onde o popup do
// SO nao da controle total de hover/seleccao. Acessivel: role=listbox + aria-activedescendant, teclado
// (setas/Home/End/Enter/Esc + type-ahead), foco gerenciado e fecha ao clicar fora.
//
// API espelha o select para troca sem mexer na logica: value, onChange(value), options (array de
// {value,label} ou strings), placeholder, disabled, className (aplicada ao gatilho).
export default function VitraSelect({ value, onChange, options = [], placeholder = 'Selecione', disabled = false, className = '', ariaLabel }) {
  const norm = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [dropUp, setDropUp] = useState(false)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const btnRef = useRef(null)
  const typeahead = useRef({ str: '', timer: 0 })
  const baseId = useId()
  const selected = norm.find(o => String(o.value) === String(value))

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return
    const onDoc = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Ao abrir: posiciona (cima/baixo conforme espaco), ativa a opcao atual e foca a lista.
  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setDropUp(window.innerHeight - rect.bottom < 260 && rect.top > window.innerHeight - rect.bottom)
    const idx = norm.findIndex(o => String(o.value) === String(value))
    setActive(idx >= 0 ? idx : 0)
    requestAnimationFrame(() => listRef.current?.focus())
  }, [open])

  // Mantem a opcao ativa visivel.
  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function commit(idx) {
    const opt = norm[idx]
    if (opt) onChange?.(opt.value)
    setOpen(false)
    requestAnimationFrame(() => btnRef.current?.focus())
  }

  function onKeyDown(e) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(e.key)) e.preventDefault()
    if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() }
    else if (e.key === 'Enter' || e.key === ' ') commit(active)
    else if (e.key === 'ArrowDown') setActive(a => Math.min(norm.length - 1, a + 1))
    else if (e.key === 'ArrowUp') setActive(a => Math.max(0, a - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(norm.length - 1)
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const ta = typeahead.current
      clearTimeout(ta.timer)
      ta.str += e.key.toLowerCase()
      ta.timer = setTimeout(() => { ta.str = '' }, 600)
      const i = norm.findIndex(o => String(o.label).toLowerCase().startsWith(ta.str))
      if (i >= 0) setActive(i)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={e => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true) } }}
        className={`form-input flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className={`truncate ${selected ? '' : 'text-white/40'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={15} className={`flex-shrink-0 text-gold-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={active >= 0 ? `${baseId}-opt-${active}` : undefined}
          onKeyDown={onKeyDown}
          className={`absolute z-50 max-h-60 w-full overflow-auto rounded-lg border border-gold-500/20 bg-[color:var(--surface-2)] py-1 shadow-2xl shadow-black/40 focus:outline-none ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          {norm.length === 0 && <li className="px-3.5 py-2 text-sm text-white/35">Sem opções</li>}
          {norm.map((o, i) => {
            const isSel = String(o.value) === String(value)
            const isActive = i === active
            return (
              <li
                key={`${o.value}-${i}`}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={isSel}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-sm transition-colors ${isActive ? 'bg-gold-500/15 text-gold-100' : 'text-white/85'}`}
              >
                <span className="truncate">{o.label}</span>
                {isSel && <Check size={15} className="flex-shrink-0 text-gold-400" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
