import { useState } from 'react'
import { X, User, ShieldOff, ShieldCheck, Bell, Loader2 } from 'lucide-react'
import Lightbox from '../../components/common/Lightbox'

export default function AdminUserDetailModal({ target, onClose, onToggleRestricted, onNotify, busy }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!target) return null

  const createdAt = target.createdAt?.toDate ? target.createdAt.toDate() : null

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-bark-900/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-bark-800">User details</h2>
          <button onClick={onClose} aria-label="Close" className="text-bark-400 hover:text-bark-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => target.photoURL && setLightboxOpen(true)}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-canopy-50 text-canopy-400"
            aria-label={target.photoURL ? 'View profile picture' : 'No profile picture'}
          >
            {target.photoURL ? (
              <img src={target.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7" />
            )}
          </button>
          <div className="min-w-0">
            <p className="truncate font-semibold text-bark-800">{target.displayName || 'Unnamed user'}</p>
            <p className="truncate text-sm text-bark-400">{target.email}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <Row label="Role" value={target.role || 'visitor'} />
          <Row label="Status" value={target.restricted ? 'Restricted' : 'Active'} />
          <Row label="Bio" value={target.bio || '—'} />
          <Row label="Birthday" value={target.birthday || '—'} />
          <Row label="Joined" value={createdAt ? createdAt.toLocaleDateString() : '—'} />
        </dl>

        <div className="mt-6 flex gap-3">
          <button onClick={() => onNotify(target)} className="btn-secondary flex-1">
            <Bell className="h-4 w-4" /> Notify
          </button>
          <button
            onClick={() => onToggleRestricted(target)}
            disabled={busy || target.role === 'admin'}
            className={`btn-secondary flex-1 ${
              target.restricted ? '!border-success-500/40 !text-success-500' : '!border-danger-500/40 !text-danger-500'
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : target.restricted ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {target.restricted ? 'Unrestrict' : 'Restrict'}
          </button>
        </div>
      </div>

      {lightboxOpen && <Lightbox src={target.photoURL} onClose={() => setLightboxOpen(false)} />}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-canopy-50 pb-2 last:border-0">
      <dt className="text-bark-400">{label}</dt>
      <dd className="max-w-[60%] break-words text-right text-bark-700">{value}</dd>
    </div>
  )
}
