/** Converts a Firestore Timestamp or Date-like value into a JS Date. */
export function toDate(value) {
  if (!value) return new Date()
  return value.toDate ? value.toDate() : new Date(value)
}


export function formatSightingDateTime(value) {
  const d = toDate(value)
  const includeYear = d.getFullYear() !== new Date().getFullYear()
  const datePart = d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  })
  const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${datePart} \u00b7 ${timePart}`
}
