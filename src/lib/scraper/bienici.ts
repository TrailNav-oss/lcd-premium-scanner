import type { RawAnnonce } from './types'

const BIENICI_API = 'https://www.bienici.com/realEstateAds.json'

const SEARCH_AREA = {
  // Bourgoin-Jallieu area bounding box
  zoneIdsByType: {
    zoneIds: ['38053', '38193', '38537', '38515', '38138'] // INSEE codes
  },
}

const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://www.bienici.com/',
  'Origin': 'https://www.bienici.com',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnonce(ad: any): RawAnnonce | null {
  try {
    const prix = ad.price
    if (!prix || prix < 30000 || prix > 200000) return null

    return {
      externalId: ad.id || ad.adId || String(ad.objectID),
      source: 'BIENICI',
      url: `https://www.bienici.com/annonce/${ad.id || ad.adId}`,
      title: ad.title || `${ad.adTypeFR || 'Bien'} ${ad.roomsQuantity || ''}p ${ad.surfaceArea || ''}m²`,
      description: ad.description || '',
      prix,
      surface: ad.surfaceArea,
      nbPieces: ad.roomsQuantity,
      nbChambres: ad.bedroomsQuantity,
      etage: ad.floor,
      dpe: ad.energyClassification || ad.energyValue,
      ges: ad.greenhouseGasClassification || ad.greenhouseGasValue,
      charges: ad.charges,
      photos: (ad.photos || []).map((p: { url?: string; url_large?: string }) => p.url_large || p.url).filter(Boolean) as string[],
      latitude: ad.blurredGeoInfo?.lat || ad.city?.lat,
      longitude: ad.blurredGeoInfo?.lng || ad.city?.lng,
      adresse: ad.address,
      codePostal: ad.postalCode || ad.city?.postalCode,
      ville: ad.cityLabel || ad.city?.label,
      datePublication: ad.publicationDate || ad.modificationDate,
    }
  } catch {
    return null
  }
}

export async function scrapeBienIci(maxPages = 2): Promise<{ annonces: RawAnnonce[]; errors: string[] }> {
  const annonces: RawAnnonce[] = []
  const errors: string[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      const params = new URLSearchParams({
        filters: JSON.stringify({
          size: 24,
          from: (page - 1) * 24,
          filterType: 'buy',
          propertyType: ['flat'],
          minPrice: '30000',
          maxPrice: '200000',
          minRooms: '1',
          maxRooms: '4',
          ...SEARCH_AREA,
          sortBy: 'relevance',
          sortOrder: 'desc',
        }),
      })

      const res = await fetch(`${BIENICI_API}?${params}`, {
        headers: HEADERS,
      })

      if (!res.ok) {
        errors.push(`Bien'ici page ${page}: HTTP ${res.status}`)
        continue
      }

      const data = await res.json()
      const ads = data.realEstateAds || data || []

      if (Array.isArray(ads)) {
        for (const ad of ads) {
          const mapped = mapAnnonce(ad)
          if (mapped) annonces.push(mapped)
        }
      }

      if (page < maxPages) {
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (e) {
      errors.push(`Bien'ici page ${page}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return { annonces, errors }
}
