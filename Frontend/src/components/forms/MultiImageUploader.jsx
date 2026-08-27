import { useRef, useState } from 'react'
import { UploadCloud, X, ImageOff } from 'lucide-react'
import ImageCropperModal from '../common/ImageCropperModal'

const MAX_PHOTOS = 5
const MAX_SIZE_MB = 8
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * @param {File[]} files
 * @param {(files: File[]) => void} onChange
 */
export default function MultiImageUploader({ files, onChange }) {
  const [error, setError] = useState('')
  const [cropQueue, setCropQueue] = useState([]) // files still waiting to be cropped
  const inputRef = useRef(null)

  const addFiles = (fileList) => {
    setError('')
    const incoming = Array.from(fileList || [])
    const valid = []
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, or WebP images are allowed.')
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Each image must be under ${MAX_SIZE_MB}MB.`)
        continue
      }
      valid.push(file)
    }
    const room = MAX_PHOTOS - files.length
    if (valid.length > room) {
      setError(`You can attach up to ${MAX_PHOTOS} photos — extra ones were skipped.`)
    }
    setCropQueue((prev) => [...prev, ...valid.slice(0, room)])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleCropConfirm = (croppedFile) => {
    onChange([...files, croppedFile])
    setCropQueue((prev) => prev.slice(1))
  }

  const handleCropCancel = () => {
    setCropQueue((prev) => prev.slice(1)) // skip this one, move to the next queued photo (if any)
  }

  const removeAt = (index) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl bg-canopy-50">
            <img src={URL.createObjectURL(file)} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bark-700/80 text-white hover:bg-bark-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {files.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-canopy-200 bg-white text-bark-400 hover:border-canopy-300 hover:text-canopy-500"
          >
            <UploadCloud className="h-5 w-5" />
            <span className="text-[10px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-bark-400">
        {files.length}/{MAX_PHOTOS} photos attached
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {error && (
        <p className="mt-2 flex items-center gap-2 text-sm text-danger-500">
          <ImageOff className="h-4 w-4" /> {error}
        </p>
      )}

      {cropQueue.length > 0 && (
        <ImageCropperModal
          key={cropQueue[0].name + cropQueue[0].lastModified}
          file={cropQueue[0]}
          aspect={4 / 3}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
