import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Share2, Check } from 'lucide-react'
import { getArticleById } from '../services/conservationService'
import { getGalleryImages } from '../services/galleryService'
import { useToast } from '../hooks/useToast'

export default function ConservationArticleDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [article, setArticle] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getArticleById(id), getGalleryImages(`conservation/${id}`)])
      .then(([a, imgs]) => {
        setArticle(a)
        setImages(imgs)
      })
      .catch(() => toast.error('Could not load this article.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShared(true)
      toast.success('Link copied to clipboard.')
      setTimeout(() => setShared(false), 2000)
    } catch {
      toast.error('Could not copy the link.')
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-sm text-bark-400">Loading article…</p>
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Article not found</h1>
        <Link to="/conservation" className="btn-primary mt-6 inline-flex">
          Back to Conservation
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/conservation" className="inline-flex items-center gap-2 text-sm font-medium text-canopy-600 hover:text-canopy-700">
        <ArrowLeft className="h-4 w-4" /> Back to Conservation
      </Link>

      <article className="mt-6">
        <h1 className="text-center font-display text-3xl font-semibold text-bark-800 sm:text-4xl">{article.title}</h1>

        {images.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-4">
            {images.map((img) => (
              <img key={img.id} src={img.url} alt="" className="w-full rounded-2xl object-cover shadow-soft" />
            ))}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-2xl">
          <p className="whitespace-pre-line break-words text-base leading-relaxed text-bark-600">{article.body}</p>
        </div>

        <div className="mt-10 flex justify-center border-t border-canopy-100 pt-6">
          <button onClick={handleShare} className="btn-secondary">
            {shared ? <Check className="h-4 w-4 text-success-500" /> : <Share2 className="h-4 w-4" />}
            {shared ? 'Link copied' : 'Share this article'}
          </button>
        </div>
      </article>
    </div>
  )
}
