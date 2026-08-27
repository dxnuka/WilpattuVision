import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getSightingById } from '../services/sightingsService'
import { getSpeciesBySlug } from '../data/species'
import { formatSightingDateTime } from '../lib/formatDate'
import PageLoader from '../components/common/PageLoader'
import Lightbox from '../components/common/Lightbox'
import ParkMapView from '../components/map/ParkMapView'


export default function SightingDetail() {
  const { id } = useParams()
  const [sighting, setSighting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    let cancelled = false
    getSightingById(id)
      .then((data) => {
        if (!cancelled) setSighting(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <PageLoader />


  if (!sighting || sighting.verificationStatus !== 'verified') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Sighting not found</h1>
        <p className="mt-2 text-bark-500">This sighting doesn't exist or isn't available.</p>
        <Link to="/map" className="btn-primary mt-6 inline-flex">
          Back to the map
        </Link>
      </div>
    )
  }

  const species = getSpeciesBySlug(sighting.speciesSlug)
  const date = sighting.observedAt?.toDate ? sighting.observedAt.toDate() : new Date(sighting.observedAt)
  const hasLocation = typeof sighting.latitude === 'number' && typeof sighting.longitude === 'number'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/map" className="inline-flex items-center gap-2 text-sm font-medium text-canopy-600 hover:text-canopy-700">
        <ArrowLeft className="h-4 w-4" /> Back to the map
      </Link>

      <div className="card mt-6 p-6">
        <p className="label-eyebrow">Community Sighting</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{sighting.speciesCommonName}</h1>
        <p className="mt-1 text-sm text-bark-400">
          Observed {formatSightingDateTime(sighting.observedAt) || date.toLocaleString()}
          {hasLocation && ` · ${sighting.latitude.toFixed(5)}, ${sighting.longitude.toFixed(5)}`}
        </p>

        {species && (
          <Link to={`/species/${species.slug}`} className="btn-secondary mt-4 inline-flex !px-3 !py-1.5 !text-xs">
            View species info
          </Link>
        )}

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-bark-700">Notes</p>
          <p className="break-words text-bark-600">{sighting.notes || 'No notes provided.'}</p>
        </div>

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
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  )
}