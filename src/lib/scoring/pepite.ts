import type { Annonce } from '@/types/annonce'
import type { Zone } from '@/types/zone'
import zonesData from '@/data/zones-bourgoin.json'

const zones = zonesData as Zone[]

function getZoneForAnnonce(annonce: Annonce): Zone | undefined {
  // Match by zone slug or by closest zone
  if (annonce.zoneSlug) {
    return zones.find(z => z.slug === annonce.zoneSlug)
  }
  if (annonce.latitude && annonce.longitude) {
    return findClosestZone(annonce.latitude, annonce.longitude)
  }
  if (annonce.ville) {
    const villeLower = annonce.ville.toLowerCase()
    return zones.find(z => z.name.toLowerCase().includes(villeLower) || villeLower.includes(z.slug.replace(/-/g, ' ')))
  }
  // Default to Bourgoin centre
  return zones.find(z => z.slug === 'bourgoin-centre')
}

function findClosestZone(lat: number, lng: number): Zone | undefined {
  let closest: Zone | undefined
  let minDist = Infinity
  for (const zone of zones) {
    const dist = Math.sqrt(Math.pow(lat - zone.lat, 2) + Math.pow(lng - zone.lng, 2))
    if (dist < minDist) {
      minDist = dist
      closest = zone
    }
  }
  return closest
}

// Prix score: how much below market (30%)
function calcPrixScore(annonce: Annonce, zone: Zone): number {
  if (!annonce.prixM2 || zone.prixM2 <= 0) return 0
  const ecart = (zone.prixM2 - annonce.prixM2) / zone.prixM2
  return Math.max(0, Math.min(100, ecart * 200)) // 50% sous marché = 100
}

// Rendement score: estimated gross yield (25%)
function calcRendementScore(annonce: Annonce, zone: Zone): number {
  if (annonce.prix <= 0) return 0
  const nuitMoy = (zone.nuiteeMin + zone.nuiteeMax) / 2
  const caAnnuel = nuitMoy * 30.4 * (zone.occupMoy / 100) * 12
  const rendement = (caAnnuel / annonce.prix) * 100
  // > 12% = 100, < 4% = 0
  return Math.max(0, Math.min(100, (rendement - 4) * (100 / 8)))
}

// DPE score: F/G = opportunity (15%)
function calcDPEScore(dpe?: string): number {
  if (!dpe) return 30 // unknown = mild bonus
  const scores: Record<string, number> = { G: 100, F: 80, E: 40, D: 20, C: 0, B: 0, A: 0 }
  return scores[dpe.toUpperCase()] ?? 30
}

// Ancienneté score: how long online (10%)
function calcAncienneteScore(joursEnLigne?: number): number {
  if (!joursEnLigne) return 0
  return Math.min(100, joursEnLigne * 2) // > 50 jours = 100
}

// Baisse prix score (10%)
function calcBaisseScore(annonce: Annonce): number {
  if (!annonce.prixInitial || annonce.prixInitial <= annonce.prix) return 0
  const baissePct = ((annonce.prixInitial - annonce.prix) / annonce.prixInitial) * 100
  return Math.min(100, baissePct * 10) // chaque % de baisse = +10 points
}

// Surface score: optimal LCD 35-55m² (10%)
function calcSurfaceScore(surface?: number): number {
  if (!surface) return 40
  if (surface >= 40 && surface <= 55) return 100
  if ((surface >= 35 && surface < 40) || (surface > 55 && surface <= 65)) return 60
  return 20
}

export function calculatePepiteScore(annonce: Annonce): {
  total: number
  details: {
    prix: number
    rendement: number
    dpe: number
    anciennete: number
    baisse: number
    surface: number
  }
  zone: Zone | undefined
  rendementBrut: number
} {
  const zone = getZoneForAnnonce(annonce)
  if (!zone) {
    return { total: 0, details: { prix: 0, rendement: 0, dpe: 0, anciennete: 0, baisse: 0, surface: 0 }, zone: undefined, rendementBrut: 0 }
  }

  const prix = calcPrixScore(annonce, zone)
  const rendement = calcRendementScore(annonce, zone)
  const dpe = calcDPEScore(annonce.dpe)
  const anciennete = calcAncienneteScore(annonce.joursEnLigne)
  const baisse = calcBaisseScore(annonce)
  const surface = calcSurfaceScore(annonce.surface)

  const total = Math.round(
    prix * 0.30 +
    rendement * 0.25 +
    dpe * 0.15 +
    anciennete * 0.10 +
    baisse * 0.10 +
    surface * 0.10
  )

  // Calcul rendement brut estimé
  const nuitMoy = (zone.nuiteeMin + zone.nuiteeMax) / 2
  const caAnnuel = nuitMoy * 30.4 * (zone.occupMoy / 100) * 12
  const rendementBrut = annonce.prix > 0 ? (caAnnuel / annonce.prix) * 100 : 0

  return {
    total: Math.min(100, total),
    details: { prix, rendement, dpe, anciennete, baisse, surface },
    zone,
    rendementBrut,
  }
}

export function enrichAnnonce(annonce: Annonce): Annonce {
  // Calculate prixM2
  const prixM2 = annonce.surface && annonce.surface > 0 ? Math.round(annonce.prix / annonce.surface) : undefined

  // Calculate pepite score
  const annonceWithPrixM2 = { ...annonce, prixM2 }
  const scoring = calculatePepiteScore(annonceWithPrixM2)

  return {
    ...annonceWithPrixM2,
    pepiteScore: scoring.total,
    rendementBrut: Math.round(scoring.rendementBrut * 10) / 10,
    potentielLCD: scoring.zone?.scoreLCD ? scoring.zone.scoreLCD * 10 : undefined,
    zoneSlug: scoring.zone?.slug || annonce.zoneSlug,
  }
}
