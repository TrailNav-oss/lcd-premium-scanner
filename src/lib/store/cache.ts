// Cache mémoire partagé côté serveur — singleton entre les API routes
import type { Annonce } from '@/types/annonce'

export interface SourceHealth {
  lastSuccessAt: string | null
  lastErrorAt: string | null
  lastError: string | null
  lastCount: number
}

interface AppCache {
  annonces: Annonce[]
  lastScrapedAt: string | null
  sourceHealth: Record<string, SourceHealth>
}

// Singleton global — survit entre les requêtes dans le même process serverless
const globalCache: AppCache = {
  annonces: [],
  lastScrapedAt: null,
  sourceHealth: {
    LEBONCOIN: { lastSuccessAt: null, lastErrorAt: null, lastError: null, lastCount: 0 },
    SELOGER: { lastSuccessAt: null, lastErrorAt: null, lastError: null, lastCount: 0 },
    BIENICI: { lastSuccessAt: null, lastErrorAt: null, lastError: null, lastCount: 0 },
    PAP: { lastSuccessAt: null, lastErrorAt: null, lastError: null, lastCount: 0 },
  },
}

export function getCache(): AppCache {
  return globalCache
}

export function setAnnonces(annonces: Annonce[]) {
  globalCache.annonces = annonces
  globalCache.lastScrapedAt = new Date().toISOString()
}

export function getAnnonces(): Annonce[] {
  return globalCache.annonces
}

export function updateSourceHealth(source: string, count: number, error: string | null) {
  if (!globalCache.sourceHealth[source]) {
    globalCache.sourceHealth[source] = { lastSuccessAt: null, lastErrorAt: null, lastError: null, lastCount: 0 }
  }
  const h = globalCache.sourceHealth[source]
  h.lastCount = count
  if (count > 0) {
    h.lastSuccessAt = new Date().toISOString()
    h.lastError = null
  }
  if (error) {
    h.lastErrorAt = new Date().toISOString()
    h.lastError = error
  }
}

export function getSourceHealth(): Record<string, SourceHealth> {
  return globalCache.sourceHealth
}
