import { useEffect, useRef, useState } from 'react'
import { WifiOff, Download, Loader2, CheckCircle2 } from 'lucide-react'
import GoogleParkMap from './GoogleParkMap'
import LeafletOfflineMap from './LeafletOfflineMap'
import { downloadOfflineTiles, getLastOfflineSaveTime } from '../../lib/offlineMapTiles'


const AUTO_REFRESH_MS = 24 * 60 * 60 * 1000

export default function ParkMapView(props) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [lastSaved, setLastSaved] = useState(getLastOfflineSaveTime())
  const autoTriggeredRef = useRef(false)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const handleSaveOffline = async () => {
    setSaving(true)
    setProgress({ done: 0, total: 0 })
    await downloadOfflineTiles((done, total) => setProgress({ done, total }))
    setSaving(false)
    setLastSaved(getLastOfflineSaveTime())
  }

  useEffect(() => {
   
    if (!isOnline || autoTriggeredRef.current) return
    const stale = !lastSaved || Date.now() - lastSaved.getTime() > AUTO_REFRESH_MS
    if (!stale) return

    autoTriggeredRef.current = true
    downloadOfflineTiles().then(() => setLastSaved(getLastOfflineSaveTime()))
  }, [isOnline])

  return (
    <div className="flex h-full flex-col">
      {!isOnline && (
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 text-xs font-medium text-amber-700">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Offline — showing the cached OpenStreetMap view.
        </div>
      )}

      <div className="min-h-0 flex-1">
        {isOnline ? <GoogleParkMap {...props} /> : <LeafletOfflineMap {...props} />}
      </div>

      {isOnline && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-canopy-100 bg-white px-4 py-2.5 text-xs text-bark-500">
          <span>
            {lastSaved
              ? `Offline map last saved ${lastSaved.toLocaleDateString()}`
              : "Map isn't saved for offline use yet."}
          </span>
          <button
            onClick={handleSaveOffline}
            disabled={saving}
            className="inline-flex items-center gap-1.5 font-semibold text-canopy-600 hover:text-canopy-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving {progress.done}/{progress.total}…
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Re-save for offline
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" /> Save map for offline
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
