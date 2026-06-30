import { AlertTriangle, RotateCw } from 'lucide-react'

// Vitra UI — primitivo de ERRO acionável. role="alert" + aria-live="assertive" para anúncio imediato no
// leitor de tela. `onRetry` dá o caminho de recuperação (sem ele, vira só a mensagem). Antes várias views
// quebravam em branco na falha de carga (sem try/catch) — este é o destino padrão desses erros.
export default function ErrorAlert({ message = 'Algo deu errado.', onRetry, retryLabel = 'Tentar de novo', className = '' }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex flex-col gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <span className="flex items-center gap-2">
        <AlertTriangle size={16} className="shrink-0 text-red-300" aria-hidden="true" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-ghost inline-flex items-center gap-1.5 self-start text-red-100 sm:self-auto"
        >
          <RotateCw size={14} aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
