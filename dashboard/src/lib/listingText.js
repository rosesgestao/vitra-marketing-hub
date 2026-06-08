// Conversao PURA de HTML de uma pagina de imovel em texto legivel para a IA extrair fatos (degrau B'
// por LINK). Prioriza title + meta description + og:description (resumos limpos da construtora), depois
// o corpo (sem nav/script/footer). NAO renderiza JavaScript: paginas SPA voltam quase vazias — tratado
// como "texto fino" no fluxo (fallback para colar o texto). Sem deps: roda no middleware do Vite (Node)
// e nos testes Vitest.

const NAMED_ENTITIES = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  laquo: '«', raquo: '»', ndash: '-', mdash: '—', hellip: '…', deg: '°',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', atilde: 'ã', otilde: 'õ',
  acirc: 'â', ecirc: 'ê', ocirc: 'ô', ccedil: 'ç', agrave: 'à',
}

export function decodeEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)) } catch { return ' ' } })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)) } catch { return ' ' } })
    .replace(/&([a-zA-Z]+);/g, (whole, name) => (name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : whole))
}

function metaContent(html, re) {
  const m = String(html || '').match(re)
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : ''
}

// Extrai os resumos limpos: <title>, meta description e og:description (cobre as duas ordens de atributo).
export function extractListingMeta(html) {
  const s = String(html || '')
  const title = metaContent(s, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const description =
    metaContent(s, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    metaContent(s, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
  const ogDescription =
    metaContent(s, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
    metaContent(s, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i)
  return { title, description: description || ogDescription }
}

// Limpa o corpo: tira comentarios, blocos sem texto util (script/style/svg), e ruido estrutural
// (nav/header/footer/aside); converte blocos em quebras de linha; remove o resto das tags; decodifica.
export function htmlToBodyText(html) {
  let s = String(html || '')
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
  // Cauda sem fechamento (pagina truncada / tag mal-formada): nao deixa JS/CSS vazar para o texto.
  s = s.replace(/<(script|style)\b[\s\S]*$/i, ' ')
  s = s.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, ' ')
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol|table)>/gi, '\n')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<[^>]+>/g, ' ')
  s = decodeEntities(s)
  return s
    .split('\n')
    .map(line => line.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Texto final para a IA: cabecalho (title + descricao) + corpo, limitado a maxChars (igual ao
// MAX_SOURCE da Edge extract-facts). maxInput limita o HTML CRU processado pelos regex — barra o custo
// quadratico de paginas gigantes/mal-formadas (DoS do dev server); 300KB cobre o texto util de uma
// pagina real de imovel.
export function htmlToReadableText(html, { maxChars = 8000, maxInput = 300000 } = {}) {
  const src = String(html || '').slice(0, maxInput)
  const meta = extractListingMeta(src)
  const head = [meta.title, meta.description].filter(Boolean).join('\n')
  const body = htmlToBodyText(src)
  return [head, body].filter(Boolean).join('\n\n').trim().slice(0, maxChars)
}
