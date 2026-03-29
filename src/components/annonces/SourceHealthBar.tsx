'use client'

import { useEffect, useState } from 'react'
import type { SourceHealth } from '@/lib/store/cache'

const SOURCE_LABELS: Record<string, string> = {
  LEBONCOIN: 'LeBonCoin',
  SELOGER: 'SeLoger',
  BIENICI: "Bien'ici",
  PAP: 'PAP',
}

function getStatus(h: SourceHealth): { color: string; label: string } {
  if (!h.lastSuccessAt && !h.lastErrorAt) {
    return { color: 'bg-brand-border', label: 'Jamais scanne' }
  }

  if (h.lastSuccessAt) {
    const ago = Date.now() - new Date(h.lastSuccessAt).getTime()
    const hours = ago / (1000 * 60 * 60)
    if (hours < 24) return { color: 'bg-green-500', label: `${h.lastCount} annonces` }
    return { color: 'bg-yellow-500', label: `${h.lastCount} (> 24h)` }
  }

  return { color: 'bg-red-500', label: h.lastError?.split(':').pop()?.trim() || 'Erreur' }
}

export function SourceHealthBar() {
  const [health, setHealth] = useState<Record<string, SourceHealth> | null>(null)

  useEffect(() => {
    fetch('/api/annonces?health=true')
      .then(r => r.json())
      .then(d => setHealth(d.sourceHealth))
      .catch(() => {})
  }, [])

  if (!health) return null

  // Don't show if no scan has happened yet
  const hasData = Object.values(health).some(h => h.lastSuccessAt || h.lastErrorAt)
  if (!hasData) return null

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(SOURCE_LABELS).map(([key, label]) => {
        const h = health[key]
        if (!h) return null
        const status = getStatus(h)
        return (
          <div key={key} className="flex items-center gap-1.5 text-xs text-brand-muted">
            <span className={`w-2 h-2 rounded-full ${status.color}`} />
            <span>{label}</span>
            <span className="text-brand-border">({status.label})</span>
          </div>
        )
      })}
    </div>
  )
}
