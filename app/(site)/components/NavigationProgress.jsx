'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { isXContentSurface } from '../../../lib/site/xSiteRoutes'

const SAFETY_TIMEOUT_MS = 12000
const MIN_VISIBLE_MS = 260

function findAnchor(target) {
  if (target instanceof Element) return target.closest('a[href]')
  const parent = target?.parentElement
  return parent ? parent.closest('a[href]') : null
}

// 只接管站内整页跳转；外链、下载、新标签、锚点和修饰键点击保持浏览器原行为。
function isInternalNavigation(anchor, event) {
  if (!anchor || event.defaultPrevented) return false
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false
  if (anchor.dataset.navProgress === 'off') return false

  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false

  let url
  try {
    url = new URL(anchor.href, window.location.href)
  } catch {
    return false
  }
  if (url.origin !== window.location.origin) return false
  if (url.pathname === window.location.pathname && url.search === window.location.search) return false
  return true
}

/**
 * 站内导航的即时进度提示。
 * 交互沿用 NProgress 的经典做法：点击站内链接立即起条，地址提交后补满淡出。
 * 实现只依赖 CSS 动画与 history 钩子，不引入第三方运行时。
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const [xTone, setXTone] = useState(false)
  const [active, setActive] = useState(false)
  const [runId, setRunId] = useState(0)
  const startedAtRef = useRef(0)
  const activeRef = useRef(false)
  const hideTimeoutRef = useRef(null)

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearHideTimeout()
    startedAtRef.current = Date.now()
    activeRef.current = true
    setRunId((current) => current + 1)
    setActive(true)
    hideTimeoutRef.current = window.setTimeout(() => {
      activeRef.current = false
      setActive(false)
    }, SAFETY_TIMEOUT_MS)
  }, [clearHideTimeout])

  const finish = useCallback(() => {
    if (!activeRef.current) return
    activeRef.current = false
    const elapsed = Date.now() - startedAtRef.current
    clearHideTimeout()
    hideTimeoutRef.current = window.setTimeout(
      () => setActive(false),
      Math.max(0, MIN_VISIBLE_MS - elapsed),
    )
  }, [clearHideTimeout])

  useEffect(() => {
    setXTone(isXContentSurface(pathname, window.location.hostname))
  }, [pathname])

  useEffect(() => {
    function handleClick(event) {
      if (!isInternalNavigation(findAnchor(event.target), event)) return
      setXTone(isXContentSurface(window.location.pathname, window.location.hostname))
      start()
    }

    function handlePopState() {
      start()
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopState)

    // App Router 在提交导航时改写 history；监听它作为“导航已落地”的信号。
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args)
      finish()
      return result
    }
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args)
      finish()
      return result
    }

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopState)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
    }
  }, [finish, start])

  return (
    <div
      className={xTone ? 'nav-progress nav-progress--x' : 'nav-progress'}
      data-active={active ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span key={runId} className="nav-progress__bar" />
    </div>
  )
}
