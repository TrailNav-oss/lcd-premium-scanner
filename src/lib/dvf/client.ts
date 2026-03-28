// DVF (Demandes de Valeurs Foncières) - données ouvertes data.gouv.fr
// Prix de vente réels par commune

export interface DVFTransaction {
  id_mutation: string
  date_mutation: string
  nature_mutation: string
  valeur_fonciere: number
  adresse_numero: string
  adresse_nom_voie: string
  code_postal: string
  nom_commune: string
  type_local: string
  surface_reelle_bati: number
  nombre_pieces_principales: number
  latitude: number
  longitude: number
  prix_m2: number
}

const DVF_API = 'https://api.cquest.org/dvf'

const COMMUNES_INSEE: Record<string, string> = {
  'bourgoin-centre': '38053',
  'bourgoin-champaret': '38053',
  'cremieu': '38138',
  'la-tour-du-pin': '38509',
  'la-verpilliere': '38537',
  'isle-abeau': '38193',
}

export async function fetchDVFForZone(zoneSlug: string, limit = 50): Promise<DVFTransaction[]> {
  const codeCommune = COMMUNES_INSEE[zoneSlug]
  if (!codeCommune) return []

  try {
    const params = new URLSearchParams({
      code_commune: codeCommune,
      nature_mutation: 'Vente',
      type_local: 'Appartement',
    })

    const res = await fetch(`${DVF_API}?${params}`, {
      headers: {
        'User-Agent': 'lcd-premium-scanner/1.0',
      },
    })

    if (!res.ok) return []

    const data = await res.json()
    const results = (data.resultats || []).slice(0, limit)

    return results
      .filter((r: Record<string, unknown>) => r.valeur_fonciere && r.surface_reelle_bati && (r.surface_reelle_bati as number) > 10)
      .map((r: Record<string, unknown>) => ({
        id_mutation: r.id_mutation as string,
        date_mutation: r.date_mutation as string,
        nature_mutation: r.nature_mutation as string,
        valeur_fonciere: r.valeur_fonciere as number,
        adresse_numero: r.adresse_numero as string || '',
        adresse_nom_voie: r.adresse_nom_voie as string || '',
        code_postal: r.code_postal as string || '',
        nom_commune: r.nom_commune as string || '',
        type_local: r.type_local as string || '',
        surface_reelle_bati: r.surface_reelle_bati as number,
        nombre_pieces_principales: r.nombre_pieces_principales as number || 0,
        latitude: r.latitude as number || 0,
        longitude: r.longitude as number || 0,
        prix_m2: Math.round((r.valeur_fonciere as number) / (r.surface_reelle_bati as number)),
      }))
  } catch (e) {
    console.error('DVF fetch error:', e)
    return []
  }
}

export async function fetchDVFAllZones(): Promise<Record<string, DVFTransaction[]>> {
  const results: Record<string, DVFTransaction[]> = {}
  for (const slug of Object.keys(COMMUNES_INSEE)) {
    results[slug] = await fetchDVFForZone(slug)
    await new Promise(r => setTimeout(r, 500)) // rate limit
  }
  return results
}
