#!/usr/bin/env node
// Vitra Creative QA Harness — o "loop" determinístico que impede erros básicos ANTES de qualquer
// criativo chegar ao usuário. NÃO depende de julgamento do modelo: renderiza uma MATRIZ de fixtures
// (conteúdo curto/médio/longo × formatos 1:1/9:16/1.91:1) pela Edge real, lê o `metadata.lint`
// (Creative Lint v2 — determinístico) e compara com o RESULTADO ESPERADO de cada fixture.
//
// - Conteúdo normal deve PASSAR (ok:true, métricas dentro dos limiares).
// - Conteúdo-estresse (headline gigante, preço enorme) deve ser REPROVADO pelas regras certas.
// Um criativo "passa no harness" quando o lint bate com a expectativa → regressão fica travada.
//
// Uso (CI ou local):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RENDER_APIKEY=<publishable> \
//   QA_CAMPAIGN_ID=... QA_SOURCE_IMAGE=... node scripts/creative-qa.mjs [--family oferta-ancora]
// Sai com código 1 se qualquer fixture divergir do esperado (falha o CI).
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Carrega .env.qa.local (gitignored) sem dependência externa: procura em dashboard/ e na raiz do repo.
// Só define chaves que ainda não vieram do ambiente (env real do CI tem precedência).
function loadQaEnv() {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [resolve(here, '../.env.qa.local'), resolve(here, '../../.env.qa.local')]
  for (const file of candidates) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m || line.trim().startsWith('#')) continue
      const key = m[1]
      let val = m[2].replace(/^["']|["']$/g, '')
      if (process.env[key] == null || process.env[key] === '') process.env[key] = val
    }
    return file
  }
  return null
}
const loadedFrom = loadQaEnv()

const {
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENDER_APIKEY,
  QA_CAMPAIGN_ID, QA_SOURCE_IMAGE,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RENDER_APIKEY || !QA_CAMPAIGN_ID || !QA_SOURCE_IMAGE) {
  console.error('[qa:creative] faltam variáveis de ambiente.')
  console.error('Crie dashboard/.env.qa.local (gitignored) a partir de dashboard/.env.qa.example e preencha:')
  console.error('  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENDER_APIKEY, QA_CAMPAIGN_ID, QA_SOURCE_IMAGE')
  if (loadedFrom) console.error(`(li ${loadedFrom}, mas ainda falta chave)`)
  process.exit(2)
}

const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const RENDER_URL = `${SUPABASE_URL}/functions/v1/render-asset`
const ALL_FORMATS = { feed: '1:1', story: '9:16', wide: '1.91:1' }
// QA_FORMATS=feed,wide (ex.) limita os formatos — passada rápida sem o 9:16 (que pode dar 546/OOM).
const onlyFormats = (process.env.QA_FORMATS || '').split(',').map((s) => s.trim()).filter(Boolean)
const FORMATS = onlyFormats.length ? Object.fromEntries(Object.entries(ALL_FORMATS).filter(([k]) => onlyFormats.includes(k))) : ALL_FORMATS
const MAX_RENDER_RETRIES = 5 // 9:16 pode dar 546 (OOM de isolate frio) — retry trata como infra, não design

// Conteúdo realista comum (superset de campos; cada builder usa o que precisa e cai em fallback no resto).
const base = {
  price: 'R$ 549.000,00', price_from: 'R$ 629.000,00',
  differentials: '3 dorms sendo 1 suíte|72m² privativos|2 vagas cobertas',
  location: 'Bairro Petrópolis, Porto Alegre', neighborhood: 'Petrópolis', city: 'Porto Alegre',
  rooms: '3', suites: '1', bathrooms: '2', parking: '2', area: '72m²', address: 'Rua Néri Filho, 200',
}
const okFixture = (headline, over = {}) => ({ name: 'medio', expect: 'ok', headline, product_data: { ...base, ...over } })
// curto = conteúdo mínimo porém presente; vazio = SEM product_data (exercita os fallbacks do builder —
// o cenário real que mais quebra em produção). Ambos DEVEM passar (expect ok).
const curtoFixture = (headline, over = {}) => ({ name: 'curto', expect: 'ok', headline, product_data: { price: 'R$ 199.000', location: 'No Centro', differentials: '1 dorm|38m²|Lazer', ...over } })
const vazioFixture = (headline, over = {}) => ({ name: 'vazio', expect: 'ok', headline, product_data: { ...over } })

