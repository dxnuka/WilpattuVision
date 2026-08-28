import { useEffect, useRef, useState } from 'react'
import { ImageOff, Loader2, Plus, X } from 'lucide-react'
import { getGalleryImages, addGalleryImage, removeGalleryImage } from '../../services/galleryService'
import { useAuth } from '../../hooks/useAuth'

/** @param {{ folder: string, emptyLabel?: string, readOnly?: boolean }} props */
export default function ImageGallery({ folder, emptyLabel = 'No photos uploaded yet', readOnly = false }) {
  const { isAdmin } = useAuth()
  const canManage = isAdmin && !readOnly
  const [images, setImages] = useState(null) // null = loading
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const load = () => getGalleryImages(folder).then(setImages)

  useEffect(() => {
    setImages(null)
    load()
  }, [folder])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await addGalleryImage(folder, file)
      await load()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async (id) => {
    await removeGalleryImage(id)
    await load()
  }

  if (images === null) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-canopy-50 text-bark-300">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {images.length === 0 && !canManage ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1.5 rounded-2xl bg-canopy-50 text-center text-bark-300">
          <ImageOff className="h-5 w-5" />
          <p className="text-xs">{emptyLabel}</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img) => (
            <div key={img.id} className="group relative h-57 w-78 shrink-0 overflow-hidden rounded-2xl">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {canManage && (
                <button
                  onClick={() => handleRemove(img.id)}
                  aria-label="Remove photo"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-bark-700/80 text-white opacity-0 transition-opacity hover:bg-bark-700 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          {canManage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-57 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-canopy-200 bg-canopy-50 text-bark-400 hover:border-canopy-300 hover:text-canopy-500"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span className="text-[10px] font-medium">Add photo</span>
            </button>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
      {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}
    </div>
  )
}
