'use client'

import { useEffect } from 'react'
import { RefreshCw, Loader2, AlertTriangle, LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { useAnnoncesStore } from '@/lib/store/annonces'
import { AnnonceCard } from '@/components/annonces/AnnonceCard'
import { AnnonceFilters } from '@/components/annonces/AnnonceFilters'
import { SourceHealthBar } from '@/components/annonces/SourceHealthBar'
import { cn } from '@/lib/utils'

export default function AnnoncesPage() {
  const { annonces, loading, scraping, lastScrapedAt, scrapeStats, scrapeErrors, scrapeHint, usingSeedData, fetchAnnonces, triggerScrape } = useAnnoncesStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchAnnonces()
  }, [fetchAnnonces])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-text">Annonces</h1>
          <p className="text-brand-muted mt-1">
            {annonces.length > 0
              ? `${annonces.length} annonce${annonces.length > 1 ? 's' : ''} trouvee${annonces.length > 1 ? 's' : ''}`
              : 'Lancez un scan pour recuperer les annonces'
            }
            {lastScrapedAt && (
              <span className="ml-2 text-xs">
                — Dernier scan : {new Date(lastScrapedAt).toLocaleString('fr-FR')}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-brand-card border border-brand-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Affichage grille"
              aria-pressed={viewMode === 'grid'}
              className={cn('p-2 rounded', viewMode === 'grid' ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Affichage liste"
              aria-pressed={viewMode === 'list'}
              className={cn('p-2 rounded', viewMode === 'list' ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted')}
            >
              <List size={16} />
            </button>
          </div>

          {/* Scrape button */}
          <button
            onClick={triggerScrape}
            disabled={scraping}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              scraping
                ? 'bg-brand-card text-brand-muted cursor-wait'
                : 'bg-brand-gold text-brand-bg hover:bg-brand-gold-light'
            )}
          >
            {scraping ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {scraping ? 'Scan en cours...' : 'Scanner les annonces'}
          </button>
        </div>
      </div>

      {/* Source health indicator */}
      <div className="mb-4">
        <SourceHealthBar />
      </div>

      {/* Scrape hint (seed data notice) */}
      {scrapeHint && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-1">
            <AlertTriangle size={14} /> Mode demonstration
          </div>
          <p className="text-xs text-blue-300">{scrapeHint}</p>
        </div>
      )}

      {/* Scrape stats */}
      {scrapeStats && (
        <div className="bg-brand-card rounded-lg border border-brand-border p-3 mb-4 flex flex-wrap gap-4 text-xs text-brand-muted">
          {usingSeedData ? (
            <span>Donnees de marche realistes : <strong className="text-brand-gold">{scrapeStats.total}</strong> annonces</span>
          ) : (
            <>
              <span>LeBonCoin : <strong className="text-brand-text">{scrapeStats.leboncoin}</strong></span>
              <span>Bien&apos;ici : <strong className="text-brand-text">{scrapeStats.bienici}</strong></span>
              <span>SeLoger : <strong className="text-brand-text">{scrapeStats.seloger}</strong></span>
              <span>PAP : <strong className="text-brand-text">{scrapeStats.pap}</strong></span>
              <span>Total : <strong className="text-brand-gold">{scrapeStats.total}</strong></span>
              {(scrapeStats.newCount ?? 0) > 0 && (
                <span>Nouvelles : <strong className="text-green-400">{scrapeStats.newCount}</strong></span>
              )}
              {(scrapeStats.expiredCount ?? 0) > 0 && (
                <span>Expirees : <strong className="text-brand-muted">{scrapeStats.expiredCount}</strong></span>
              )}
            </>
          )}
          {scrapeStats.excluded > 0 && (
            <span>Exclus (viager, etc.) : <strong className="text-orange-400">{scrapeStats.excluded}</strong></span>
          )}
          {(scrapeStats.geoFiltered ?? 0) > 0 && (
            <span>Hors zone (&gt;50km) : <strong className="text-brand-muted">{scrapeStats.geoFiltered}</strong></span>
          )}
        </div>
      )}

      {/* Scrape errors — condensed summary */}
      {scrapeErrors.length > 0 && !usingSeedData && (
        <details className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
          <summary className="flex items-center gap-2 text-orange-400 text-sm font-medium cursor-pointer">
            <AlertTriangle size={14} /> {scrapeErrors.length} source{scrapeErrors.length > 1 ? 's' : ''} indisponible{scrapeErrors.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-0.5">
            {scrapeErrors.map((err, i) => (
              <p key={i} className="text-xs text-orange-300">{err}</p>
            ))}
          </div>
        </details>
      )}

      {/* Filters */}
      <div className="mb-6">
        <AnnonceFilters />
      </div>

      {/* Loading state — skeleton */}
      {loading && annonces.length === 0 && (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-brand-card rounded-xl border border-brand-border overflow-hidden animate-pulse">
              <div className="h-44 bg-brand-surface" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-6 w-24 bg-brand-surface rounded" />
                  <div className="h-4 w-16 bg-brand-surface rounded" />
                </div>
                <div className="h-4 w-3/4 bg-brand-surface rounded" />
                <div className="flex gap-3">
                  <div className="h-3 w-12 bg-brand-surface rounded" />
                  <div className="h-3 w-12 bg-brand-surface rounded" />
                  <div className="h-3 w-16 bg-brand-surface rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-brand-surface rounded" />
                  <div className="h-3 w-8 bg-brand-surface rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && annonces.length === 0 && !scraping && (
        <div className="bg-brand-card rounded-xl border border-brand-border p-12 text-center">
          <RefreshCw size={48} className="text-brand-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-text mb-2">Aucune annonce</h2>
          <p className="text-sm text-brand-muted mb-6 max-w-md mx-auto">
            Cliquez sur &quot;Scanner les annonces&quot; pour recuperer les dernieres annonces
            de LeBonCoin, Bien&apos;ici et autres sites immobiliers dans votre zone.
          </p>
          <button
            onClick={triggerScrape}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-brand-gold text-brand-bg hover:bg-brand-gold-light"
          >
            <RefreshCw size={16} />
            Lancer le premier scan
          </button>
        </div>
      )}

      {/* Annonces grid/list */}
      {annonces.length > 0 && (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        )}>
          {annonces.map((annonce) => (
            <AnnonceCard key={annonce.id} annonce={annonce} />
          ))}
        </div>
      )}
    </div>
  )
}
