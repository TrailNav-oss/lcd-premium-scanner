'use client'

import Link from 'next/link'
import { MapPin, Maximize, BedDouble, Zap, Clock, TrendingDown, Heart, ExternalLink } from 'lucide-react'
import type { Annonce } from '@/types/annonce'
import { PepiteBadge } from './PepiteScore'
import { formatEuro, formatPercent } from '@/lib/utils'
import { useAnnoncesStore } from '@/lib/store/annonces'

const SOURCE_LABELS: Record<string, string> = {
  LEBONCOIN: 'LeBonCoin',
  SELOGER: 'SeLoger',
  BIENICI: "Bien'ici",
  PAP: 'PAP',
  LOGICIMMO: 'LogicImmo',
}

const DPE_COLORS: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-green-400',
  C: 'bg-yellow-400',
  D: 'bg-yellow-500',
  E: 'bg-orange-400',
  F: 'bg-orange-500',
  G: 'bg-red-500',
}

export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const toggleFavorite = useAnnoncesStore(s => s.toggleFavorite)
  const hasPhoto = annonce.photos.length > 0

  return (
    <div className="bg-brand-card rounded-xl border border-brand-border hover:border-brand-gold/30 transition-all overflow-hidden group">
      {/* Photo + badges */}
      <div className="relative h-44 bg-brand-surface overflow-hidden">
        {hasPhoto ? (
          <img
            src={annonce.photos[0]}
            alt={annonce.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted">
            Pas de photo
          </div>
        )}

        {/* Top-left: source + sale type warning */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-xs bg-black/70 text-white px-2 py-0.5 rounded">
            {SOURCE_LABELS[annonce.source] || annonce.source}
          </span>
          {annonce.saleType && annonce.saleType !== 'standard' && (
            <span className="text-xs bg-orange-500/90 text-white px-2 py-0.5 rounded">
              {annonce.saleTypeLabel}
            </span>
          )}
        </div>

        {/* Top-right: score pepite */}
        {annonce.pepiteScore !== undefined && (
          <div className="absolute top-2 right-2">
            <PepiteBadge score={annonce.pepiteScore} />
          </div>
        )}

        {/* Bottom-left: price drop indicator */}
        {annonce.prixInitial && annonce.prix < annonce.prixInitial && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded">
            <TrendingDown size={12} />
            {Math.round(((annonce.prixInitial - annonce.prix) / annonce.prixInitial) * 100)}%
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite(annonce.id) }}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <Heart size={16} className={annonce.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'} />
        </button>
      </div>

      {/* Content */}
      <Link href={`/annonce/${encodeURIComponent(annonce.id)}`}>
        <div className="p-4">
          {/* Prix + rendement */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xl font-bold text-brand-text">{formatEuro(annonce.prix)}</span>
            {annonce.rendementBrut && (
              <span className="text-sm font-semibold text-green-400">
                {formatPercent(annonce.rendementBrut)} brut
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm text-brand-text font-medium line-clamp-1 mb-2">{annonce.title}</h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted mb-3">
            {annonce.surface && (
              <span className="flex items-center gap-1"><Maximize size={12} />{annonce.surface} m²</span>
            )}
            {annonce.nbPieces && (
              <span className="flex items-center gap-1"><BedDouble size={12} />{annonce.nbPieces}p</span>
            )}
            {annonce.dpe && (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs font-bold ${DPE_COLORS[annonce.dpe] || 'bg-brand-muted'}`}>
                <Zap size={10} />DPE {annonce.dpe}
              </span>
            )}
            {annonce.prixM2 && (
              <span>{formatEuro(annonce.prixM2)}/m²</span>
            )}
          </div>

          {/* Location + days online */}
          <div className="flex items-center justify-between text-xs text-brand-muted">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {annonce.ville || annonce.codePostal || 'Secteur Bourgoin'}
            </span>
            <div className="flex items-center gap-3">
              {annonce.joursEnLigne !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />{annonce.joursEnLigne}j
                </span>
              )}
              <a
                href={annonce.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-brand-gold"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
