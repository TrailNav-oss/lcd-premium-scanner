import type { Annonce } from '@/types/annonce'

// Deduplicate annonces cross-site by fuzzy matching address + surface + price
export function deduplicateAnnonces(annonces: Annonce[]): Annonce[] {
  const seen = new Map<string, Annonce>()

  for (const annonce of annonces) {
    const key = buildDedupKey(annonce)

    if (seen.has(key)) {
      const existing = seen.get(key)!
      // Keep the one with more info (more photos, description, etc.)
      const existingScore = qualityScore(existing)
      const newScore = qualityScore(annonce)
      if (newScore > existingScore) {
        seen.set(key, annonce)
      }
    } else {
      seen.set(key, annonce)
    }
  }

  return Array.from(seen.values())
}

function buildDedupKey(a: Annonce): string {
  // Fuzzy key: ville + price range (±5%) + surface range (±3m²)
  const ville = (a.ville || a.codePostal || 'unknown').toLowerCase().trim()
  const prixBucket = Math.round(a.prix / (a.prix * 0.05)) // 5% buckets
  const surfaceBucket = a.surface ? Math.round(a.surface / 3) : 0 // 3m² buckets

  return `${ville}-${prixBucket}-${surfaceBucket}`
}

function qualityScore(a: Annonce): number {
  let score = 0
  if (a.photos.length > 0) score += a.photos.length
  if (a.description) score += 2
  if (a.surface) score += 2
  if (a.dpe) score += 2
  if (a.latitude && a.longitude) score += 3
  if (a.nbPieces) score += 1
  return score
}
