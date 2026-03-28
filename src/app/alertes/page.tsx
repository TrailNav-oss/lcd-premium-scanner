import { Bell, Lock } from 'lucide-react'

export default function AlertesPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text">Alertes</h1>
        <p className="text-brand-muted mt-2">
          Recevez une notification Telegram des qu'une pepite immobiliere apparait.
        </p>
      </div>

      <div className="bg-brand-card rounded-xl p-8 border border-brand-border text-center">
        <div className="w-16 h-16 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-brand-gold" />
        </div>
        <h2 className="text-lg font-semibold text-brand-text mb-2">Disponible en Phase 3</h2>
        <p className="text-sm text-brand-muted max-w-md mx-auto mb-6">
          Le systeme d'alertes sera active apres la mise en place du scraping
          d'annonces (Phase 2). Il permettra de configurer des criteres et
          recevoir des notifications par Telegram ou email.
        </p>
        <div className="flex flex-col gap-3 max-w-sm mx-auto text-left">
          <Feature text="Criteres personnalises (prix, surface, DPE, zone)" />
          <Feature text="Score pepite minimum configurable" />
          <Feature text="Notifications Telegram instantanees" />
          <Feature text="Email via Resend (100/jour gratuit)" />
          <Feature text="Matching automatique a chaque scrape" />
        </div>
      </div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Bell size={14} className="text-brand-gold shrink-0" />
      <span className="text-sm text-brand-muted">{text}</span>
    </div>
  )
}
