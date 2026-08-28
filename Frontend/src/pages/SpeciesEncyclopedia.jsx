import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, PawPrint } from 'lucide-react'
import { SPECIES } from '../data/species'
import { getFirstGalleryImage } from '../services/galleryService'

const CATEGORIES = ['All', ...new Set(SPECIES.map((s) => s.category))]
const PAGE_SIZE = 9 

export default function SpeciesEncyclopedia() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [thumbnails, setThumbnails] = useState({})
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      SPECIES.map(async (s) => {
        const url = await getFirstGalleryImage(`species/${s.slug}`)
        return [s.slug, url]
      })
    ).then((pairs) => {
      if (!cancelled) setThumbnails(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return SPECIES.filter((s) => {
      const matchesQuery = s.commonName.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All' || s.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  useEffect(() => setPage(1), [query, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Species Encyclopedia</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">The {SPECIES.length} species of Wilpattu</h1>
      <p className="mt-2 max-w-2xl text-bark-500">
        Every species the AI Identifier currently recognizes, with notes for field identification.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search species..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === c ? 'bg-canopy-500 text-villu-50' : 'bg-white text-bark-600 hover:bg-canopy-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {paged.map((s) => (
          <Link key={s.slug} to={`/species/${s.slug}`} className="card overflow-hidden transition-transform hover:-translate-y-1">
            <div className="flex aspect-square items-center justify-center bg-canopy-50">
              {thumbnails[s.slug] ? (
                <img src={thumbnails[s.slug]} alt={s.commonName} className="h-full w-full object-cover" />
              ) : (
                <PawPrint className="h-8 w-8 text-canopy-200" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold text-bark-800">{s.commonName}</h3>
                  <p className="text-sm italic text-bark-400">{s.scientificName}</p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-clay-50 px-2.5 py-1 text-xs font-medium text-clay-500">
                  IUCN: {s.conservationStatus}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-bark-400">No species match your search.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
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
