'use client'

import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'info' | 'error'
}

let toastId = 0
let addToastFn: ((text: string, type?: ToastMessage['type']) => void) | null = null

/** Call from anywhere to show a toast */
export function showToast(text: string, type: ToastMessage['type'] = 'info') {
  addToastFn?.(text, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  const colors = {
    success: 'bg-green-500/90 text-white',
    info: 'bg-brand-card text-brand-text border border-brand-border',
    error: 'bg-red-500/90 text-white',
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg animate-slide-in ${colors[toast.type]}`}
        >
          {toast.text}
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            aria-label="Fermer"
            className="ml-1 opacity-70 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
