'use client'

import { cn } from '@/lib/utils'

interface PepiteScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

function getScoreLevel(score: number): { label: string; color: string; bgColor: string; borderColor: string } {
  if (score >= 70) return { label: 'Or', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400' }
  if (score >= 50) return { label: 'Argent', color: 'text-gray-300', bgColor: 'bg-gray-300/10', borderColor: 'border-gray-300' }
  if (score >= 30) return { label: 'Bronze', color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400' }
  return { label: '', color: 'text-brand-muted', bgColor: 'bg-brand-border/30', borderColor: 'border-brand-border' }
}

const sizes = {
  sm: 'w-10 h-10 text-sm border-2',
  md: 'w-14 h-14 text-lg border-3',
  lg: 'w-20 h-20 text-2xl border-4',
}

export function PepiteScore({ score, size = 'md' }: PepiteScoreProps) {
  const level = getScoreLevel(score)

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-black',
          sizes[size],
          level.bgColor,
          level.borderColor,
          level.color,
          'border'
        )}
      >
        {score}
      </div>
      {level.label && size !== 'sm' && (
        <span className={cn('text-xs font-semibold', level.color)}>{level.label}</span>
      )}
    </div>
  )
}

export function PepiteBadge({ score }: { score: number }) {
  const level = getScoreLevel(score)
  return (
    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', level.bgColor, level.color, 'border', level.borderColor)}>
      {score}
    </span>
  )
}
