'use client'

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr" className="dark">
      <body className="bg-brand-bg text-brand-text min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">Erreur inattendue</h2>
          <p className="text-brand-muted mb-6 text-sm">
            Une erreur est survenue. Elle a ete automatiquement signale.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-brand-gold text-brand-bg hover:bg-brand-gold-light"
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  )
}
