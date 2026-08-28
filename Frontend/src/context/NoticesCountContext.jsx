import { createContext, useCallback, useEffect, useState } from 'react'
import { getPrivateNotices, getCommonNotices, getReadNoticeIds } from '../services/noticesService'
import { useAuth } from '../hooks/useAuth'

export const NoticesCountContext = createContext(undefined)

export function NoticesCountProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    Promise.all([getPrivateNotices(user.uid), getCommonNotices(), getReadNoticeIds(user.uid)])
      .then(([priv, common, readIds]) => {
        const unreadPrivate = priv.filter((n) => !readIds.has(n.id)).length
        const unreadCommon = common.filter((n) => !readIds.has(n.id)).length
        setUnreadCount(unreadPrivate + unreadCommon)
      })
      .catch(() => setUnreadCount(0)) 
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return <NoticesCountContext.Provider value={{ unreadCount, refresh }}>{children}</NoticesCountContext.Provider>
}
