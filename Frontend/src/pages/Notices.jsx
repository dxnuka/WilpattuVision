import { useEffect, useMemo, useState } from 'react'
import { Bell, User } from 'lucide-react'
import { getPrivateNotices, getCommonNotices, getReadNoticeIds, markNoticeRead } from '../services/noticesService'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useNoticesCount } from '../hooks/useNoticesCount'
import PageLoader from '../components/common/PageLoader'

const PAGE_SIZE = 10

export default function Notices() {
  const { user } = useAuth()
  const toast = useToast()
  const { refresh: refreshNavbarCount } = useNoticesCount()
  const [privateNotices, setPrivateNotices] = useState([])
  const [commonNotices, setCommonNotices] = useState([])
  const [readIds, setReadIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('private')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!user) return
    Promise.all([getPrivateNotices(user.uid), getCommonNotices(), getReadNoticeIds(user.uid)])
      .then(([priv, common, reads]) => {
        setPrivateNotices(priv)
        setCommonNotices(common)
        setReadIds(reads)
      })
      .catch((err) => {
        console.error('[Notices] Failed to load notices:', err)
        toast.error(`Could not load notices: ${err.code || err.message}`)
      })
      .finally(() => setLoading(false))
  }, [user])

  const privateUnread = useMemo(() => privateNotices.filter((n) => !readIds.has(n.id)).length, [privateNotices, readIds])
  const commonUnread = useMemo(() => commonNotices.filter((n) => !readIds.has(n.id)).length, [commonNotices, readIds])

  const activeList = tab === 'private' ? privateNotices : commonNotices
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE))
  const pagedList = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleOpen = async (notice) => {
    if (readIds.has(notice.id)) return
    setReadIds((prev) => new Set(prev).add(notice.id))
    try {
      await markNoticeRead(user.uid, notice.id)
      refreshNavbarCount() 
    } catch {
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Notices</p>
      <h1 className="mt-2 text-3xl font-semibold">Park announcements</h1>
      <p className="mt-1 text-sm text-bark-400">Click on an announcement to mark it as read.</p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => {
            setTab('private')
            setPage(1)
          }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'private' ? 'bg-canopy-500 text-villu-50' : 'bg-white text-bark-600 hover:bg-canopy-50'
          }`}
        >
          Private
          {privateUnread > 0 && (
            <span className={`rounded-full px-1.5 text-xs ${tab === 'private' ? 'bg-white/25' : 'bg-clay-100 text-clay-600'}`}>
              {privateUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setTab('common')
            setPage(1)
          }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'common' ? 'bg-canopy-500 text-villu-50' : 'bg-white text-bark-600 hover:bg-canopy-50'
          }`}
        >
          Common
          {commonUnread > 0 && (
            <span className={`rounded-full px-1.5 text-xs ${tab === 'common' ? 'bg-white/25' : 'bg-clay-100 text-clay-600'}`}>
              {commonUnread}
            </span>
          )}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <PageLoader />
        ) : pagedList.length === 0 ? (
          <p className="py-10 text-center text-bark-400">
            {tab === 'private' ? 'No notices addressed to you yet.' : 'No park-wide notices yet.'}
          </p>
        ) : (
          pagedList.map((n) => {
            const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date()
            const isUnread = !readIds.has(n.id)
            return (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                className={`card block w-full p-5 text-left ${isUnread ? 'border-l-4 border-l-clay-400' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {tab === 'private' ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canopy-100 text-canopy-600" title="Sent by an admin">
                      <User className="h-4 w-4" />
                    </div>
                  ) : (
                    <Bell className="mt-0.5 h-5 w-5 shrink-0 text-clay-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-bark-800">{n.title}</p>
                      {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-clay-400" />}
                    </div>
                    <p className="mt-1 break-words text-sm text-bark-500">{n.body}</p>
                    <p className="mt-2 text-xs text-bark-400">{date.toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            )
          })
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
