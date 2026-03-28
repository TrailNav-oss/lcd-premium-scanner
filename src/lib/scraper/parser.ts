import type { RawAnnonce } from './types'
import type { Annonce } from '@/types/annonce'
import { enrichAnnonce } from '../scoring/pepite'
import { detectSaleType } from './salefilter'
import zonesData from '@/data/zones-bourgoin.json'
import type { Zone } from '@/types/zone'

const zones = zonesData as Zone[]

function findZoneSlug(annonce: RawAnnonce): string | undefined {
  // Try by lat/lng
  if (annonce.latitude && annonce.longitude) {
    let closest: Zone | undefined
    let minDist = Infinity
    for (const zone of zones) {
      const dist = Math.sqrt(
        Math.pow(annonce.latitude - zone.lat, 2) +
        Math.pow(annonce.longitude - zone.lng, 2)
      )
      if (dist < minDist) {
        minDist = dist
        closest = zone
      }
    }
    if (closest && minDist < 0.1) return closest.slug // ~10km radius
  }

  // Try by ville name
  if (annonce.ville) {
    const v = annonce.ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (v.includes('bourgoin')) return 'bourgoin-centre'
    if (v.includes('cremieu')) return 'cremieu'
    if (v.includes('tour') && v.includes('pin')) return 'la-tour-du-pin'
    if (v.includes('verpill')) return 'la-verpilliere'
    if (v.includes('isle') || v.includes('abeau')) return 'isle-abeau'
    if (v.includes('champaret')) return 'bourgoin-champaret'
  }

  // Try by code postal
  if (annonce.codePostal) {
    const cp = annonce.codePostal
    if (cp === '38300') return 'bourgoin-centre'
    if (cp === '38460') return 'cremieu'
    if (cp === '38110') return 'la-tour-du-pin'
    if (cp === '38290') return 'la-verpilliere'
    if (cp === '38080') return 'isle-abeau'
  }

  return 'bourgoin-centre' // default
}

function calculateJoursEnLigne(datePublication?: string): number | undefined {
  if (!datePublication) return undefined
  const pubDate = new Date(datePublication)
  if (isNaN(pubDate.getTime())) return undefined
  const now = new Date()
  return Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function normalizeAnnonce(raw: RawAnnonce): Annonce {
  const zoneSlug = findZoneSlug(raw)
  const joursEnLigne = calculateJoursEnLigne(raw.datePublication)

  // Detect sale type (viager, enchères, etc.)
  const saleTypeResult = detectSaleType(raw.title, raw.description, raw.prix, raw.surface)

  const base: Annonce = {
    id: `${raw.source.toLowerCase()}-${raw.externalId}`,
    externalId: raw.externalId,
    source: raw.source,
    url: raw.url,
    title: raw.title,
    description: raw.description,
    prix: raw.prix,
    surface: raw.surface,
    nbPieces: raw.nbPieces,
    nbChambres: raw.nbChambres,
    etage: raw.etage,
    dpe: raw.dpe?.toUpperCase(),
    ges: raw.ges?.toUpperCase(),
    charges: raw.charges,
    taxeFonciere: raw.taxeFonciere,
    annee: raw.annee,
    photos: raw.photos.filter(Boolean).slice(0, 10),
    latitude: raw.latitude,
    longitude: raw.longitude,
    adresse: raw.adresse,
    codePostal: raw.codePostal,
    ville: raw.ville,
    datePublication: raw.datePublication,
    joursEnLigne,
    prixInitial: raw.prix,
    isActive: true,
    isFavorite: false,
    zoneSlug,
    saleType: saleTypeResult.type,
    saleTypeLabel: saleTypeResult.label,
    saleTypeReason: saleTypeResult.reason,
    excludedByDefault: saleTypeResult.excluded,
  }

  return enrichAnnonce(base)
}

export function normalizeAll(rawAnnonces: RawAnnonce[]): Annonce[] {
  return rawAnnonces.map(normalizeAnnonce)
}
