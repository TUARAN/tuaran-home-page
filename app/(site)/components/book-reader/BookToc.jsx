'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './bookReader.module.css'
import { pickBookSection } from './navigation.mjs'

const ACTIVATION_LINE = 136

function targetFor(id) {
  if (!id) return null
  const node = document.getElementById(id)
  return node?.getClientRects().length ? node : null
}

function activeAt(ids) {
  return pickBookSection(ids.map((id) => {
    const node = targetFor(id)
    return { id, top: node ? node.getBoundingClientRect().top : NaN }
  }), ACTIVATION_LINE)
}

function showActive(list, id) {
  const link = [...list.querySelectorAll('[data-book-toc-id]')].find((node) => node.dataset.bookTocId === id)
  if (!link) return
  const top = link.offsetTop
  const bottom = top + link.offsetHeight
  if (top < list.scrollTop + 12) list.scrollTop = Math.max(0, top - 12)
  else if (bottom > list.scrollTop + list.clientHeight - 12) list.scrollTop = bottom - list.clientHeight + 12
}

export default function BookToc({ groups, title = '目录', caption, className = '' }) {
  const pathname = usePathname()
  const listRef = useRef(null)
  const manualUntil = useRef(0)
  const ids = useMemo(() => groups.flatMap((group) => [group.id, ...group.items.map((item) => item.id)]).filter(Boolean), [groups])
  const [activeId, setActiveId] = useState(ids[0] || '')
  const activePage = groups.flatMap((group) => group.items).find((item) => item.href === pathname)?.href

  useEffect(() => {
    const list = listRef.current
    if (!list) return undefined
    let frame = 0
    let previous = ''
    const sync = () => {
      frame = 0
      const id = activePage || activeAt(ids)
      if (!id) return
      setActiveId(id)
      if (id !== previous && Date.now() >= manualUntil.current) showActive(list, id)
      previous = id
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(sync)
    }
    sync()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('hashchange', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('hashchange', schedule)
    }
  }, [ids, activePage])

  const holdManualScroll = () => { manualUntil.current = Date.now() + 1800 }
  return (
    <nav aria-label={title} data-book-toc="" className={`${styles.toc} ${className}`}>
      <p className={styles.tocTitle}>{title}</p>
      {caption ? <p className={styles.tocCaption}>{caption}</p> : null}
      <div ref={listRef} className={styles.tocList} onWheel={holdManualScroll} onTouchMove={holdManualScroll} onPointerDown={holdManualScroll}>
        {groups.map((group, index) => (
          <div key={group.id || group.heading || index} className={styles.tocGroup}>
            {group.id ? <a href={`#${group.id}`} data-book-toc-id={group.id} aria-current={activeId === group.id ? 'location' : undefined} className={styles.tocGroupLink}>{group.heading}</a> : <p className={styles.tocGroupLink}>{group.heading}</p>}
            <ol className={styles.tocItems}>
              {group.items.map((item) => <li key={item.id || item.href}>
                <a href={item.href || `#${item.id}`} data-book-toc-id={item.id || item.href} aria-current={activeId === (item.id || item.href) ? (item.href ? 'page' : 'location') : undefined} className={`${styles.tocLink} ${item.depth ? styles.tocSubLink : ''}`}>{item.label}</a>
              </li>)}
            </ol>
          </div>
        ))}
      </div>
    </nav>
  )
}
