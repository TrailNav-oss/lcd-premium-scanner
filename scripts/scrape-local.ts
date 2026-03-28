#!/usr/bin/env npx tsx
/**
 * Script de scraping local via Playwright
 * Usage: npx tsx scripts/scrape-local.ts
 *
 * Nécessite: npm install playwright
 * Premier lancement: npx playwright install chromium
 *
 * Ce script lance un navigateur headless, scrape LeBonCoin et SeLoger,
 * et sauvegarde les résultats dans src/data/annonces-cache.json
 */

import { chromium } from 'playwright'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'src', 'data', 'annonces-cache.json')

interface RawAnnonce {
  externalId: string
  source: string
  url: string
  title: string
  description: string
  prix: number
  surface?: number
  nbPieces?: number
  dpe?: string
  photos: string[]
  ville?: string
  codePostal?: string
  latitude?: number
  longitude?: number
}

async function scrapeLeBonCoinPlaywright(): Promise<RawAnnonce[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const annonces: RawAnnonce[] = []

  try {
    // Search apartments for sale around Bourgoin-Jallieu
    const url = 'https://www.leboncoin.fr/recherche?category=9&locations=Bourgoin-Jallieu_38300__45.5856_5.2739_10000_20000&real_estate_type=2&price=30000-200000&rooms=1-4&sort=time'

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Extract listings from the page
    const listings = await page.$$eval('[data-test-id="adListCard"], [data-qa-id="aditem_container"], a[href*="/ventes_immobilieres/"]', (elements) => {
      return elements.slice(0, 30).map(el => {
        const link = el.closest('a') || el.querySelector('a')
        const href = link?.href || ''
        const title = el.querySelector('[data-qa-id="aditem_title"], h2, [class*="Title"]')?.textContent?.trim() || ''
        const priceText = el.querySelector('[data-qa-id="aditem_price"], [class*="Price"]')?.textContent?.trim() || ''
        const prix = parseInt(priceText.replace(/[^\d]/g, '')) || 0
        const location = el.querySelector('[data-qa-id="aditem_location"], [class*="Location"]')?.textContent?.trim() || ''
        const img = el.querySelector('img')?.src || ''

        return { href, title, prix, location, img }
      }).filter(a => a.prix >= 30000 && a.prix <= 200000)
    })

    for (const listing of listings) {
      annonces.push({
        externalId: listing.href.match(/\/(\d+)\.htm/)?.[1] || String(Math.random()),
        source: 'LEBONCOIN',
        url: listing.href,
        title: listing.title,
        description: '',
        prix: listing.prix,
        photos: listing.img ? [listing.img] : [],
        ville: listing.location.split(' ')[0],
      })
    }

    console.log(`LeBonCoin: ${annonces.length} annonces trouvées`)
  } catch (e) {
    console.error('LeBonCoin scraping error:', e)
  }

  await browser.close()
  return annonces
}

async function scrapeSeLogerPlaywright(): Promise<RawAnnonce[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const annonces: RawAnnonce[] = []

  try {
    const url = 'https://www.seloger.com/list.htm?types=1&projects=2&places=[{ci:380053}]&price=30000/200000&rooms=1,2,3,4&enterprise=0&qsVersion=1.0'

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    const listings = await page.$$eval('[class*="CardContainer"], [class*="listing-item"], article', (elements) => {
      return elements.slice(0, 25).map(el => {
        const link = el.querySelector('a')
        const href = link?.href || ''
        const title = el.querySelector('[class*="Title"], h2, h3')?.textContent?.trim() || ''
        const priceText = el.querySelector('[class*="Price"], [class*="price"]')?.textContent?.trim() || ''
        const prix = parseInt(priceText.replace(/[^\d]/g, '')) || 0
        const img = el.querySelector('img')?.src || ''

        return { href, title, prix, img }
      }).filter(a => a.prix >= 30000 && a.prix <= 200000)
    })

    for (const listing of listings) {
      annonces.push({
        externalId: listing.href.match(/\/(\d+)\.htm/)?.[1] || String(Math.random()),
        source: 'SELOGER',
        url: listing.href,
        title: listing.title,
        description: '',
        prix: listing.prix,
        photos: listing.img ? [listing.img] : [],
      })
    }

    console.log(`SeLoger: ${annonces.length} annonces trouvées`)
  } catch (e) {
    console.error('SeLoger scraping error:', e)
  }

  await browser.close()
  return annonces
}

async function main() {
  console.log('=== Scraping local (Playwright) ===\n')

  const [lbc, seloger] = await Promise.all([
    scrapeLeBonCoinPlaywright(),
    scrapeSeLogerPlaywright(),
  ])

  const all = [...lbc, ...seloger]
  console.log(`\nTotal: ${all.length} annonces scrapées`)

  // Load existing cache
  let existing: unknown[] = []
  try {
    if (existsSync(DATA_FILE)) {
      existing = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }

  // Save (note: in production, would normalize + score + dedup here)
  console.log(`Cache existant: ${existing.length} annonces`)
  console.log(`Sauvegarde dans ${DATA_FILE}`)

  // For now, just save raw data — the API routes will handle normalization
  writeFileSync(DATA_FILE, JSON.stringify(all, null, 2))
  console.log('Done!')
}

main().catch(console.error)
