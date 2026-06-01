import puppeteer from 'puppeteer'
import { buildCreative } from './template.js'

let browser

export async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
    })
  }
  return browser
}

export async function closeBrowser() {
  if (browser) { await browser.close(); browser = undefined }
}

export async function renderAssetPng(asset, campaign) {
  const { html, width, height } = buildCreative(asset, campaign)
  const b = await getBrowser()
  const page = await b.newPage()
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
    try { await page.evaluate(() => (document.fonts ? document.fonts.ready : null)) } catch (_) {}
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } })
    return buf
  } finally {
    await page.close()
  }
}
