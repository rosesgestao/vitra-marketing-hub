// Roteamento por HASH (deep-link / P0). Mantém a navegação por estado já existente, mas espelha a view
// ativa na URL (#/<viewId>) para: compartilhar link, abrir direto, e usar voltar/avançar do browser.
// PURO e testável — o App liga estes helpers a window.location.hash + listener de hashchange.

// Extrai o id da view a partir do hash. Aceita "#/metricas", "#metricas", "#/pecas:facebook".
// Retorna null quando não há hash (cai para localStorage/default no App).
export function viewIdFromHash(hash) {
  const raw = String(hash || '')
    .replace(/^#/, '')
    .replace(/^\//, '')
    .trim()
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

// Monta o hash canônico de uma view.
export function hashForViewId(id) {
  return `#/${id}`
}