// Matriz de fixtures por família. `expect: 'ok'` = deve passar; `expectError` = deve reprovar por essa regra.
const MATRIX = {
  'oferta-ancora': {
    family: 'vitra-imobiliaria-oferta-ancora',
    contents: [
      { name: 'curto', expect: 'ok', product_data: { price: 'R$ 199.000', price_from: 'R$ 249.000', differentials: '1 dorm|38m²|Lazer', location: 'No Centro' }, headline: '1 dorm no Centro' },
      { name: 'medio', expect: 'ok', product_data: { price: 'R$ 319.000,00', price_from: 'R$ 439.000,00', differentials: '2 dorms|54m² privativos|Infra completa', location: 'Apenas 2 minutos da PUCRS' }, headline: '2 dorms junto à Av. Ipiranga' },
      { name: 'preco-grande', expect: 'ok', product_data: { price: 'R$ 2.750.000,00', price_from: 'R$ 3.100.000,00', differentials: '4 suítes|220m²|4 vagas', location: 'Frente ao Parque' }, headline: 'Cobertura no Moinhos' },
      { name: 'headline-longa', expectError: 'char_limit', product_data: { price: 'R$ 1.289.000,00', price_from: 'R$ 1.549.000,00', differentials: '3 dorms sendo 1 suíte|72m² com sacada|2 vagas', location: 'A 5 min do Shopping' }, headline: 'Apartamento 3 dormitórios com suíte e sacada gourmet integrada' },
    ],
  },
  // Selecionáveis — médio + curto + vazio (fallbacks). Os ocultos seguem com 1 fixture.
  'hero-checklist': { family: 'vitra-imobiliaria-hero-checklist', contents: [okFixture('Apartamento pronto no Petrópolis'), curtoFixture('1 dorm no Centro'), vazioFixture('Apartamento pronto')] },
  'duo-selos': { family: 'vitra-imobiliaria-duo-selos-offer', contents: [okFixture('Studio garden no Bom Fim'), curtoFixture('Studio no Bom Fim'), vazioFixture('Studio garden')] },
  'hero-panel': { family: 'vitra-imobiliaria-hero-panel-gallery', contents: [okFixture('Cobertura duplex vista parque')] },
  'lancamento': { family: 'vitra-imobiliaria-lancamento', contents: [okFixture('Lançamento na Zona Sul')] },
  'vitrine': { family: 'vitra-imobiliaria-vitrine-gallery', contents: [okFixture('Casa em condomínio fechado'), curtoFixture('Casa no Sul'), vazioFixture('Casa em condomínio')] },
  'oportunidade-bairro': { family: 'vitra-imobiliaria-oportunidade-bairro', contents: [okFixture('Oportunidade no Menino Deus')] },
  'ficha-imovel': { family: 'vitra-imobiliaria-ficha-imovel', contents: [okFixture('2 dorms no Rio Branco'), curtoFixture('2 dorms'), vazioFixture('Apartamento à venda')] },
  // destino-bairro: o HERÓI é o bairro (pd.location, ≤18 chars); o headline vira o subtítulo lifestyle.
  'destino-bairro': { family: 'vitra-imobiliaria-destino-bairro', contents: [okFixture('A poucos passos do Parcão', { location: 'Moinhos de Vento', neighborhood: 'Moinhos de Vento' }), curtoFixture('Perto de tudo', { location: 'Cidade Baixa' }), vazioFixture('A um passo do Parcão')] },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function insertAsset(family, format, ar, content) {
  const metadata = {
    brand_scope: 'vitra_imobiliaria',
    visual_template: { key: family, family, frame: 'none' },
    frame: 'none',
    product_data: content.product_data,
    qa_harness: true,
  }
  const { data, error } = await svc.from('premium_campaign_assets').insert({
    campaign_id: QA_CAMPAIGN_ID, asset_type: 'image', channel: 'meta_ads', format,
    title: `QA ${content.name}`, headline: content.headline, status: 'queued',
    aspect_ratio: ar, template_key: family, source_image_url: QA_SOURCE_IMAGE, metadata,
  }).select('id').single()
  if (error) throw new Error(`insert: ${error.message}`)
  return data.id
}

async function renderWithRetry(assetId) {
  for (let attempt = 1; attempt <= MAX_RENDER_RETRIES; attempt++) {
    // libera assets presos em 'rendering' (546 mata o isolate após o claim)
    await svc.from('premium_campaign_assets').update({ status: 'queued' }).eq('id', assetId).eq('status', 'rendering')
    const res = await fetch(RENDER_URL, {
      method: 'POST', headers: { apikey: RENDER_APIKEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: QA_CAMPAIGN_ID, asset_ids: [assetId], limit: 1 }),
    })
    const body = await res.json().catch(() => ({}))
    const r = (body.results || [])[0]
    if (r?.ok) return true
    if (/compute resources|546/.test(JSON.stringify(body))) { await sleep(1500 * attempt); continue }
    // outro erro real de render
    if (r && r.ok === false) return false
  }
  return false // esgotou retries de 546 → trata como infra (não conta como falha de design)
}

