import { useEffect, useMemo, useState } from 'react'
import { ShieldOff, ShieldCheck, Loader2, Send, Search, User, Bell, X } from 'lucide-react'
import { getAllUsers, setUserRestricted } from '../../services/usersService'
import { createNotice } from '../../services/noticesService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import PageLoader from '../../components/common/PageLoader'
import AdminUserDetailModal from './AdminUserDetailModal'

const PAGE_SIZE = 10

export default function AdminUsers() {
  const { user } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyUid, setBusyUid] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailTarget, setDetailTarget] = useState(null)

  const [recipient, setRecipient] = useState(null) 
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeBody, setNoticeBody] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => getAllUsers().then(setUsers).finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    )
  }, [users, search])

  useEffect(() => setPage(1), [search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleRestricted = async (target) => {
    setBusyUid(target.id)
    try {
      await setUserRestricted(target.id, !target.restricted)
      toast.success(target.restricted ? 'User unrestricted.' : 'User restricted.')
      await load()
      setDetailTarget(null)
    } catch {
      toast.error('Could not update this user.')
    } finally {
      setBusyUid(null)
    }
  }

  const handleNotifyUser = (target) => {
    setDetailTarget(null)
    setRecipient(target)
    document.getElementById('notice-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSendNotice = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await createNotice({
        title: noticeTitle,
        body: noticeBody,
        authorAdminId: user.uid,
        recipientUid: recipient ? recipient.id : 'all',
      })
      toast.success(recipient ? `Notice sent to ${recipient.displayName || recipient.email}.` : 'Notice sent to all users.')
      setNoticeTitle('')
      setNoticeBody('')
    } catch {
      toast.error('Could not send this notice.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">User accounts</h1>
      <p className="mt-2 text-bark-500">Click a user to view full details. Restrict accounts that misuse the sighting log, and send notices to users.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field pl-9"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <PageLoader />
            ) : pagedUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-bark-400">No users match "{search}".</p>
            ) : (
              pagedUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setDetailTarget(u)}
                  className="card flex w-full items-center justify-between gap-3 p-3 text-left transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-canopy-50 text-canopy-400">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-bark-800">{u.displayName || 'Unnamed user'}</p>
                      <p className="truncate text-xs text-bark-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {u.restricted && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-danger-500">Restricted</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNotifyUser(u)
                      }}
                      aria-label={`Notify ${u.displayName || u.email}`}
                      className="rounded-full p-2 text-canopy-600 hover:bg-canopy-50"
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
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

        <form id="notice-composer" onSubmit={handleSendNotice} className="card h-fit space-y-3 p-5">
          <h2 className="text-sm font-semibold text-bark-800">Send a notice</h2>

          {recipient ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-canopy-50 px-3 py-2 text-xs">
              <span className="truncate text-canopy-700">
                To: <strong>{recipient.displayName || recipient.email}</strong>
              </span>
              <button type="button" onClick={() => setRecipient(null)} aria-label="Clear recipient, send to all users">
                <X className="h-3.5 w-3.5 text-canopy-500" />
              </button>
            </div>
          ) : (
            <p className="rounded-lg bg-villu-100 px-3 py-2 text-xs text-bark-500">
              To: <strong>All users</strong> 
            </p>
          )}

          <input
            type="text"
            required
            value={noticeTitle}
            onChange={(e) => setNoticeTitle(e.target.value)}
            placeholder="Notice title"
            className="input-field"
          />
          <textarea
            required
            value={noticeBody}
            onChange={(e) => setNoticeBody(e.target.value)}
            rows={4}
            placeholder="Notice details..."
            className="input-field"
          />
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Sending...' : 'Post notice'}
          </button>
        </form>
      </div>

      <AdminUserDetailModal
        target={detailTarget}
        onClose={() => setDetailTarget(null)}
        onToggleRestricted={toggleRestricted}
        onNotify={handleNotifyUser}
        busy={busyUid === detailTarget?.id}
      />
    </div>
  )
}
