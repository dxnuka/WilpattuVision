import { useContext } from 'react'
import { NoticesCountContext } from '../context/NoticesCountContext'

export function useNoticesCount() {
  const ctx = useContext(NoticesCountContext)
  if (ctx === undefined) {
    throw new Error('useNoticesCount must be used within a NoticesCountProvider')
  }
  return ctx
}
