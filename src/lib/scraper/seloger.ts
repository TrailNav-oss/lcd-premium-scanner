import type { RawAnnonce } from './types'

// SeLoger search API
const SELOGER_API = 'https://www.seloger.com/list.htm'

// SeLoger has a JSON endpoint behind their search
const SELOGER_SEARCH_API = 'https://www.seloger.com/search/v1/search'

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://www.seloger.com/',
  'Origin': 'https://www.seloger.com',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
}

// Codes INSEE communes autour de Bourgoin
const COMMUNES = ['38053', '38193', '38537', '38515', '38138', '38509']

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
      // Try the JSON search API
      const params = new URLSearchParams({
        types: '1', // Appartement
        projects: '2', // Achat
        places: COMMUNES.map(c => `{ci:${c}}`).join('|'),
        price: '30000/200000',
        rooms: '1,2,3,4',
        LISTING_TYPE_ID: '1', // Ancien
        sortBy: '1', // Plus récent
        pageIndex: String(page),
        pageSize: '25',
      })

      const res = await fetch(`${SELOGER_SEARCH_API}?${params}`, {
        headers: HEADERS,
      })

      if (!res.ok) {
        // Fallback: try alternative endpoint
        const altRes = await fetch(
          `https://www.seloger.com/api/v1/listings?transactionType=buy&propertyTypes=flat&locations=${COMMUNES.join(',')}&priceMin=30000&priceMax=200000&page=${page}`,
          { headers: HEADERS }
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
        await new Promise(r => setTimeout(r, 3000)) // SeLoger = rate limit strict
      }
    } catch (e) {
      errors.push(`SeLoger page ${page}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return { annonces, errors }
}
