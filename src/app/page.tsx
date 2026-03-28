import Link from 'next/link'
import { Map, Calculator, BookOpen, Bell, TrendingUp, MapPin, Euro } from 'lucide-react'
import zonesData from '@/data/zones-bourgoin.json'
import { formatEuro } from '@/lib/utils'

export default function HomePage() {
  const bestZones = [...zonesData].sort((a, b) => b.scoreLCD - a.scoreLCD).slice(0, 3)
  const avgPrixM2 = Math.round(zonesData.reduce((s, z) => s + z.prixM2, 0) / zonesData.length)
  const avgNuitee = Math.round(zonesData.reduce((s, z) => s + (z.nuiteeMin + z.nuiteeMax) / 2, 0) / zonesData.length)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-text">
          LCD Premium <span className="text-brand-gold">Scanner</span>
        </h1>
        <p className="text-brand-muted mt-3 text-lg max-w-2xl">
          Trouvez, analysez et simulez vos investissements en Location Courte Duree
          premium autour de Bourgoin-Jallieu.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={MapPin} label="Zones analysees" value={`${zonesData.length}`} />
        <StatCard icon={Euro} label="Prix moyen /m2" value={formatEuro(avgPrixM2)} />
        <StatCard icon={TrendingUp} label="Nuitee moyenne" value={formatEuro(avgNuitee)} />
        <StatCard icon={Map} label="Meilleur score" value={`${bestZones[0]?.scoreLCD}/10`} highlight />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <ActionCard
          href="/carte"
          icon={Map}
          title="Carte interactive"
          desc="Explorez les zones avec scores LCD, prix/m2 et conseils."
        />
        <ActionCard
          href="/simulateur"
          icon={Calculator}
          title="Simulateur LCD"
          desc="Calculez le rendement, le cash-flow et la mensualite credit."
        />
        <ActionCard
          href="/guide"
          icon={BookOpen}
          title="Guide investissement"
          desc="Renovation, reglementation, fiscalite, outils de gestion."
        />
        <ActionCard
          href="/alertes"
          icon={Bell}
          title="Alertes"
          desc="Soyez notifie des pepites des leur apparition. (Phase 3)"
          disabled
        />
      </div>

      {/* Top zones */}
      <h2 className="text-xl font-bold text-brand-text mb-4">Top zones LCD</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {bestZones.map((zone, i) => (
          <Link href="/carte" key={zone.slug}>
            <div className="bg-brand-card rounded-xl p-5 border border-brand-border hover:border-brand-gold/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-brand-muted uppercase tracking-wider">#{i + 1}</span>
                <div className="w-10 h-10 rounded-full border-2 border-brand-gold flex items-center justify-center">
                  <span className="text-lg font-black text-brand-gold">{zone.scoreLCD}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-brand-text mb-1">{zone.name}</h3>
              <p className="text-xs text-brand-muted mb-3 line-clamp-2">{zone.why}</p>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Prix/m2" value={formatEuro(zone.prixM2)} />
                <MiniStat label="Nuitee" value={`${zone.nuiteeMin}-${zone.nuiteeMax}€`} />
                <MiniStat label="Occup." value={`${zone.occupMoy}%`} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: typeof Map; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-brand-gold/10 border border-brand-gold/20' : 'bg-brand-card'}`}>
      <Icon size={18} className={highlight ? 'text-brand-gold' : 'text-brand-muted'} />
      <p className={`text-xl font-bold mt-2 ${highlight ? 'text-brand-gold' : 'text-brand-text'}`}>{value}</p>
      <p className="text-xs text-brand-muted mt-0.5">{label}</p>
    </div>
  )
}

function ActionCard({ href, icon: Icon, title, desc, disabled }: { href: string; icon: typeof Map; title: string; desc: string; disabled?: boolean }) {
  const Wrapper = disabled ? 'div' : Link
  return (
    <Wrapper href={disabled ? undefined as never : href}>
      <div className={`bg-brand-card rounded-xl p-5 border border-brand-border h-full transition-colors ${disabled ? 'opacity-50' : 'hover:border-brand-gold/30 cursor-pointer'}`}>
        <Icon size={24} className="text-brand-gold mb-3" />
        <h3 className="text-sm font-semibold text-brand-text mb-1">{title}</h3>
        <p className="text-xs text-brand-muted">{desc}</p>
      </div>
    </Wrapper>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-brand-muted">{label}</p>
      <p className="text-sm font-semibold text-brand-text">{value}</p>
    </div>
  )
}
