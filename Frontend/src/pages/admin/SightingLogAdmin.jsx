import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSightings } from '../../services/sightingsService'
import SightingCard from '../../components/sightings/SightingCard'
import PageLoader from '../../components/common/PageLoader'

const FILTERS = ['all', 'pending', 'verified', 'rejected']
const PAGE_SIZE = 10

export default function SightingLogAdmin() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    getAllSightings().then((data) => {
      setSightings(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => setPage(1), [filter])

  const visible = filter === 'all' ? sightings : sightings.filter((s) => s.verificationStatus === filter)
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Sighting review queue</h1>
      <p className="mt-2 text-bark-500">Verify or reject sightings submitted by visitors.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-canopy-500 text-villu-50' : 'bg-white text-bark-600 hover:bg-canopy-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <PageLoader />
        ) : paged.length === 0 ? (
          <p className="py-10 text-center text-bark-400">No sightings in this category.</p>
        ) : (
          paged.map((s) => (
            <SightingCard key={s.id} sighting={s} onClick={() => navigate(`/admin/sightings/${s.id}`)} />
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
