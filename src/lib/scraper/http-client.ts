// HTTP client robuste pour scraping — rotation UA, headers navigateur, retry backoff, délai aléatoire, circuit breaker

import { logger } from '@/lib/logger'
import { notifyCircuitBreakerOpen } from '@/lib/telegram'

// ---------------------------------------------------------------------------
// Circuit breaker — skip a source after N consecutive failures (403/503)
// ---------------------------------------------------------------------------
const CIRCUIT_BREAKER_THRESHOLD = 3

interface CircuitState {
  consecutiveFailures: number
  openUntil: number // timestamp ms — circuit stays open until this time
  lastError: string | null
}

const circuits: Record<string, CircuitState> = {}

export function getCircuit(source: string): CircuitState {
  if (!circuits[source]) {
    circuits[source] = { consecutiveFailures: 0, openUntil: 0, lastError: null }
  }
  return circuits[source]
}

/** Returns true if the circuit is open (source should be skipped). */
export function isCircuitOpen(source: string): boolean {
  const c = getCircuit(source)
  if (c.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && Date.now() < c.openUntil) {
    return true
  }
  // Auto-reset if cooldown expired
  if (c.openUntil > 0 && Date.now() >= c.openUntil) {
    c.consecutiveFailures = 0
    c.openUntil = 0
    c.lastError = null
  }
  return false
}

export function recordCircuitFailure(source: string, error: string) {
  const c = getCircuit(source)
  c.consecutiveFailures++
  c.lastError = error
  if (c.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    // Open circuit for 5 minutes
    c.openUntil = Date.now() + 5 * 60 * 1000
    logger.warn({ source, consecutiveFailures: c.consecutiveFailures, cooldownMin: 5 },
      'Circuit breaker OPEN — skipping source')
    notifyCircuitBreakerOpen(source, c.consecutiveFailures).catch(() => {})
  }
}

export function recordCircuitSuccess(source: string) {
  const c = getCircuit(source)
  c.consecutiveFailures = 0
  c.openUntil = 0
  c.lastError = null
}

export function getCircuitStates(): Record<string, CircuitState> {
  return { ...circuits }
}

// ---------------------------------------------------------------------------
// User-Agent rotation
// ---------------------------------------------------------------------------

const USER_AGENTS = [
  // Chrome Desktop récents
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Firefox Desktop récents
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
  // Chrome Mobile
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
]

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function buildBrowserHeaders(origin: string, referer: string, extraHeaders?: Record<string, string>): Record<string, string> {
  const ua = getRandomUA()
  const isChrome = ua.includes('Chrome')

  return {
    'User-Agent': ua,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': origin,
    'Referer': referer,
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    ...(isChrome ? {
      'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
    } : {}),
    ...extraHeaders,
  }
}

/** Délai aléatoire entre min et max ms */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs)
  return new Promise(r => setTimeout(r, delay))
}

/** Fetch avec retry et backoff exponentiel */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { retries?: number; backoffMs?: number } = {}
): Promise<Response> {
  const { retries = 3, backoffMs = 1000, ...fetchOptions } = options

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions)

      // 429 Too Many Requests — toujours retry
      if (res.status === 429 && attempt < retries) {
        const wait = backoffMs * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(r => setTimeout(r, wait))
        continue
      }

      // 403/503 — retry avec backoff (anti-bot temporaire)
      if ((res.status === 403 || res.status === 503) && attempt < retries) {
        const wait = backoffMs * Math.pow(2, attempt) + Math.random() * 2000
        await new Promise(r => setTimeout(r, wait))
        continue
      }

      return res
    } catch (e) {
      if (attempt === retries) throw e
      const wait = backoffMs * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(r => setTimeout(r, wait))
    }
  }

  // Unreachable but TS needs it
  throw new Error('fetchWithRetry: all retries exhausted')
}

/** Construire les headers pour LeBonCoin */
export function lbcHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  return {
    ...buildBrowserHeaders('https://www.leboncoin.fr', 'https://www.leboncoin.fr/'),
    'Content-Type': 'application/json',
    'api_key': process.env.LBC_API_KEY || 'ba0c2dad52b3ec',
    'Sec-Fetch-Site': 'same-site',
    ...extraHeaders,
  }
}

/** Construire les headers pour SeLoger */
export function selogerHeaders(): Record<string, string> {
  return buildBrowserHeaders('https://www.seloger.com', 'https://www.seloger.com/')
}

/** Construire les headers pour Bien'ici */
export function bieniciHeaders(): Record<string, string> {
  return buildBrowserHeaders('https://www.bienici.com', 'https://www.bienici.com/')
}

/** Construire les headers pour PAP */
export function papHeaders(): Record<string, string> {
  return buildBrowserHeaders('https://www.pap.fr', 'https://www.pap.fr/')
}
