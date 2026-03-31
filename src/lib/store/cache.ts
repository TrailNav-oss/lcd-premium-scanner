// Cache mémoire partagé côté serveur — singleton entre les API routes
import type { Annonce } from '@/types/annonce'

export interface SourceHealth {
  lastSuccessAt: string | null
  lastErrorAt: string | null
  lastError: string | null
  lastCount: number
}

export type ScanStatus = 'idle' | 'running' | 'success' | 'failed' | 'timeout'

export interface ScanState {
  status: ScanStatus
  startedAt: string | null
  finishedAt: string | null
  scanId: string | null
  error: string | null
}

interface AppCache {
  annonces: Annonce[]
  lastScrapedAt: string | null
  sourceHealth: Record<string, SourceHealth>
  scan: ScanState
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
  scan: { status: 'idle', startedAt: null, finishedAt: null, scanId: null, error: null },
}

// ---------------------------------------------------------------------------
// Scan mutex — only one scan at a time
// ---------------------------------------------------------------------------
const SCAN_TIMEOUT_MS = 120_000 // force-release lock after 2 min (safety net)

/** Try to acquire the scan lock. Returns scanId on success, null if already running. */
export function acquireScanLock(): string | null {
  const { scan } = globalCache
  // If a previous scan is "running" but exceeded the timeout, force-release it
  if (scan.status === 'running' && scan.startedAt) {
    const elapsed = Date.now() - new Date(scan.startedAt).getTime()
    if (elapsed > SCAN_TIMEOUT_MS) {
      scan.status = 'timeout'
      scan.finishedAt = new Date().toISOString()
      scan.error = `Scan forcibly timed out after ${Math.round(elapsed / 1000)}s`
    } else {
      return null // scan genuinely in progress
    }
  }

  const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  globalCache.scan = {
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    scanId,
    error: null,
  }
  return scanId
}

export function releaseScanLock(status: 'success' | 'failed' | 'timeout', error?: string) {
  globalCache.scan.status = status
  globalCache.scan.finishedAt = new Date().toISOString()
  globalCache.scan.error = error || null
}

export function getScanState(): ScanState {
  return { ...globalCache.scan }
}

// ---------------------------------------------------------------------------
// Annonces cache
// ---------------------------------------------------------------------------

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
