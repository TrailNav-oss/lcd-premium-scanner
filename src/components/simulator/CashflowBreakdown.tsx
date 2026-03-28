'use client'

import { ArrowUp, ArrowDown, CreditCard, Banknote } from 'lucide-react'
import type { SimulationResult, SimulationParams } from '@/types/simulation'
import { formatEuro } from '@/lib/utils'

interface Props {
  result: SimulationResult
  params: SimulationParams
}

function Line({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'border-t border-brand-border pt-3 mt-2' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-brand-text' : 'text-brand-muted'}`}>{label}</span>
      <span className={`text-sm font-mono ${color || 'text-brand-text'} ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  )
}

export function CashflowBreakdown({ result, params }: Props) {
  return (
    <div className="bg-brand-card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-brand-gold mb-4">Decomposition annuelle</h3>

      {/* Investissement */}
      <div className="mb-4">
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <CreditCard size={14} /> Investissement
        </p>
        <Line label="Prix d'achat" value={formatEuro(params.prixAchat)} />
        <Line label="Frais de notaire (8%)" value={formatEuro(result.fraisNotaire)} />
        <Line label="Renovation" value={formatEuro(params.budgetReno)} />
        {params.apport > 0 && <Line label="Apport" value={`-${formatEuro(params.apport)}`} color="text-green-400" />}
        <Line label="Investissement total" value={formatEuro(result.investTotal)} bold />
      </div>

      {/* Revenus */}
      <div className="mb-4">
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <ArrowUp size={14} className="text-green-400" /> Revenus annuels
        </p>
        <Line label="CA location" value={formatEuro(result.caAnnuel)} color="text-green-400" />
      </div>

      {/* Charges */}
      <div className="mb-4">
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <ArrowDown size={14} className="text-red-400" /> Charges annuelles
        </p>
        <Line label="Menage" value={`-${formatEuro(result.menageAnnuel)}`} />
        {result.conciergerieAnnuel > 0 && <Line label="Conciergerie" value={`-${formatEuro(result.conciergerieAnnuel)}`} />}
        <Line label="Commission plateforme (3%)" value={`-${formatEuro(result.commissionPlateforme)}`} />
        <Line label="Charges + taxes" value={`-${formatEuro(result.chargesAnnuelles)}`} />
        <Line label="Total charges" value={`-${formatEuro(result.totalCharges)}`} color="text-red-400" bold />
      </div>

      {/* Net */}
      <div>
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <Banknote size={14} className="text-brand-gold" /> Resultat
        </p>
        <Line label="Net avant credit" value={formatEuro(result.netAvantCredit)} />
        <Line label="Mensualite credit" value={`-${formatEuro(result.mensualiteCredit)}/mois`} />
        <Line
          label="Cash-flow mensuel"
          value={formatEuro(result.cashflowMensuel)}
          color={result.cashflowMensuel >= 0 ? 'text-green-400' : 'text-red-400'}
          bold
        />
        <Line
          label="Cash-flow annuel"
          value={formatEuro(result.cashflowAnnuel)}
          color={result.cashflowAnnuel >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>
    </div>
  )
}
