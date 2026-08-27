
const STORAGE_KEY = 'wv_offline_sighting_drafts'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(drafts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export function getDraftLocations() {
  return readAll().sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
}

/** @param {{ lat: number, lng: number, tag: string }} entry */
export function saveDraftLocation({ lat, lng, tag }) {
  const drafts = readAll()
  const draft = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lat,
    lng,
    tag: tag?.trim() || 'Untitled location',
    savedAt: new Date().toISOString(),
  }
  writeAll([draft, ...drafts])
  return draft
}

export function deleteDraftLocation(id) {
  writeAll(readAll().filter((d) => d.id !== id))
}
