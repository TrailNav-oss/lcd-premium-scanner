'use client'

import renoItems from '@/data/reno-items.json'
import { Hammer, Sparkles, Wifi, Zap } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, typeof Hammer> = {
  'Essentiel': Hammer,
  'Wow factor': Sparkles,
  'Equipement LCD': Wifi,
  'DPE / Energie': Zap,
}

const PRIORITY_COLORS: Record<string, string> = {
  essentiel: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
  wow: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export function RenovationGuide() {
  const totalMin = renoItems.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + i.prixMin, 0), 0)
  const totalMax = renoItems.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + i.prixMax, 0), 0)

  return (
    <div className="space-y-6">
      <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-4">
        <p className="text-sm text-brand-gold font-semibold">Budget total estime pour un T2 :</p>
        <p className="text-2xl font-bold text-brand-text mt-1">{formatEuro(totalMin)} — {formatEuro(totalMax)}</p>
        <p className="text-xs text-brand-muted mt-1">Fourchette basse (DIY + entree de gamme) a haute (tout par artisan + premium)</p>
      </div>

      {renoItems.map((category) => {
        const Icon = CATEGORY_ICONS[category.category] || Hammer
        const catMin = category.items.reduce((s, i) => s + i.prixMin, 0)
        const catMax = category.items.reduce((s, i) => s + i.prixMax, 0)

        return (
          <div key={category.category} className="bg-brand-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
                <Icon size={16} className="text-brand-gold" />
                {category.category}
              </h3>
              <span className="text-xs text-brand-muted">{formatEuro(catMin)} — {formatEuro(catMax)}</span>
            </div>
            <div className="space-y-3">
              {category.items.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[item.priority]}`}>
                      {item.priority === 'essentiel' ? 'Essentiel' : 'Wow'}
                    </span>
                    <span className="text-sm text-brand-text">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-brand-muted">
                      {formatEuro(item.prixMin)} — {formatEuro(item.prixMax)}
                    </span>
                    <span className="text-xs text-brand-muted ml-2">/ {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
