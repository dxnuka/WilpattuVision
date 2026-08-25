import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, ClipboardList, Bell, LogOut, ShieldCheck, Newspaper, MapPin } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNoticesCount } from '../../hooks/useNoticesCount'

const NAV_LINKS = [
  { to: '/identify', label: 'Identify' },
  { to: '/map', label: 'Map' },
  { to: '/sightings/new', label: 'Add Sighting' },
  { to: '/species', label: 'Encyclopedia' },
  { to: '/conservation', label: 'Conservation' },
]

const ADMIN_LINKS = [
  { to: '/admin/sightings', label: 'Admin dashboard', icon: ShieldCheck },
  { to: '/admin/users', label: 'Manage users', icon: ShieldCheck },
  { to: '/admin/conservation', label: 'Manage articles', icon: Newspaper },
  { to: '/admin/hotspots', label: 'Manage hotspots', icon: MapPin },
]

function NoticeBadge({ count }) {
  if (!count) return null
  return (
    <span className="ml-auto rounded-full bg-clay-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth()
  const { unreadCount } = useNoticesCount()
  const navigate = useNavigate()
  const profileRef = useRef(null)


  const photoURL = authLoading ? null : profile && 'photoURL' in profile ? profile.photoURL : user?.photoURL || null

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const linkClass = ({ isActive }) =>
    `text-sm font-medium whitespace-nowrap transition-colors ${
      isActive ? 'text-clay-500' : 'text-bark-600 hover:text-canopy-600'
    }`

  const handleSignOut = async () => {
    setProfileOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-canopy-100 bg-villu-50/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="WilpattuVision" className="h-22 w-22" />
          <span className="font-display text-lg font-semibold text-bark-800">
            Wilpattu<span className="text-clay-500">Vision</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center lg:flex">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="relative flex h-15 w-15 items-center justify-center overflow-hidden rounded-full border border-canopy-200 text-canopy-600 hover:bg-canopy-50"
                aria-label="Account menu"
                aria-expanded={profileOpen}
              >
                {photoURL ? <img src={photoURL} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-villu-50 bg-clay-400" />
                )}
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-canopy-100 bg-white py-1 shadow-soft">
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-bark-700 hover:bg-villu-100">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link to="/submissions" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-bark-700 hover:bg-villu-100">
                    <ClipboardList className="h-4 w-4" /> Submissions
                  </Link>
                  <Link to="/notices" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-bark-700 hover:bg-villu-100">
                    <Bell className="h-4 w-4" /> Notices
                    <NoticeBadge count={unreadCount} />
                  </Link>
                  {isAdmin &&
                    ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-bark-700 hover:bg-villu-100">
                        <Icon className="h-4 w-4" /> {label}
                      </Link>
                    ))}
                  <button onClick={handleSignOut} className="flex w-full items-center gap-2 border-t border-canopy-100 px-4 py-2.5 text-left text-sm text-danger-500 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary !py-2">
              Sign in
            </Link>
          )}
        </div>

        <button
          className="relative rounded-lg p-2 text-bark-700 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          {!open && unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-villu-50 bg-clay-400" />
          )}
        </button>
      </nav>

      {open && (
        <div className="border-t border-canopy-100 bg-villu-50 px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                  Profile
                </NavLink>
                <NavLink to="/submissions" className={linkClass} onClick={() => setOpen(false)}>
                  Submissions
                </NavLink>
                <NavLink to="/notices" className={`${linkClass({ isActive: false })} flex items-center`} onClick={() => setOpen(false)}>
                  Notices
                  <NoticeBadge count={unreadCount} />
                </NavLink>
                {}
                {isAdmin &&
                  ADMIN_LINKS.map(({ to, label }) => (
                    <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
                      {label}
                    </NavLink>
                  ))}
                <button
                  onClick={() => {
                    handleSignOut()
                    setOpen(false)
                  }}
                  className="btn-secondary w-full"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary w-full" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
