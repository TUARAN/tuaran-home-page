'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const SessionContext = createContext({
  loading: true,
  user: null,
  isOwner: false,
  navOverrides: {},
  refresh: async () => {},
  refreshNav: async () => {},
})

const REFRESH_EVENT = 'tuaran:session-refresh'
const NAV_REFRESH_EVENT = 'tuaran:nav-refresh'

export function SessionProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    isOwner: false,
    navOverrides: {},
  })
  const inFlightAccountRef = useRef(null)
  const inFlightNavRef = useRef(null)

  const refresh = useCallback(async () => {
    if (inFlightAccountRef.current) return inFlightAccountRef.current
    const p = (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' })
        const data = await res.json().catch(() => null)
        setState((prev) => ({
          ...prev,
          loading: false,
          user: data?.user || null,
          isOwner: Boolean(data?.isOwner),
        }))
      } catch {
        setState((prev) => ({ ...prev, loading: false, user: null, isOwner: false }))
      } finally {
        inFlightAccountRef.current = null
      }
    })()
    inFlightAccountRef.current = p
    return p
  }, [])

  const refreshNav = useCallback(async () => {
    if (inFlightNavRef.current) return inFlightNavRef.current
    const p = (async () => {
      try {
        const res = await fetch('/api/nav-config', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        setState((prev) => ({
          ...prev,
          navOverrides: data?.overrides && typeof data.overrides === 'object' ? data.overrides : {},
        }))
      } catch {
        setState((prev) => ({ ...prev, navOverrides: {} }))
      } finally {
        inFlightNavRef.current = null
      }
    })()
    inFlightNavRef.current = p
    return p
  }, [])

  useEffect(() => {
    refresh()
    refreshNav()
    function onFocus() {
      refresh()
      refreshNav()
    }
    function onVisibility() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refresh()
        refreshNav()
      }
    }
    function onPageShow(event) {
      if (event.persisted) {
        refresh()
        refreshNav()
      }
    }
    function onSessionRefresh() { refresh() }
    function onNavRefresh() { refreshNav() }
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener(REFRESH_EVENT, onSessionRefresh)
    window.addEventListener(NAV_REFRESH_EVENT, onNavRefresh)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener(REFRESH_EVENT, onSessionRefresh)
      window.removeEventListener(NAV_REFRESH_EVENT, onNavRefresh)
    }
  }, [refresh, refreshNav])

  return (
    <SessionContext.Provider value={{ ...state, refresh, refreshNav }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionAccount() {
  return useContext(SessionContext)
}

export function notifySessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(REFRESH_EVENT))
  }
}

export function notifyNavChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAV_REFRESH_EVENT))
  }
}
