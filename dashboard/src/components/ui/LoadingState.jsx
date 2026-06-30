import { Loader2 } from 'lucide-react'

// Vitra UI — primitivo de CARREGAMENTO padrão. Substitui os spinners inline ad-hoc (cada view inventava
// o seu). `full` centraliza num bloco alto (carga de tela); sem ele, fica inline (ao lado de um texto/ação).
// role="status" + aria-live="polite" para o leitor de tela anunciar o estado. Respeita o focus-ring global.
export default function LoadingState({ label = 'Carregando', full = false, size = 22, className = '' }) {
  const spinner = (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-white/55">
      <Loader2 size={size} className="animate-spin text-gold-400" aria-hidden="true" />
      {label && <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>}
    </span>
  )
  if (!full) return <span className={className}>{spinner}</span>
  return <div className={`flex min-h-[12rem] items-center justify-center ${className}`}>{spinner}</div>
}
