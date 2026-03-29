import type { RawAnnonce } from './types'

// PAP.fr search API
const PAP_API = 'https://ws.pap.fr/immobilier/annonces'

const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://www.pap.fr/',
  'Origin': 'https://www.pap.fr',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnonce(ad: any): RawAnnonce | null {
  try {
    const prix = ad.prix || ad.price
    if (!prix || prix < 30000 || prix > 200000) return null

    const id = ad.id || ad.reference
    if (!id) return null

    return {
      externalId: String(id),
      source: 'PAP',
      url: ad.url || ad.link || `https://www.pap.fr/annonces/${id}`,
      title: ad.titre || ad.title || `${ad.typeBien || 'Appartement'} ${ad.nbPieces || ''}p`,
      description: ad.texte || ad.description || '',
      prix,
      surface: ad.surface || ad.surfaceHabitable,
      nbPieces: ad.nbPieces || ad.rooms,
      nbChambres: ad.nbChambres || ad.bedrooms,
      etage: ad.etage,
      dpe: ad.dpe?.lettre || ad.energyClass,
      ges: ad.ges?.lettre || ad.ghgClass,
      charges: ad.charges,
      photos: (ad.photos || ad.images || ad.medias || [])
        .map((p: string | { url?: string; src?: string }) =>
          typeof p === 'string' ? p : (p.url || p.src)
        )
        .filter(Boolean) as string[],
      latitude: ad.latitude || ad.coordonnees?.latitude,
      longitude: ad.longitude || ad.coordonnees?.longitude,
      adresse: ad.adresse,
      codePostal: ad.codePostal || ad.cp,
      ville: ad.ville || ad.commune,
      datePublication: ad.dateCreation || ad.datePublication,
    }
  } catch {
    return null
  }
}

export async function scrapePAP(maxPages = 2): Promise<{ annonces: RawAnnonce[]; errors: string[] }> {
  const annonces: RawAnnonce[] = []
  const errors: string[] = []

  for (let page = 1; page <= maxPages; page++) {
    try {
      const params = new URLSearchParams({
        typeBien: 'appartement',
        typeTransaction: 'vente',
        geo: 'bourgoin-jallieu-38-g',
        rayonMax: '20', // 20km autour
        prixMin: '30000',
        prixMax: '200000',
        nbPiecesMin: '1',
        nbPiecesMax: '4',
        page: String(page),
        size: '25',
      })

      const res = await fetch(`${PAP_API}?${params}`, {
        headers: HEADERS,
      })

      if (!res.ok) {
        errors.push(`PAP page ${page}: HTTP ${res.status}`)
        continue
      }

      const data = await res.json()
      const ads = data._embedded?.annonce || data.annonces || data.results || data.items || []

      for (const ad of (Array.isArray(ads) ? ads : [])) {
        const mapped = mapAnnonce(ad)
        if (mapped) annonces.push(mapped)
      }

      if (page < maxPages) {
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (e) {
      errors.push(`PAP page ${page}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return { annonces, errors }
}
