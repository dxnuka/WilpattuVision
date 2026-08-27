import { useState } from 'react'
import { X, Trash2, Loader2 } from 'lucide-react'
import { formatSightingDateTime } from '../lib/formatDate'
import ParkMapView from '../components/map/ParkMapView'
import Lightbox from '../components/common/Lightbox'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-600',
  verified: 'bg-green-100 text-success-500',
  rejected: 'bg-red-100 text-danger-500',
}

export default function SubmissionDetailModal({ sighting, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  if (!sighting) return null

  const status = sighting.verificationStatus || 'pending'
  const hasLocation = typeof sighting.latitude === 'number' && typeof sighting.longitude === 'number'

  const handleDelete = async () => {
    if (!confirm('Delete this sighting? This cannot be undone.')) return
    setDeleting(true)
    try {
      await onDelete(sighting.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-bark-900/60 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-bark-800">{sighting.speciesCommonName}</h2>
            <p className="mt-0.5 text-xs text-bark-400">{formatSightingDateTime(sighting.observedAt)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
              {status}
            </span>
            <button onClick={onClose} aria-label="Close" className="text-bark-400 hover:text-bark-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {status === 'rejected' && sighting.rejectionReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger-500">
            <strong>Reason: </strong>{sighting.rejectionReason}
          </p>
        )}

        <p className="mt-4 break-words text-sm text-bark-600">{sighting.notes || 'No notes added.'}</p>

        {sighting.images?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-bark-700">Photos</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sighting.images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setLightboxSrc(url)}
                  className="aspect-square overflow-hidden rounded-xl bg-canopy-50"
                  aria-label={`View photo ${i + 1} full size`}
                >
                  <img src={url} alt={`${sighting.speciesCommonName} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {hasLocation && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-bark-700">Location</p>
            <div className="h-48 overflow-hidden rounded-xl border border-canopy-100">
              <ParkMapView hotspots={[]} sightings={[sighting]} focusLocation={{ lat: sighting.latitude, lng: sighting.longitude }} />
            </div>
          </div>
        )}

        <button onClick={handleDelete} disabled={deleting} className="btn-secondary mt-6 w-full !border-danger-500/40 !text-danger-500 hover:!bg-red-50">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {deleting ? 'Deleting...' : 'Delete sighting'}
        </button>
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  )
}
