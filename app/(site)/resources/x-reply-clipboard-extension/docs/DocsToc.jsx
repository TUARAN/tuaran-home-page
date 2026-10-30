'use client'

import { useLayoutEffect, useRef, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'
const ACTIVATION_LINE = 120

function visibleSection(id) {
  const element = document.getElementById(id)
  if (!element || element.getClientRects().length === 0) return null
  return element
}

function pickActiveId(ids) {
  const root = document.scrollingElement
  const atBottom = root && root.scrollTop + window.innerHeight >= root.scrollHeight - 2
  let current = ''
  let lastVisible = ''
  for (const id of ids) {
    const element = visibleSection(id)
    if (!element) continue
    lastVisible = id
    if (element.getBoundingClientRect().top <= ACTIVATION_LINE) current = id
  }
  if (atBottom && lastVisible) return lastVisible
  return current || lastVisible || ids[0] || ''
}

function revealWithin(list, link) {
  const pad = 10
  const listRect = list.getBoundingClientRect()
  const linkRect = link.getBoundingClientRect()
  if (linkRect.top < listRect.top + pad) {
    list.scrollTop -= listRect.top + pad - linkRect.top
  } else if (linkRect.bottom > listRect.bottom - pad) {
    list.scrollTop += linkRect.bottom - (listRect.bottom - pad)
  }
}

export default function DocsToc({ groups }) {
  const navRef = useRef(null)
  const listRef = useRef(null)
  const [activeId, setActiveId] = useState(groups[0]?.items[0]?.id || '')

  useLayoutEffect(() => {
    const nav = navRef.current
    const list = listRef.current
    if (!nav || !list) return undefined

    const ids = groups.flatMap((group) => group.items.map((item) => item.id))
    let frame = 0

    const syncToPage = () => {
      const current = pickActiveId(ids)
      setActiveId((previous) => (previous === current ? previous : current))
      if (!window.matchMedia(DESKTOP_QUERY).matches) {
        if (list.scrollTop !== 0) list.scrollTop = 0
        return
      }
      const link = list.querySelector(`[data-toc-id="${current}"]`)
      if (link) revealWithin(list, link)
    }

    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(syncToPage)
    }

    // 目录高于一屏时，滚轮如果被目录自己吃掉，右侧正文不会动。
    // 这里把目录上的滚轮交给整页，目录只跟着当前章节露出对应条目。
    const onWheel = (event) => {
      if (!window.matchMedia(DESKTOP_QUERY).matches) return
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      let delta = event.deltaY
      if (event.deltaMode === 1) delta *= 16
      else if (event.deltaMode === 2) delta *= window.innerHeight
      event.preventDefault()
      window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
    }

    syncToPage()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('hashchange', schedule)
    nav.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('hashchange', schedule)
      nav.removeEventListener('wheel', onWheel)
    }
  }, [groups])

  return (
    <nav
      ref={navRef}
      aria-label="文档目录"
      className="rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_82%,transparent)] p-4 shadow-[0_16px_50px_color-mix(in_srgb,var(--site-shadow)_12%,transparent)]"
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--site-faint)]">On this page</p>
      <div
        ref={listRef}
        className="mt-4 space-y-4 lg:max-h-[calc(100dvh-var(--site-header-height)-7rem)] lg:overflow-y-hidden lg:[scrollbar-width:none]"
      >
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--site-faint)]">{group.heading}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const depth = Number(item.depth) || 0
                const active = item.id === activeId
                const depthClass = depth === 1
                  ? 'pl-4 text-[12.5px] font-medium text-[var(--site-ink)]'
                  : depth >= 2
                    ? 'ml-4 border-l border-[var(--site-line)] pl-3 text-[12px] text-[var(--site-muted)]'
                    : 'text-[13px]'
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    data-toc-id={item.id}
                    aria-current={active ? 'location' : undefined}
                    className={`block rounded-lg px-2 py-1.5 no-underline transition hover:bg-[color-mix(in_srgb,var(--site-green)_8%,var(--site-panel))] hover:text-[var(--site-ink)] ${depthClass} ${active ? 'bg-[color-mix(in_srgb,var(--site-green)_10%,var(--site-panel))] !text-[var(--site-ink)]' : 'text-[var(--site-muted)]'}`}
                  >
                    {item.label}
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
