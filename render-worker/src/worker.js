import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { renderAssetPng, getBrowser, closeBrowser } from './render.js'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = process.env.STORAGE_BUCKET || 'cards'
const BATCH = Number(process.env.BATCH_SIZE || 3)
const INTERVAL = Number(process.env.POLL_INTERVAL_MS || 15000)
const PORT = Number(process.env.PORT || 8787)
const RENDER_TOKEN = process.env.RENDER_TOKEN || ''

if (!URL || !KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } })
const campaignCache = new Map()

async function getCampaign(id) {
  if (campaignCache.has(id)) return campaignCache.get(id)
  const { data } = await sb.from('premium_campaigns').select('*').eq('id', id).single()
  campaignCache.set(id, data)
  return data
}

// Reivindica um lote de assets 'queued' marcando-os como 'rendering' (evita conflito com o cron edge).
async function claim(n) {
  const { data: queued, error } = await sb
    .from('premium_campaign_assets')
    .select('*')
    .not('channel', 'in', '(whatsapp,email)')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(n)
  if (error) throw error
  if (!queued || !queued.length) return []
  const ids = queued.map(a => a.id)
  const { error: uErr } = await sb
    .from('premium_campaign_assets')
    .update({ status: 'rendering', updated_at: new Date().toISOString() })
    .in('id', ids)
  if (uErr) throw uErr
  return queued
}

async function processOne(asset) {
  const campaign = await getCampaign(asset.campaign_id)
  const png = await renderAssetPng(asset, campaign)
  const slug = (campaign && (campaign.slug || campaign.id)) || 'campanha'
  const path = `premium-campaigns/${slug}/rendered/${asset.id}.png`
  const up = await sb.storage.from(BUCKET).upload(path, png, { contentType: 'image/png', upsert: true })
  if (up.error) throw up.error
  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)
  const { error } = await sb
    .from('premium_campaign_assets')
    .update({ status: 'generated', storage_bucket: BUCKET, storage_path: path, public_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', asset.id)
  if (error) throw error
  return pub.publicUrl
}

async function finalizeJobs(campaignIds) {
  for (const cid of campaignIds) {
    const { count } = await sb
      .from('premium_campaign_assets')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', cid)
      .not('channel', 'in', '(whatsapp,email)')
      .in('status', ['queued', 'rendering'])
    const pending = count || 0
    if (pending === 0) {
      await sb.from('premium_generation_jobs')
        .update({ status: 'done', progress: 100, finished_at: new Date().toISOString() })
        .eq('campaign_id', cid).eq('job_type', 'asset_render').in('status', ['queued', 'running'])
    } else {
      await sb.from('premium_generation_jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('campaign_id', cid).eq('job_type', 'asset_render').eq('status', 'queued')
    }
  }
}

let running = false
async function drain() {
  if (running) return { skipped: true, claimed: 0 }
  running = true
  let rendered = 0, failed = 0
  try {
    const batch = await claim(BATCH)
    const touched = new Set()
    for (const asset of batch) {
      touched.add(asset.campaign_id)
      try {
        await processOne(asset)
        rendered++
      } catch (e) {
        failed++
        console.error('[render falhou]', asset.id, e.message)
        await sb.from('premium_campaign_assets')
          .update({ status: 'error', updated_at: new Date().toISOString() })
          .eq('id', asset.id)
      }
    }
    if (touched.size) await finalizeJobs([...touched])
    return { rendered, failed, claimed: batch.length }
  } finally {
    running = false
  }
}

async function loop() {
  try {
    const r = await drain()
    if (r.claimed) console.log('[lote]', r)
  } catch (e) {
    console.error('[drain erro]', e.message)
  }
  setTimeout(loop, INTERVAL)
}

if (process.argv.includes('--once')) {
  (async () => {
    let total = 0
    // drena ate esvaziar a fila
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const r = await drain()
      if (!r.claimed) break
      total += r.rendered
    }
    console.log('[--once] concluido, rendered =', total)
    await closeBrowser()
    process.exit(0)
  })()
} else {
  const app = express()
  app.use(express.json())
  app.get('/healthz', (_req, res) => res.json({ ok: true }))
  app.post('/render', async (req, res) => {
    if (RENDER_TOKEN && req.get('x-render-token') !== RENDER_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    try { res.json(await drain()) } catch (e) { res.status(500).json({ error: e.message }) }
  })
  app.listen(PORT, () => console.log(`render-worker on :${PORT} (poll ${INTERVAL}ms, batch ${BATCH})`))
  getBrowser().then(() => loop()).catch(e => { console.error(e); process.exit(1) })
  process.on('SIGTERM', async () => { await closeBrowser(); process.exit(0) })
}
