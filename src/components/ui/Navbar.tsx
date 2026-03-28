'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Calculator, BookOpen, Home, Bell, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/annonces', label: 'Annonces', icon: Building2 },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/simulateur', label: 'Simulateur', icon: Calculator },
  { href: '/guide', label: 'Guide', icon: BookOpen },
  { href: '/alertes', label: 'Alertes', icon: Bell },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-brand-surface border-r border-brand-border z-50">
        <div className="p-6">
          <h1 className="text-xl font-bold text-brand-gold">LCD Premium</h1>
          <p className="text-xs text-brand-muted mt-1">Scanner immobilier</p>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-gold/10 text-brand-gold'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-card'
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-brand-border">
          <p className="text-xs text-brand-muted">Phase 1 — MVP</p>
          <p className="text-xs text-brand-muted">Bourgoin-Jallieu (38)</p>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border z-50 safe-area-pb">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
                  active ? 'text-brand-gold' : 'text-brand-muted'
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
