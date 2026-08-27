import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Loader2, Trash2, Send, BookmarkPlus } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getDraftLocations, saveDraftLocation, deleteDraftLocation } from '../../lib/offlineDrafts'


export default function SaveLocationPanel() {
  const navigate = useNavigate()
  const { position, status, request } = useGeolocation()
  const [tag, setTag] = useState('')
  const [drafts, setDrafts] = useState(getDraftLocations())
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (position && showForm === false) setShowForm(true)
  }, [position]) 

  const handleSave = () => {
    if (!position) return
    saveDraftLocation({ lat: position.lat, lng: position.lng, tag })
    setDrafts(getDraftLocations())
    setTag('')
    setShowForm(false)
  }

  const handleDelete = (id) => {
    deleteDraftLocation(id)
    setDrafts(getDraftLocations())
  }

  const handleUse = (draft) => {
    navigate('/sightings/new', {
      state: { presetLocation: { lat: draft.lat, lng: draft.lng }, presetTag: draft.tag, presetObservedAt: draft.savedAt },
    })
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <BookmarkPlus className="h-4 w-4 text-canopy-500" />
        <h3 className="text-sm font-semibold text-bark-800">Save a location for later</h3>
      </div>
      <p className="mt-1 text-xs text-bark-400">
        Capture GPS + a short tag right now even with no connection. Submit it as a full
        sighting once you're back online.
      </p>

      {!showForm ? (
        <button onClick={request} disabled={status === 'requesting'} className="btn-secondary mt-3 w-full !py-2 !text-xs">
          {status === 'requesting' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
          Capture my location
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="font-mono text-xs text-bark-500">
            {position?.lat.toFixed(5)}, {position?.lng.toFixed(5)}
          </p>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag, e.g. 'leopard near rock outcrop'"
            className="input-field !py-2 !text-xs"
          />
          <button onClick={handleSave} className="btn-primary w-full !py-2 !text-xs">
            Save location
          </button>
        </div>
      )}
      {status === 'denied' && <p className="mt-2 text-xs text-danger-500">Location permission denied.</p>}

      {drafts.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-canopy-100 pt-3">
          <p className="text-xs font-semibold text-bark-600">Saved locations ({drafts.length})</p>
          {drafts.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-villu-100 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-bark-700">{d.tag}</p>
                <p className="font-mono text-[10px] text-bark-400">
                  {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => handleUse(d)} aria-label="Submit this location as a sighting" className="rounded-full p-1.5 text-canopy-600 hover:bg-canopy-50">
                  <Send className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(d.id)} aria-label="Delete saved location" className="rounded-full p-1.5 text-danger-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
