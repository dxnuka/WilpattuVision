import { Link } from 'react-router-dom'
import { getSpeciesBySlug } from '../../data/species'
import { formatSightingDateTime } from '../../lib/formatDate'

export default function SightingRow({ sighting, onViewOnMap }) {
  const species = getSpeciesBySlug(sighting.speciesSlug)

  return (
    <div className="card flex items-center gap-4 p-4">
      <Link to={`/sightings/${sighting.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-canopy-50">
          {sighting.images?.[0] && (
            <img src={sighting.images?.[0]} alt={sighting.speciesCommonName} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-bark-800 hover:text-canopy-700">{sighting.speciesCommonName}</p>
          <p className="truncate text-xs text-bark-400">{formatSightingDateTime(sighting.observedAt)}</p>
        </div>
      </Link>
      <div className="flex shrink-0 gap-2">
        {species && (
          <Link to={`/species/${species.slug}`} className="btn-secondary !px-3 !py-1.5 !text-xs">
            Species Info
          </Link>
        )}
        <button onClick={() => onViewOnMap?.(sighting)} className="btn-primary !px-3 !py-1.5 !text-xs">
          View on Map
        </button>
      </div>
    </div>
  )
}