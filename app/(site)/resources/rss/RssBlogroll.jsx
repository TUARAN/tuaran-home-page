'use client'

import { useEffect, useState } from 'react'

/**
 * RSS 订阅墙：渲染站长关注的 feed 列表（只列出 + 一键复制，不抓取对方文章）。
 * - 先用 SSR 传入的 fallback（内置种子）渲染，保证不空、SEO 有内容；
 * - 挂载后拉 /api/rss-feeds 取 D1 实时列表，有就替换。
 */
export default function RssBlogroll({ fallback = [] }) {
  const [feeds, setFeeds] = useState(fallback)
  const [copiedId, setCopiedId] = useState('')

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
    return (
      <p className="text-sm text-[#666] dark:text-gray-400">订阅墙暂时为空，稍后再来看看。</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5">
      {feeds.map((feed) => (
        <section
          key={feed.id}
          className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#222] dark:text-gray-100">
              {feed.siteName}
            </h2>
            {feed.category ? (
              <span className="rounded-full border border-[#dee0db] bg-white/70 px-2 py-0.5 text-[11px] text-[#666] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                {feed.category}
              </span>
            ) : null}
          </div>

          {feed.description ? (
            <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
              {feed.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyRss(feed)}
              className="article-action-button px-3 py-1 text-xs"
            >
              {copiedId === feed.id ? '已复制 RSS' : '复制 RSS 链接'}
            </button>
            <a
              href={feed.rssUrl}
              target="_blank"
              rel="noreferrer"
              className="article-action-button px-3 py-1 text-xs"
            >
              打开 RSS
            </a>
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

          <div className="mt-2 break-all font-mono text-[11px] text-[#aaa] dark:text-gray-500">
            {feed.rssUrl}
          </div>
        </section>
      ))}
    </div>
  )
}
