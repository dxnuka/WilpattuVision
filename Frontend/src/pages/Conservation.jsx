import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Leaf } from 'lucide-react'
import { getArticles } from '../services/conservationService'
import { getFirstGalleryImage } from '../services/galleryService'
import { SPECIES } from '../data/species'
import { useToast } from '../hooks/useToast'

const ARTICLES_PAGE_SIZE = 12
const SPECIES_PAGE_SIZE = 10

export default function Conservation() {
  const toast = useToast()
  const [articles, setArticles] = useState([])
  const [thumbnails, setThumbnails] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [articlesPage, setArticlesPage] = useState(1)
  const [speciesPage, setSpeciesPage] = useState(1)

  useEffect(() => {
    getArticles()
      .then(async (data) => {
        setArticles(data)
        const pairs = await Promise.all(
          data.map(async (a) => [a.id, await getFirstGalleryImage(`conservation/${a.id}`)])
        )
        setThumbnails(Object.fromEntries(pairs))
      })
      .catch((err) => {
        console.error('[Conservation] Failed to load articles:', err)
        toast.error('Could not load conservation articles.')
      })
      .finally(() => setLoading(false))
  }, [])

  const visibleArticles = useMemo(() => {
    let list = [...articles]
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
    list.sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
      const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
      return sort === 'newest' ? db - da : da - db
    })
    return list
  }, [articles, search, sort])

  useEffect(() => setArticlesPage(1), [search, sort])

  const articlesTotalPages = Math.max(1, Math.ceil(visibleArticles.length / ARTICLES_PAGE_SIZE))
  const pagedArticles = visibleArticles.slice((articlesPage - 1) * ARTICLES_PAGE_SIZE, articlesPage * ARTICLES_PAGE_SIZE)

  const speciesTotalPages = Math.max(1, Math.ceil(SPECIES.length / SPECIES_PAGE_SIZE))
  const pagedSpecies = SPECIES.slice((speciesPage - 1) * SPECIES_PAGE_SIZE, speciesPage * SPECIES_PAGE_SIZE)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow text-center">Conservation</p>
      <h1 className="mt-2 text-center text-3xl font-semibold sm:text-4xl">Protecting Wilpattu's wildlife</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-bark-500">
        Conservation in context - The pressures facing the park as a whole, and what's being done.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border-0 bg-canopy-50 px-4 py-2.5 text-sm font-medium text-bark-700 focus:ring-2 focus:ring-clay-200"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full py-6 text-center text-sm text-bark-400">Loading articles…</p>
        ) : pagedArticles.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-bark-400">
            {articles.length === 0 ? 'No conservation articles have been published yet.' : `No articles match "${search}".`}
          </p>
        ) : (
          pagedArticles.map((article) => (
            <Link
              key={article.id}
              to={`/conservation/${article.id}`}
              className="card overflow-hidden transition-transform hover:-translate-y-1"
            >
              <div className="flex h-40 items-center justify-center bg-canopy-50">
                {thumbnails[article.id] ? (
                  <img src={thumbnails[article.id]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Leaf className="h-8 w-8 text-canopy-200" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-base font-semibold text-bark-800">{article.title}</h3>
              </div>
            </Link>
          ))
        )}
      </div>

      {articlesTotalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setArticlesPage((p) => Math.max(1, p - 1))} disabled={articlesPage === 1} className="btn-secondary !px-4 !py-1.5 !text-xs">
            Previous
          </button>
          <span className="text-xs text-bark-400">Page {articlesPage} of {articlesTotalPages}</span>
          <button onClick={() => setArticlesPage((p) => Math.min(articlesTotalPages, p + 1))} disabled={articlesPage === articlesTotalPages} className="btn-secondary !px-4 !py-1.5 !text-xs">
            Next
          </button>
        </div>
      )}

      <h2 className="mt-12 text-xl font-semibold text-bark-800">By species</h2>
      <div className="mt-4 space-y-4">
        {pagedSpecies.map((s) => (
          <div key={s.slug} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-bark-800">{s.commonName}</h3>
              <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs font-medium text-clay-500">
                IUCN: {s.conservationStatus}
              </span>
            </div>
            <p className="mt-3 text-sm text-bark-500">
              <span className="font-medium text-bark-700">Threats: </span>
              {s.threats}
            </p>
            <p className="mt-5 text-sm text-bark-500">
              <span className="font-medium text-bark-700">Actions: </span>
              {s.actions}
            </p>
            <Link to={`/species/${s.slug}`} className="mt-3 inline-block text-sm font-semibold text-clay-500 hover:underline">
              View species profile →
            </Link>
          </div>
        ))}
      </div>

      {speciesTotalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setSpeciesPage((p) => Math.max(1, p - 1))} disabled={speciesPage === 1} className="btn-secondary !px-4 !py-1.5 !text-xs">
            Previous
          </button>
          <span className="text-xs text-bark-400">Page {speciesPage} of {speciesTotalPages}</span>
          <button onClick={() => setSpeciesPage((p) => Math.min(speciesTotalPages, p + 1))} disabled={speciesPage === speciesTotalPages} className="btn-secondary !px-4 !py-1.5 !text-xs">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
