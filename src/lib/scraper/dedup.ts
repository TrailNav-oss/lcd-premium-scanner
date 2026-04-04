import type { Annonce } from '@/types/annonce'

// Deduplicate annonces cross-platform
// Strategy: group by normalized address + price ±10% + surface ±5%
// Keep the one with the most info, link others via alsoFoundOn

export function deduplicateAnnonces(annonces: Annonce[]): Annonce[] {
  const groups = new Map<string, Annonce[]>()

  for (const annonce of annonces) {
    const key = buildDedupKey(annonce)
    const group = groups.get(key) || []
    group.push(annonce)
    groups.set(key, group)
  }

  const result: Annonce[] = []
  for (const group of Array.from(groups.values())) {
    if (group.length === 1) {
      result.push(group[0])
      continue
    }

    // Sort by quality score desc — best one wins
    group.sort((a, b) => qualityScore(b) - qualityScore(a))
    const best = { ...group[0] }

    // Enrich with "also found on" info
    const otherSources = group
      .slice(1)
      .map(a => a.source)
      .filter(s => s !== best.source)

    if (otherSources.length > 0) {
      best.description = best.description
        ? `${best.description}\n\n[Aussi trouvee sur : ${otherSources.join(', ')}]`
        : `[Aussi trouvee sur : ${otherSources.join(', ')}]`
    }

    result.push(best)
  }

  return result
}

function buildDedupKey(a: Annonce): string {
  // Normalize ville
  const ville = normalizeVille(a.ville || a.codePostal || 'unknown')

  // Price bucket: ±10% → round to nearest 10k
  const prixBucket = Math.round(a.prix / 10000)

  // Surface bucket: ±5% → round to nearest 5m²
  const surfaceBucket = a.surface ? Math.round(a.surface / 5) : 0

  // Pieces
  const pieces = a.nbPieces || 0

  return `${ville}-${prixBucket}-${surfaceBucket}-${pieces}`
}

function normalizeVille(ville: string): string {
  return ville
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function qualityScore(a: Annonce): number {
  let score = 0
  if (a.photos.length > 0) score += a.photos.length * 2
  if (a.description && a.description.length > 50) score += 5
  if (a.surface) score += 3
  if (a.dpe) score += 3
  if (a.latitude && a.longitude) score += 4
  if (a.nbPieces) score += 2
  if (a.nbChambres) score += 2
  if (a.etage !== undefined) score += 1
  if (a.charges) score += 1
  if (a.taxeFonciere) score += 1
  if (a.datePublication) score += 1
  return score
}
