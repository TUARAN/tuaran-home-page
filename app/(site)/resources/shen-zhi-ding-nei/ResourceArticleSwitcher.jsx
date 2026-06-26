'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import ResourceLongformReader from './ResourceLongformReader'

/** 「置身 X 内」多文切换阅读：标签页 + 各自目录与原文，支持 hash 锚点直达。 */
export default function ResourceArticleSwitcher({ articles }) {
  const [activeKey, setActiveKey] = useState(articles[0]?.key)

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (articles.some((item) => item.key === hash)) {
      setActiveKey(hash)
    }
  }, [articles])

  const active = articles.find((item) => item.key === activeKey) || articles[0]
  if (!active) return null

  const switchTo = (key) => {
    setActiveKey(key)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${key}`)
      window.scrollTo({ top: 0 })
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="切换原文"
        className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl border border-[#e2e2da] bg-[#f4f4ee] p-1 dark:border-[#2a2d24] dark:bg-[#141612]"
      >
        {articles.map((item) => {
          const isActive = item.key === active.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => switchTo(item.key)}
              className={[
                'rounded-full px-4 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-white font-semibold text-[#222] shadow-sm dark:bg-[#23261d] dark:text-gray-100'
                  : 'text-[#777] hover:text-[#333] dark:text-gray-400 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {item.tabLabel}
            </button>
          )
        })}
      </div>

      <section className="mb-8 rounded-xl border border-[#e8e8e2] bg-[#f8f8f4] p-5 dark:border-[#2a2d24] dark:bg-[#141612]">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-[#222] dark:text-gray-100">{active.title}</h2>
          <span className="text-xs text-[#888] dark:text-gray-500">
            作者 {active.author} · 首发 {active.date} · {active.wordCount}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">{active.intro}</p>
        {active.points?.length ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#444] dark:text-gray-300">
            {active.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        ) : null}
        <p className="mt-4 text-xs text-[#999] dark:text-gray-500">
          文本来源：
          {active.sourceUrl ? (
            <a
              href={active.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline underline-offset-4"
            >
              {active.sourceLabel}
            </a>
          ) : (
            <span className="ml-1">{active.sourceLabel}</span>
          )}
          ，本站整理存档便于检索与阅读。
          {active.researchHref ? (
            <>
              {' '}
              配套观察见
              <Link href={active.researchHref} className="mx-1 underline underline-offset-4">
                职场调研
              </Link>
              。
            </>
          ) : null}
        </p>
      </section>

      {active.html ? (
        <>
          <h2 className="mb-4 text-lg font-semibold text-[#222] dark:text-gray-100">{active.title} · 全文原文</h2>
          <ResourceLongformReader key={active.key} toc={active.toc} html={active.html} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-[#ccc] bg-[#fafaf8] p-6 text-sm leading-relaxed text-[#666] dark:border-[#3a3a32] dark:bg-[#121410] dark:text-gray-300">
          <p>{active.archiveNote || '该篇暂无可核验的公开全文，本站不做全文存档。'}</p>
          {active.researchHref ? (
            <p className="mt-3">
              配套观察见
              <Link href={active.researchHref} className="mx-1 underline underline-offset-4">
                {active.tabLabel}职场调研
              </Link>
              。
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
