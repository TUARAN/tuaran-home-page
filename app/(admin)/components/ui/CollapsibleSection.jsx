'use client'

import { useEffect, useRef } from 'react'
import StatusPill from './StatusPill'

/** 可折叠分区卡。审计清单默认收起；带 id 时，对应锚点会自动展开。 */
export default function CollapsibleSection({
  id,
  title,
  description,
  badge,
  badgeTone = 'info',
  children,
  defaultOpen = false,
  className = '',
}) {
  const detailsRef = useRef(null)

  useEffect(() => {
    if (defaultOpen && detailsRef.current) detailsRef.current.open = true
  }, [defaultOpen])

  useEffect(() => {
    if (!id) return undefined
    const target = `#${id}`
    const openIfTargeted = () => {
      if (window.location.hash === target && detailsRef.current) detailsRef.current.open = true
    }
    const openFromSamePageLink = (event) => {
      const node = event.target instanceof Element ? event.target : event.target.parentElement
      const anchor = node?.closest('a[href]')
      if (!anchor) return
      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.hash === target && url.pathname === window.location.pathname) {
          window.setTimeout(openIfTargeted, 0)
        }
      } catch {
        return
      }
    }
    openIfTargeted()
    window.addEventListener('hashchange', openIfTargeted)
    document.addEventListener('click', openFromSamePageLink)
    return () => {
      window.removeEventListener('hashchange', openIfTargeted)
      document.removeEventListener('click', openFromSamePageLink)
    }
  }, [id])

  return (
    <details
      ref={detailsRef}
      id={id}
      className={`admin-section group/collapsible-section scroll-mt-24 rounded-xl border ${className}`}
    >
      <summary className="admin-section__header flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:px-5 group-open/collapsible-section:border-b [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          {title ? (
            <h2 className="admin-section__title font-serif text-[1.05rem] font-semibold">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="admin-section__description mb-0 mt-0.5 text-[12.5px] leading-6">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge ? <StatusPill tone={badgeTone} size="sm">{badge}</StatusPill> : null}
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            <span className="group-open/collapsible-section:hidden">展开</span>
            <span className="hidden group-open/collapsible-section:inline">收起</span>
          </span>
        </div>
      </summary>
      <div className="px-4 py-4 md:px-5">{children}</div>
    </details>
  )
}
