import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, User, Camera, Trash2 } from 'lucide-react'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { updateUserProfile, uploadProfilePicture, removeProfilePicture } from '../services/usersService'
import { validateName } from '../lib/validators'
import Lightbox from '../components/common/Lightbox'
import ImageCropperModal from '../components/common/ImageCropperModal'
import { getTodayISODate } from '../lib/dateConstraints'

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '')
  const [nameError, setNameError] = useState('')
  const [bio, setBio] = useState(profile?.bio || '')
  const [birthday, setBirthday] = useState(profile?.birthday || '')
  const [saving, setSaving] = useState(false)

  const [photoBusy, setPhotoBusy] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const fileInputRef = useRef(null)
  const photoURL = profile && 'photoURL' in profile ? profile.photoURL : user?.photoURL || null

  const handleSave = async (e) => {
    e.preventDefault()
    const err = validateName(displayName)
    setNameError(err)
    if (err) return

    setSaving(true)
    try {
      await updateProfile(user, { displayName: displayName.trim() })
      await updateUserProfile(user.uid, { displayName: displayName.trim(), bio: bio.trim(), birthday: birthday || null })
      await refreshProfile()
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(`Could not save your profile: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePickPhoto = () => fileInputRef.current?.click()

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB.`)
      return
    }
    setCropFile(file) 
  }

  const handleCropConfirm = async (croppedFile) => {
    setCropFile(null)
    setPhotoBusy(true)
    try {
      await uploadProfilePicture(croppedFile, user.uid)
      await refreshProfile()
      toast.success('Profile picture updated.')
    } catch (err) {
      toast.error(`Could not upload your photo: ${err.message}`)
    } finally {
      setPhotoBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    setPhotoBusy(true)
    try {
      await removeProfilePicture(user.uid)
      await refreshProfile()
      toast.success('Profile picture removed.')
    } catch (err) {
      toast.error(`Could not remove your photo: ${err.message}`)
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow text-center">Profile</p>
      <h1 className="mt-2 text-center text-3xl font-semibold">Your account</h1>

      <div className="card mt-6 flex flex-col items-center gap-3 p-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => photoURL && setLightboxOpen(true)}
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-canopy-50 text-canopy-400"
            aria-label={photoURL ? 'View profile picture' : 'No profile picture'}
          >
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10" />
            )}
          </button>
          <button
            type="button"
            onClick={handlePickPhoto}
            disabled={photoBusy}
            aria-label="Change profile picture"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-canopy-500 text-white shadow-soft hover:bg-canopy-600"
          >
            {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handlePhotoChange}
        />

        {photoURL && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={photoBusy}
            className="flex items-center gap-1.5 text-xs font-medium text-danger-500 hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove photo
          </button>
        )}
      </div>

      {lightboxOpen && <Lightbox src={photoURL} onClose={() => setLightboxOpen(false)} />}

      {cropFile && (
        <ImageCropperModal
          file={cropFile}
          aspect={1}
          round
          onCancel={() => {
            setCropFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          onConfirm={handleCropConfirm}
        />
      )}

      <form onSubmit={handleSave} className="card mt-4 space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value)
              setNameError('')
            }}
            className="input-field"
          />
          {nameError && <p className="mt-1 text-xs text-danger-500">{nameError}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Email</label>
          <input type="email" value={user?.email || ''} disabled className="input-field opacity-60" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Bio <span className="font-normal text-bark-400">(optional)</span></label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="A little about yourself..."
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Birthday <span className="font-normal text-bark-400">(optional)</span></label>
          <input type="date" value={birthday} max={getTodayISODate()} onChange={(e) => setBirthday(e.target.value)} className="input-field" />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <Link to="/submissions" className="btn-secondary mt-4 w-full">
        View my submission history
      </Link>
    </div>
  )
}
