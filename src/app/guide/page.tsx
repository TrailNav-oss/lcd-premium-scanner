'use client'

import { useState } from 'react'
import { RenovationGuide } from '@/components/guide/RenovationGuide'
import { RegulationChecklist } from '@/components/guide/RegulationChecklist'
import { InvestmentFAQ } from '@/components/guide/InvestmentFAQ'
import { ManagementStack } from '@/components/guide/ManagementStack'
import { Wrench, Scale, HelpCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'reno', label: 'Renovation', icon: Wrench },
  { id: 'regulation', label: 'Reglementation', icon: Scale },
  { id: 'faq', label: 'FAQ Immo', icon: HelpCircle },
  { id: 'stack', label: 'Gestion', icon: Settings },
] as const

type TabId = typeof TABS[number]['id']

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<TabId>('reno')

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text">
          Guide investissement LCD
        </h1>
        <p className="text-brand-muted mt-2">
          Tout ce qu'il faut savoir pour reussir son investissement en Location Courte Duree premium.
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Sections du guide" className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                : 'bg-brand-card text-brand-muted hover:text-brand-text'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'reno' && <RenovationGuide />}
        {activeTab === 'regulation' && <RegulationChecklist />}
        {activeTab === 'faq' && <InvestmentFAQ />}
        {activeTab === 'stack' && <ManagementStack />}
      </div>
    </div>
  )
}
