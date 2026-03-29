'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, ExternalLink, Maximize, BedDouble, Zap, Clock, TrendingDown, Calculator } from 'lucide-react'
import type { Annonce } from '@/types/annonce'
import { PepiteScore } from '@/components/annonces/PepiteScore'
import { formatEuro, formatPercent } from '@/lib/utils'

const SOURCE_LABELS: Record<string, string> = {
  LEBONCOIN: 'LeBonCoin', SELOGER: 'SeLoger', BIENICI: "Bien'ici", PAP: 'PAP',
}

const DPE_COLORS: Record<string, string> = {
  A: 'bg-green-500', B: 'bg-green-400', C: 'bg-yellow-400',
  D: 'bg-yellow-500', E: 'bg-orange-400', F: 'bg-orange-500', G: 'bg-red-500',
}

interface Props {
  annonce: Annonce
  onClose: () => void
}

export function AnnoncePopup({ annonce, onClose }: Props) {
  return (
    <div className="absolute top-0 right-0 w-full md:w-[420px] h-full bg-brand-surface/95 backdrop-blur-sm border-l border-brand-border overflow-y-auto z-10">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-brand-card text-brand-muted px-2 py-0.5 rounded">
              {SOURCE_LABELS[annonce.source] || annonce.source}
            </span>
            {annonce.saleType && annonce.saleType !== 'standard' && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                {annonce.saleTypeLabel}
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-lg hover:bg-brand-card text-brand-muted hover:text-brand-text">
            <X size={18} />
          </button>
        </div>

        {/* Photo */}
        {annonce.photos.length > 0 && (
          <div className="relative rounded-xl overflow-hidden mb-3 h-48">
            <Image src={annonce.photos[0]} alt={annonce.title} fill sizes="420px" className="object-cover" unoptimized />
          </div>
        )}

        {/* Prix + Score */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-brand-text">{formatEuro(annonce.prix)}</p>
            {annonce.prixM2 && (
              <p className="text-sm text-brand-muted">{formatEuro(annonce.prixM2)}/m²</p>
            )}
            {annonce.prixInitial && annonce.prix < annonce.prixInitial && (
              <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                <TrendingDown size={14} />
                -{Math.round(((annonce.prixInitial - annonce.prix) / annonce.prixInitial) * 100)}%
                <span className="text-brand-muted line-through ml-1">{formatEuro(annonce.prixInitial)}</span>
              </p>
            )}
          </div>
          <PepiteScore score={annonce.pepiteScore || 0} size="md" />
        </div>

        {/* Title */}
        <h2 className="text-sm font-semibold text-brand-text mb-3">{annonce.title}</h2>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2 mb-3">
          {annonce.surface && (
            <span className="flex items-center gap-1 text-xs bg-brand-card px-2 py-1 rounded text-brand-text">
              <Maximize size={12} />{annonce.surface} m²
            </span>
          )}
          {annonce.nbPieces && (
            <span className="flex items-center gap-1 text-xs bg-brand-card px-2 py-1 rounded text-brand-text">
              <BedDouble size={12} />{annonce.nbPieces} pieces
            </span>
          )}
          {annonce.dpe && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded text-white font-bold ${DPE_COLORS[annonce.dpe]}`}>
              <Zap size={12} />DPE {annonce.dpe}
            </span>
          )}
          {annonce.joursEnLigne !== undefined && (
            <span className="flex items-center gap-1 text-xs bg-brand-card px-2 py-1 rounded text-brand-muted">
              <Clock size={12} />{annonce.joursEnLigne}j en ligne
            </span>
          )}
        </div>

        {/* Rendement estimé */}
        {annonce.rendementBrut && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
            <p className="text-xs text-green-400 font-semibold">Rendement LCD estime</p>
            <p className="text-xl font-bold text-green-400">{formatPercent(annonce.rendementBrut)} brut</p>
          </div>
        )}

        {/* Description excerpt */}
        {annonce.description && (
          <div className="bg-brand-card rounded-lg p-3 mb-3">
            <p className="text-xs text-brand-muted line-clamp-4">{annonce.description}</p>
          </div>
        )}

        {/* Location */}
        <div className="text-xs text-brand-muted mb-4">
          {annonce.adresse && <span>{annonce.adresse}, </span>}
          {annonce.ville || annonce.codePostal}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/annonce/${encodeURIComponent(annonce.id)}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-gold text-brand-bg hover:bg-brand-gold-light transition-colors"
          >
            <Calculator size={16} />
            Detail + Simulateur
          </Link>
          <a
            href={annonce.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-card border border-brand-border text-brand-text hover:border-brand-gold/30 transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
