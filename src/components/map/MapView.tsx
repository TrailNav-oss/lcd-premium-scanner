'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import zonesData from '@/data/zones-bourgoin.json'
import type { Zone } from '@/types/zone'
import type { Annonce } from '@/types/annonce'
import { ZonePanel } from './ZonePanel'
import { AnnoncePopup } from './AnnoncePopup'
import { formatEuro } from '@/lib/utils'

const SCORE_COLORS: Record<number, string> = {
  9: '#22c55e', 8: '#4ade80', 7: '#facc15', 6: '#fb923c', 5: '#f87171',
}

function getScoreColor(score: number): string {
  return SCORE_COLORS[score] || '#8a7d6b'
}

function getPepiteColor(score: number): string {
  if (score >= 70) return '#facc15' // gold
  if (score >= 50) return '#9ca3af' // silver
  if (score >= 30) return '#f97316' // orange
  return '#6b7280'
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null)
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [showAnnonces, setShowAnnonces] = useState(true)
  const [loading, setLoading] = useState(false)

  // Fetch annonces
  const fetchAnnonces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/annonces?excludeNonStandard=true&sortBy=pepiteScore&sortOrder=desc')
      const data = await res.json()
      setAnnonces(data.annonces || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAnnonces()
  }, [fetchAnnonces])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          },
        },
        layers: [{
          id: 'osm-tiles', type: 'raster', source: 'osm-tiles', minzoom: 0, maxzoom: 19,
        }],
      },
      center: [5.28, 45.60],
      zoom: 11,
      minZoom: 9,
      maxZoom: 17,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      const zones = zonesData as Zone[]

      zones.forEach((zone) => {
        // Zone circle
        const circleId = `zone-circle-${zone.slug}`
        map.addSource(circleId, {
          type: 'geojson',
          data: createCircle([zone.lng, zone.lat], 2),
        })
        map.addLayer({
          id: circleId, type: 'fill', source: circleId,
          paint: { 'fill-color': getScoreColor(zone.scoreLCD), 'fill-opacity': 0.08 },
        })
        map.addLayer({
          id: `${circleId}-border`, type: 'line', source: circleId,
          paint: { 'line-color': getScoreColor(zone.scoreLCD), 'line-width': 1.5, 'line-opacity': 0.3 },
        })

        // Zone marker
        const el = document.createElement('div')
        el.style.cssText = `
          width: 48px; height: 48px; border-radius: 50%;
          background: ${getScoreColor(zone.scoreLCD)}22;
          border: 3px solid ${getScoreColor(zone.scoreLCD)};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform 0.2s;
          box-shadow: 0 0 20px ${getScoreColor(zone.scoreLCD)}44;
          z-index: 10;
        `
        const span = document.createElement('span')
        span.style.cssText = `color: ${getScoreColor(zone.scoreLCD)}; font-weight: 700; font-size: 16px;`
        span.textContent = String(zone.scoreLCD)
        el.appendChild(span)
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)' })
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          setSelectedZone(zone)
          setSelectedAnnonce(null)
          map.flyTo({ center: [zone.lng, zone.lat], zoom: 13, duration: 800 })
        })

        new maplibregl.Marker({ element: el }).setLngLat([zone.lng, zone.lat]).addTo(map)
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Add/update annonce markers when annonces change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!showAnnonces) return

    // Add annonce markers
    annonces.forEach((annonce) => {
      if (!annonce.latitude || !annonce.longitude) return

      const score = annonce.pepiteScore || 0
      const color = getPepiteColor(score)

      const el = document.createElement('div')
      el.style.cssText = `
        width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
        background: ${color}; transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 2px 8px ${color}66;
        border: 2px solid rgba(255,255,255,0.3);
        z-index: 5;
      `
      const inner = document.createElement('span')
      inner.style.cssText = `
        transform: rotate(45deg); color: #000; font-weight: 700;
        font-size: 10px; line-height: 1;
      `
      inner.textContent = `${Math.round(annonce.prix / 1000)}k`
      el.appendChild(inner)

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'rotate(-45deg) scale(1.3)'
        el.style.zIndex = '20'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'rotate(-45deg) scale(1)'
        el.style.zIndex = '5'
      })
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedAnnonce(annonce)
        setSelectedZone(null)
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([annonce.longitude, annonce.latitude])
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [annonces, showAnnonces])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Controls overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        <button
          onClick={() => setShowAnnonces(!showAnnonces)}
          className={`px-3 py-2 rounded-lg text-xs font-medium shadow-lg transition-colors ${
            showAnnonces
              ? 'bg-brand-gold text-brand-bg'
              : 'bg-brand-surface/90 text-brand-muted border border-brand-border'
          }`}
        >
          {showAnnonces ? `${annonces.length} annonces` : 'Afficher annonces'}
        </button>

        {annonces.length === 0 && (
          <button
            onClick={fetchAnnonces}
            disabled={loading}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-brand-surface/90 text-brand-gold border border-brand-gold/20 shadow-lg"
          >
            {loading ? 'Chargement...' : 'Charger annonces'}
          </button>
        )}

        {/* Legend */}
        <div className="bg-brand-surface/90 backdrop-blur-sm rounded-lg p-3 border border-brand-border shadow-lg">
          <p className="text-xs text-brand-muted font-semibold mb-2">Legende</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-500/20 flex items-center justify-center">
                <span className="text-[8px] text-green-500 font-bold">9</span>
              </div>
              <span className="text-xs text-brand-muted">Zone LCD (score)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400 border border-white/30" />
              <span className="text-xs text-brand-muted">Pepite (score 70+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400 border border-white/30" />
              <span className="text-xs text-brand-muted">Annonce (score 50+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 border border-white/30" />
              <span className="text-xs text-brand-muted">Annonce (score 30+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panels */}
      {selectedZone && (
        <ZonePanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}
      {selectedAnnonce && (
        <AnnoncePopup annonce={selectedAnnonce} onClose={() => setSelectedAnnonce(null)} />
      )}
    </div>
  )
}

function createCircle(center: [number, number], radiusKm: number, points = 64) {
  const coords: [number, number][] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))
    const dy = radiusKm / 110.574
    coords.push([center[0] + dx * Math.cos(angle), center[1] + dy * Math.sin(angle)])
  }
  coords.push(coords[0])
  return { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [coords] }, properties: {} }
}
