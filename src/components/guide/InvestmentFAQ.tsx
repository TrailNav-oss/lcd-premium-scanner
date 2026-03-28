'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que le rendement brut vs net ?",
    a: "Le rendement brut = loyers annuels / prix d'achat total. Il ne tient pas compte des charges. Le rendement net deduit toutes les charges (menage, copro, taxe fonciere, CFE, conciergerie, commission plateforme). C'est le chiffre qui compte vraiment. Un bon rendement net en LCD est > 7%."
  },
  {
    q: "Qu'est-ce que le LMNP ?",
    a: "Loueur Meuble Non Professionnel. C'est le statut fiscal le plus avantageux pour la LCD. Deux regimes : micro-BIC (abattement 71% sur les revenus) ou reel (deduction des charges reelles + amortissement du bien). Le reel est quasi toujours plus avantageux car l'amortissement permet de ne payer aucun impot pendant 10-15 ans."
  },
  {
    q: "Pourquoi le DPE F ou G est une opportunite ?",
    a: "Un bien en DPE F/G se vend moins cher (decote 10-20%). Apres renovation energetique (isolation, fenetres, chauffage), vous gagnez un meilleur DPE (objectif D minimum) ET vous augmentez la valeur du bien. De plus, les travaux sont amortissables en LMNP reel. Double gain : prix d'achat bas + plus-value post-travaux."
  },
  {
    q: "Combien coute une renovation complete T2 pour Airbnb premium ?",
    a: "Budget moyen : 15 000 a 25 000€ pour un T2 de 40m2. Cela comprend : peinture, sol, salle de bain, cuisine equipee, mise aux normes elec/plomberie, deco premium. Ajoutez 3 000-5 000€ pour les equipements LCD (literie, electromenager, serrure connectee, deco)."
  },
  {
    q: "Qu'est-ce que la CFE ?",
    a: "Cotisation Fonciere des Entreprises. Tout loueur en meuble doit la payer. Elle depend de la commune et de la surface. Comptez 300-600€/an pour un T2. Exoneration la premiere annee d'activite (declaration au 31/12 de l'annee de debut)."
  },
  {
    q: "Faut-il une autorisation pour faire de la LCD ?",
    a: "Depuis 2024, il faut obligatoirement un numero d'enregistrement en mairie. Dans les villes de + 200 000 habitants, un changement d'usage peut etre requis. Autour de Bourgoin-Jallieu, les communes sont generalement ouvertes a la LCD sans restriction majeure. Verifier quand meme le reglement de copropriete."
  },
  {
    q: "Conciergerie ou autogestion ?",
    a: "L'autogestion est plus rentable mais demande du temps (communication voyageurs, menage, check-in). Une conciergerie prend 15-25% du CA mais gere tout. Solution intermediaire : serrure connectee (check-in autonome) + femme de menage locale + gestion perso sur Airbnb. C'est le meilleur ratio effort/rendement."
  },
  {
    q: "Quel taux d'occupation viser ?",
    a: "En zone Bourgoin-Jallieu, visez 55-65% la premiere annee, avec un objectif de 70%+ a maturite (apres accumulation d'avis). L'occupation depend fortement de : qualite des photos, prix competitif au debut, reactivite des messages, note globale. Les premiers mois, baissez le prix pour accumuler des avis 5 etoiles."
  },
  {
    q: "Comment fixer le prix de la nuitee ?",
    a: "Analysez les Airbnb similaires dans le secteur (surface, equipements, note). Positionnez-vous 5-10% en dessous au debut pour accumuler des reservations et avis. Apres 10+ avis a 4.8+, augmentez progressivement. Utilisez le pricing dynamique (PriceLabs, Beyond) si le volume le justifie."
  },
  {
    q: "Quel apport pour un investissement LCD ?",
    a: "Les banques demandent generalement 10% d'apport + frais de notaire (8%). Pour un bien a 75 000€, comptez 13 500€ minimum (frais notaire 6 000€ + apport 7 500€). Certains courtiers obtiennent du 110% (sans apport) si vos revenus sont stables et votre profil solide."
  },
]

export function InvestmentFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="bg-brand-card rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex items-center justify-between w-full p-4 text-left"
          >
            <span className="text-sm font-medium text-brand-text pr-4">{item.q}</span>
            <ChevronDown
              size={18}
              className={cn(
                'text-brand-muted shrink-0 transition-transform',
                open === i && 'rotate-180'
              )}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <p className="text-sm text-brand-muted leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
