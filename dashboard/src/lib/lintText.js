// Traduz os códigos do Creative Lint (metadata.lint) em texto legível para o operador. PURO/testável.
// Os códigos vêm do gate determinístico (creativeLint.ts): erros bloqueiam; warnings são consultivos.

export function humanizeLintNote(code) {
  const raw = String(code || '')
  const kind = raw.split(':')[0]
  const arg = raw.slice(kind.length + 1)
  switch (kind) {
    case 'token_font': return `Fonte fora da marca: ${arg}`
    case 'token_color': return `Cor fora da paleta: ${arg}`
    case 'logo_crowding': {
      const m = arg.match(/^([a-z]+):(\d+)<(\d+)/i)
      return m ? `Logo próxima da ${m[1]} (folga ${m[2]}px < ${m[3]}px)` : 'Logo próxima do texto'
    }
    case 'contrast': {
      const m = arg.match(/^([a-z]+):([\d.]+)</i)
      return m ? `Contraste baixo em "${m[1]}" (${m[2]}:1)` : 'Contraste insuficiente'
    }
    case 'safe_zone': return `Elemento fora da área segura: ${arg}`
    case 'overflow': return `Texto sem espaço (encolheu ao limite): ${arg}`
    case 'char_limit': return `Texto acima do limite de caracteres: ${arg}`
    case 'dead_gap': return 'Faixa vertical vazia (respiro irregular)'
    case 'axis_misaligned': return 'Textos fora do mesmo eixo'
    case 'price_weak': return 'Preço com pouco destaque'
    case 'underfill': return `Vazio lateral sem função: ${arg}`
    case 'overlap': return `Sobreposição de blocos: ${arg}`
    case 'logo_missing': return 'Logo ausente'
    default: return raw
  }
}

// Agrupa os itens do lint (erros + warnings) já humanizados, sem duplicatas.
export function humanizeLintList(list) {
  const seen = new Set()
  const out = []
  for (const c of Array.isArray(list) ? list : []) {
    const t = humanizeLintNote(c)
    if (!seen.has(t)) { seen.add(t); out.push(t) }
  }
  return out
}
