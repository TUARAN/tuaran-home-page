'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BOOKMARK_CATEGORIES,
  parseChromeBookmarks,
  summarizeBookmarks,
} from '../../../lib/bookmarkNavigation.mjs'

const INITIAL_VISIBLE = 120

function formatDate(epochSeconds) {
  const value = Number(epochSeconds)
  if (!Number.isFinite(value) || value <= 0) return ''
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(value * 1000))
}

function formatImportDate(value) {
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function ImportPanel({ currentImport, onImported }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const prepareFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setPreview(null)
    if (file.size > 8 * 1024 * 1024) {
      setError('导出文件超过 8 MB，请确认选择的是 Chrome 书签 HTML。')
      return
    }
    try {
      const html = await file.text()
      const entries = parseChromeBookmarks(html)
      if (!entries.length) throw new Error('没有识别到书签，请使用 Chrome 书签管理器导出的 HTML。')
      const sourceSha256 = bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html)))
      const sourceFolderCount = (html.match(/<DT><H3\b/gi) || []).length
      setPreview({
        sourceName: file.name,
        sourceSha256,
        sourceFolderCount,
        entries,
        summary: summarizeBookmarks(entries),
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '书签文件解析失败。')
    }
  }

  const importBookmarks = async () => {
    if (!preview || busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/bookmark-navigation', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceName: preview.sourceName,
          sourceSha256: preview.sourceSha256,
          sourceFolderCount: preview.sourceFolderCount,
          entries: preview.entries,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || '导入失败，请稍后重试。')
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
      await onImported()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '导入失败，请稍后重试。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="rounded-2xl border border-[#dfe3dc] bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-950/70">
      <summary className="cursor-pointer list-none text-sm font-semibold text-[#252821] dark:text-gray-100">
        导入或更新 Chrome 书签
        <span className="ml-2 font-normal text-[#777d72] dark:text-gray-400">
          {currentImport ? `当前 ${currentImport.total} 条` : '尚未导入'}
        </span>
      </summary>
      <div className="mt-4 border-t border-[#e7e9e4] pt-4 dark:border-gray-800">
        <p className="max-w-2xl text-sm leading-6 text-[#62675f] dark:text-gray-300">
          文件只会发送到本站受保护的 D1 数据库。每次导入先建立新版本，完整写入后再切换，不会把书签明文写进 Git。
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-[#c8cec4] bg-white px-4 py-2 text-sm font-medium text-[#30352d] hover:border-[#7f8c78] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          选择 bookmarks.html
          <input ref={inputRef} type="file" accept=".html,text/html" className="sr-only" onChange={prepareFile} />
        </label>

        {preview ? (
          <div className="mt-4 rounded-xl bg-[#f1f4ef] p-4 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#252821] dark:text-gray-100">{preview.sourceName}</p>
                <p className="mt-1 text-xs text-[#6f756b] dark:text-gray-400">
                  {preview.summary.total} 条 · {preview.summary.uniqueUrls} 个唯一 URL · {preview.sourceFolderCount} 个原始文件夹 · {preview.summary.duplicateEntries} 条重复记录
                </p>
              </div>
              <button
                type="button"
                onClick={importBookmarks}
                disabled={busy}
                className="rounded-full bg-[#20251e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-[#dbe4d5] dark:text-[#172016]"
              >
                {busy ? '正在完整写入…' : `确认导入 ${preview.summary.total} 条`}
              </button>
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      </div>
    </details>
  )
}

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
    <article className="group relative min-w-0 border-t border-[#e3e5df] py-4 transition-colors first:border-t-0 dark:border-gray-800 sm:[&:nth-child(2)]:border-t-0 xl:[&:nth-child(3)]:border-t-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c8cdc3] transition-colors group-hover:bg-[#53684c] dark:bg-gray-700 dark:group-hover:bg-[#aebea8]" />
        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate pr-6 text-[15px] font-semibold leading-6 text-[#22261f] no-underline transition-colors hover:text-[#53684c] hover:no-underline dark:text-gray-100 dark:hover:text-[#b9cdb1]"
          >
            {item.title}
          </a>
          <p className="mt-0.5 truncate text-xs text-[#858a81] dark:text-gray-500">{item.domain || item.url}</p>
          {item.folderPath?.length ? (
            <p className="mt-2 truncate text-[11px] text-[#6f756b] dark:text-gray-400">
              {item.folderPath.join(' / ')}
            </p>
          ) : null}
          <div className="mt-2 flex min-h-4 items-center gap-1.5 text-[10px]">
            {item.duplicateOf ? <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">重复</span> : null}
            {item.riskFlags?.includes('insecure-http') ? <span className="rounded bg-orange-50 px-1.5 py-0.5 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200">HTTP</span> : null}
            {item.riskFlags?.some((flag) => flag !== 'insecure-http') ? <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-800 dark:bg-red-950/40 dark:text-red-200">私人入口</span> : null}
            {item.addedAt ? <span className="ml-auto truncate text-[#a0a59c] dark:text-gray-600">{formatDate(item.addedAt)}</span> : null}
          </div>
        </div>
        <span className="absolute right-0 top-[18px] text-[#9ba097] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-gray-600" aria-hidden="true">↗</span>
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
      if (special === 'duplicates' && !item.duplicateOf) return false
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
    <main className="mx-auto min-h-[70vh] w-full max-w-[1240px] px-4 py-8 md:px-6 md:py-12">
      <header className="border-b border-[#dfe3dc] pb-6 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#747b70] dark:text-gray-500">Private bookmark atlas</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-wide text-[#1d211b] dark:text-gray-100 md:text-4xl">书签导航</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#646a60] dark:text-gray-300">
              Chrome 收藏的完整私有索引。按用途重新分类，同时保留原始文件夹、重复记录和风险提示。
            </p>
          </div>
          {data.import?.activatedAt ? (
            <p className="text-xs text-[#858b81] dark:text-gray-500">最近导入 {formatImportDate(data.import.activatedAt)}</p>
          ) : null}
        </div>
      </header>

      <section className="mt-6">
        <ImportPanel currentImport={data.import} onImported={load} />
      </section>

      {status === 'loading' ? <p className="mt-10 text-sm text-[#72786e] dark:text-gray-400">正在读取私有书签库…</p> : null}
      {status === 'error' ? <p className="mt-10 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      {status === 'ready' && !data.import ? (
        <section className="mt-8 rounded-2xl border border-dashed border-[#cfd5cb] px-6 py-12 text-center dark:border-gray-700">
          <h2 className="font-serif text-xl font-semibold text-[#262b24] dark:text-gray-100">书签库还是空的</h2>
          <p className="mt-2 text-sm text-[#70766c] dark:text-gray-400">展开上方导入面板，选择 Chrome 导出的 HTML 文件。</p>
        </section>
      ) : null}

      {status === 'ready' && data.import ? (
        <>
          <section aria-label="书签库概览" className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[#e1e4de] py-3 text-xs text-[#747a70] dark:border-gray-800 dark:text-gray-400">
            <p><strong className="mr-1.5 text-base font-semibold text-[#252a23] dark:text-gray-100">{data.import.total}</strong>条书签</p>
            <p><strong className="mr-1 font-medium text-[#444a41] dark:text-gray-200">{data.import.uniqueUrls}</strong>唯一链接</p>
            <p><strong className="mr-1 font-medium text-[#444a41] dark:text-gray-200">{data.import.sourceFolderCount}</strong>文件夹</p>
            <span className="hidden h-3 w-px bg-[#d6dad2] dark:bg-gray-700 sm:block" aria-hidden="true" />
            <p className={data.import.duplicateEntries ? 'text-amber-700 dark:text-amber-300' : ''}>{data.import.duplicateEntries} 条重复</p>
            <p className={riskTotal ? 'text-red-700 dark:text-red-300' : ''}>{riskTotal} 个风险标记</p>
            <p className="ml-auto hidden max-w-56 truncate text-[#989d94] dark:text-gray-600 md:block" title={data.import.sourceName}>{data.import.sourceName}</p>
          </section>

          <section className="sticky top-2 z-10 -mx-2 mt-5 rounded-2xl bg-[#f5f5f0]/95 p-2 backdrop-blur-md dark:bg-[#111510]/95">
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
                <option value="duplicates">只看重复记录</option>
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

          <div className="mt-8 space-y-9">
            {grouped.map(([categoryId, items]) => {
              const categoryInfo = categoryMap.get(categoryId)
              return (
                <section key={categoryId}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-[#262b24] dark:text-gray-100">{categoryInfo?.label || categoryId}</h2>
                    <span className="text-[11px] tabular-nums text-[#92978f] dark:text-gray-600">{items.length} 条</span>
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
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
