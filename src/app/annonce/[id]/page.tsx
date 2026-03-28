'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, MapPin, Maximize, BedDouble, Zap, Clock, TrendingDown, Heart, Building2 } from 'lucide-react'
import type { Annonce } from '@/types/annonce'
import type { Zone } from '@/types/zone'
import { PepiteScore } from '@/components/annonces/PepiteScore'
import { LCDSimulator } from '@/components/simulator/LCDSimulator'
import { calculatePepiteScore } from '@/lib/scoring/pepite'
import { formatEuro, formatPercent } from '@/lib/utils'
import zonesData from '@/data/zones-bourgoin.json'

const DPE_COLORS: Record<string, string> = {
  A: 'bg-green-500', B: 'bg-green-400', C: 'bg-yellow-400',
  D: 'bg-yellow-500', E: 'bg-orange-400', F: 'bg-orange-500', G: 'bg-red-500',
}

const SOURCE_LABELS: Record<string, string> = {
  LEBONCOIN: 'LeBonCoin', SELOGER: 'SeLoger', BIENICI: "Bien'ici", PAP: 'PAP',
}

export default function AnnonceDetailPage() {
  const params = useParams()
  const id = decodeURIComponent(params.id as string)
  const [annonce, setAnnonce] = useState<Annonce | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/annonces?activeOnly=false`)
        const data = await res.json()
        const found = (data.annonces || []).find((a: Annonce) => a.id === id)
        setAnnonce(found || null)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-brand-muted animate-pulse">Chargement...</div>
      </div>
    )
  }

  if (!annonce) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl text-brand-text mb-4">Annonce introuvable</h1>
        <Link href="/annonces" className="text-brand-gold hover:underline">Retour aux annonces</Link>
      </div>
    )
  }

  const scoring = calculatePepiteScore(annonce)
  const zone = (zonesData as Zone[]).find(z => z.slug === annonce.zoneSlug)
  const nuitMoy = zone ? (zone.nuiteeMin + zone.nuiteeMax) / 2 : 62

  // Pre-fill simulator from annonce data
  const simParams = {
    prixAchat: annonce.prix,
    budgetReno: annonce.dpe && ['F', 'G'].includes(annonce.dpe) ? 25000 : 15000,
    nuitee: Math.round(nuitMoy),
    tauxOccupation: zone?.occupMoy || 60,
    chargesMensuelles: annonce.charges || 120,
    taxeFonciere: annonce.taxeFonciere || 500,
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Back link */}
      <Link href="/annonces" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-gold mb-6">
        <ArrowLeft size={16} /> Retour aux annonces
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column: photos + info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Photo gallery */}
          {annonce.photos.length > 0 && (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden bg-brand-surface h-72 md:h-96">
                <img
                  src={annonce.photos[selectedPhoto]}
                  alt={annonce.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                  {SOURCE_LABELS[annonce.source] || annonce.source}
                </span>
              </div>
              {annonce.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {annonce.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(i)}
                      className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedPhoto ? 'border-brand-gold' : 'border-transparent'}`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title + price */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-text">{annonce.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-brand-muted">
                  <MapPin size={14} />
                  {annonce.adresse && <span>{annonce.adresse},</span>}
                  <span>{annonce.ville || annonce.codePostal}</span>
                  {zone && <span className="text-brand-gold">({zone.name})</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-brand-text">{formatEuro(annonce.prix)}</p>
                {annonce.prixM2 && (
                  <p className="text-sm text-brand-muted">{formatEuro(annonce.prixM2)}/m²</p>
                )}
                {annonce.prixInitial && annonce.prix < annonce.prixInitial && (
                  <p className="text-sm text-green-400 flex items-center gap-1 justify-end mt-1">
                    <TrendingDown size={14} />
                    -{Math.round(((annonce.prixInitial - annonce.prix) / annonce.prixInitial) * 100)}% ({formatEuro(annonce.prixInitial)})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {annonce.surface && (
              <StatBox icon={Maximize} label="Surface" value={`${annonce.surface} m²`} />
            )}
            {annonce.nbPieces && (
              <StatBox icon={BedDouble} label="Pieces" value={`${annonce.nbPieces}`} />
            )}
            {annonce.dpe && (
              <div className="bg-brand-card rounded-lg p-3 flex items-center gap-3">
                <span className={`${DPE_COLORS[annonce.dpe]} text-white text-sm font-bold px-2 py-1 rounded`}>
                  {annonce.dpe}
                </span>
                <div>
                  <p className="text-xs text-brand-muted">DPE</p>
                  <p className="text-sm text-brand-text font-semibold">
                    {['F', 'G'].includes(annonce.dpe) ? 'Opportunite reno' : annonce.dpe}
                  </p>
                </div>
              </div>
            )}
            {annonce.etage !== undefined && (
              <StatBox icon={Building2} label="Etage" value={annonce.etage === 0 ? 'RDC' : `${annonce.etage}`} />
            )}
          </div>

          {/* Description */}
          {annonce.description && (
            <div className="bg-brand-card rounded-xl p-4">
              <h2 className="text-sm font-semibold text-brand-text mb-3">Description</h2>
              <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">{annonce.description}</p>
            </div>
          )}

          {/* External link */}
          <a
            href={annonce.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-card border border-brand-border text-brand-text hover:border-brand-gold/30 transition-colors"
          >
            <ExternalLink size={16} />
            Voir sur {SOURCE_LABELS[annonce.source] || annonce.source}
          </a>
        </div>

        {/* Right column: score + zone + simulator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pepite score */}
          <div className="bg-brand-card rounded-xl p-5 border border-brand-border">
            <div className="flex items-center gap-4 mb-4">
              <PepiteScore score={annonce.pepiteScore || 0} size="lg" />
              <div>
                <h3 className="text-sm font-semibold text-brand-text">Score Pepite</h3>
                {annonce.rendementBrut && (
                  <p className="text-sm text-green-400 font-semibold">{formatPercent(annonce.rendementBrut)} rendement brut estime</p>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div className="space-y-2">
              <ScoreBar label="Prix sous marche" value={scoring.details.prix} weight="30%" />
              <ScoreBar label="Rendement" value={scoring.details.rendement} weight="25%" />
              <ScoreBar label="DPE renovable" value={scoring.details.dpe} weight="15%" />
              <ScoreBar label="Anciennete" value={scoring.details.anciennete} weight="10%" />
              <ScoreBar label="Baisse prix" value={scoring.details.baisse} weight="10%" />
              <ScoreBar label="Surface optimale" value={scoring.details.surface} weight="10%" />
            </div>
          </div>

          {/* Infos annonce */}
          <div className="bg-brand-card rounded-xl p-4 space-y-2 text-sm">
            {annonce.joursEnLigne !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-brand-muted flex items-center gap-2"><Clock size={14} />En ligne depuis</span>
                <span className="text-brand-text font-semibold">{annonce.joursEnLigne} jours</span>
              </div>
            )}
            {annonce.charges && (
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Charges copro/mois</span>
                <span className="text-brand-text font-semibold">{formatEuro(annonce.charges)}</span>
              </div>
            )}
            {annonce.taxeFonciere && (
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Taxe fonciere/an</span>
                <span className="text-brand-text font-semibold">{formatEuro(annonce.taxeFonciere)}</span>
              </div>
            )}
          </div>

          {/* Zone info */}
          {zone && (
            <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-brand-gold mb-2">{zone.name}</h3>
              <p className="text-xs text-brand-muted mb-2">{zone.why}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-brand-muted">Score LCD</span><br /><strong className="text-brand-text">{zone.scoreLCD}/10</strong></div>
                <div><span className="text-brand-muted">Nuitee</span><br /><strong className="text-brand-text">{zone.nuiteeMin}-{zone.nuiteeMax}€</strong></div>
                <div><span className="text-brand-muted">Occup.</span><br /><strong className="text-brand-text">{zone.occupMoy}%</strong></div>
              </div>
            </div>
          )}

          {/* Simulateur pre-rempli */}
          <div>
            <h2 className="text-lg font-bold text-brand-text mb-4">Simuler cet investissement</h2>
            <LCDSimulator initialParams={simParams} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value }: { icon: typeof Maximize; label: string; value: string }) {
  return (
    <div className="bg-brand-card rounded-lg p-3 flex items-center gap-3">
      <Icon size={18} className="text-brand-muted" />
      <div>
        <p className="text-xs text-brand-muted">{label}</p>
        <p className="text-sm text-brand-text font-semibold">{value}</p>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color = value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-yellow-400' : value >= 20 ? 'bg-orange-400' : 'bg-brand-border'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-brand-muted">{label} <span className="text-brand-border">({weight})</span></span>
        <span className="text-brand-text font-mono">{Math.round(value)}</span>
      </div>
      <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
