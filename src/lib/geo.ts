// Géolocalisation — filtre haversine, centre Bourgoin-Jallieu

export const GEO_CENTER = {
  lat: 45.5856,
  lng: 5.2739,
}

export const GEO_RADIUS_KM = 50

/** Distance haversine entre deux points GPS en km */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // rayon Terre en km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/** Vérifie si un point est dans le rayon autour de Bourgoin-Jallieu */
export function isWithinRadius(lat: number, lng: number, radiusKm = GEO_RADIUS_KM): boolean {
  return haversineKm(GEO_CENTER.lat, GEO_CENTER.lng, lat, lng) <= radiusKm
}

/** Distance depuis le centre Bourgoin-Jallieu */
export function distanceFromCenter(lat: number, lng: number): number {
  return haversineKm(GEO_CENTER.lat, GEO_CENTER.lng, lat, lng)
}

/** Codes postaux connus dans le rayon 50km de Bourgoin-Jallieu */
const CP_IN_RADIUS = new Set([
  // Isère Nord
  '38300', '38080', '38290', '38110', '38460', '38090', '38070',
  '38230', '38510', '38390', '38540', '38590', '38270', '38440',
  '38260', '38280', '38210', '38200', '38340', '38780',
  // Ain limitrophe
  '01120', '01150', '01800',
  // Rhône limitrophe
  '69330', '69780',
])

/** Vérifie si un code postal est dans la zone connue */
export function isCPInRadius(codePostal: string): boolean {
  return CP_IN_RADIUS.has(codePostal)
}

/** Codes postaux clairement hors zone (grandes villes loin) */
const CP_OUT_OF_RADIUS = new Set([
  '42000', '42100', '42200', '42300', // St-Etienne (~100km)
  '69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009', // Lyon centre (OK si <50km mais vérifier)
  '73000', '73100', // Chambéry (~80km)
  '26000', '26100', // Valence (~100km)
])

export function isCPOutOfRadius(codePostal: string): boolean {
  return CP_OUT_OF_RADIUS.has(codePostal)
}
