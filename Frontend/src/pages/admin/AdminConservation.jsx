import { useEffect, useState } from 'react'
import { Loader2, Send, Trash2, Pencil, X, Leaf } from 'lucide-react'
import { getArticles, createArticle, updateArticle, deleteArticle } from '../../services/conservationService'
import { getFirstGalleryImage, reassignGalleryFolder } from '../../services/galleryService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import PageLoader from '../../components/common/PageLoader'
import ImageGallery from '../../components/common/ImageGallery'

const PAGE_SIZE = 10


const makeDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function AdminConservation() {
  const { user } = useAuth()
  const toast = useToast()
  const [articles, setArticles] = useState([])
  const [thumbnails, setThumbnails] = useState({})
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draftId, setDraftId] = useState(makeDraftId)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)

  const load = () =>
    getArticles()
      .then(async (data) => {
        setArticles(data)
        const pairs = await Promise.all(data.map(async (a) => [a.id, await getFirstGalleryImage(`conservation/${a.id}`)]))
        setThumbnails(Object.fromEntries(pairs))
      })
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setTitle('')
    setBody('')
    setEditingId(null)
    setDraftId(makeDraftId()) 
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await updateArticle(editingId, { title, body })
        toast.success('Article updated.')
        await load()
      } else {
        const newId = await createArticle({ title, body, authorAdminId: user.uid })
        await reassignGalleryFolder(`conservation/${draftId}`, `conservation/${newId}`)
        toast.success('Article published.')
        await load()
        setEditingId(newId) 
      }
    } catch {
      toast.error('Could not save this article.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (article) => {
    setEditingId(article.id)
    setTitle(article.title)
    setBody(article.body)
    document.getElementById('article-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this article? This cannot be undone.')) return
    try {
      await deleteArticle(id)
      toast.success('Article deleted.')
      if (editingId === id) resetForm()
      await load()
    } catch {
      toast.error('Could not delete this article.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE))
  const pagedArticles = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)


  const photoFolder = editingId ? `conservation/${editingId}` : `conservation/${draftId}`

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Conservation articles</h1>
      <p className="mt-2 text-bark-500">Write general Wilpattu / Sri Lanka conservation content shown on the public Conservation page.</p>

      <form id="article-composer" onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-bark-800">{editingId ? 'Edit article' : 'New article'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs text-bark-400 hover:text-bark-600">
              <X className="h-3.5 w-3.5" /> Start a new article
            </button>
          )}
        </div>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="input-field"
        />
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Article content..."
          className="input-field"
        />

        <div className="border-t border-canopy-100 pt-4">
          <p className="mb-2 text-sm font-semibold text-bark-700">Photos</p>
          <ImageGallery folder={photoFolder} emptyLabel="No photos added yet" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Publish article'}
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-bark-800">Published articles</h2>
      <div className="mt-4 space-y-3">
        {loading ? (
          <PageLoader />
        ) : articles.length === 0 ? (
          <p className="py-6 text-center text-sm text-bark-400">No articles yet — publish one above.</p>
        ) : (
          pagedArticles.map((a) => (
            <div key={a.id} className="card flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-canopy-50">
                {thumbnails[a.id] ? (
                  <img src={thumbnails[a.id]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Leaf className="h-5 w-5 text-canopy-200" />
                )}
              </div>
              <h3 className="min-w-0 flex-1 truncate font-semibold text-bark-800">{a.title}</h3>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => handleEdit(a)} aria-label="Edit" className="rounded-full p-1.5 text-canopy-600 hover:bg-canopy-50">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(a.id)} aria-label="Delete" className="rounded-full p-1.5 text-danger-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
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
