'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const TAB_DEFS = [
  { key: 'all', label: '全部' },
  { key: 'posts', label: '精选文章' },
  { key: 'companies', label: '公司调研' },
  { key: 'topics', label: '事项调研' },
  { key: 'people', label: '人物调研' },
  { key: 'history', label: '历史调研' },
  { key: 'poetry', label: '诗歌调研' },
]

// 各分类标签的配色（浅色 + 暗色）
const KIND_TAG_CLASS = {
  posts: 'border-[#dadada] text-[#666] dark:border-gray-700 dark:text-gray-300',
  companies: 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  topics: 'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
  people: 'border-[#e9d5b8] bg-[#fbf3e3] text-[#8a5a14] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]',
  history: 'border-[#e4cdc0] bg-[#f7efe9] text-[#8a4f32] dark:border-[#3a2c22] dark:bg-[#241a13] dark:text-[#d7a98a]',
  poetry: 'border-[#ddd0e6] bg-[#f4eef8] text-[#6b4a86] dark:border-[#332a3f] dark:bg-[#1f1726] dark:text-[#c3a9d9]',
}

const TAB_KEYS = TAB_DEFS.map((t) => t.key)

const EXTERNAL_TABS = [
  { label: '掘金文章', href: 'https://juejin.cn/user/1521379823340792/posts' },
  { label: '掘金专栏', href: 'https://juejin.cn/user/1521379823340792/columns' },
]

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export default function ArticlesIndexClient({ items }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (() => {
    const fromUrl = searchParams?.get('tab')
    return TAB_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const fromUrl = searchParams?.get('tab')
    if (fromUrl && TAB_KEYS.includes(fromUrl) && fromUrl !== tab) {
      setTab(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function selectTab(next) {
    setTab(next)
    const url = next === 'all' ? '/articles' : `/articles?tab=${next}`
    router.replace(url, { scroll: false })
  }

  const counts = useMemo(() => {
    const base = Object.fromEntries(TAB_KEYS.map((k) => [k, 0]))
    base.all = items.length
    for (const item of items) {
      if (typeof base[item.kind] === 'number') base[item.kind] += 1
    }
    return base
  }, [items])

  const visible = useMemo(() => {
    if (tab === 'all') return items
    return items.filter((item) => item.kind === tab)
  }, [items, tab])

  return (
    <div className="space-y-6">
      <nav aria-label="知识库分类" className="flex flex-wrap items-center gap-2">
        {TAB_DEFS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'border-[#444] bg-[#444] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#111]'
                  : 'border-[#ddd] bg-white text-[#555] hover:border-[#999] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500',
              ].join(' ')}
            >
              <span>{t.label}</span>
              <span className={active ? 'text-white/80 dark:text-[#333]' : 'text-[#999] dark:text-gray-500'}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          )
        })}

        <span aria-hidden="true" className="mx-1 h-4 w-px bg-[#e0d8c8] dark:bg-gray-700" />

        {EXTERNAL_TABS.map((t) => (
          <a
            key={t.href}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#d6cdb8] bg-white px-3 py-1 text-sm text-[#6c604d] no-underline hover:border-[#9c8e72] hover:text-[#2d261d] dark:border-[#3a4452] dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-100"
          >
            <span>{t.label}</span>
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
              className="h-3 w-3 opacity-70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 2h6v6" />
              <path d="M10 2L4 8" />
              <path d="M9 8v2H2V3h2" />
            </svg>
          </a>
        ))}
      </nav>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-sm text-[#666] dark:text-gray-400">该分类下暂无内容。</p>
        ) : (
          visible.map((item) => <ArticleRow key={item.kind + ':' + item.href} item={item} />)
        )}
      </div>
    </div>
  )
}

function ArticleRow({ item }) {
  const external = isExternalHref(item.href)
  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group block border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all"
    >
      <div className="p-4">
        <div className="flex flex-wrap items-baseline gap-2 mb-2">
          <span className="text-[#999] text-sm">▪</span>
          {item.date ? <span className="text-xs text-[#999] dark:text-gray-400">{item.date}</span> : null}
          <span aria-hidden="true" className="text-[#ddd] text-xs">·</span>
          <span
            className={[
              'inline-flex items-center rounded-full border px-2 py-[1px] text-[11px]',
              KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
            ].join(' ')}
          >
            {item.tagLabel}
          </span>
          <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100 group-hover:text-[#111] dark:group-hover:text-white transition-colors">
            {item.title}
          </h2>
        </div>
        {item.summary ? (
          <p className="text-sm text-[#666] dark:text-gray-300 ml-5 leading-relaxed group-hover:text-[#333] dark:group-hover:text-gray-200 transition-colors">
            {item.summary}
          </p>
        ) : null}
        <div className="ml-5 mt-2 flex items-center gap-3 text-sm text-[#999] dark:text-gray-400">
          <span>{external ? '阅读原文 →' : '阅读全文 →'}</span>
          {item.readingMinutes ? (
            <span className="font-mono text-[11px] text-[#bbb] dark:text-gray-500">
              · {item.readingMinutes} min
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
