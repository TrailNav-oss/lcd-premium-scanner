import type { RawAnnonce } from './types'
import { lbcHeaders, fetchWithRetry, randomDelay } from './http-client'

const LBC_API = 'https://api.leboncoin.fr/finder/search'

// Recherche centrée sur Bourgoin-Jallieu, rayon géré par les locations
const SEARCH_PARAMS = {
  category: '9', // ventes immobilieres
  locations: [
    { city: 'Bourgoin-Jallieu', zipcode: '38300', department_id: '38', region_id: '22' },
    { city: "L'Isle-d'Abeau", zipcode: '38080', department_id: '38', region_id: '22' },
    { city: 'La Verpillière', zipcode: '38290', department_id: '38', region_id: '22' },
    { city: 'La Tour-du-Pin', zipcode: '38110', department_id: '38', region_id: '22' },
    { city: 'Crémieu', zipcode: '38460', department_id: '38', region_id: '22' },
    { city: 'Villefontaine', zipcode: '38090', department_id: '38', region_id: '22' },
    { city: 'Saint-Quentin-Fallavier', zipcode: '38070', department_id: '38', region_id: '22' },
  ],
  real_estate_type: ['1', '2'], // 1=maison, 2=appartement
  price: { min: 30000, max: 200000 },
  rooms: { min: 1, max: 4 },
}

function parseDPE(attributes: Record<string, string>[]): string | undefined {
  const dpe = attributes?.find((a: Record<string, string>) => a.key === 'energy_rate')
  return dpe?.value || undefined
}

function parseGES(attributes: Record<string, string>[]): string | undefined {
  const ges = attributes?.find((a: Record<string, string>) => a.key === 'ges')
  return ges?.value || undefined
}

function getAttrNum(attributes: Record<string, string>[], key: string): number | undefined {
  const attr = attributes?.find((a: Record<string, string>) => a.key === key)
  return attr?.value ? parseInt(attr.value) : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnonce(ad: any): RawAnnonce | null {
  try {
    const prix = ad.price?.[0]
    if (!prix || prix < 30000) return null

    const attrs = ad.attributes || []

    return {
      externalId: String(ad.list_id),
      source: 'LEBONCOIN',
      url: ad.url || `https://www.leboncoin.fr/ventes_immobilieres/${ad.list_id}.htm`,
      title: ad.subject || '',
      description: ad.body || '',
      prix,
      surface: getAttrNum(attrs, 'square'),
      nbPieces: getAttrNum(attrs, 'rooms'),
      nbChambres: getAttrNum(attrs, 'bedrooms'),
      etage: getAttrNum(attrs, 'floor_number'),
      dpe: parseDPE(attrs),
      ges: parseGES(attrs),
      charges: getAttrNum(attrs, 'charges_included'),
      photos: (ad.images?.urls_large || ad.images?.urls || []) as string[],
      latitude: ad.location?.lat,
      longitude: ad.location?.lng,
      adresse: ad.location?.address,
      codePostal: ad.location?.zipcode,
      ville: ad.location?.city,
      datePublication: ad.first_publication_date || ad.index_date,
    }
  } catch {
    return null
  }
}

export async function scrapeLeBonCoin(maxPages = 3): Promise<{ annonces: RawAnnonce[]; errors: string[] }> {
  const annonces: RawAnnonce[] = []
  const errors: string[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      const body = {
        ...SEARCH_PARAMS,
        limit: 35,
        offset: (page - 1) * 35,
        sort_by: 'time',
        sort_order: 'desc',
        owner_type: 'all',
      }

      const res = await fetchWithRetry(LBC_API, {
        method: 'POST',
        headers: lbcHeaders(),
        body: JSON.stringify(body),
        retries: 2,
        backoffMs: 2000,
      })

      if (!res.ok) {
        errors.push(`LeBonCoin page ${page}: HTTP ${res.status}`)
        continue
      }

      const data = await res.json()
      const ads = data.ads || []

      for (const ad of ads) {
        const mapped = mapAnnonce(ad)
        if (mapped) annonces.push(mapped)
      }

      if (page < maxPages) {
        await randomDelay(2000, 5000)
      }
    } catch (e) {
      errors.push(`LeBonCoin page ${page}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return { annonces, errors }
}
