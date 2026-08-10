'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  flushSiteEvents,
  getVisitorStage,
  markQualifiedStart,
  trackSiteEvent,
} from '../../../lib/siteAnalytics'

const ENGAGED_SECONDS = 30
const ENGAGED_SCROLL_RATIO = 0.5

function landingType(pathname) {
  if (pathname === '/') return 'home'
  if (pathname?.startsWith('/articles/research/')) return 'research_detail'
  if (pathname?.startsWith('/articles/')) return 'article_detail'
  if (pathname === '/articles') return 'directory'
  if (pathname?.startsWith('/resources/')) return 'resource'
  if (pathname === '/tools' || pathname?.startsWith('/tools/')) return 'tool'
  return 'other'
}

function contentKindForPath(pathname) {
  if (pathname?.startsWith('/articles/research/')) return 'analysis'
  if (pathname?.startsWith('/articles/')) return 'article'
  if (pathname?.startsWith('/resources/')) return 'resource'
  if (pathname?.startsWith('/tools/')) return 'tool'
  if (pathname === '/rich-pages' || pathname === '/adsense-content-check') return 'interactive'
  return ''
}

function canMeasureEngagement(pathname) {
  return Boolean(contentKindForPath(pathname))
}

function currentScrollRatio() {
  const root = document.documentElement
  const scrollable = Math.max(0, root.scrollHeight - window.innerHeight)
  if (scrollable <= 80) return 1
  return Math.min(1, Math.max(0, window.scrollY / scrollable))
}

export default function SiteBehaviorAnalytics() {
  const pathname = usePathname()
  const activeSecondsRef = useRef(0)
  const maxScrollRef = useRef(0)
  const engagedPathRef = useRef('')

  useEffect(() => {
    flushSiteEvents()
    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      flushSiteEvents()
      if (typeof window.umami?.track === 'function' || attempts >= 40) {
        window.clearInterval(timer)
      }
    }, 500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const stage = getVisitorStage()
    const sessionKey = 'tuaran_landing_view_tracked'
    let tracked = false
    try {
      tracked = window.sessionStorage.getItem(sessionKey) === '1'
      if (!tracked) window.sessionStorage.setItem(sessionKey, '1')
    } catch {
      // Storage 被禁用时，仍允许 Umami 自己统计页面浏览。
    }
    if (!tracked) {
      trackSiteEvent('landing_view', {
        landing_type: landingType(pathname),
        landing_path: pathname,
        visitor_stage: stage,
      })
    }
  }, [pathname])

  useEffect(() => {
    function handleClick(event) {
      const target = event.target instanceof Element
        ? event.target.closest('[data-analytics-event]')
        : null
      if (!target) return
      const {
        analyticsEvent,
        analyticsSurface,
        analyticsDestinationKind,
        analyticsDestinationId,
        analyticsSubject,
        analyticsAction,
        analyticsDelivery,
        analyticsPosition,
      } = target.dataset
      const properties = {
        surface: analyticsSurface,
        destination_kind: analyticsDestinationKind,
        destination_id: analyticsDestinationId,
        subject: analyticsSubject,
        action: analyticsAction,
        delivery: analyticsDelivery,
        position: analyticsPosition ? Number(analyticsPosition) : undefined,
      }
      trackSiteEvent(analyticsEvent, properties)
      if (['tool_start', 'resource_action', 'search_result_click'].includes(analyticsEvent)) {
        markQualifiedStart(analyticsEvent, properties)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    activeSecondsRef.current = 0
    maxScrollRef.current = currentScrollRatio()
    if (!canMeasureEngagement(pathname)) return undefined

    function updateScroll() {
      maxScrollRef.current = Math.max(maxScrollRef.current, currentScrollRatio())
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        activeSecondsRef.current += 1
      }
      updateScroll()
      if (
        engagedPathRef.current !== pathname &&
        activeSecondsRef.current >= ENGAGED_SECONDS &&
        maxScrollRef.current >= ENGAGED_SCROLL_RATIO
      ) {
        engagedPathRef.current = pathname
        const contentKind = contentKindForPath(pathname)
        const properties = {
          content_kind: contentKind,
          active_seconds: activeSecondsRef.current,
          scroll_percent: Math.round(maxScrollRef.current * 100),
          path: pathname,
        }
        trackSiteEvent('content_engaged', properties)
        markQualifiedStart('content_engaged', properties)
      }
    }, 1000)

    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('scroll', updateScroll)
    }
  }, [pathname])

  return null
}