async function readLint(assetId) {
  const { data } = await svc.from('premium_campaign_assets').select('metadata').eq('id', assetId).single()
  return data?.metadata?.lint || null
}

function evaluate(content, lint) {
  if (!lint) return { pass: false, why: 'sem lint (render/infra falhou)' }
  if (content.expect === 'ok') {
    return lint.ok ? { pass: true } : { pass: false, why: `esperava ok, veio: ${(lint.errors || []).join(',')}` }
  }
  if (content.expectError) {
    const hit = (lint.errors || []).some((e) => e.startsWith(content.expectError))
    return hit ? { pass: true } : { pass: false, why: `esperava reprovar por ${content.expectError}, veio: ${lint.ok ? 'ok' : (lint.errors || []).join(',')}` }
  }
  return { pass: false, why: 'fixture sem expectativa' }
}

async function run() {
  const familyArg = process.argv.includes('--family') ? process.argv[process.argv.indexOf('--family') + 1] : null
  const families = familyArg ? [familyArg] : Object.keys(MATRIX)
  const rows = []
  for (const fam of families) {
    const spec = MATRIX[fam]
    if (!spec) { console.error(`família desconhecida: ${fam}`); process.exit(2) }
    for (const content of spec.contents) {
      for (const [format, ar] of Object.entries(FORMATS)) {
        let id
        try {
          id = await insertAsset(spec.family, format, ar, content)
          const rendered = await renderWithRetry(id)
          const lint = rendered ? await readLint(id) : null
          const verdict = evaluate(content, lint)
          rows.push({ fam, content: content.name, format, ...verdict, metrics: lint?.metrics })
        } catch (e) {
          rows.push({ fam, content: content.name, format, pass: false, why: e.message })
        } finally {
          if (id) await svc.from('premium_campaign_assets').delete().eq('id', id)
        }
      }
    }
  }

  console.log('\n=== Vitra Creative QA — relatório ===')
  for (const r of rows) {
    const m = r.metrics ? ` [fill_bar=${r.metrics.fill_bar} fill_price=${r.metrics.fill_price} axis=${r.metrics.axis_spread} price=${r.metrics.price_ratio}]` : ''
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.fam}/${r.content}/${r.format}${r.pass ? '' : ' — ' + r.why}${m}`)
  }
  const failed = rows.filter((r) => !r.pass)
  console.log(`\n${rows.length - failed.length}/${rows.length} ok`)
  if (failed.length) process.exit(1)
}

run().catch((e) => { console.error(e); process.exit(2) })
