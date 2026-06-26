// Canal leve entre o Copiloto e a tela de Tráfego Pago (PremiumDashboard). O copiloto grava uma
// "intenção" e o painel a consome ao montar (o App remonta a view ao navegar — key={view}).
// Mantido em memória do módulo (vive durante a sessão SPA). Usa-se peek (ler sem limpar) no mount
// para sobreviver ao double-mount do React.StrictMode em dev; o painel limpa depois de aplicar.
//
//  { type: 'select', campaignId }                 -> selecionar a campanha no painel
//  { type: 'create', prefill: {name,product_name,neighborhood,price} } -> abrir "Nova campanha" preenchida

export const TRAFEGO_INTENT_EVENT = 'vitra:trafego-intent'

let pending = null

// Grava a intenção E avisa via evento — assim o painel aplica mesmo quando JÁ está montado (navegar
// para a view atual é no-op no App, sem remount). Quem acabou de montar lê via peek.
export function setTrafegoIntent(intent) {
  pending = intent || null
  if (pending && typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent(TRAFEGO_INTENT_EVENT)) } catch (_) { /* SSR/sem window */ }
  }
}
export function peekTrafegoIntent() { return pending }
export function clearTrafegoIntent() { pending = null }
