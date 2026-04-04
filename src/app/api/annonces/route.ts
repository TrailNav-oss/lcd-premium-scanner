import { NextRequest, NextResponse } from 'next/server'
import type { Annonce } from '@/types/annonce'
import { generateSeedData } from '@/lib/scraper/seed'
import { getAnnonces, getSourceHealth } from '@/lib/store/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Use shared cache, fallback to seed data on cold start
  const cached = getAnnonces()
  const annonces: Annonce[] = cached.length > 0 ? cached : generateSeedData()

  // Apply filters
  const parseNum = (key: string): number | undefined => {
    const raw = searchParams.get(key)
    if (raw === null) return undefined
    const n = Number(raw)
    return isNaN(n) ? undefined : n
  }
  const prixMin = parseNum('prixMin')
  const prixMax = parseNum('prixMax')
  const surfaceMin = parseNum('surfaceMin')
  const surfaceMax = parseNum('surfaceMax')
  const nbPiecesMin = parseNum('nbPiecesMin')
  const dpeMax = searchParams.get('dpeMax')
  const zone = searchParams.get('zone')
  const source = searchParams.get('source')
  const scoreMin = parseNum('scoreMin')
  const activeOnly = searchParams.get('activeOnly') !== 'false'
  const favoritesOnly = searchParams.get('favoritesOnly') === 'true'
  const excludeNonStandard = searchParams.get('excludeNonStandard') !== 'false' // true by default
  const saleType = searchParams.get('saleType') // filter specific sale type
  const sortBy = searchParams.get('sortBy') || 'pepiteScore'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const search = searchParams.get('search')
  const id = searchParams.get('id') // fetch single annonce by id

  // Source health query
  if (searchParams.get('health') === 'true') {
    return NextResponse.json({ sourceHealth: getSourceHealth() })
  }

  // Single annonce lookup
  if (id) {
    const found = annonces.find(a => a.id === id)
    // If not found, suggest similar annonces
    if (!found) {
      const similar = annonces
        .filter(a => a.isActive)
        .slice(0, 5)
      return NextResponse.json({ annonce: null, similar })
    }
    return NextResponse.json({ annonce: found })
  }

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
