'use client'

import { ExternalLink } from 'lucide-react'

const TOOLS = [
  {
    category: 'Channel Manager',
    items: [
      { name: 'Hospitable', desc: 'Messagerie auto, synchro calendriers, guides arrivee. A partir de 29€/mois.', url: 'https://hospitable.com' },
      { name: 'Lodgify', desc: 'Site de reservation direct + channel manager. A partir de 17€/mois.', url: 'https://lodgify.com' },
    ],
  },
  {
    category: 'Pricing dynamique',
    items: [
      { name: 'PriceLabs', desc: 'Tarification dynamique basee sur la demande. A partir de 20€/mois/bien.', url: 'https://pricelabs.co' },
      { name: 'Beyond', desc: 'Ex-Beyond Pricing. Algorithme de pricing + revenue management.', url: 'https://beyondpricing.com' },
    ],
  },
  {
    category: 'Acces / Serrures connectees',
    items: [
      { name: 'Nuki', desc: 'Serrure connectee europeenne. Check-in autonome, codes temporaires. ~150€.', url: 'https://nuki.io' },
      { name: 'Igloohome', desc: 'Cadenas et serrures a code. Fonctionne offline. ~100-200€.', url: 'https://igloohome.co' },
    ],
  },
  {
    category: 'Automatisation',
    items: [
      { name: 'n8n', desc: 'Automatisation open-source (self-hosted). Connecter Airbnb, Google Sheets, Telegram. Gratuit.', url: 'https://n8n.io' },
      { name: 'Make', desc: 'Ex-Integromat. Automatisation no-code cloud. Free tier genereux.', url: 'https://make.com' },
    ],
  },
  {
    category: 'Conciergerie (si delegation)',
    items: [
      { name: 'Conciergerie locale', desc: "15-20% du CA. Gere menage, linge, check-in, communication. Chercher sur LeBonCoin 'conciergerie Airbnb'.", url: '' },
      { name: 'GuestReady', desc: 'Conciergerie nationale. 18-25% du CA. Tout inclus.', url: 'https://guestready.com' },
      { name: 'Luckey (by Airbnb)', desc: 'Service officiel Airbnb. ~20% du CA.', url: 'https://luckey.com' },
    ],
  },
  {
    category: 'Comptabilite LMNP',
    items: [
      { name: 'Decla.fr', desc: 'Comptabilite LMNP en ligne. Declaration + amortissements. ~500€/an.', url: 'https://decla.fr' },
      { name: 'JD2M', desc: 'Specialiste LMNP. Accompagnement complet. ~600€/an.', url: 'https://www.jedeclaremonmeuble.com' },
    ],
  },
]

export function ManagementStack() {
  return (
    <div className="space-y-6">
      <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-4">
        <p className="text-sm text-brand-gold font-semibold">Stack recommandee pour demarrer (budget 0€) :</p>
        <p className="text-sm text-brand-text mt-1">Airbnb direct + serrure Nuki + menage local + n8n pour automatiser les messages</p>
        <p className="text-xs text-brand-muted mt-1">Passez au channel manager quand vous gerez 2+ biens ou multi-plateforme.</p>
      </div>

      {TOOLS.map((section) => (
        <div key={section.category} className="bg-brand-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-brand-text mb-4">{section.category}</h3>
          <div className="space-y-3">
            {section.items.map((tool) => (
              <div key={tool.name} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-brand-text">{tool.name}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{tool.desc}</p>
                </div>
                {tool.url && (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-lg hover:bg-brand-border text-brand-muted hover:text-brand-gold transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
