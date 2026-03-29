'use client'

import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/map/MapView').then(m => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-brand-bg">
      <div className="text-brand-muted animate-pulse">Chargement de la carte...</div>
    </div>
  ),
})

export default function CartePage() {
  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen w-full">
      <MapView />
    </div>
  )
}
