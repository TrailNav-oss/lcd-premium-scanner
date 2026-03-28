import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Annonce } from '@/types/annonce'
import { generateSeedData } from '@/lib/scraper/seed'

const DATA_FILE = join(process.cwd(), 'src', 'data', 'annonces-cache.json')

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Load cached annonces, fallback to seed data
  let annonces: Annonce[] = []
  try {
    if (existsSync(DATA_FILE)) {
      annonces = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
    }
  } catch { /* empty */ }

  // If no cache, use realistic seed data
  if (annonces.length === 0) {
    annonces = generateSeedData()
  }

  // Apply filters
  const prixMin = searchParams.get('prixMin') ? Number(searchParams.get('prixMin')) : undefined
  const prixMax = searchParams.get('prixMax') ? Number(searchParams.get('prixMax')) : undefined
  const surfaceMin = searchParams.get('surfaceMin') ? Number(searchParams.get('surfaceMin')) : undefined
  const surfaceMax = searchParams.get('surfaceMax') ? Number(searchParams.get('surfaceMax')) : undefined
  const nbPiecesMin = searchParams.get('nbPiecesMin') ? Number(searchParams.get('nbPiecesMin')) : undefined
  const dpeMax = searchParams.get('dpeMax')
  const zone = searchParams.get('zone')
  const source = searchParams.get('source')
  const scoreMin = searchParams.get('scoreMin') ? Number(searchParams.get('scoreMin')) : undefined
  const activeOnly = searchParams.get('activeOnly') !== 'false'
  const favoritesOnly = searchParams.get('favoritesOnly') === 'true'
  const excludeNonStandard = searchParams.get('excludeNonStandard') !== 'false' // true by default
  const saleType = searchParams.get('saleType') // filter specific sale type
  const sortBy = searchParams.get('sortBy') || 'pepiteScore'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const search = searchParams.get('search')

  let filtered = annonces

  if (activeOnly) filtered = filtered.filter(a => a.isActive)
  if (favoritesOnly) filtered = filtered.filter(a => a.isFavorite)
  // Exclude viager, enchères, parking, etc. by default
  if (excludeNonStandard) filtered = filtered.filter(a => !a.excludedByDefault)
  if (saleType) filtered = filtered.filter(a => a.saleType === saleType)
  if (prixMin) filtered = filtered.filter(a => a.prix >= prixMin)
  if (prixMax) filtered = filtered.filter(a => a.prix <= prixMax)
  if (surfaceMin) filtered = filtered.filter(a => (a.surface || 0) >= surfaceMin)
  if (surfaceMax) filtered = filtered.filter(a => (a.surface || 0) <= surfaceMax)
  if (nbPiecesMin) filtered = filtered.filter(a => (a.nbPieces || 0) >= nbPiecesMin)
  if (zone) filtered = filtered.filter(a => a.zoneSlug === zone)
  if (source) filtered = filtered.filter(a => a.source === source)
  if (scoreMin) filtered = filtered.filter(a => (a.pepiteScore || 0) >= scoreMin)
  if (dpeMax) {
    const dpeOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const maxIdx = dpeOrder.indexOf(dpeMax.toUpperCase())
    if (maxIdx >= 0) {
      filtered = filtered.filter(a => {
        if (!a.dpe) return true
        return dpeOrder.indexOf(a.dpe) <= maxIdx
      })
    }
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.ville || '').toLowerCase().includes(q) ||
      (a.adresse || '').toLowerCase().includes(q)
    )
  }

  // Sort
  const sortFn = (a: Annonce, b: Annonce): number => {
    let va: number, vb: number
    switch (sortBy) {
      case 'prix': va = a.prix; vb = b.prix; break
      case 'prixM2': va = a.prixM2 || 99999; vb = b.prixM2 || 99999; break
      case 'surface': va = a.surface || 0; vb = b.surface || 0; break
      case 'rendementBrut': va = a.rendementBrut || 0; vb = b.rendementBrut || 0; break
      case 'joursEnLigne': va = a.joursEnLigne || 0; vb = b.joursEnLigne || 0; break
      case 'pepiteScore':
      default: va = a.pepiteScore || 0; vb = b.pepiteScore || 0; break
    }
    return sortOrder === 'desc' ? vb - va : va - vb
  }
  filtered.sort(sortFn)

  return NextResponse.json({
    total: filtered.length,
    annonces: filtered,
  })
}
