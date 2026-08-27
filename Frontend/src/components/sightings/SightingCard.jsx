import { formatSightingDateTime } from '../../lib/formatDate'

const STATUS_STYLES = {
  pending: { badge: 'bg-amber-100 text-amber-600', border: 'border-l-amber-400' },
  verified: { badge: 'bg-green-100 text-success-500', border: 'border-l-success-500' },
  rejected: { badge: 'bg-red-100 text-danger-500', border: 'border-l-danger-500' },
}

export default function SightingCard({ sighting, onClick }) {
  const status = sighting.verificationStatus || 'pending'
  const styles = STATUS_STYLES[status] || STATUS_STYLES.pending
  const thumbnail = sighting.images?.[0]

  return (
    <button
      onClick={onClick}
      className={`card flex w-full items-center gap-4 border-l-4 p-4 text-left transition-transform hover:-translate-y-0.5 ${styles.border}`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-canopy-50">
        {thumbnail && <img src={thumbnail} alt={sighting.speciesCommonName} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-bark-800">{sighting.speciesCommonName}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles.badge}`}>
            {status}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-bark-400">
          {formatSightingDateTime(sighting.observedAt)} &middot; {sighting.notes || 'No notes added'}
        </p>
        {status === 'rejected' && sighting.rejectionReason && (
          <p className="mt-0.5 truncate text-xs text-danger-500">Reason: {sighting.rejectionReason}</p>
        )}
      </div>
    </button>
  )
}
