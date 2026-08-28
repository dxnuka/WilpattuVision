import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X, ZoomIn } from 'lucide-react'
import { getCroppedFile } from '../../lib/cropImage'


const ASPECT_PRESETS = [
  { label: 'Square', value: 1 },
  { label: 'Standard', value: 4 / 3 },
  { label: 'Wide', value: 16 / 9 },
  { label: 'Portrait', value: 3 / 4 },
]

/**
 * @param {{
 *   file: File,
 *   aspect?: number,        // initial/default width-over-height ratio
 *   round?: boolean,        // circular crop preview (profile pictures) — hides aspect presets
 *   onCancel: () => void,
 *   onConfirm: (croppedFile: File) => void,
 * }} props
 */
export default function ImageCropperModal({ file, aspect = 4 / 3, round = false, onCancel, onConfirm }) {
  const [imageSrc] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropAspect, setCropAspect] = useState(aspect)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const cropped = await getCroppedFile(imageSrc, croppedAreaPixels, file.name, file.type)
      onConfirm(cropped)
    } finally {
      setSaving(false)
      URL.revokeObjectURL(imageSrc)
    }
  }

  const handleCancel = () => {
    URL.revokeObjectURL(imageSrc)
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-bark-900/90 p-4">
      {!round && (
        <div className="mx-auto mb-3 flex w-full max-w-md flex-wrap justify-center gap-1.5">
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setCropAspect(preset.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                Math.abs(cropAspect - preset.value) < 0.001
                  ? 'bg-clay-400 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-2xl">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={round ? aspect : cropAspect}
          cropShape={round ? 'round' : 'rect'}
          showGrid={!round}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-md items-center gap-3">
        <ZoomIn className="h-4 w-4 shrink-0 text-white/70" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-clay-400"
          aria-label="Zoom"
        />
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-md gap-3">
        <button onClick={handleCancel} className="btn-secondary flex-1 !border-white/30 !bg-transparent !text-white hover:!bg-white/10">
          <X className="h-4 w-4" /> Cancel
        </button>
        <button onClick={handleConfirm} disabled={saving} className="btn-clay flex-1">
          <Check className="h-4 w-4" /> {saving ? 'Applying...' : 'Use this crop'}
        </button>
      </div>
    </div>
  )
}
