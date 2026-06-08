import { describe, it, expect } from 'vitest'
import { htmlToReadableText, extractListingMeta, htmlToBodyText, decodeEntities } from '../listingText.js'

// Degrau B' por LINK: HTML da pagina do imovel -> texto limpo para a IA extrair fatos. A limpeza e a
// parte de maior risco (ruido vs ancoragem), entao trancamos o comportamento aqui.

describe('decodeEntities', () => {
  it('decodifica entidades nomeadas, numericas e hex', () => {
    expect(decodeEntities('Pre&ccedil;o &amp; condi&ccedil;&otilde;es')).toBe('Preço & condições')
    expect(decodeEntities('R&#36;&#32;539')).toBe('R$ 539')
    expect(decodeEntities('caf&#xe9;')).toBe('café')
  })
})

describe('extractListingMeta', () => {
  it('pega title e meta description (qualquer ordem de atributo)', () => {
    const html = `<title>Residencial Aurora — Menino Deus</title>
      <meta name="description" content="2 dormitorios com suite, 61m2, a partir de R$ 539 mil.">`
    const meta = extractListingMeta(html)
    expect(meta.title).toBe('Residencial Aurora — Menino Deus')
    expect(meta.description).toMatch(/R\$ 539 mil/)
  })

  it('cai no og:description quando nao ha description', () => {
    const html = `<meta content="Cobertura no Moinhos, 320m2." property="og:description">`
    expect(extractListingMeta(html).description).toBe('Cobertura no Moinhos, 320m2.')
  })
})

describe('htmlToBodyText', () => {
  it('remove script/style/nav/footer e mantem o texto util', () => {
    const html = `
      <nav>Home Sobre Contato</nav>
      <script>var preco = 999999; alert('x')</script>
      <style>.x{color:red}</style>
      <main><h1>Residencial Aurora</h1><p>2 dorms com suite.</p><p>R$ 539 mil</p></main>
      <footer>Rodape com telefone 51 99999-9290</footer>`
    const text = htmlToBodyText(html)
    expect(text).toContain('Residencial Aurora')
    expect(text).toContain('2 dorms com suite.')
    expect(text).toContain('R$ 539 mil')
    expect(text).not.toContain('999999') // script removido
    expect(text).not.toContain('color:red') // style removido
    expect(text).not.toContain('Home Sobre Contato') // nav removido
    expect(text).not.toContain('99999-9290') // footer removido
  })

  it('converte blocos em quebras de linha e colapsa espacos', () => {
    const text = htmlToBodyText('<p>linha um</p><div>linha   dois</div>')
    expect(text).toBe('linha um\nlinha dois')
  })

  it('script/style SEM fechamento (pagina truncada) nao vaza codigo', () => {
    const text = htmlToBodyText('<p>ok</p><script>var leakedSecret=123; doEvil();')
    expect(text).toContain('ok')
    expect(text).not.toContain('leakedSecret')
    expect(text).not.toContain('doEvil')
  })
})

describe('htmlToReadableText', () => {
  it('prepoe title+descricao ao corpo', () => {
    const html = `<title>Aurora</title><meta name="description" content="Resumo limpo."><main><p>Corpo do anuncio.</p></main>`
    const text = htmlToReadableText(html)
    expect(text.startsWith('Aurora\nResumo limpo.')).toBe(true)
    expect(text).toContain('Corpo do anuncio.')
  })

  it('pagina SPA (corpo vazio) retorna so o cabecalho (ou pouco texto -> fallback no fluxo)', () => {
    const html = `<title>App</title><div id="root"></div><script>render()</script>`
    const text = htmlToReadableText(html)
    expect(text.length).toBeLessThan(50) // pouco texto -> o fluxo avisa e cai no paste
  })

  it('respeita o maxChars', () => {
    const html = `<main>${'a '.repeat(6000)}</main>`
    expect(htmlToReadableText(html, { maxChars: 500 }).length).toBeLessThanOrEqual(500)
  })
})
