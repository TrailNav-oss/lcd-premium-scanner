'use client'

const APP_VERSION = 'v0.3.0'
const BUILD_DATE = '2026-03-29 22:45'

export function VersionBadge() {
  return (
    <div className="fixed bottom-2 right-2 md:bottom-3 md:right-3 z-50 bg-brand-surface/90 backdrop-blur-sm border border-brand-border rounded-lg px-3 py-1.5 text-[10px] text-brand-muted select-none pointer-events-none">
      <span className="font-semibold text-brand-gold">{APP_VERSION}</span>
      <span className="mx-1.5 text-brand-border">|</span>
      <span>MAJ {BUILD_DATE}</span>
    </div>
  )
}
