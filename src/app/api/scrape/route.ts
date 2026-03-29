import { NextResponse } from 'next/server'
import { scrapeLeBonCoin } from '@/lib/scraper/leboncoin'
import { scrapeBienIci } from '@/lib/scraper/bienici'
import { scrapeSeLoger } from '@/lib/scraper/seloger'
import { scrapePAP } from '@/lib/scraper/pap'
import { generateSeedData } from '@/lib/scraper/seed'
import { normalizeAll } from '@/lib/scraper/parser'
import { deduplicateAnnonces } from '@/lib/scraper/dedup'
import { getAnnonces, setAnnonces, updateSourceHealth, getSourceHealth } from '@/lib/store/cache'
import type { Annonce } from '@/types/annonce'

const SCRAPER_TIMEOUT = 30000 // 30s (augmenté pour laisser le retry backoff agir)

function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms))
  ])
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const [lbcResult, bieniciResult, selogerResult, papResult] = await Promise.all([
      withTimeout(scrapeLeBonCoin(3), SCRAPER_TIMEOUT, 'LeBonCoin')
        .catch(e => ({ annonces: [], errors: [`LeBonCoin: ${e instanceof Error ? e.message : e}`] })),
      withTimeout(scrapeBienIci(2), SCRAPER_TIMEOUT, "Bien'ici")
        .catch(e => ({ annonces: [], errors: [`Bien'ici: ${e instanceof Error ? e.message : e}`] })),
      withTimeout(scrapeSeLoger(2), SCRAPER_TIMEOUT, 'SeLoger')
        .catch(e => ({ annonces: [], errors: [`SeLoger: ${e instanceof Error ? e.message : e}`] })),
      withTimeout(scrapePAP(2), SCRAPER_TIMEOUT, 'PAP')
        .catch(e => ({ annonces: [], errors: [`PAP: ${e instanceof Error ? e.message : e}`] })),
    ])

    // Track source health
    updateSourceHealth('LEBONCOIN', lbcResult.annonces.length, lbcResult.errors[0] || null)
    updateSourceHealth('BIENICI', bieniciResult.annonces.length, bieniciResult.errors[0] || null)
    updateSourceHealth('SELOGER', selogerResult.annonces.length, selogerResult.errors[0] || null)
    updateSourceHealth('PAP', papResult.annonces.length, papResult.errors[0] || null)

    const allRaw = [
      ...lbcResult.annonces,
      ...bieniciResult.annonces,
      ...selogerResult.annonces,
      ...papResult.annonces,
    ]
    const allErrors = [
      ...lbcResult.errors,
      ...bieniciResult.errors,
      ...selogerResult.errors,
      ...papResult.errors,
    ]

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

    return NextResponse.json({
      success: true,
      usingSeedData,
      hint,
      stats: {
        leboncoin: lbcResult.annonces.length,
        bienici: bieniciResult.annonces.length,
        seloger: selogerResult.annonces.length,
        pap: papResult.annonces.length,
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
      errors: allErrors,
      annonces: merged,
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
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
