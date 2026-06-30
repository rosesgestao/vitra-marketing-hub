import { cloneElement, isValidElement, useId } from 'react'

// Vitra UI — CAMPO de formulário acessível. Resolve o problema dos ~150 inputs sem <label htmlFor>:
// gera um id, associa o <label>, e liga hint/erro via aria-describedby. role="alert" no erro para anúncio.
// Uso: <FormField label="Nome" required hint="..." error={err}><input className="form-input" /></FormField>
// O id é injetado no filho automaticamente (se ele já não tiver um).
export default function FormField({ label, hint, error, required = false, htmlFor, children, className = '' }) {
  const auto = useId()
  const id = htmlFor || auto
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-invalid': error ? true : children.props['aria-invalid'],
        'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
        'aria-required': required || children.props['aria-required'] || undefined,
      })
    : children

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && (
            <span className="text-gold-400" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-[11px] leading-4 text-white/40">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-[11px] leading-4 text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
