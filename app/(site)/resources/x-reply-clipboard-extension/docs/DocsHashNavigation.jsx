'use client'

import { useEffect } from 'react'

export default function DocsHashNavigation() {
  useEffect(() => {
    let frame = 0
    let followup = 0

    const revealTarget = () => {
      let id = ''
      try {
        id = decodeURIComponent(window.location.hash.slice(1))
      } catch {
        return
      }
      if (!id) return
      const target = document.getElementById(id)
      if (!target) return
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true
      }
      if (target instanceof HTMLDetailsElement) target.open = true

      const scrollToTarget = () => {
        const root = document.documentElement
        const previousBehavior = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        target.scrollIntoView({ block: 'start', behavior: 'auto' })
        root.style.scrollBehavior = previousBehavior
      }
      window.cancelAnimationFrame(frame)
      window.clearTimeout(followup)
      frame = window.requestAnimationFrame(scrollToTarget)
      // 初次打开时，浏览器的锚点滚动和滚动恢复可能晚于 React 挂载。
      followup = window.setTimeout(scrollToTarget, 180)
    }

    revealTarget()
    window.addEventListener('hashchange', revealTarget)
    window.addEventListener('pageshow', revealTarget)
    if (document.readyState !== 'complete') window.addEventListener('load', revealTarget)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(followup)
      window.removeEventListener('hashchange', revealTarget)
      window.removeEventListener('pageshow', revealTarget)
      window.removeEventListener('load', revealTarget)
    }
  }, [])

  return null
}
