import type { RawAnnonce } from './types'
import { selogerHeaders, fetchWithRetry, randomDelay } from './http-client'

const SELOGER_SEARCH_API = 'https://www.seloger.com/search/v1/search'

// Codes INSEE communes autour de Bourgoin-Jallieu (rayon ~30km)
const COMMUNES = ['38053', '38193', '38537', '38515', '38138', '38509', '38090', '38070']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnonce(ad: any): RawAnnonce | null {
  try {
    const prix = ad.price || ad.pricing?.price
    if (!prix || prix < 30000 || prix > 200000) return null

    const id = ad.id || ad.classifiedId || ad.listingId
    if (!id) return null

    return {
      externalId: String(id),
      source: 'SELOGER',
      url: ad.permalink || ad.classifiedURL || `https://www.seloger.com/annonces/achat/appartement/${id}.htm`,
      title: ad.title || ad.description?.title || `Appartement ${ad.rooms || ''}p`,
      description: ad.description?.text || ad.description || '',
      prix,
      surface: ad.livingArea || ad.surface || ad.surfaceArea,
      nbPieces: ad.rooms || ad.roomsQuantity,
      nbChambres: ad.bedrooms || ad.bedroomsQuantity,
      etage: ad.floor,
      dpe: ad.energyPerformanceDiagnostic?.categoryLetter || ad.energy_rate,
      ges: ad.greenHouseGasEmission?.categoryLetter || ad.ges,
      charges: ad.charges,
      photos: (ad.photos || ad.images || []).map((p: string | { url: string }) =>
        typeof p === 'string' ? p : p.url
      ).filter(Boolean) as string[],
      latitude: ad.coordinates?.latitude || ad.latitude || ad.contact?.latitude,
      longitude: ad.coordinates?.longitude || ad.longitude || ad.contact?.longitude,
      adresse: ad.address || ad.contact?.address,
      codePostal: ad.zipCode || ad.postalCode || ad.contact?.zipCode,
      ville: ad.city || ad.cityLabel || ad.contact?.city,
      datePublication: ad.publicationDate || ad.lastModified,
    }
  } catch {
    return null
  }
}

export async function scrapeSeLoger(maxPages = 2): Promise<{ annonces: RawAnnonce[]; errors: string[] }> {
  const annonces: RawAnnonce[] = []
  const errors: string[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      const params = new URLSearchParams({
        types: '1',
        projects: '2',
        places: COMMUNES.map(c => `{ci:${c}}`).join('|'),
        price: '30000/200000',
        rooms: '1,2,3,4',
        LISTING_TYPE_ID: '1',
        sortBy: '1',
        pageIndex: String(page),
        pageSize: '25',
      })

      const res = await fetchWithRetry(`${SELOGER_SEARCH_API}?${params}`, {
        headers: selogerHeaders(),
        retries: 2,
        backoffMs: 3000,
      })

      if (!res.ok) {
        // Fallback endpoint
        const altRes = await fetchWithRetry(
          `https://www.seloger.com/api/v1/listings?transactionType=buy&propertyTypes=flat&locations=${COMMUNES.join(',')}&priceMin=30000&priceMax=200000&page=${page}`,
          { headers: selogerHeaders(), retries: 1, backoffMs: 2000 }
        )

        if (!altRes.ok) {
          errors.push(`SeLoger page ${page}: HTTP ${res.status} (principal) / ${altRes.status} (alt)`)
          continue
        }

        const altData = await altRes.json()
        const ads = altData.items || altData.listings || altData.results || []
        for (const ad of (Array.isArray(ads) ? ads : [])) {
          const mapped = mapAnnonce(ad)
          if (mapped) annonces.push(mapped)
        }
      } else {
        const data = await res.json()
        const ads = data.items || data.listings || data.cards || data.results || []

        for (const ad of (Array.isArray(ads) ? ads : [])) {
          const mapped = mapAnnonce(ad)
          if (mapped) annonces.push(mapped)
        }
      }

      if (page < maxPages) {
        await randomDelay(3000, 6000)
      }
    } catch (e) {
      errors.push(`SeLoger page ${page}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return { annonces, errors }
}
