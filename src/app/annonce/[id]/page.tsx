import type { Metadata } from 'next'
import { getAnnonces } from '@/lib/store/cache'
import { generateSeedData } from '@/lib/scraper/seed'
import { formatEuro } from '@/lib/utils'
import AnnonceDetailClient from './AnnonceDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const cached = getAnnonces()
  const annonces = cached.length > 0 ? cached : generateSeedData()
  const annonce = annonces.find(a => a.id === decodedId)

  if (!annonce) {
    return { title: 'Annonce introuvable — LCD Premium Scanner' }
  }

  const title = `${annonce.title} — ${formatEuro(annonce.prix)} | LCD Premium Scanner`
  const description = [
    annonce.surface ? `${annonce.surface} m²` : null,
    annonce.nbPieces ? `${annonce.nbPieces} pieces` : null,
    annonce.ville || 'Bourgoin-Jallieu',
    annonce.pepiteScore ? `Score pepite ${annonce.pepiteScore}/100` : null,
    annonce.rendementBrut ? `Rendement brut estime ${annonce.rendementBrut.toFixed(1)}%` : null,
  ].filter(Boolean).join(' — ')

  return {
    title,
    description,
    openGraph: {
      title: annonce.title,
      description,
      images: annonce.photos.length > 0 ? [annonce.photos[0]] : undefined,
    },
  }
}

export default function AnnonceDetailPage() {
  return <AnnonceDetailClient />
}
