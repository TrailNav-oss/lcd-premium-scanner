'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import type { MonthlyData } from '@/types/simulation'
import { formatEuro } from '@/lib/utils'

interface SeasonalChartProps {
  data: MonthlyData[]
}

export function SeasonalChart({ data }: SeasonalChartProps) {
  return (
    <div className="bg-brand-card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-brand-gold mb-4">Cash-flow mensuel (saisonnalite)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#352d22" />
            <XAxis dataKey="mois" tick={{ fill: '#8a7d6b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8a7d6b', fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#231e16',
                border: '1px solid #352d22',
                borderRadius: '8px',
                color: '#f5e6d0',
              }}
              formatter={(value, name) => [
                formatEuro(value as number),
                name === 'cashflow' ? 'Cash-flow' : name === 'ca' ? 'CA' : 'Charges',
              ]}
            />
            <ReferenceLine y={0} stroke="#8a7d6b" strokeDasharray="3 3" />
            <Bar dataKey="cashflow" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.cashflow >= 0 ? '#22c55e' : '#ef4444'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-xs text-brand-muted">Positif</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs text-brand-muted">Negatif</span>
        </div>
      </div>
    </div>
  )
}
