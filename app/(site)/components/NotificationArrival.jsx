'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { useSessionAccount } from './SessionProvider'

function targetInView(node) {
  const rect = node.getBoundingClientRect()
  return rect.height > 0 && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight
}

export default function NotificationArrival() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const notificationId = Number(searchParams.get('notification'))
  const { user, markNotificationsRead } = useSessionAccount()

  useEffect(() => {
    if (!user?.id || !Number.isInteger(notificationId) || notificationId <= 0) return undefined

    let cancelled = false
    let pending = false
    let expected = null
    let highlighted = null
    let scrollRequested = false
    const targetId = (() => {
      try { return decodeURIComponent(window.location.hash.slice(1)) } catch { return '' }
    })()
    const observer = new MutationObserver(() => inspect())

    function inspect() {
      if (cancelled || !expected || pending || document.visibilityState !== 'visible') return
      const current = new URL(window.location.href)
      if (current.pathname !== expected.pathname || current.search !== expected.search || current.hash !== expected.hash) return

      const target = targetId ? document.getElementById(targetId) : null
      if (targetId && !target) return
      if (targetId && (targetId.startsWith('rss-feed-') || targetId.startsWith('comment-') || targetId === 'article-like' || targetId === 'notification-destination') && target?.dataset.notificationReady !== 'true') return
      if (target && !targetInView(target)) {
        if (!scrollRequested) {
          scrollRequested = true
          target.scrollIntoView({ block: targetId.startsWith('comment-') ? 'center' : 'start', behavior: 'auto' })
        }
        return
      }

      if (target && !highlighted) {
        highlighted = target
        target.classList.add('is-notification-target')
        window.setTimeout(() => target.classList.remove('is-notification-target'), 3000)
      }
      pending = true
      markNotificationsRead({ id: notificationId }).then((ok) => {
        if (cancelled) return
        if (ok) {
          window.dispatchEvent(new CustomEvent('tuaran:notification-read', { detail: { id: notificationId } }))
          observer.disconnect()
          window.removeEventListener('scroll', inspect)
          document.removeEventListener('visibilitychange', inspect)
        } else {
          pending = false
        }
      })
    }

    fetch(`/api/notifications?id=${notificationId}`, { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const item = data?.items?.[0]
        if (cancelled || item?.id !== notificationId) return
        expected = new URL(item.href, window.location.origin)
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-notification-ready'] })
        window.addEventListener('scroll', inspect, { passive: true })
        document.addEventListener('visibilitychange', inspect)
        inspect()
      })
      .catch(() => {})

    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('scroll', inspect)
      document.removeEventListener('visibilitychange', inspect)
    }
  }, [pathname, searchParams, notificationId, user?.id, markNotificationsRead])

  return null
}
