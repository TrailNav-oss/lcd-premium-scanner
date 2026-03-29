import { NextResponse } from 'next/server'
import { scrapeLeBonCoin } from '@/lib/scraper/leboncoin'
import { scrapeBienIci } from '@/lib/scraper/bienici'
import { scrapeSeLoger } from '@/lib/scraper/seloger'
import { scrapePAP } from '@/lib/scraper/pap'
import { generateSeedData } from '@/lib/scraper/seed'
import { normalizeAll } from '@/lib/scraper/parser'
import { deduplicateAnnonces } from '@/lib/scraper/dedup'
import type { Annonce } from '@/types/annonce'

// In-memory cache (persists across requests within the same serverless instance)
let memoryCache: Annonce[] = []

// Timeout pour les scrapers qui ne répondent pas
const SCRAPER_TIMEOUT = 15000 // 15s

function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms))
  ])
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel: max 60s pour les API routes

export async function GET() {
  try {
    // Scrape all sources in parallel with timeout
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

    // Normalize and score all annonces
    const normalized = normalizeAll(allRaw)

    // If no real data scraped, use seed data (realistic market data)
    const usingSeedData = normalized.length < 5
    const seedData = usingSeedData ? generateSeedData() : []

    // Combine real + seed, deduplicate
    const combined = [...normalized, ...seedData]
    const deduped = deduplicateAnnonces(combined)

    // Merge with in-memory cache (preserve favorites, notes, price history)
    const merged = mergeWithExisting(deduped, memoryCache)

    // Sort by pepite score desc
    merged.sort((a, b) => (b.pepiteScore || 0) - (a.pepiteScore || 0))

    // Save to memory cache
    memoryCache = merged

    // Count excluded (viager, etc.)
    const excluded = merged.filter(a => a.excludedByDefault).length

    // Build helpful hint when scrapers fail
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
        afterDedup: deduped.length,
        afterMerge: merged.length,
        excluded,
      },
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

function mergeWithExisting(
  fresh: Annonce[],
  existing: Annonce[]
): Annonce[] {
  const existingMap = new Map(existing.map(a => [a.id, a]))

  const merged = fresh.map(annonce => {
    const prev = existingMap.get(annonce.id)
    if (prev) {
      // Track price changes
      const prixHistorique = prev.prixInitial && annonce.prix !== prev.prix
        ? annonce.prix
        : prev.prix

      return {
        ...annonce,
        isFavorite: prev.isFavorite,
        notes: prev.notes,
        prixInitial: prev.prixInitial || annonce.prix,
        prix: prixHistorique,
      }
    }
    return annonce
  })

  // Keep existing annonces not found in fresh (mark inactive)
  existingMap.forEach((prev, id) => {
    if (!merged.find(a => a.id === id)) {
      merged.push({ ...prev, isActive: false })
    }
  })

  return merged
}
