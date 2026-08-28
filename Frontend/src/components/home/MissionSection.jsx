import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { getFirstGalleryImage, addGalleryImage } from '../../services/galleryService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import WildlifeFactsCarousel from './WildlifeFactsCarousel'

const HERO_FOLDER = 'site/landing-background'

export default function MissionSection() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [bgUrl, setBgUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const load = () => getFirstGalleryImage(HERO_FOLDER).then(setBgUrl)

  useEffect(() => {
    load()
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await addGalleryImage(HERO_FOLDER, file)
      await load()
      toast.success('Background photo updated.')
    } catch (err) {
      toast.error(`Could not upload the background photo: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-eyebrow">Our mission</p>
        <h2 className="mt-2 text-2xl font-semibold text-bark-800 sm:text-3xl">
          Making Wilpattu's wildlife easier to know, and easier to protect
        </h2>
        <p className="mt-3 text-bark-500">
          WilpattuVision pairs AI species identification with citizen-science sighting logs, so
          every visitor can help build a clearer picture of the park's wildlife while learning
          about the species and conservation challenges of Wilpattu National Park along the way.
        </p>
      </div>

      <div
        className="relative mt-8 flex min-h-[400px] items-center justify-center overflow-hidden rounded-3xl bg-canopy-700 px-6 py-14"
        style={
          bgUrl
            ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, var(--color-canopy-500) 0, transparent 45%), radial-gradient(circle at 80% 60%, var(--color-clay-400) 0, transparent 40%)',
              }
        }
      >
        <div className="absolute inset-0 bg-bark-900/35" />

        <div className="relative w-full max-w-2xl">
          <WildlifeFactsCarousel />
        </div>

        {isAdmin && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-bark-700 shadow-soft hover:bg-white"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              Change background
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>
    </section>
  )
}
