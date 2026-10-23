'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { IconSearch } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/site/i18n'

export default function SiteSearch({ mobile = false }) {
  const { locale } = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => { setOpen(false); setActive(-1) }, [pathname])

  useEffect(() => {
    if (!open || !query.trim()) { setResults([]); return }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/site-search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => { if (!controller.signal.aborted) setResults(data?.results || []) })
        .catch(() => {})
    }, 180)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function onKeyDown(event) {
    if (event.key === 'Escape') { setOpen(false); setActive(-1); inputRef.current?.blur(); return }
    if (!results.length || !open) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => event.key === 'ArrowDown'
        ? (current + 1) % results.length
        : (current - 1 + results.length) % results.length)
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      setOpen(false)
      router.push(results[active].href)
    }
  }

  const listId = mobile ? 'site-search-mobile-results' : 'site-search-desktop-results'
  return <div ref={rootRef} className={`site-search ${mobile ? 'site-search-mobile' : 'site-search-desktop'}`}>
    <form action="/search" role="search" className="site-search-form">
      <IconSearch size={17} stroke={1.8} aria-hidden="true" className="site-search-icon" />
      <label className="sr-only" htmlFor={mobile ? 'site-search-mobile-input' : 'site-search-desktop-input'}>{pick(locale, '搜索页面和内容', 'Search pages and content')}</label>
      <input
        ref={inputRef}
        id={mobile ? 'site-search-mobile-input' : 'site-search-desktop-input'}
        type="search"
        name="q"
        value={query}
        maxLength={100}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && Boolean(query.trim())}
        aria-activedescendant={active >= 0 && open ? `${listId}-${active}` : undefined}
        placeholder={pick(locale, mobile ? '搜索页面、内容' : '搜索页面、文章、资源', 'Search pages and content')}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setResults([]); setActive(-1); setOpen(true) }}
        onKeyDown={onKeyDown}
      />
    </form>
    {open && query.trim() ? <div id={listId} role="listbox" className="site-search-results">
      {results.map((item, index) => <Link
        key={`${item.kind}:${item.href}`}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={index === active}
        href={item.href}
        className={`site-search-result ${index === active ? 'site-search-result-active' : ''}`}
        onClick={() => setOpen(false)}
      >
        <span className="site-search-result-title">{item.title}</span>
        <span className="site-search-result-kind">{item.kind === 'page' ? pick(locale, '页面', 'Page') : pick(locale, '内容', 'Content')}</span>
      </Link>)}
      <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="site-search-all" onClick={() => setOpen(false)}>
        {pick(locale, '查看全部搜索结果', 'View all results')} <span aria-hidden="true">→</span>
      </Link>
    </div> : null}
  </div>
}
