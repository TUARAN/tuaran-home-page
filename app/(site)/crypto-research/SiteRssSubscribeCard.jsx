'use client'

import { useState } from 'react'

const SITE_RSS_URL = 'https://2aran.com/rss.xml'

export default function SiteRssSubscribeCard() {
  const [copied, setCopied] = useState(false)

  async function copyFeed() {
    try {
      await navigator.clipboard.writeText(SITE_RSS_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="border border-[#d8ddd9] bg-white p-5 dark:border-[#303b3a] dark:bg-[#111923] sm:p-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#16745b] dark:text-[#65c8a9]">SUBSCRIBE</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">订阅本站</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66706c] dark:text-[#a9b5b0]">
        把 feed 放进 Reeder、Feedly、Folo 或其他阅读器，即可收到 2aran.com 的文章、调研和资源更新。
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copyFeed} className="article-action-button px-3 py-1.5 text-xs">
          {copied ? '已复制 RSS 链接' : '复制本站 RSS'}
        </button>
        <a
          href="/rss.xml"
          target="_blank"
          rel="noopener"
          className="text-xs text-[#16745b] underline underline-offset-4 dark:text-[#65c8a9]"
        >
          打开 rss.xml →
        </a>
      </div>
      <p className="mt-3 break-all font-mono text-[11px] text-[#9aa39e] dark:text-[#6d7a75]">{SITE_RSS_URL}</p>
    </section>
  )
}
