'use client'

import { X, TrendingUp, Train, ShoppingBag, Users, Star, MapPin } from 'lucide-react'
import type { Zone } from '@/types/zone'
import { formatEuro } from '@/lib/utils'

interface ZonePanelProps {
  zone: Zone
  onClose: () => void
}

function ScoreBadge({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : pct >= 40 ? 'text-orange-400' : 'text-red-400'
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-muted">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score}/{max}</span>
    </div>
  )
}

export function ZonePanel({ zone, onClose }: ZonePanelProps) {
  const nuitMoy = (zone.nuiteeMin + zone.nuiteeMax) / 2

  return (
    <div className="absolute top-0 right-0 w-full md:w-96 h-full bg-brand-surface/95 backdrop-blur-sm border-l border-brand-border overflow-y-auto z-10">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-brand-text">{zone.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={14} className="text-brand-muted" />
              <span className="text-xs text-brand-muted">{zone.population.toLocaleString('fr-FR')} hab.</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-brand-card text-brand-muted hover:text-brand-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Score LCD principal */}
        <div className="bg-brand-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-brand-gold flex items-center justify-center">
              <span className="text-2xl font-black text-brand-gold">{zone.scoreLCD}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text">Score LCD</p>
              <p className="text-xs text-brand-muted">
                {zone.scoreLCD >= 8 ? 'Excellent potentiel' : zone.scoreLCD >= 6 ? 'Bon potentiel' : 'Potentiel modere'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-brand-card rounded-lg p-3">
            <p className="text-xs text-brand-muted mb-1">Prix/m2</p>
            <p className="text-lg font-bold text-brand-text">{formatEuro(zone.prixM2)}</p>
          </div>
          <div className="bg-brand-card rounded-lg p-3">
            <p className="text-xs text-brand-muted mb-1">Nuitee moy.</p>
            <p className="text-lg font-bold text-brand-gold">{formatEuro(nuitMoy)}</p>
          </div>
          <div className="bg-brand-card rounded-lg p-3">
            <p className="text-xs text-brand-muted mb-1">Occupation</p>
            <p className="text-lg font-bold text-brand-text">{zone.occupMoy}%</p>
          </div>
          <div className="bg-brand-card rounded-lg p-3">
            <p className="text-xs text-brand-muted mb-1">Loyer/m2</p>
            <p className="text-lg font-bold text-brand-text">{zone.loyerM2}€</p>
          </div>
        </div>

        {/* Scores détaillés */}
        <div className="bg-brand-card rounded-xl p-4 mb-4 space-y-2">
          <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
            <Star size={16} className="text-brand-gold" /> Scores detailles
          </h3>
          <ScoreBadge label="LCD" score={zone.scoreLCD} />
          <ScoreBadge label="LMNP classique" score={zone.scoreLMNP} />
          <ScoreBadge label="Tension locative" score={zone.tension} />
          <ScoreBadge label="Transport" score={zone.transport} />
          <ScoreBadge label="Commerces" score={zone.commerce} />
        </div>

        {/* Description */}
        <div className="bg-brand-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-brand-text mb-2">Pourquoi cette zone ?</h3>
          <p className="text-sm text-brand-muted leading-relaxed">{zone.why}</p>
        </div>

        {/* Tips */}
        <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-brand-gold mb-2 flex items-center gap-2">
            <TrendingUp size={16} /> Conseil investissement
          </h3>
          <p className="text-sm text-brand-text leading-relaxed">{zone.tips}</p>
        </div>

        {/* Réglementation */}
        <div className="bg-brand-card rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-brand-text mb-2">Reglementation</h3>
          <p className="text-sm text-brand-muted leading-relaxed">{zone.regulation}</p>
        </div>

        {/* Fourchette nuitées */}
        <div className="bg-brand-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-brand-text mb-2">Fourchette nuitees</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-muted">{formatEuro(zone.nuiteeMin)}</span>
            <div className="flex-1 h-2 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-gold-dark to-brand-gold rounded-full"
                style={{ width: `${((nuitMoy - 40) / 60) * 100}%` }}
              />
            </div>
            <span className="text-sm text-brand-muted">{formatEuro(zone.nuiteeMax)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
