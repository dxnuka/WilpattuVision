import { CheckCircle2, XCircle, X } from 'lucide-react'
import { useToast } from '../../hooks/useToast'

export default function ToastStack() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-soft ${
            t.type === 'error' ? 'bg-danger-500 text-white' : 'bg-canopy-600 text-white'
          }`}
        >
          {t.type === 'error' ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
