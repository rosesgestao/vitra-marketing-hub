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
