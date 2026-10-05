'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'
import NotificationArrival from './NotificationArrival'

const SessionContext = createContext({
  loading: true,
  user: null,
  isOwner: false,
  navOverrides: {},
  notifications: { unread: 0, items: [], status: 'idle' },
  rssUpdates: { unread: 0, status: 'idle' },
  points: { balance: 0, checkedInToday: false, checkinStatus: null, status: 'idle' },
  refresh: async () => {},
  refreshNav: async () => {},
  refreshNotifications: async () => {},
  refreshRssUpdates: async () => {},
  refreshPoints: async () => {},
  markNotificationsRead: async () => {},
})

const REFRESH_EVENT = 'tuaran:session-refresh'
const NAV_REFRESH_EVENT = 'tuaran:nav-refresh'

export function SessionProvider({ children, pointsEndpoint = null }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    isOwner: false,
    navOverrides: {},
    notifications: { unread: 0, items: [], status: 'idle' },
    rssUpdates: { unread: 0, status: 'idle' },
    points: { balance: 0, checkedInToday: false, checkinStatus: null, status: 'idle' },
  })
  const inFlightAccountRef = useRef(null)
  const inFlightNavRef = useRef(null)
  const inFlightNotificationsRef = useRef(null)
  const inFlightRssUpdatesRef = useRef(null)
  const inFlightPointsRef = useRef(null)

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
        setState((prev) => ({
          ...prev,
          loading: false,
          user: null,
          isOwner: false,
          notifications: { unread: 0, items: [], status: 'anonymous' },
        }))
      } finally {
        inFlightAccountRef.current = null
      }
    })()
    inFlightAccountRef.current = p
    return p
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (inFlightNotificationsRef.current) return inFlightNotificationsRef.current
    const p = (async () => {
      try {
        const res = await fetch('/api/notifications?type=interaction&unreadOnly=1&limit=2', { cache: 'no-store', credentials: 'same-origin' })
        const data = await res.json().catch(() => null)
        setState((prev) => ({
          ...prev,
          notifications: {
            unread: Number(data?.unread) || 0,
            items: Array.isArray(data?.items) ? data.items : [],
            status: data?.status || (res.ok ? 'ok' : 'error'),
          },
        }))
      } catch {
        setState((prev) => ({
          ...prev,
          notifications: { unread: 0, items: [], status: 'error' },
        }))
      } finally {
        inFlightNotificationsRef.current = null
      }
    })()
    inFlightNotificationsRef.current = p
    return p
  }, [])

  const refreshRssUpdates = useCallback(async () => {
    if (inFlightRssUpdatesRef.current) return inFlightRssUpdatesRef.current
    const p = (async () => {
      try {
        const res = await fetch('/api/notifications?type=rss&unreadOnly=1&limit=1', { cache: 'no-store', credentials: 'same-origin' })
        const data = await res.json().catch(() => null)
        setState((prev) => ({
          ...prev,
          rssUpdates: {
            unread: Number(data?.unread) || 0,
            status: data?.status || (res.ok ? 'ok' : 'error'),
          },
        }))
      } catch {
        setState((prev) => ({ ...prev, rssUpdates: { unread: 0, status: 'error' } }))
      } finally {
        inFlightRssUpdatesRef.current = null
      }
    })()
    inFlightRssUpdatesRef.current = p
    return p
  }, [])

  const refreshPoints = useCallback(async () => {
    if (!pointsEndpoint) return
    if (inFlightPointsRef.current) return inFlightPointsRef.current
    const p = (async () => {
      try {
        const res = await fetch(pointsEndpoint, { cache: 'no-store', credentials: 'same-origin' })
        const data = await res.json().catch(() => null)
        setState((prev) => ({
          ...prev,
          points: {
            balance: Number(data?.balance) || 0,
            checkedInToday: Boolean(data?.authed && data?.checkedInToday),
            checkinStatus: data?.checkinStatus || null,
            status: data?.authed ? 'ok' : 'anonymous',
          },
        }))
      } catch {
        setState((prev) => ({
          ...prev,
          points: { ...prev.points, status: 'error' },
        }))
      } finally {
        inFlightPointsRef.current = null
      }
    })()
    inFlightPointsRef.current = p
    return p
  }, [pointsEndpoint])

  const markNotificationsRead = useCallback(async (payload = { all: true }) => {
    const isRssUpdate = payload?.rssFeedId !== undefined || payload?.category === 'rss'
    const targetIds = new Set(
      Array.isArray(payload?.ids)
        ? payload.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
        : Number.isInteger(Number(payload?.id)) && Number(payload?.id) > 0
          ? [Number(payload.id)]
          : []
    )
    if (!isRssUpdate && (payload?.all || targetIds.size)) {
      setState((prev) => {
        const visibleItems = Array.isArray(prev.notifications?.items) ? prev.notifications.items : []
        const removed = payload?.all
          ? visibleItems.length
          : visibleItems.filter((item) => targetIds.has(Number(item.id))).length
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            unread: payload?.all ? 0 : Math.max(0, (Number(prev.notifications?.unread) || 0) - removed),
            items: payload?.all ? [] : visibleItems.filter((item) => !targetIds.has(Number(item.id))),
          },
        }
      })
    }
    if (isRssUpdate) {
      setState((prev) => ({ ...prev, rssUpdates: { ...prev.rssUpdates, unread: 0 } }))
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        if (inFlightNotificationsRef.current) await inFlightNotificationsRef.current
        if (isRssUpdate) await refreshRssUpdates()
        else await refreshNotifications()
        return true
      }
      if (isRssUpdate) await refreshRssUpdates()
      else await refreshNotifications()
    } catch {
      if (isRssUpdate) await refreshRssUpdates()
      else await refreshNotifications()
    }
    return false
  }, [refreshNotifications, refreshRssUpdates])

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
      refreshNotifications()
      refreshRssUpdates()
      refreshPoints()
    }
    function onVisibility() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refresh()
        refreshNav()
        refreshNotifications()
        refreshRssUpdates()
        refreshPoints()
      }
    }
    function onPageShow(event) {
      if (event.persisted) {
        refresh()
        refreshNav()
        refreshNotifications()
        refreshRssUpdates()
        refreshPoints()
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
  }, [refresh, refreshNav, refreshNotifications, refreshRssUpdates, refreshPoints])

  useEffect(() => {
    if (state.loading) return
    if (state.user?.id) {
      refreshNotifications()
      refreshRssUpdates()
      refreshPoints()
      const timer = window.setInterval(() => {
        refreshNotifications()
        refreshRssUpdates()
      }, 60_000)
      return () => window.clearInterval(timer)
    } else {
      setState((prev) => ({
        ...prev,
        notifications: { unread: 0, items: [], status: 'anonymous' },
        rssUpdates: { unread: 0, status: 'anonymous' },
        points: { balance: 0, checkedInToday: false, checkinStatus: null, status: 'anonymous' },
      }))
    }
    return undefined
  }, [state.loading, state.user?.id, refreshNotifications, refreshRssUpdates, refreshPoints])

  return (
    <SessionContext.Provider value={{ ...state, refresh, refreshNav, refreshNotifications, refreshRssUpdates, refreshPoints, markNotificationsRead }}>
      <Suspense fallback={null}><NotificationArrival /></Suspense>
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
