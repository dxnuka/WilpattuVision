import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ParkMapView from '../components/map/ParkMapView'
import MapLegend from '../components/map/MapLegend'
import SaveLocationPanel from '../components/map/SaveLocationPanel'
import SightingFilters from '../components/sightings/SightingFilters'
import SightingRow from '../components/sightings/SightingRow'
import { useHotspots } from '../hooks/useHotspots'
import { getVerifiedSightings } from '../services/sightingsService'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { getTodayISODate, getISODateDaysAgo } from '../lib/dateConstraints'

const PAGE_SIZE = 10

function applyFilters(sightings, { speciesSlug, dateFrom, dateTo, sort }) {
  let list = [...sightings]
  if (speciesSlug) list = list.filter((s) => s.speciesSlug === speciesSlug)
  if (dateFrom || dateTo) {
    list = list.filter((s) => {
      const d = s.observedAt?.toDate ? s.observedAt.toDate() : new Date(s.observedAt)
      const iso = d.toISOString().slice(0, 10)
      if (dateFrom && iso < dateFrom) return false
      if (dateTo && iso > dateTo) return false
      return true
    })
  }
  list.sort((a, b) => {
    const da = a.observedAt?.toDate ? a.observedAt.toDate() : new Date(a.observedAt)
    const db = b.observedAt?.toDate ? b.observedAt.toDate() : new Date(b.observedAt)
    return sort === 'newest' ? db - da : da - db
  })
  return list
}

export default function ParkMap() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { hotspots: PARK_LOCATIONS } = useHotspots()
  const [searchParams] = useSearchParams()
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [focusLocation, setFocusLocation] = useState(null)
  const [page, setPage] = useState(1)


  const [mapSpecies, setMapSpecies] = useState(searchParams.get('species') || '')
  const [mapDateFrom, setMapDateFrom] = useState(getISODateDaysAgo(30))
  const [mapDateTo, setMapDateTo] = useState(getTodayISODate())


  const [listSpecies, setListSpecies] = useState('')
  const [listSort, setListSort] = useState('newest')
  const [listDateFrom, setListDateFrom] = useState(getISODateDaysAgo(30))
  const [listDateTo, setListDateTo] = useState(getTodayISODate())

  useEffect(() => {

    getVerifiedSightings(200)
      .then(setSightings)
      .catch((err) => {
        console.error('[ParkMap] Failed to load sightings:', err)
        toast.error(`Could not load sightings: ${err.code || err.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  const mapFilteredSightings = useMemo(
    () => applyFilters(sightings, { speciesSlug: mapSpecies, dateFrom: mapDateFrom, dateTo: mapDateTo, sort: 'newest' }),
    [sightings, mapSpecies, mapDateFrom, mapDateTo]
  )
  const mapSightings = mapFilteredSightings.filter((s) => typeof s.latitude === 'number')

  const listFilteredSightings = useMemo(
    () => applyFilters(sightings, { speciesSlug: listSpecies, dateFrom: listDateFrom, dateTo: listDateTo, sort: listSort }),
    [sightings, listSpecies, listDateFrom, listDateTo, listSort]
  )

  useEffect(() => setPage(1), [listSpecies, listDateFrom, listDateTo, listSort])

  const totalPages = Math.max(1, Math.ceil(listFilteredSightings.length / PAGE_SIZE))
  const pagedSightings = listFilteredSightings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const visibleHotspots = useMemo(
    () => (mapSpecies ? PARK_LOCATIONS.filter((loc) => loc.category !== 'hotspot' || loc.speciesSlugs?.includes(mapSpecies)) : PARK_LOCATIONS),
    [mapSpecies, PARK_LOCATIONS]
  )

  const handleAddSighting = () => navigate(user ? '/sightings/new' : '/login', { state: { from: { pathname: '/sightings/new' } } })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Park Map</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Explore Wilpattu</h1>
      <p className="mt-2 max-w-2xl text-bark-500">
        Species hotspots, verified community sightings, and your live position across the park. Works offline too.
      </p>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bark-400">Filter the map</p>
        <SightingFilters
          sort="newest"
          speciesSlug={mapSpecies}
          onSpeciesChange={setMapSpecies}
          dateFrom={mapDateFrom}
          onDateFromChange={setMapDateFrom}
          dateTo={mapDateTo}
          onDateToChange={setMapDateTo}
          showSort={false}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="card h-[420px] overflow-hidden p-0 lg:h-[560px]">
          <ParkMapView hotspots={visibleHotspots} sightings={mapSightings} focusLocation={focusLocation} />
        </div>
        <SaveLocationPanel />
      </div>

      <div className="mt-3">
        <MapLegend />
      </div>

      <div className="mt-6 flex justify-center">
        <button onClick={handleAddSighting} className="btn-clay">
          Add your Sighting
        </button>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-bark-800">Sightings</h2>
        <p className="text-xs font-semibold uppercase tracking-wide text-bark-400">Filter the list</p>
      </div>
      <div className="mt-2">
        <SightingFilters
          sort={listSort}
          onSortChange={setListSort}
          speciesSlug={listSpecies}
          onSpeciesChange={setListSpecies}
          dateFrom={listDateFrom}
          onDateFromChange={setListDateFrom}
          dateTo={listDateTo}
          onDateToChange={setListDateTo}
          center
        />
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="py-6 text-center text-sm text-bark-400">Loading sightings…</p>
        ) : pagedSightings.length === 0 ? (
          <p className="py-6 text-center text-sm text-bark-400">No verified sightings match these filters yet.</p>
        ) : (
          pagedSightings.map((s) => (
            <SightingRow
              key={s.id}
              sighting={s}
              onViewOnMap={(sight) => {
                setFocusLocation({ lat: sight.latitude, lng: sight.longitude })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !px-4 !py-1.5 !text-xs">
            Previous
          </button>
          <span className="text-xs text-bark-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary !px-4 !py-1.5 !text-xs">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
