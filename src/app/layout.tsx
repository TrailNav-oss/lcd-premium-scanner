import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Navbar } from '@/components/ui/Navbar'
import { VersionBadge } from '@/components/ui/VersionBadge'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://lcd-premium-scanner.vercel.app'

export const metadata: Metadata = {
  title: 'LCD Premium Scanner — Investissement Airbnb',
  description: 'Dashboard d\'analyse immobiliere pour investissement en Location Courte Duree premium. Bourgoin-Jallieu et environs.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'LCD Premium Scanner',
    description: 'Trouvez, analysez et simulez vos investissements en Location Courte Duree premium autour de Bourgoin-Jallieu.',
    url: SITE_URL,
    siteName: 'LCD Premium Scanner',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'LCD Premium Scanner',
    description: 'Dashboard d\'analyse immobiliere LCD — Bourgoin-Jallieu',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-brand-bg text-brand-text min-h-screen`}>
        <Navbar />
        <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
        <VersionBadge />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
