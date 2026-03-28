import { LCDSimulator } from '@/components/simulator/LCDSimulator'

export default function SimulateurPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text">
          Simulateur LCD
        </h1>
        <p className="text-brand-muted mt-2">
          Simulez le rendement d'un investissement en Location Courte Duree.
          Ajustez les parametres pour voir l'impact en temps reel.
        </p>
      </div>
      <LCDSimulator />
    </div>
  )
}
