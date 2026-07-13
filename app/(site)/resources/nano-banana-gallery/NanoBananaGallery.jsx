'use client'

import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 18

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.4 16.4 4.1 4.1" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.7">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function ImagePreview({ preview, onClose }) {
  useEffect(() => {
    if (!preview) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [preview, onClose])

  if (!preview) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${preview.caseTitle} · ${preview.image.label}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/15"
      >
        关闭 Esc
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview.image.url}
        alt={`${preview.caseTitle} · ${preview.image.label}`}
        className="max-h-[88vh] max-w-[94vw] object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
      <p className="absolute bottom-4 left-1/2 max-w-[90vw] -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-center text-xs text-white/90">
        {preview.caseTitle} · {preview.image.label}
      </p>
    </div>
  )
}

function CaseCard({ item, onPreview, onCopy }) {
  return (
    <article className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-[#e5e5df] bg-white shadow-[0_8px_26px_rgba(38,38,30,0.05)] dark:border-gray-800 dark:bg-gray-900">
      <div className={`grid gap-px bg-[#e8e8e2] dark:bg-gray-800 ${item.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {item.images.map((image) => (
          <button
            key={image.url}
            type="button"
            onClick={() => onPreview({ image, caseTitle: item.title })}
            className="group relative aspect-square overflow-hidden bg-[#f3f3ef] text-left dark:bg-gray-950"
            title="查看大图"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`${item.title} · ${image.label}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.025]"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              {image.label}
            </span>
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07b16] dark:text-amber-400/80">
              {item.edition === 'pro' ? 'Nano Banana Pro' : 'Nano Banana'} · #{item.number}
            </p>
            <h2 className="mt-1.5 text-base font-semibold leading-6 text-[#262622] dark:text-gray-100">
              {item.title}
            </h2>
          </div>
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full border border-[#deded6] px-2.5 py-1 text-[11px] text-[#777] transition hover:border-[#aaa] hover:text-[#222] dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
            >
              原帖 ↗
            </a>
          ) : null}
        </div>

        {item.prompt ? (
          <div className="mt-4 rounded-xl bg-[#f7f7f3] p-3 dark:bg-gray-950/70">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999]">Prompt</span>
              <button
                type="button"
                onClick={() => onCopy(item)}
                className="inline-flex items-center gap-1 text-xs text-[#777] transition hover:text-[#1d1d1b] dark:text-gray-400 dark:hover:text-white"
              >
                <CopyIcon />
                复制提示词
              </button>
            </div>
            <p className="line-clamp-5 whitespace-pre-line text-xs leading-5 text-[#555] dark:text-gray-300">
              {item.prompt}
            </p>
          </div>
        ) : null}

        {item.author ? (
          <p className="mt-3 text-[11px] text-[#aaa]">
            案例作者：
            {item.authorUrl ? (
              <a href={item.authorUrl} target="_blank" rel="noreferrer" className="hover:text-[#555] hover:underline dark:hover:text-gray-300">
                {item.author}
              </a>
            ) : item.author}
          </p>
        ) : null}
      </div>
    </article>
  )
}

export default function NanoBananaGallery({ cases }) {
  const [edition, setEdition] = useState('nano')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [preview, setPreview] = useState(null)
  const [toast, setToast] = useState('')

  const counts = useMemo(() => ({
    nano: cases.filter((item) => item.edition === 'nano').length,
    pro: cases.filter((item) => item.edition === 'pro').length,
  }), [cases])

  const filteredCases = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('zh-CN')
    return cases.filter((item) => {
      if (item.edition !== edition) return false
      if (!needle) return true
      return [item.title, item.prompt, item.author]
        .join('\n')
        .toLocaleLowerCase('zh-CN')
        .includes(needle)
    })
  }, [cases, edition, query])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [edition, query])

  async function copyPrompt(item) {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setToast(`已复制「${item.title}」提示词`)
      window.setTimeout(() => setToast(''), 2200)
    } catch {
      setToast('复制失败，请手动选择提示词')
    }
  }

  const visibleCases = filteredCases.slice(0, visibleCount)

  return (
    <>
      <section className="sticky top-[calc(var(--site-header-height)+0.75rem)] z-20 mb-7 rounded-2xl border border-[#e4e4dd] bg-[#fafaf7]/95 p-3 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex rounded-xl bg-[#eeeeea] p-1 dark:bg-gray-900">
            {[
              { id: 'nano', label: 'Nano Banana' },
              { id: 'pro', label: 'Nano Banana Pro' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEdition(tab.id)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm transition md:flex-none ${
                  edition === tab.id
                    ? 'bg-[#22221e] text-white shadow-sm dark:bg-white dark:text-gray-950'
                    : 'text-[#777] hover:text-[#222] dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {tab.label} <span className="ml-1 opacity-60">{counts[tab.id]}</span>
              </button>
            ))}
          </div>

          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#deded8] bg-white px-3 py-2 text-[#888] focus-within:border-[#999] md:w-80 dark:border-gray-700 dark:bg-gray-900">
            <SearchIcon />
            <span className="sr-only">搜索案例与提示词</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索案例、作者或提示词"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#333] outline-none placeholder:text-[#aaa] dark:text-gray-100"
            />
          </label>
        </div>
      </section>

      <p className="mb-4 text-xs text-[#999] dark:text-gray-500">
        找到 {filteredCases.length} 个案例 · 点击图片查看大图
      </p>

      {visibleCases.length ? (
        <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
          {visibleCases.map((item) => (
            <CaseCard key={item.id} item={item} onPreview={setPreview} onCopy={copyPrompt} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8d8d0] py-20 text-center text-sm text-[#888] dark:border-gray-800 dark:text-gray-400">
          没有找到匹配案例，换个关键词试试。
        </div>
      )}

      {visibleCount < filteredCases.length ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-full border border-[#d7d7cf] bg-white px-6 py-2.5 text-sm text-[#555] transition hover:border-[#999] hover:text-[#222] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            加载更多（剩余 {filteredCases.length - visibleCount}）
          </button>
        </div>
      ) : null}

      <ImagePreview preview={preview} onClose={() => setPreview(null)} />

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-[#222] px-4 py-2 text-xs text-white shadow-xl dark:bg-white dark:text-gray-950">
          {toast}
        </div>
      ) : null}
    </>
  )
}
