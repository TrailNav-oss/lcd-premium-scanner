'use client'

import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useAnnoncesStore, type AnnoncesFilters } from '@/lib/store/annonces'
import zonesData from '@/data/zones-bourgoin.json'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'pepiteScore', label: 'Score pepite' },
  { value: 'rendementBrut', label: 'Rendement' },
  { value: 'prix', label: 'Prix' },
  { value: 'prixM2', label: 'Prix/m²' },
  { value: 'surface', label: 'Surface' },
  { value: 'joursEnLigne', label: 'Anciennete' },
] as const

const DPE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const PIECES_OPTIONS = [1, 2, 3, 4]

export function AnnonceFilters() {
  const { filters, setFilter, resetFilters } = useAnnoncesStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeFilterCount = countActiveFilters(filters)

  return (
    <div className="space-y-3">
      {/* Search bar + sort + toggle */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            id="search-annonces"
            type="text"
            placeholder="Rechercher (ville, adresse, mot-cle)..."
            aria-label="Rechercher une annonce"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="w-full bg-brand-card border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-gold/50"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilter('sortBy', e.target.value as AnnoncesFilters['sortBy'])}
            className="bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-gold/50"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
            aria-label={filters.sortOrder === 'desc' ? 'Tri croissant' : 'Tri decroissant'}
            className="bg-brand-card border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text hover:bg-brand-border transition-colors"
          >
            {filters.sortOrder === 'desc' ? '↓' : '↑'}
          </button>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border',
              showAdvanced
                ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                : 'bg-brand-card text-brand-muted border-brand-border hover:text-brand-text'
            )}
          >
            <SlidersHorizontal size={16} />
            Filtres
            {activeFilterCount > 0 && (
              <span className="bg-brand-gold text-brand-bg rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              aria-label="Reinitialiser les filtres"
              className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-brand-muted hover:text-brand-text bg-brand-card border border-brand-border"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <QuickFilter
          label="Favoris"
          active={filters.favoritesOnly}
          onClick={() => setFilter('favoritesOnly', !filters.favoritesOnly)}
        />
        <QuickFilter
          label="Score 50+"
          active={filters.scoreMin === 50}
          onClick={() => setFilter('scoreMin', filters.scoreMin === 50 ? undefined : 50)}
        />
        <QuickFilter
          label="Score 70+"
          active={filters.scoreMin === 70}
          onClick={() => setFilter('scoreMin', filters.scoreMin === 70 ? undefined : 70)}
        />
        <QuickFilter
          label="< 80 000€"
          active={filters.prixMax === 80000}
          onClick={() => setFilter('prixMax', filters.prixMax === 80000 ? undefined : 80000)}
        />
        <QuickFilter
          label="< 100 000€"
          active={filters.prixMax === 100000}
          onClick={() => setFilter('prixMax', filters.prixMax === 100000 ? undefined : 100000)}
        />
        <QuickFilter
          label="DPE F-G"
          active={filters.dpeMax === 'G'}
          onClick={() => setFilter('dpeMax', filters.dpeMax === 'G' ? undefined : 'G')}
        />
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="bg-brand-card rounded-xl border border-brand-border p-4 grid md:grid-cols-3 gap-4">
          {/* Prix */}
          <div>
            <label htmlFor="filter-prix-min" className="text-xs text-brand-muted mb-1 block">Prix</label>
            <div className="flex gap-2">
              <input
                id="filter-prix-min"
                type="number"
                placeholder="Min"
                aria-label="Prix minimum"
                value={filters.prixMin || ''}
                onChange={(e) => setFilter('prixMin', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
              />
              <input
                id="filter-prix-max"
                type="number"
                placeholder="Max"
                aria-label="Prix max"
                value={filters.prixMax || ''}
                onChange={(e) => setFilter('prixMax', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
              />
            </div>
          </div>

          {/* Surface */}
          <div>
            <label htmlFor="filter-surface-min" className="text-xs text-brand-muted mb-1 block">Surface (m²)</label>
            <div className="flex gap-2">
              <input
                id="filter-surface-min"
                type="number"
                placeholder="Min"
                aria-label="Surface minimum"
                value={filters.surfaceMin || ''}
                onChange={(e) => setFilter('surfaceMin', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
              />
              <input
                id="filter-surface-max"
                type="number"
                placeholder="Max"
                aria-label="Surface max"
                value={filters.surfaceMax || ''}
                onChange={(e) => setFilter('surfaceMax', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
              />
            </div>
          </div>

          {/* Zone */}
          <div>
            <label htmlFor="filter-zone" className="text-xs text-brand-muted mb-1 block">Zone</label>
            <select
              id="filter-zone"
              value={filters.zone || ''}
              onChange={(e) => setFilter('zone', e.target.value || undefined)}
              className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
            >
              <option value="">Toutes les zones</option>
              {zonesData.map(z => (
                <option key={z.slug} value={z.slug}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Pieces */}
          <div>
            <span className="text-xs text-brand-muted mb-1 block" id="label-pieces">Pieces minimum</span>
            <div className="flex gap-1" role="group" aria-labelledby="label-pieces">
              {PIECES_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setFilter('nbPiecesMin', filters.nbPiecesMin === n ? undefined : n)}
                  className={cn(
                    'px-3 py-1.5 rounded text-sm border transition-colors',
                    filters.nbPiecesMin === n
                      ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                      : 'bg-brand-surface text-brand-muted border-brand-border hover:text-brand-text'
                  )}
                >
                  {n}+
                </button>
              ))}
            </div>
          </div>

          {/* DPE max */}
          <div>
            <span className="text-xs text-brand-muted mb-1 block" id="label-dpe">DPE maximum</span>
            <div className="flex gap-1" role="group" aria-labelledby="label-dpe">
              {DPE_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setFilter('dpeMax', filters.dpeMax === d ? undefined : d)}
                  className={cn(
                    'px-2 py-1.5 rounded text-xs font-bold border transition-colors',
                    filters.dpeMax === d
                      ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                      : 'bg-brand-surface text-brand-muted border-brand-border hover:text-brand-text'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label htmlFor="filter-source" className="text-xs text-brand-muted mb-1 block">Source</label>
            <select
              id="filter-source"
              value={filters.source || ''}
              onChange={(e) => setFilter('source', (e.target.value || undefined) as AnnoncesFilters['source'])}
              className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
            >
              <option value="">Toutes</option>
              <option value="LEBONCOIN">LeBonCoin</option>
              <option value="BIENICI">Bien&apos;ici</option>
              <option value="SELOGER">SeLoger</option>
              <option value="PAP">PAP</option>
            </select>
          </div>

          {/* Score min */}
          <div>
            <label htmlFor="filter-score-min" className="text-xs text-brand-muted mb-1 block">Score pepite minimum</label>
            <input
              id="filter-score-min"
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.scoreMin || 0}
              onChange={(e) => setFilter('scoreMin', Number(e.target.value) || undefined)}
              className="w-full"
            />
            <span className="text-xs text-brand-gold font-semibold">{filters.scoreMin || 0}/100</span>
          </div>

          {/* Type de vente */}
          <div>
            <label htmlFor="filter-sale-type" className="text-xs text-brand-muted mb-1 block">Type de vente</label>
            <select
              id="filter-sale-type"
              value={filters.saleType || ''}
              onChange={(e) => setFilter('saleType', (e.target.value || undefined) as AnnoncesFilters['saleType'])}
              className="w-full bg-brand-surface border border-brand-border rounded px-2 py-1.5 text-sm text-brand-text"
            >
              <option value="">Tous types</option>
              <option value="standard">Vente classique</option>
              <option value="viager">Viager</option>
              <option value="encheres">Encheres</option>
              <option value="programme-neuf">Programme neuf</option>
              <option value="nue-propriete">Nue-propriete</option>
              <option value="lot">Vente en lot</option>
            </select>
          </div>

          {/* Exclure ventes non standard */}
          <div>
            <label className="text-xs text-brand-muted mb-1 block">Ventes bizarres</label>
            <button
              onClick={() => setFilter('excludeNonStandard', !filters.excludeNonStandard)}
              className={cn(
                'px-3 py-1.5 rounded text-sm border transition-colors w-full text-left',
                filters.excludeNonStandard
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              )}
            >
              {filters.excludeNonStandard
                ? '✓ Viager, encheres, etc. exclus'
                : '⚠ Tout afficher (viager inclus)'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickFilter({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
        active
          ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
          : 'bg-brand-card text-brand-muted border-brand-border hover:text-brand-text'
      )}
    >
      {label}
    </button>
  )
}

function countActiveFilters(f: AnnoncesFilters): number {
  let count = 0
  if (f.prixMin) count++
  if (f.prixMax) count++
  if (f.surfaceMin) count++
  if (f.surfaceMax) count++
  if (f.nbPiecesMin) count++
  if (f.dpeMax) count++
  if (f.zone) count++
  if (f.source) count++
  if (f.scoreMin) count++
  if (f.favoritesOnly) count++
  if (f.search) count++
  return count
}
