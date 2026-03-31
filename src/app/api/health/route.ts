import { NextResponse } from 'next/server'
import { getScanState, getAnnonces, getSourceHealth } from '@/lib/store/cache'
import { getCircuitStates } from '@/lib/scraper/http-client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'warning' | 'error'> = {}

  // Check 1: scan state
  const scan = getScanState()
  if (scan.status === 'failed' || scan.status === 'timeout') {
    checks.scan = 'error'
  } else if (scan.status === 'running') {
    checks.scan = 'ok' // running is fine
  } else {
    checks.scan = 'ok'
  }

  // Check 2: do we have any annonces in cache?
  const annonces = getAnnonces()
  checks.cache = annonces.length > 0 ? 'ok' : 'warning'

  // Check 3: source health — how many sources responded last time?
  const health = getSourceHealth()
  const sourcesUp = Object.values(health).filter(h => h.lastCount > 0).length
  if (sourcesUp === 0 && annonces.length > 0) {
    checks.sources = 'warning' // all blocked but cache has data
  } else if (sourcesUp === 0) {
    checks.sources = 'error'
  } else {
    checks.sources = 'ok'
  }

  // Check 4: circuit breakers
  const circuits = getCircuitStates()
  const openCircuits = Object.entries(circuits).filter(([, c]) => c.consecutiveFailures >= 3)
  checks.circuitBreakers = openCircuits.length >= 3 ? 'warning' : 'ok'

  const hasError = Object.values(checks).includes('error')
  const hasWarning = Object.values(checks).includes('warning')
  const status = hasError ? 'degraded' : hasWarning ? 'warning' : 'healthy'

  return NextResponse.json(
    {
      status,
      checks,
      scan: {
        status: scan.status,
        lastStarted: scan.startedAt,
        lastFinished: scan.finishedAt,
      },
      cache: {
        annoncesCount: annonces.length,
      },
      sourcesUp,
      openCircuits: openCircuits.map(([name]) => name),
      timestamp: new Date().toISOString(),
    },
    { status: hasError ? 503 : 200 }
  )
}
