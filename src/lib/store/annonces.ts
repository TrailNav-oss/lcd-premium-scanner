import { create } from 'zustand'
import type { Annonce, Source, SaleType } from '@/types/annonce'

export interface AnnoncesFilters {
  prixMin?: number
  prixMax?: number
  surfaceMin?: number
  surfaceMax?: number
  nbPiecesMin?: number
  dpeMax?: string
  zone?: string
  source?: Source
  scoreMin?: number
  saleType?: SaleType
  excludeNonStandard: boolean // exclure viager, enchères, etc.
  activeOnly: boolean
  favoritesOnly: boolean
  search: string
  sortBy: 'pepiteScore' | 'prix' | 'prixM2' | 'surface' | 'rendementBrut' | 'joursEnLigne'
  sortOrder: 'asc' | 'desc'
}

interface AnnoncesState {
  annonces: Annonce[]
  filters: AnnoncesFilters
  loading: boolean
  scraping: boolean
  lastScrapedAt: string | null
  scrapeStats: { leboncoin: number; bienici: number; seloger: number; pap: number; total: number; excluded: number; geoFiltered?: number; newCount?: number; expiredCount?: number } | null
  scrapeErrors: string[]
  scrapeHint: string | null
  usingSeedData: boolean

  setFilter: <K extends keyof AnnoncesFilters>(key: K, value: AnnoncesFilters[K]) => void
  resetFilters: () => void
  fetchAnnonces: () => Promise<void>
  triggerScrape: () => Promise<void>
  toggleFavorite: (id: string) => void
}

const DEFAULT_FILTERS: AnnoncesFilters = {
  prixMin: undefined,
  prixMax: undefined,
  surfaceMin: undefined,
  surfaceMax: undefined,
  nbPiecesMin: undefined,
  dpeMax: undefined,
  zone: undefined,
  source: undefined,
  scoreMin: undefined,
  saleType: undefined,
  excludeNonStandard: true, // exclure viager, enchères, etc. par défaut
  activeOnly: true,
  favoritesOnly: false,
  search: '',
  sortBy: 'pepiteScore',
  sortOrder: 'desc',
}

// Debounce timer for filter changes
let fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null

export const useAnnoncesStore = create<AnnoncesState>((set, get) => ({
  annonces: [],
  filters: { ...DEFAULT_FILTERS },
  loading: false,
  scraping: false,
  lastScrapedAt: null,
  scrapeStats: null,
  scrapeErrors: [],
  scrapeHint: null,
  usingSeedData: false,

  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }))
    // Debounced re-fetch (300ms)
    if (fetchDebounceTimer) clearTimeout(fetchDebounceTimer)
    fetchDebounceTimer = setTimeout(() => {
      get().fetchAnnonces()
    }, 300)
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } })
    get().fetchAnnonces()
  },

  fetchAnnonces: async () => {
    const { filters } = get()
    set({ loading: true })

    try {
      const params = new URLSearchParams()
      if (filters.prixMin) params.set('prixMin', String(filters.prixMin))
      if (filters.prixMax) params.set('prixMax', String(filters.prixMax))
      if (filters.surfaceMin) params.set('surfaceMin', String(filters.surfaceMin))
      if (filters.surfaceMax) params.set('surfaceMax', String(filters.surfaceMax))
      if (filters.nbPiecesMin) params.set('nbPiecesMin', String(filters.nbPiecesMin))
      if (filters.dpeMax) params.set('dpeMax', filters.dpeMax)
      if (filters.zone) params.set('zone', filters.zone)
      if (filters.source) params.set('source', filters.source)
      if (filters.scoreMin) params.set('scoreMin', String(filters.scoreMin))
      if (filters.saleType) params.set('saleType', filters.saleType)
      params.set('excludeNonStandard', String(filters.excludeNonStandard))
      if (filters.search) params.set('search', filters.search)
      params.set('activeOnly', String(filters.activeOnly))
      params.set('favoritesOnly', String(filters.favoritesOnly))
      params.set('sortBy', filters.sortBy)
      params.set('sortOrder', filters.sortOrder)

      const res = await fetch(`/api/annonces?${params}`)
      const data = await res.json()
      set({ annonces: data.annonces || [], loading: false })
    } catch {
      set({ loading: false })
    }
  },

  triggerScrape: async () => {
    // Guard: don't trigger if already scraping client-side
    if (get().scraping) return
    set({ scraping: true, scrapeErrors: [], scrapeHint: null })

    try {
      const res = await fetch('/api/scrape')
      const data = await res.json()

      // 409 = scan already running server-side (mutex)
      if (res.status === 409) {
        set({ scraping: false, scrapeErrors: [data.error || 'Scan deja en cours'] })
        return
      }

      if (data.success) {
        set({
          scraping: false,
          lastScrapedAt: new Date().toISOString(),
          usingSeedData: data.usingSeedData || false,
          scrapeHint: data.hint || null,
          scrapeStats: {
            leboncoin: data.stats.leboncoin,
            bienici: data.stats.bienici,
            seloger: data.stats.seloger,
            pap: data.stats.pap,
            total: data.stats.afterMerge,
            excluded: data.stats.excluded || 0,
            geoFiltered: data.stats.geoFiltered || 0,
            newCount: data.stats.newCount || 0,
            expiredCount: data.stats.expiredCount || 0,
          },
          scrapeErrors: data.errors || [],
          annonces: data.annonces || [],
        })
      } else {
        set({ scraping: false, scrapeErrors: [data.error] })
      }
    } catch (e) {
      set({ scraping: false, scrapeErrors: [e instanceof Error ? e.message : 'Erreur inconnue'] })
    }
  },

  toggleFavorite: (id) => {
    set((state) => ({
      annonces: state.annonces.map(a =>
        a.id === id ? { ...a, isFavorite: !a.isFavorite } : a
      ),
    }))
  },
}))
