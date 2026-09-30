'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { SITE_PRESENCE_HEARTBEAT_MS } from '../../../lib/sitePresence'

const STORAGE_KEY = 'tuaran_presence_visitor'
const SitePresenceContext = createContext(null)

function createVisitorKey() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replaceAll('-', '')
  }

  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getVisitorKey() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (/^[a-zA-Z0-9_-]{20,80}$/.test(existing || '')) return existing
    const created = createVisitorKey()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return createVisitorKey()
  }
}

export function SitePresenceProvider({ children }) {
  const [onlineCount, setOnlineCount] = useState(null)

  useEffect(() => {
    const visitorKey = getVisitorKey()
    let stopped = false
    let requestInFlight = false
    let lastHeartbeatAt = 0

    async function heartbeat() {
      if (stopped || requestInFlight || document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastHeartbeatAt < SITE_PRESENCE_HEARTBEAT_MS) return
      lastHeartbeatAt = now
      requestInFlight = true
      try {
        const response = await fetch('/api/presence', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ visitorKey }),
        })
        if (!response.ok) return
        const data = await response.json()
        const nextCount = Number(data?.count)
        if (!stopped && Number.isFinite(nextCount) && nextCount >= 0) {
          setOnlineCount(Math.floor(nextCount))
        }
      } catch {
        // Presence is decorative; network or storage failures must not affect navigation.
      } finally {
        requestInFlight = false
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') heartbeat()
    }

    heartbeat()
    const timer = window.setInterval(heartbeat, SITE_PRESENCE_HEARTBEAT_MS)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', heartbeat)

    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', heartbeat)
    }
  }, [])

  return (
    <SitePresenceContext.Provider value={onlineCount}>
      {children}
    </SitePresenceContext.Provider>
  )
}

export function useSitePresence() {
  return useContext(SitePresenceContext)
}
