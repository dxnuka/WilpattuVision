

const PARK_BOUNDS = { minLat: 8.28, maxLat: 8.58, minLng: 79.82, maxLng: 80.1 }
const ZOOM_LEVELS = [10, 11, 12, 13]
const TILE_SUBDOMAIN = 'a' // fixed subdomain so we don't triple-fetch the same tile via a/b/c

function lngToTileX(lng, zoom) {
  return Math.floor(((lng + 180) / 360) * 2 ** zoom)
}

function latToTileY(lat, zoom) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom
  )
}

function tilesForBounds(bounds, zoom) {
  const xMin = lngToTileX(bounds.minLng, zoom)
  const xMax = lngToTileX(bounds.maxLng, zoom)
  const yMin = latToTileY(bounds.maxLat, zoom) // max lat = smaller y
  const yMax = latToTileY(bounds.minLat, zoom)
  const tiles = []
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ z: zoom, x, y })
    }
  }
  return tiles
}

export function getOfflineTileList() {
  return ZOOM_LEVELS.flatMap((zoom) => tilesForBounds(PARK_BOUNDS, zoom))
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))])
}

/**
 * Downloads all park tiles, a few at a time, reporting progress.
 * @param {(done: number, total: number) => void} onProgress
 * @returns {Promise<{succeeded: number, failed: number, total: number}>}
 */
export async function downloadOfflineTiles(onProgress) {

  if ('serviceWorker' in navigator) {
    try {
      await withTimeout(navigator.serviceWorker.ready, 3000)
      if (!navigator.serviceWorker.controller) {
        // eslint-disable-next-line no-console
        console.warn(
          '[offlineMapTiles] Service worker registered but not yet controlling this tab — tiles may not cache. Reload the page once, then try again.'
        )
      }
    } catch {

    }
  }

  const tiles = getOfflineTileList()
  const total = tiles.length
  let done = 0
  let succeeded = 0
  let failed = 0
  const CONCURRENCY = 6
  const PER_TILE_TIMEOUT_MS = 8000

  async function fetchTile(url) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PER_TILE_TIMEOUT_MS)
    try {
      await fetch(url, { mode: 'no-cors', signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  async function worker(queue) {
    for (const tile of queue) {
      const url = `https://${TILE_SUBDOMAIN}.tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`
      try {
        await fetchTile(url)
        succeeded++
      } catch {
        failed++
      }
      done++
      onProgress?.(done, total)
    }
  }

  const chunks = Array.from({ length: CONCURRENCY }, (_, i) =>
    tiles.filter((_, idx) => idx % CONCURRENCY === i)
  )
  await Promise.all(chunks.map(worker))

  if (succeeded > 0) {
    localStorage.setItem('wv_offline_tiles_saved_at', new Date().toISOString())
  }

  return { succeeded, failed, total }
}

export function getLastOfflineSaveTime() {
  const iso = localStorage.getItem('wv_offline_tiles_saved_at')
  return iso ? new Date(iso) : null
}
