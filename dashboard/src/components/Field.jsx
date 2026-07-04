// Campo de formulário rotulado (label + children). Compartilhado por vários modais/forms do dashboard.
// Extraído de PremiumDashboard.jsx (Onda 4).
export function Field({ label, labelClass, className = '', children }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}
