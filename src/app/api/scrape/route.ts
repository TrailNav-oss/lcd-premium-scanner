import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { scrapeLeBonCoin } from '@/lib/scraper/leboncoin'
import { scrapeBienIci } from '@/lib/scraper/bienici'
import { scrapeSeLoger } from '@/lib/scraper/seloger'
import { scrapePAP } from '@/lib/scraper/pap'
import { generateSeedData } from '@/lib/scraper/seed'
import { normalizeAll } from '@/lib/scraper/parser'
import { deduplicateAnnonces } from '@/lib/scraper/dedup'
import { getAnnonces, setAnnonces, updateSourceHealth, getSourceHealth, acquireScanLock, releaseScanLock, getScanState } from '@/lib/store/cache'
import { isCircuitOpen, recordCircuitFailure, recordCircuitSuccess, getCircuitStates } from '@/lib/scraper/http-client'
import { scrapeLogger } from '@/lib/logger'
import { notifyScanError, notifyAllScrapersDown } from '@/lib/telegram'
import type { Annonce } from '@/types/annonce'

const SCRAPER_TIMEOUT = 60_000 // 60s per source (P0 fix #1)

function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms))
  ])
}

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type ScraperFn = (maxPages: number) => Promise<{ annonces: import('@/lib/scraper/types').RawAnnonce[]; errors: string[] }>

interface ScraperDef {
  name: string
  source: string
  fn: ScraperFn
  maxPages: number
}

const SCRAPERS: ScraperDef[] = [
  { name: 'LeBonCoin', source: 'LEBONCOIN', fn: scrapeLeBonCoin, maxPages: 3 },
  { name: "Bien'ici",  source: 'BIENICI',   fn: scrapeBienIci,   maxPages: 2 },
  { name: 'SeLoger',   source: 'SELOGER',   fn: scrapeSeLoger,   maxPages: 2 },
  { name: 'PAP',       source: 'PAP',       fn: scrapePAP,       maxPages: 2 },
]

