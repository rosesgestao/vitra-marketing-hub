import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft } from 'lucide-react'
import { filterCommands } from '../lib/commandFilter.js'

// Command Palette (⌘K) — busca global de telas (P1.7). Controlado pelo App (open/onClose). Acessível:
// combobox (input) + listbox (resultados) com aria-activedescendant; setas/Enter/Esc; foco vai pro input
// ao abrir e volta ao gatilho ao fechar; scroll do body travado. Reutiliza .modal-overlay/.modal-panel.
export default function CommandPalette({ open, onClose, items = [], onNavigate }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const restoreRef = useRef(null)

  const results = useMemo(() => filterCommands(items, query), [items, query])

  useEffect(() => {
    if (!open) return undefined
    restoreRef.current = document.activeElement
    setQuery('')
    setActive(0)
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Esc global (robusto — não depende de onde está o foco).
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onEsc, true)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onEsc, true)
      document.body.style.overflow = prevOverflow
      const el = restoreRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [open, onClose])

  // Mantém o índice ativo dentro dos resultados quando a lista encolhe.
  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, results.length - 1)))
  }, [results.length])

  // Mantém o item ativo visível.
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const choose = (item) => {
    if (!item) return
    onNavigate?.(item.id)
    onClose?.()
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose?.()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(current + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[active])
    }
  }

  const listId = 'cmdk-list'

  return (
    <div
      className="modal-overlay items-start pt-[12vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Busca rápida" className="modal-panel w-full max-w-xl">
        <div className="flex items-center gap-2.5 border-b border-gold-500/12 px-4 py-3">
          <Search size={16} className="text-gold-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `cmdk-opt-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Buscar telas"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar telas… (ex.: métricas, tráfego, biblioteca)"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/40 sm:block">Esc</kbd>
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-y-auto py-1.5">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-white/40">Nenhuma tela encontrada para “{query}”.</li>
          )}
          {results.map((item, idx) => {
            const Icon = item.icon
            const selected = idx === active
            return (
              <li
                key={item.id}
                id={`cmdk-opt-${idx}`}
                data-idx={idx}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(item)
                }}
                className={`mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  selected ? 'bg-gold-500/15 text-white' : 'text-white/70'
                }`}
              >
                {Icon && <Icon size={15} className={selected ? 'text-gold-300' : 'text-white/40'} aria-hidden="true" />}
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">{item.group}</span>
                {selected && <CornerDownLeft size={13} className="text-gold-300" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
