import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import { getSightingById, updateSightingStatus } from '../../services/sightingsService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import PageLoader from '../../components/common/PageLoader'
import Lightbox from '../../components/common/Lightbox'
import ParkMapView from '../../components/map/ParkMapView'

export default function SightingDetailAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [sighting, setSighting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    getSightingById(id).then((data) => {
      setSighting(data)
      setReason(data?.rejectionReason || '')
      setLoading(false)
    })
  }, [id])

  const handleReview = async (verificationStatus) => {
    setSaving(true)
    try {
      await updateSightingStatus(id, verificationStatus, user.uid, reason)
      toast.success(verificationStatus === 'verified' ? 'Sighting verified.' : 'Sighting rejected.')
      navigate('/admin/sightings')
    } catch {
      toast.error('Could not update this sighting. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  if (!sighting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sighting not found</h1>
        <Link to="/admin/sightings" className="btn-primary mt-6 inline-flex">
          Back to queue
        </Link>
      </div>
    )
  }

  const date = sighting.observedAt?.toDate ? sighting.observedAt.toDate() : new Date(sighting.observedAt)
  const hasLocation = typeof sighting.latitude === 'number' && typeof sighting.longitude === 'number'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/admin/sightings" className="inline-flex items-center gap-2 text-sm font-medium text-canopy-600 hover:text-canopy-700">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <div className="card mt-6 p-6">
        <h1 className="text-2xl font-semibold">{sighting.speciesCommonName}</h1>
        <p className="mt-1 text-sm text-bark-400">
          Observed {date.toLocaleString()}
          {hasLocation && ` · ${sighting.latitude.toFixed(5)}, ${sighting.longitude.toFixed(5)}`}
        </p>
        <p className="mt-4 break-words text-bark-600">{sighting.notes || 'No notes provided.'}</p>

        {sighting.images?.length > 0 && (
          <div className="mt-5">
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
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-bark-700">Location</p>
            <div className="h-56 overflow-hidden rounded-xl border border-canopy-100">
              <ParkMapView
                hotspots={[]}
                sightings={[sighting]}
                focusLocation={{ lat: sighting.latitude, lng: sighting.longitude }}
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Rejection reason (if rejecting)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why this sighting is being rejected, if applicable..."
            className="input-field"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => handleReview('verified')} disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Verify
          </button>
          <button onClick={() => handleReview('rejected')} disabled={saving} className="btn-secondary flex-1 !border-danger-500/40 !text-danger-500 hover:!bg-red-50">
            <X className="h-4 w-4" /> Reject
          </button>
        </div>
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  )
}
