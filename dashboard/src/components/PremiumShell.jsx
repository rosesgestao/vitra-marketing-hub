export function PremiumPageHeader({ kicker, title, subtitle, actions }) {
  return (
    <div className="premium-page-header">
      <div>
        <p className="premium-kicker">{kicker}</p>
        <h1 className="premium-title">{title}</h1>
        {subtitle && <p className="premium-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// Aviso reutilizavel para telas que representam visao de roadmap (ainda nao implementadas).
// Mantem a UI honesta sobre o que e operacional vs. planejado.
export function RoadmapNotice({ children }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-gold-500/25 bg-gold-500/5 px-4 py-3">
      <span className="mt-0.5 inline-flex h-5 items-center rounded bg-gold-500/15 px-2 text-[10px] font-semibold uppercase tracking-wider text-gold-200">
        Roadmap
      </span>
      <p className="text-xs leading-relaxed text-white/60">{children}</p>
    </div>
  )
}