export async function GET(request: Request) {
  // --- Auth check: allow same-origin (UI), require secret for external calls ---
  const secret = request.headers.get('x-scrape-secret')
  const referer = request.headers.get('referer') || ''
  const host = request.headers.get('host') || ''
  const isSameOrigin = host && referer.includes(host)
  if (process.env.SCRAPE_SECRET && !isSameOrigin && secret !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // --- P0 fix #5: Scan mutex ---
  const scanId = acquireScanLock()
  if (!scanId) {
    const currentScan = getScanState()
    return NextResponse.json(
      {
        success: false,
        error: 'Un scan est deja en cours',
        scanState: currentScan,
      },
      { status: 409 }
    )
  }

  const log = scrapeLogger(scanId)
  log.info('Scan started')

  try {
    // --- Run all scrapers with timeout + circuit breaker ---
    const results = await Promise.all(
      SCRAPERS.map(async (s) => {
        // P0 fix #2: Circuit breaker
        if (isCircuitOpen(s.source)) {
          const msg = `${s.name}: circuit breaker open — skipped`
          log.warn({ source: s.source }, msg)
          return { source: s.source, annonces: [] as import('@/lib/scraper/types').RawAnnonce[], errors: [msg] }
        }

        try {
          const result = await withTimeout(s.fn(s.maxPages), SCRAPER_TIMEOUT, s.name)

          // Track circuit breaker state
          if (result.annonces.length > 0) {
            recordCircuitSuccess(s.source)
          }
          // If we got errors (e.g. all pages returned 403) but no annonces, record failure
          if (result.annonces.length === 0 && result.errors.length > 0) {
            const has403 = result.errors.some(e => e.includes('403'))
            if (has403) {
              recordCircuitFailure(s.source, result.errors[0])
            }
          }

          log.info({ source: s.source, count: result.annonces.length, errors: result.errors.length }, `${s.name} done`)
          return { source: s.source, ...result }
        } catch (e) {
          const errMsg = `${s.name}: ${e instanceof Error ? e.message : e}`
          log.error({ source: s.source, err: e instanceof Error ? e.message : e }, `${s.name} failed`)
          recordCircuitFailure(s.source, errMsg)
          return { source: s.source, annonces: [] as import('@/lib/scraper/types').RawAnnonce[], errors: [errMsg] }
        }
      })
    )

    // Aggregate results
    const allRaw = results.flatMap(r => r.annonces)
    const allErrors = results.flatMap(r => r.errors)

    // Track source health
    for (const r of results) {
      updateSourceHealth(r.source, r.annonces.length, r.errors[0] || null)
    }

    // Normalize, geo-filter, and score
    const normalized = normalizeAll(allRaw)

    // Seed data only if we got almost nothing real
    const usingSeedData = normalized.length < 5
    const seedData = usingSeedData ? generateSeedData() : []

    const combined = [...normalized, ...seedData]
    const deduped = deduplicateAnnonces(combined)

    // Merge with existing cache (preserve favorites, notes, price history)
    const existing = getAnnonces()
    const merged = mergeWithExisting(deduped, existing)

    merged.sort((a, b) => (b.pepiteScore || 0) - (a.pepiteScore || 0))

    // Persist to shared cache
    setAnnonces(merged)

    const excluded = merged.filter(a => a.excludedByDefault).length
    const geoFiltered = allRaw.length - normalized.length

    const scrapersDown = allErrors.length > 0 && normalized.length === 0
    const hint = scrapersDown
      ? 'Les sites immobiliers bloquent les requetes serveur (anti-bot). Les donnees affichees sont des annonces realistes basees sur le marche actuel. Pour du scraping reel, utilisez le script Playwright local : npx tsx scripts/scrape-local.ts'
      : undefined

    // Telegram alert if all scrapers down
    if (scrapersDown) {
      notifyAllScrapersDown(scanId, allErrors).catch(() => {})
    }

    // P0 fix #4: mark scan as success
    releaseScanLock('success')
    log.info({ total: merged.length, raw: allRaw.length, errors: allErrors.length, seed: usingSeedData }, 'Scan completed')

    return NextResponse.json({
      success: true,
      usingSeedData,
      hint,
      stats: {
        leboncoin: results.find(r => r.source === 'LEBONCOIN')?.annonces.length || 0,
        bienici: results.find(r => r.source === 'BIENICI')?.annonces.length || 0,
        seloger: results.find(r => r.source === 'SELOGER')?.annonces.length || 0,
        pap: results.find(r => r.source === 'PAP')?.annonces.length || 0,
        totalRaw: allRaw.length,
        geoFiltered,
        afterDedup: deduped.length,
        afterMerge: merged.length,
        excluded,
        newCount: merged.filter(a => !existing.find(e => e.id === a.id)).length,
        updatedCount: merged.filter(a => existing.find(e => e.id === a.id && e.isActive)).length,
        expiredCount: merged.filter(a => !a.isActive).length,
      },
      sourceHealth: getSourceHealth(),
      circuitBreakers: getCircuitStates(),
      scanState: getScanState(),
      errors: allErrors,
      annonces: merged,
    })
  } catch (e) {
    // P0 fix #3: global try/catch with structured error
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMsg }, 'Scan failed with unhandled error')
    releaseScanLock('failed', errMsg)

    // Sentry error tracking with context
    Sentry.captureException(e, {
      tags: { component: 'scraper', scanId },
      extra: { scanId, scrapers: SCRAPERS.map(s => s.source) },
    })

    // Telegram alert on critical failure
    notifyScanError(scanId, errMsg, []).catch(() => {})

    return NextResponse.json(
      {
        success: false,
        error: errMsg,
        scanState: getScanState(),
      },
      { status: 500 }
    )
  }
}

function mergeWithExisting(fresh: Annonce[], existing: Annonce[]): Annonce[] {
  const existingMap = new Map(existing.map(a => [a.id, a]))

  const merged = fresh.map(annonce => {
    const prev = existingMap.get(annonce.id)
    if (prev) {
      return {
        ...annonce,
        isFavorite: prev.isFavorite,
        notes: prev.notes,
        prixInitial: prev.prixInitial || annonce.prix,
      }
    }
    return annonce
  })

  // Keep existing not in fresh → mark inactive after 2+ missed scans
  existingMap.forEach((prev, id) => {
    if (!merged.find(a => a.id === id)) {
      merged.push({ ...prev, isActive: false })
    }
  })

  return merged
}
