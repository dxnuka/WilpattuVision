import { createContext, useCallback, useState } from 'react'

export const ToastContext = createContext(undefined)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success') => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  const value = {
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
    toasts,
    dismiss,
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
