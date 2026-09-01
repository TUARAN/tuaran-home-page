'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BOOKMARK_CATEGORIES } from '../../../lib/bookmarkNavigation.mjs'

const INITIAL_VISIBLE = 120

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function BookmarkCard({ item }) {
  return (
    <article className="group relative min-w-0 rounded-lg border border-[#e3e5df] bg-white/45 px-2.5 py-2 transition-colors hover:border-[#b8c0b3] hover:bg-white/80 dark:border-gray-800 dark:bg-gray-950/35 dark:hover:border-gray-700 dark:hover:bg-gray-950/70">
      <div className="flex min-w-0 items-start gap-2">
        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8cdc3] transition-colors group-hover:bg-[#53684c] dark:bg-gray-700 dark:group-hover:bg-[#aebea8]" />
        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate pr-3 text-xs font-semibold leading-5 text-[#22261f] no-underline transition-colors hover:text-[#53684c] hover:no-underline dark:text-gray-100 dark:hover:text-[#b9cdb1]"
          >
            {item.title}
          </a>
          <p className="truncate text-[10px] leading-4 text-[#858a81] dark:text-gray-500">{item.domain || item.url}</p>
          {item.riskFlags?.length ? <div className="mt-1 flex min-h-4 items-center gap-1 text-[9px]">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-800 dark:bg-red-950/40 dark:text-red-200">私人入口</span>
          </div> : null}
        </div>
        <span className="absolute right-2 top-2 text-[10px] text-[#9ba097] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-gray-600" aria-hidden="true">↗</span>
      </div>
    </article>
  )
}

export default function BookmarkNavigationClient() {
  const [data, setData] = useState({ import: null, items: [], categories: BOOKMARK_CATEGORIES })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [special, setSpecial] = useState('all')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/bookmark-navigation', { cache: 'no-store', credentials: 'same-origin' })
      const next = await response.json().catch(() => null)
      if (!response.ok) throw new Error(next?.message || '无法读取书签数据。')
      setData(next)
      setStatus('ready')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法读取书签数据。')
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setVisibleCount(INITIAL_VISIBLE) }, [query, category, special])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return data.items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (special === 'risk' && !item.riskFlags?.length) return false
      if (!needle) return true
      return `${item.title} ${item.url} ${item.domain} ${(item.folderPath || []).join(' ')}`.toLowerCase().includes(needle)
    })
  }, [category, data.items, query, special])

  const categoryMap = useMemo(() => new Map(data.categories.map((item) => [item.id, item])), [data.categories])
  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of filtered.slice(0, visibleCount)) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category).push(item)
    }
    return [...map.entries()]
  }, [filtered, visibleCount])

  const riskTotal = data.import ? Object.values(data.import.risks || {}).reduce((sum, count) => sum + count, 0) : 0

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-[1880px] px-3 py-4 md:px-5 md:py-5">
      <Link href="/" className="inline-flex items-center text-xs font-medium text-[#656c61] no-underline transition-colors hover:text-[#263022] hover:no-underline dark:text-gray-400 dark:hover:text-gray-100">
        ← 返回首页
      </Link>

      {status === 'loading' ? <p className="mt-6 text-sm text-[#72786e] dark:text-gray-400">正在读取私有书签库…</p> : null}
      {status === 'error' ? <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      {status === 'ready' && !data.import ? (
        <section className="mt-8 rounded-2xl border border-dashed border-[#cfd5cb] px-6 py-12 text-center dark:border-gray-700">
          <h2 className="font-serif text-xl font-semibold text-[#262b24] dark:text-gray-100">书签库还是空的</h2>
          <p className="mt-2 text-sm text-[#70766c] dark:text-gray-400">当前没有可显示的书签。</p>
        </section>
      ) : null}

      {status === 'ready' && data.import ? (
        <>
          <section aria-label="书签库概览" className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-[#e1e4de] py-2 text-[11px] text-[#747a70] dark:border-gray-800 dark:text-gray-400">
            <p><strong className="mr-1.5 text-base font-semibold text-[#252a23] dark:text-gray-100">{data.import.total}</strong>条书签</p>
            <p><strong className="mr-1 font-medium text-[#444a41] dark:text-gray-200">{data.import.uniqueUrls}</strong>唯一链接</p>
            <p><strong className="mr-1 font-medium text-[#444a41] dark:text-gray-200">{data.import.sourceFolderCount}</strong>文件夹</p>
            <span className="hidden h-3 w-px bg-[#d6dad2] dark:bg-gray-700 sm:block" aria-hidden="true" />
            <p className={riskTotal ? 'text-red-700 dark:text-red-300' : ''}>{riskTotal} 个风险标记</p>
            <p className="ml-auto hidden max-w-56 truncate text-[#989d94] dark:text-gray-600 md:block" title={data.import.sourceName}>{data.import.sourceName}</p>
          </section>

          <section className="sticky top-2 z-10 -mx-1 mt-3 rounded-xl bg-[#f5f5f0]/95 p-1.5 backdrop-blur-md dark:bg-[#111510]/95">
            <div className="flex overflow-hidden rounded-xl border border-[#d9ddd5] bg-white shadow-[0_1px_2px_rgba(28,33,25,0.04)] focus-within:border-[#9aa795] focus-within:ring-2 focus-within:ring-[#899982]/15 dark:border-gray-700 dark:bg-gray-950">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3.5 text-[#92988e] dark:text-gray-500">
                <span className="sr-only">搜索书签</span>
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、域名或文件夹"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm text-[#252a23] outline-none placeholder:text-[#a1a69e] dark:text-gray-100"
                />
              </label>
              <select value={special} onChange={(event) => setSpecial(event.target.value)} aria-label="筛选书签状态" className="h-12 max-w-[9rem] border-0 border-l border-[#e2e5df] bg-transparent px-3 text-xs text-[#52584f] outline-none dark:border-gray-800 dark:text-gray-300 sm:max-w-none sm:text-sm">
                <option value="all">全部状态</option>
                <option value="risk">只看风险入口</option>
              </select>
              <span className="hidden h-12 min-w-[5.5rem] items-center justify-center border-l border-[#e2e5df] px-3 text-xs tabular-nums text-[#858b81] dark:border-gray-800 dark:text-gray-500 sm:flex">
                {filtered.length} 条
              </span>
            </div>
            <div className="mt-1.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 pt-1">
              <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${category === 'all' ? 'bg-[#273025] text-white dark:bg-[#d6e1d1] dark:text-[#182017]' : 'text-[#686e64] hover:bg-white/80 hover:text-[#292e27] dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200'}`}>
                全部 {data.import.total}
              </button>
              {data.categories.map((item) => (
                <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${category === item.id ? 'bg-[#273025] text-white dark:bg-[#d6e1d1] dark:text-[#182017]' : 'text-[#686e64] hover:bg-white/80 hover:text-[#292e27] dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200'}`}>
                  {item.label} {data.import.categoryCounts?.[item.id] || 0}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-4 space-y-5">
            {grouped.map(([categoryId, items]) => {
              const categoryInfo = categoryMap.get(categoryId)
              return (
                <section key={categoryId}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-tight text-[#262b24] dark:text-gray-100">{categoryInfo?.label || categoryId}</h2>
                    <span className="text-[11px] tabular-nums text-[#92978f] dark:text-gray-600">{items.length} 条</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
                    {items.map((item) => <BookmarkCard key={item.id} item={item} />)}
                  </div>
                </section>
              )
            })}
          </div>

          {visibleCount < filtered.length ? (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)} className="rounded-lg border border-[#cdd2c9] px-5 py-2.5 text-sm font-medium text-[#41483e] transition-colors hover:border-[#8d9988] hover:bg-white/70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900">
                再显示 {Math.min(INITIAL_VISIBLE, filtered.length - visibleCount)} 条
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  )
}
