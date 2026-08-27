import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { getSightingsForUser, deleteSighting } from '../services/sightingsService'
import SightingCard from '../components/sightings/SightingCard'
import SightingFilters from '../components/sightings/SightingFilters'
import PageLoader from '../components/common/PageLoader'
import SubmissionDetailModal from './SubmissionDetailModal'

const PAGE_SIZE = 10

export default function Submissions() {
  const { user } = useAuth()
  const toast = useToast()
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [speciesSlug, setSpeciesSlug] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [detailSighting, setDetailSighting] = useState(null)

  const load = () => {
    if (!user) return
    getSightingsForUser(user.uid)
      .then(setSightings)
      .catch((err) => {
        console.error('[Submissions] Failed to load your sightings:', err)
        toast.error(`Could not load your submissions: ${err.code || err.message}`)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [user])

  const visible = useMemo(() => {
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
  }, [sightings, speciesSlug, dateFrom, dateTo, sort])

  useEffect(() => setPage(1), [speciesSlug, dateFrom, dateTo, sort])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (id) => {
    try {
      await deleteSighting(id)
      toast.success('Sighting deleted.')
      setDetailSighting(null)
      load()
    } catch {
      toast.error('Could not delete this sighting.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-eyebrow">My Submissions</p>
          <h1 className="mt-2 text-3xl font-semibold">Your sighting history</h1>
        </div>
        <Link to="/sightings/new" className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> Add Sighting
        </Link>
      </div>

      <div className="mt-6">
        <SightingFilters
          sort={sort}
          onSortChange={setSort}
          speciesSlug={speciesSlug}
          onSpeciesChange={setSpeciesSlug}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <PageLoader />
        ) : paged.length === 0 ? (
          <p className="py-10 text-center text-bark-400">No submissions match these filters yet.</p>
        ) : (
          paged.map((s) => <SightingCard key={s.id} sighting={s} onClick={() => setDetailSighting(s)} />)
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

      {detailSighting && (
        <SubmissionDetailModal sighting={detailSighting} onClose={() => setDetailSighting(null)} onDelete={handleDelete} />
      )}
    </div>
  )
}
