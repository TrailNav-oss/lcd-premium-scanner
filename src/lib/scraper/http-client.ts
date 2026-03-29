// HTTP client robuste pour scraping — rotation UA, headers navigateur, retry backoff, délai aléatoire

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
