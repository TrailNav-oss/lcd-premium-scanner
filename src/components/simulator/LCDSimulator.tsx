'use client'

import { useState, useMemo } from 'react'
import { SimulationParams, SIMULATION_DEFAULTS } from '@/types/simulation'
import { calculateSimulation, calculateMonthlyData } from '@/lib/scoring/rendement'
import { SeasonalChart } from './SeasonalChart'
import { CashflowBreakdown } from './CashflowBreakdown'
import { formatEuro, formatPercent } from '@/lib/utils'

interface SliderFieldProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}

function SliderField({ id, label, value, min, max, step, unit, onChange }: SliderFieldProps) {
  const displayValue = unit === '€' ? formatEuro(value) : unit === '%' ? formatPercent(value, 1) : `${value} ${unit}`

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-brand-muted">{label}</label>
        <span className="text-sm font-semibold text-brand-text">{displayValue}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-brand-border rounded-full appearance-none cursor-pointer"
      />
    </div>
  )
}

interface LCDSimulatorProps {
  initialParams?: Partial<SimulationParams>
}

export function LCDSimulator({ initialParams }: LCDSimulatorProps) {
  const [params, setParams] = useState<SimulationParams>({
    ...SIMULATION_DEFAULTS,
    ...initialParams,
  })

  const update = (key: keyof SimulationParams, value: number) => {
    setParams((p) => ({ ...p, [key]: value }))
  }

  const result = useMemo(() => calculateSimulation(params), [params])
  const monthlyData = useMemo(() => calculateMonthlyData(params), [params])

  const cashflowPositif = result.cashflowMensuel > 0

  return (
    <div className="space-y-6">
      {/* Résultats clés en haut */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ResultCard label="Rendement brut" value={formatPercent(result.rendementBrut)} highlight />
        <ResultCard label="Rendement net" value={formatPercent(result.rendementNet)} />
        <ResultCard
          label="Cash-flow /mois"
          value={formatEuro(result.cashflowMensuel)}
          color={cashflowPositif ? 'text-green-400' : 'text-red-400'}
        />
        <ResultCard label="CA annuel" value={formatEuro(result.caAnnuel)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Colonne sliders */}
        <div className="space-y-6">
          {/* Achat */}
          <div className="bg-brand-card rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-brand-gold">Achat & Renovation</h3>
            <SliderField id="sim-prix-achat" label="Prix d'achat" value={params.prixAchat} min={30000} max={200000} step={5000} unit="€" onChange={(v) => update('prixAchat', v)} />
            <SliderField id="sim-budget-reno" label="Budget renovation" value={params.budgetReno} min={0} max={50000} step={1000} unit="€" onChange={(v) => update('budgetReno', v)} />
            <SliderField id="sim-apport" label="Apport personnel" value={params.apport} min={0} max={50000} step={1000} unit="€" onChange={(v) => update('apport', v)} />
          </div>

          {/* LCD */}
          <div className="bg-brand-card rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-brand-gold">Location Courte Duree</h3>
            <SliderField id="sim-nuitee" label="Prix par nuitee" value={params.nuitee} min={30} max={120} step={1} unit="€" onChange={(v) => update('nuitee', v)} />
            <SliderField id="sim-occupation" label="Taux d'occupation" value={params.tauxOccupation} min={20} max={90} step={5} unit="%" onChange={(v) => update('tauxOccupation', v)} />
            <SliderField id="sim-menage" label="Menage par passage" value={params.menageParPassage} min={20} max={80} step={5} unit="€" onChange={(v) => update('menageParPassage', v)} />
            <SliderField id="sim-conciergerie" label="Conciergerie" value={params.conciergeriePct} min={0} max={25} step={1} unit="%" onChange={(v) => update('conciergeriePct', v)} />
          </div>

          {/* Charges */}
          <div className="bg-brand-card rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-brand-gold">Charges & Fiscalite</h3>
            <SliderField id="sim-charges" label="Charges mensuelles" value={params.chargesMensuelles} min={50} max={300} step={10} unit="€" onChange={(v) => update('chargesMensuelles', v)} />
            <SliderField id="sim-taxe" label="Taxe fonciere /an" value={params.taxeFonciere} min={200} max={1500} step={50} unit="€" onChange={(v) => update('taxeFonciere', v)} />
            <SliderField id="sim-cfe" label="CFE /an" value={params.cfe} min={0} max={1000} step={50} unit="€" onChange={(v) => update('cfe', v)} />
          </div>

          {/* Crédit */}
          <div className="bg-brand-card rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-brand-gold">Credit immobilier</h3>
            <SliderField id="sim-taux-credit" label="Taux credit" value={params.tauxCredit} min={2} max={6} step={0.1} unit="%" onChange={(v) => update('tauxCredit', v)} />
            <SliderField id="sim-duree-credit" label="Duree credit" value={params.dureeCredit} min={10} max={25} step={1} unit="ans" onChange={(v) => update('dureeCredit', v)} />
          </div>
        </div>

        {/* Colonne résultats */}
        <div className="space-y-6">
          <CashflowBreakdown result={result} params={params} />
          <SeasonalChart data={monthlyData} />
        </div>
      </div>
    </div>
  )
}

function ResultCard({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-brand-gold/10 border border-brand-gold/20' : 'bg-brand-card'}`}>
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || (highlight ? 'text-brand-gold' : 'text-brand-text')}`}>{value}</p>
    </div>
  )
}
