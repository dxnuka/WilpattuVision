import { useCallback, useRef, useState } from 'react'
import { UploadCloud, ImageOff, X, Crop } from 'lucide-react'
import ImageCropperModal from '../common/ImageCropperModal'

const MAX_SIZE_MB = 8
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUploader({ onFileSelected, onClear, previewUrl }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [cropFile, setCropFile] = useState(null)
  const inputRef = useRef(null)

  const validateAndEmit = useCallback((file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image is too large — keep it under ${MAX_SIZE_MB}MB.`)
      return
    }
    setError('')
    setCropFile(file) 
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    validateAndEmit(e.dataTransfer.files?.[0])
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    onClear?.()
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !previewUrl && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !previewUrl && inputRef.current?.click()}
        className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-clay-400 bg-clay-50' : 'border-canopy-200 bg-white hover:border-canopy-300'
        }`}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Selected sighting preview" className="max-h-64 rounded-xl object-contain" />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove image"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-bark-700/80 text-white shadow-soft hover:bg-bark-700"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              aria-label="Re-crop image"
              className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-bark-700/80 text-white shadow-soft hover:bg-bark-700"
            >
              <Crop className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-canopy-400" />
            <p className="mt-3 font-medium text-bark-700">Drag & drop a photo here</p>
            <p className="mt-1 text-sm text-bark-400">or click to browse — JPEG, PNG, WebP up to {MAX_SIZE_MB}MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => validateAndEmit(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger-500">
          <ImageOff className="h-4 w-4" /> {error}
        </p>
      )}

      {cropFile && (
        <ImageCropperModal
          file={cropFile}
          aspect={4 / 3}
          onCancel={() => {
            setCropFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          onConfirm={(croppedFile) => {
            setCropFile(null)
            onFileSelected(croppedFile)
          }}
        />
      )}
    </div>
  )
}
