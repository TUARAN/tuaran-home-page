'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const REFRESH_EVENT = 'tuaran:session-refresh'

const SharedSessionContext = createContext({
  loading: true,
  user: null,
  isOwner: false,
  signedIn: false,
  refresh: async () => {},
})

export function SharedSessionProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, isOwner: false })
  const inFlightRef = useRef(null)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current
    const p = (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store', credentials: 'include' })
        const data = await res.json().catch(() => null)
        setState({
          loading: false,
          user: data?.user || null,
          isOwner: Boolean(data?.isOwner),
        })
      } catch {
        setState({ loading: false, user: null, isOwner: false })
      } finally {
        inFlightRef.current = null
      }
    })()
    inFlightRef.current = p
    return p
  }, [])

  useEffect(() => {
    refresh()
    const onRefresh = () => { refresh() }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', onVisible)
    window.addEventListener('pageshow', onRefresh)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(REFRESH_EVENT, onRefresh)
    return () => {
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('pageshow', onRefresh)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(REFRESH_EVENT, onRefresh)
    }
  }, [refresh])

  const signedIn = Boolean(state.user?.id)

  return (
    <SharedSessionContext.Provider value={{ ...state, signedIn, refresh }}>
      {children}
    </SharedSessionContext.Provider>
  )
}

export function useSharedSession() {
  return useContext(SharedSessionContext)
}

export function sessionUserLabel(user) {
  if (!user) return ''
  return user.login || user.email || user.id || '已登录'
}