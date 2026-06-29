'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * RSS 订阅墙 + 内置 mini 阅读器。
 * - 先用 SSR 传入的 fallback（内置种子）渲染源列表，保证不空、SEO 有内容；
 * - 挂载后拉 /api/rss-feeds 取 D1 实时源列表；
 * - 每张源卡片可展开，懒加载 /api/rss-fetch?id= 拿该源最新文章（标题 + 日期 + 摘要），
 *   点标题去原站读全文。首个源默认自动展开，一进页面就能看到内容。
 */
export default function RssBlogroll({ fallback = [] }) {
  const [feeds, setFeeds] = useState(fallback)
  const [copiedId, setCopiedId] = useState('')
  // feedId -> { open, loading, error, entries }
  const [reader, setReader] = useState({})

  const loadEntries = useCallback(async (feedId) => {
    setReader((prev) => ({ ...prev, [feedId]: { ...prev[feedId], open: true, loading: true, error: '' } }))
    try {
      const res = await fetch(`/api/rss-fetch?id=${encodeURIComponent(feedId)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      const entries = Array.isArray(data?.entries) ? data.entries : []
      setReader((prev) => ({
        ...prev,
        [feedId]: {
          open: true,
          loading: false,
          error: entries.length ? '' : data?.error || (data?.status === 'ok' ? 'EMPTY' : 'FETCH_FAILED'),
          entries,
        },
      }))
    } catch (err) {
      setReader((prev) => ({
        ...prev,
        [feedId]: { open: true, loading: false, error: String(err?.message || err), entries: [] },
      }))
    }
  }, [])

  // 拉实时源列表
  useEffect(() => {
    let cancelled = false
    fetch('/api/rss-feeds', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.feeds) && d.feeds.length) setFeeds(d.feeds)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // 首个源自动展开，进页面即见内容
  useEffect(() => {
    const first = feeds[0]
    if (first && reader[first.id] === undefined) loadEntries(first.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeds, loadEntries])

  function toggle(feedId) {
    const state = reader[feedId]
    if (!state) return loadEntries(feedId)
    if (state.open && !state.loading && !state.entries?.length && state.error) return loadEntries(feedId) // 失败可重试
    setReader((prev) => ({ ...prev, [feedId]: { ...prev[feedId], open: !prev[feedId].open } }))
  }

  async function copyRss(feed) {
    try {
      await navigator.clipboard.writeText(feed.rssUrl)
      setCopiedId(feed.id)
      setTimeout(() => setCopiedId(''), 2000)
    } catch {
      // 复制失败时静默，用户仍可手动复制下方明文链接
    }
  }

  if (!feeds.length) {
    return <p className="text-sm text-[#666] dark:text-gray-400">订阅墙暂时为空，稍后再来看看。</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5">
      {feeds.map((feed) => {
        const state = reader[feed.id] || {}
        return (
          <section
            key={feed.id}
            className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#222] dark:text-gray-100">{feed.siteName}</h2>
              {feed.category ? (
                <span className="rounded-full border border-[#dee0db] bg-white/70 px-2 py-0.5 text-[11px] text-[#666] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  {feed.category}
                </span>
              ) : null}
            </div>

            {feed.description ? (
              <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">{feed.description}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggle(feed.id)}
                className="article-action-button px-3 py-1 text-xs"
                aria-expanded={state.open ? 'true' : 'false'}
              >
                {state.open ? '收起最新文章 ▴' : '最新文章 ▾'}
              </button>
              <button
                type="button"
                onClick={() => copyRss(feed)}
                className="article-action-button px-3 py-1 text-xs"
              >
                {copiedId === feed.id ? '已复制 RSS' : '复制 RSS 链接'}
              </button>
              {feed.siteUrl ? (
                <a
                  href={feed.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#888] underline underline-offset-4 hover:text-[#444] dark:text-gray-400 dark:hover:text-gray-200"
                >
                  访问主页 →
                </a>
              ) : null}
            </div>

            {state.open ? (
              <div className="mt-4 border-t border-[#f0f0ec] pt-3 dark:border-gray-800">
                {state.loading ? (
                  <p className="text-xs text-[#999] dark:text-gray-500">正在抓取最新文章…</p>
                ) : state.entries?.length ? (
                  <ul className="divide-y divide-[#f3f3ef] dark:divide-gray-800">
                    {state.entries.map((entry, idx) => (
                      <li key={entry.link || idx} className="py-2.5 first:pt-0">
                        <a
                          href={entry.link || feed.siteUrl || feed.rssUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium text-[#2a2a2a] underline-offset-4 hover:underline dark:text-gray-100">
                              {entry.title}
                            </span>
                            {entry.date ? (
                              <time className="shrink-0 font-mono text-[11px] text-[#aaa] dark:text-gray-500">
                                {entry.date}
                              </time>
                            ) : null}
                          </div>
                          {entry.summary ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#777] dark:text-gray-400">
                              {entry.summary}
                            </p>
                          ) : null}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#999] dark:text-gray-500">
                    暂时拉不到这个源的文章（对方站点可能限制了抓取）。
                    <button
                      type="button"
                      onClick={() => loadEntries(feed.id)}
                      className="ml-1 underline underline-offset-4 hover:text-[#555]"
                    >
                      重试
                    </button>
                    {feed.siteUrl ? (
                      <>
                        {' 或 '}
                        <a
                          href={feed.siteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-4 hover:text-[#555]"
                        >
                          去原站读 →
                        </a>
                      </>
                    ) : null}
                  </p>
                )}
              </div>
            ) : null}

            <div className="mt-3 break-all font-mono text-[11px] text-[#bbb] dark:text-gray-600">
              {feed.rssUrl}
            </div>
          </section>
        )
      })}
    </div>
  )
}
