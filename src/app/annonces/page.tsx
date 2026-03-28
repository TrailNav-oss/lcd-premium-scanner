'use client'

import { useEffect } from 'react'
import { RefreshCw, Loader2, AlertTriangle, LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { useAnnoncesStore } from '@/lib/store/annonces'
import { AnnonceCard } from '@/components/annonces/AnnonceCard'
import { AnnonceFilters } from '@/components/annonces/AnnonceFilters'
import { cn } from '@/lib/utils'

export default function AnnoncesPage() {
  const { annonces, loading, scraping, lastScrapedAt, scrapeStats, scrapeErrors, fetchAnnonces, triggerScrape } = useAnnoncesStore()
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
              className={cn('p-2 rounded', viewMode === 'grid' ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-muted')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
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

      {/* Scrape stats */}
      {scrapeStats && (
        <div className="bg-brand-card rounded-lg border border-brand-border p-3 mb-4 flex flex-wrap gap-4 text-xs text-brand-muted">
          <span>LeBonCoin : <strong className="text-brand-text">{scrapeStats.leboncoin}</strong></span>
          <span>Bien&apos;ici : <strong className="text-brand-text">{scrapeStats.bienici}</strong></span>
          <span>SeLoger : <strong className="text-brand-text">{scrapeStats.seloger}</strong></span>
          <span>PAP : <strong className="text-brand-text">{scrapeStats.pap}</strong></span>
          <span>Total : <strong className="text-brand-gold">{scrapeStats.total}</strong></span>
          {scrapeStats.excluded > 0 && (
            <span>Exclus (viager, etc.) : <strong className="text-orange-400">{scrapeStats.excluded}</strong></span>
          )}
        </div>
      )}

      {/* Scrape errors */}
      {scrapeErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
            <AlertTriangle size={14} /> Erreurs de scan
          </div>
          {scrapeErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-300">{err}</p>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <AnnonceFilters />
      </div>

      {/* Loading state */}
      {loading && annonces.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-gold" />
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
