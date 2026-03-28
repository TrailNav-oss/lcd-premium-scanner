import type { Source } from '@/types/annonce'

export interface RawAnnonce {
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
  datePublication?: string
}

export interface ScraperConfig {
  source: Source
  name: string
  maxPages: number
  delayMs: number
}

export interface ScraperResult {
  source: Source
  annonces: RawAnnonce[]
  errors: string[]
  scrapedAt: string
}
