// Espelha os geradores de peças (capas/banners) do diretório de brand assets para
// dashboard/public/pecas, seguindo a mesma convenção já usada em public/brand.
// Fonte da verdade continua em vitra-agentes-marketing/vitra_brand_assets; rode
// `npm run sync:pecas` após editar/adicionar geradores para atualizar a cópia servida.
//
// Falha graciosa: se a pasta de origem não existir (ex.: outra máquina/clone parcial),
// apenas avisa e sai com 0 — nunca quebra o dev/build.

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const here = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = path.resolve(here, '../../../vitra-agentes-marketing/vitra_brand_assets')
const DEST_DIR = path.resolve(here, '../public/pecas')

// Geradores de peças = capas/banners sociais. Exclui brandbooks e quaisquer outros HTML.
const PATTERNS = [/^capa-facebook-.*\.html$/i, /^capa-youtube-.*\.html$/i, /^linkedin-.*\.html$/i]

function isPeca(name) {
  return PATTERNS.some(rx => rx.test(name))
}

async function main() {
  let entries
  try {
    entries = await fs.readdir(SOURCE_DIR)
  } catch (err) {
    console.warn(`[sync:pecas] origem indisponível (${SOURCE_DIR}). Pulando. Detalhe: ${err.message}`)
    return
  }

  const files = entries.filter(isPeca).sort()
  if (!files.length) {
    console.warn(`[sync:pecas] nenhum gerador encontrado em ${SOURCE_DIR}.`)
    return
  }

  await fs.mkdir(DEST_DIR, { recursive: true })
  let copied = 0
  for (const name of files) {
    await fs.copyFile(path.join(SOURCE_DIR, name), path.join(DEST_DIR, name))
    copied += 1
  }
  console.log(`[sync:pecas] ${copied} gerador(es) sincronizado(s) -> public/pecas`)
  for (const name of files) console.log(`  · ${name}`)
}

main().catch(err => {
  // Mesmo em erro inesperado, não derruba o pipeline de dev/build.
  console.warn(`[sync:pecas] aviso: ${err.message}`)
})
