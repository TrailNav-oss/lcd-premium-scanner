export type Source = 'LEBONCOIN' | 'SELOGER' | 'BIENICI' | 'PAP' | 'LOGICIMMO'

export type SaleType = 'standard' | 'viager' | 'encheres' | 'nue-propriete' | 'indivision' | 'lot' | 'local-commercial' | 'terrain' | 'parking' | 'programme-neuf' | 'suspect'

export interface Annonce {
  id: string
  externalId: string
  source: Source
  url: string
  title: string
  description?: string
  prix: number
  surface?: number
  nbPieces?: number
  nbChambres?: number
  etage?: number
  dpe?: string
  ges?: string
  charges?: number
  taxeFonciere?: number
  annee?: number
  photos: string[]
  latitude?: number
  longitude?: number
  adresse?: string
  codePostal?: string
  ville?: string
  pepiteScore?: number
  rendementBrut?: number
  potentielLCD?: number
  prixM2?: number
  prixInitial?: number
  joursEnLigne?: number
  datePublication?: string
  isActive: boolean
  isFavorite: boolean
  notes?: string
  zoneSlug?: string
  saleType?: SaleType
  saleTypeLabel?: string
  saleTypeReason?: string
  excludedByDefault?: boolean
}
