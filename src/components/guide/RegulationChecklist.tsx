'use client'

import { useState } from 'react'
import regulationData from '@/data/regulation-checklist.json'
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react'

export function RegulationChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (label: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const totalItems = regulationData.reduce((sum, cat) => sum + cat.items.length, 0)
  const doneCount = checked.size
  const pct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-brand-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-brand-text font-semibold">Progression</span>
          <span className="text-sm text-brand-gold font-bold">{doneCount}/{totalItems} ({pct}%)</span>
        </div>
        <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
          <div className="h-full bg-brand-gold rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {regulationData.map((category) => (
        <div key={category.category} className="bg-brand-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-brand-text mb-4">{category.category}</h3>
          <div className="space-y-3">
            {category.items.map((item) => {
              const done = checked.has(item.label)
              return (
                <button
                  key={item.label}
                  onClick={() => toggle(item.label)}
                  className="flex items-start gap-3 w-full text-left group"
                >
                  {done ? (
                    <CheckCircle2 size={20} className="text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <Circle size={20} className="text-brand-border group-hover:text-brand-muted mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm ${done ? 'text-brand-muted line-through' : 'text-brand-text'}`}>
                      {item.label}
                    </span>
                    {item.critical && !done && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-400">
                        <AlertTriangle size={12} /> Critique
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
