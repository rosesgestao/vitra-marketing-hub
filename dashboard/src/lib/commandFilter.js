// Filtro do Command Palette (⌘K). PURO e testável. Normaliza acentos (PT) para que "metricas" ache
// "Métricas" e "trafego" ache "Tráfego". Casamento multi-termo (AND) sobre label + grupo + keywords.

const DIACRITICS = /[̀-ͯ]/g

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
}

export function filterCommands(items, query) {
  const q = normalizeText(query).trim()
  if (!q) return items
  const terms = q.split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    const haystack = normalizeText(`${item.label} ${item.group || ''} ${item.keywords || ''}`)
    return terms.every((term) => haystack.includes(term))
  })
}
