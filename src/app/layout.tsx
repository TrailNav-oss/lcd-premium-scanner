import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/ui/Navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LCD Premium Scanner — Investissement Airbnb',
  description: 'Dashboard d\'analyse immobiliere pour investissement en Location Courte Duree premium. Bourgoin-Jallieu et environs.',
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
      </body>
    </html>
  )
}
