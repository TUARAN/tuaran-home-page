'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

const TAB_DEFS = [
  { key: 'all', label: '全部' },
  { key: 'posts', label: '精选文章' },
  { key: 'companies', label: '公司调研' },
  { key: 'topics', label: '事项调研' },
  { key: 'special', label: '专题' },
]

// 各分类标签的配色（浅色 + 暗色）
const KIND_TAG_CLASS = {
  posts: 'border-[#dadada] text-[#666] dark:border-gray-700 dark:text-gray-300',
  companies: 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  topics: 'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
  special: 'border-[#d9d3f0] bg-[#f2eefc] text-[#5b4b8a] dark:border-[#312745] dark:bg-[#191424] dark:text-[#b8a6e8]',
}

const TAB_KEYS = TAB_DEFS.map((t) => t.key)

const QUICK_LINKS = [
  { label: '创作日历', href: '/articles/creation-calendar' },
  { label: '掘金专栏', href: 'https://tuaran.github.io/auto-sync-blog/', external: true },
]

const COMPANY_TYPE_DEFS = [
  { key: 'all', label: '全部公司' },
  { key: 'developer_ecosystem', label: '开发者生态' },
  { key: 'content_community', label: '内容社区' },
  { key: 'enterprise_software', label: '企业软件' },
  { key: 'cloud_communications', label: '云通信' },
  { key: 'new_energy', label: '新能源' },
  { key: 'devtools', label: '开发工具' },
]

const COMPANY_TYPE_KEYS = COMPANY_TYPE_DEFS.map((t) => t.key)

const TOPIC_TYPE_DEFS = [
  { key: 'all', label: '全部事项' },
  { key: 'industry', label: '行业' },
  { key: 'tech', label: '技术' },
  { key: 'product', label: '产品' },
  { key: 'market', label: '市场' },
  { key: 'thesis', label: '观点' },
]

const TOPIC_TYPE_KEYS = TOPIC_TYPE_DEFS.map((t) => t.key)

const SPECIAL_TYPE_DEFS = [
  { key: 'all', label: '全部专题' },
  { key: 'dashboard', label: '数据看板' },
  { key: 'culture', label: '文化专题' },
  { key: 'politics', label: '政治专题' },
  { key: 'people', label: '人物调研' },
  { key: 'history', label: '历史调研' },
  { key: 'poetry', label: '诗歌调研' },
]

const SPECIAL_TYPE_KEYS = SPECIAL_TYPE_DEFS.map((t) => t.key)

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

export default function ArticlesIndexClient({ items }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pvCounts, setPvCounts] = useState({})
  const initialTab = (() => {
    const fromUrl = searchParams?.get('tab')
    return TAB_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialCompanyType = (() => {
    const fromUrl = searchParams?.get('company_type')
    return COMPANY_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialTopicType = (() => {
    const fromUrl = searchParams?.get('topic_type')
    return TOPIC_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialSpecialType = (() => {
    const fromUrl = searchParams?.get('special_type')
    return SPECIAL_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialQuery = searchParams?.get('q') || ''
  const [tab, setTab] = useState(initialTab)
  const [companyType, setCompanyType] = useState(initialCompanyType)
  const [topicType, setTopicType] = useState(initialTopicType)
  const [specialType, setSpecialType] = useState(initialSpecialType)
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    const fromUrl = searchParams?.get('tab')
    if (fromUrl && TAB_KEYS.includes(fromUrl) && fromUrl !== tab) {
      setTab(fromUrl)
    }
    const companyTypeFromUrl = searchParams?.get('company_type')
    const nextCompanyType = COMPANY_TYPE_KEYS.includes(companyTypeFromUrl) ? companyTypeFromUrl : 'all'
    if (nextCompanyType !== companyType) {
      setCompanyType(nextCompanyType)
    }
    const topicTypeFromUrl = searchParams?.get('topic_type')
    const nextTopicType = TOPIC_TYPE_KEYS.includes(topicTypeFromUrl) ? topicTypeFromUrl : 'all'
    if (nextTopicType !== topicType) {
      setTopicType(nextTopicType)
    }
    const specialTypeFromUrl = searchParams?.get('special_type')
    const nextSpecialType = SPECIAL_TYPE_KEYS.includes(specialTypeFromUrl) ? specialTypeFromUrl : 'all'
    if (nextSpecialType !== specialType) {
      setSpecialType(nextSpecialType)
    }
    const queryFromUrl = searchParams?.get('q') || ''
    if (queryFromUrl !== query) {
      setQuery(queryFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function buildArticlesUrl(nextTab, nextCompanyType, nextTopicType, nextSpecialType, nextQuery) {
    const params = new URLSearchParams()
    if (nextTab !== 'all') params.set('tab', nextTab)
    if (nextTab === 'companies' && nextCompanyType !== 'all') params.set('company_type', nextCompanyType)
    if (nextTab === 'topics' && nextTopicType !== 'all') params.set('topic_type', nextTopicType)
    if (nextTab === 'special' && nextSpecialType !== 'all') params.set('special_type', nextSpecialType)
    const normalizedQuery = String(nextQuery || '').trim()
    if (normalizedQuery) params.set('q', normalizedQuery)
    const queryString = params.toString()
    return queryString ? `/articles?${queryString}` : '/articles'
  }

  function selectTab(next) {
    setTab(next)
    const nextCompanyType = next === 'companies' ? companyType : 'all'
    const nextTopicType = next === 'topics' ? topicType : 'all'
    const nextSpecialType = next === 'special' ? specialType : 'all'
    if (next !== 'companies') {
      setCompanyType('all')
    }
    if (next !== 'topics') {
      setTopicType('all')
    }
    if (next !== 'special') {
      setSpecialType('all')
    }
    const url = buildArticlesUrl(next, nextCompanyType, nextTopicType, nextSpecialType, query)
    router.replace(url, { scroll: false })
  }

  function selectCompanyType(next) {
    setTab('companies')
    setCompanyType(next)
    const url = buildArticlesUrl('companies', next, 'all', 'all', query)
    router.replace(url, { scroll: false })
  }

  function selectTopicType(next) {
    setTab('topics')
    setTopicType(next)
    const url = buildArticlesUrl('topics', 'all', next, 'all', query)
    router.replace(url, { scroll: false })
  }

  function selectSpecialType(next) {
    setTab('special')
    setSpecialType(next)
    const url = buildArticlesUrl('special', 'all', 'all', next, query)
    router.replace(url, { scroll: false })
  }

  function submitSearch(event) {
    event.preventDefault()
    const url = buildArticlesUrl(tab, companyType, topicType, specialType, query)
    router.replace(url, { scroll: false })
  }

  function clearSearch() {
    setQuery('')
    const url = buildArticlesUrl(tab, companyType, topicType, specialType, '')
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
    const tabItems = tab === 'all' ? items : items.filter((item) => item.kind === tab)
    let typeFiltered = tabItems
    if (tab === 'companies' && companyType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.companyType === companyType)
    }
    if (tab === 'topics' && topicType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.topicType === topicType)
    }
    if (tab === 'special' && specialType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.specialType === specialType)
    }
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return typeFiltered

    return typeFiltered.filter((item) => {
      const combined = [item.title, item.summary, item.tagLabel, item.date, item.kind]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return combined.includes(normalizedQuery)
    })
  }, [items, tab, companyType, topicType, specialType, query])

  useEffect(() => {
    const keys = Array.from(
      new Set(
        items
          .filter((item) => item.kind === 'companies' || item.kind === 'topics')
          .map((item) => {
            const parts = String(item.href || '').split('/')
            const category = parts[3]
            const slug = parts[4]
            return category && slug ? `${category}/${slug}` : ''
          })
          .filter(Boolean),
      ),
    )
    if (!keys.length) return

    let cancelled = false
    async function loadPv() {
      try {
        const res = await fetch(`/api/research-pv?keys=${encodeURIComponent(keys.join(','))}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.counts) setPvCounts(data.counts)
      } catch {
        // 统计接口不可用时保留静态 frontmatter 里的 pv。
      }
    }

    loadPv()
    return () => {
      cancelled = true
    }
  }, [items])

  const companyTypeCounts = useMemo(() => {
    const base = Object.fromEntries(COMPANY_TYPE_KEYS.map((k) => [k, 0]))
    const companyItems = items.filter((item) => item.kind === 'companies')
    base.all = companyItems.length
    for (const item of companyItems) {
      if (item.companyType && typeof base[item.companyType] === 'number') {
        base[item.companyType] += 1
      }
    }
    return base
  }, [items])

  const topicTypeCounts = useMemo(() => {
    const base = Object.fromEntries(TOPIC_TYPE_KEYS.map((k) => [k, 0]))
    const topicItems = items.filter((item) => item.kind === 'topics')
    base.all = topicItems.length
    for (const item of topicItems) {
      if (item.topicType && typeof base[item.topicType] === 'number') {
        base[item.topicType] += 1
      }
    }
    return base
  }, [items])

  const specialTypeCounts = useMemo(() => {
    const base = Object.fromEntries(SPECIAL_TYPE_KEYS.map((k) => [k, 0]))
    const specialItems = items.filter((item) => item.kind === 'special')
    base.all = specialItems.length
    for (const item of specialItems) {
      if (item.specialType && typeof base[item.specialType] === 'number') {
        base[item.specialType] += 1
      }
    }
    return base
  }, [items])

  return (
    <div className="space-y-4">
      <nav
        aria-label="知识库分类"
        className="flex flex-nowrap items-center gap-5 overflow-x-auto border-b border-[#e8dfd0] text-sm dark:border-gray-800"
      >
        {TAB_DEFS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={[
                'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2 pt-1 transition-colors',
                active
                  ? 'border-[#333] text-[#222] dark:border-gray-100 dark:text-gray-100'
                  : 'border-transparent text-[#716958] hover:text-[#222] dark:text-gray-400 dark:hover:text-gray-100',
              ].join(' ')}
            >
              <span className={active ? 'font-semibold' : ''}>{t.label}</span>
              <span className={active ? 'text-[#777] dark:text-gray-400' : 'text-[#999] dark:text-gray-500'}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          )
        })}

        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[#d8cdbc] dark:bg-gray-700" />

        {QUICK_LINKS.map((t) =>
          t.external ? (
            <a
              key={t.href}
              href={t.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 pt-1 text-[#7a6d58] no-underline hover:text-[#2d261d] dark:text-gray-400 dark:hover:text-gray-100"
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
          ) : (
            <Link
              key={t.href}
              href={t.href}
              className="inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 pt-1 text-[#7a6d58] no-underline hover:text-[#2d261d] dark:text-gray-400 dark:hover:text-gray-100"
            >
              <span>{t.label}</span>
            </Link>
          ),
        )}
      </nav>

      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索知识库：标题 / 摘要 / 标签"
          className="min-w-[220px] flex-1 rounded-md border border-[#ddd3c2] bg-white px-3 py-2 text-sm text-[#2d261d] outline-none transition-colors focus:border-[#a99779] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
        />
        <button
          type="submit"
          className="rounded-md border border-[#d8cfbf] bg-[#faf6ef] px-3 py-2 text-sm text-[#5b5141] transition-colors hover:border-[#bdae93] hover:text-[#2d261d] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
        >
          搜索
        </button>
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-md border border-transparent px-2 py-2 text-sm text-[#8f826c] transition-colors hover:text-[#3d3429] dark:text-gray-400 dark:hover:text-gray-200"
          >
            清空
          </button>
        ) : null}
      </form>

      {tab === 'companies' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#9a8b72] dark:text-[#7f8aa0]">公司分类</span>
          <nav aria-label="公司调研分类" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {COMPANY_TYPE_DEFS.map((t) => {
              const active = companyType === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectCompanyType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#eef4fb] font-medium text-[#285a8d] dark:bg-[#152034] dark:text-[#9bb6df]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6d8db0] dark:text-[#7899bf]' : 'text-[#a99d8a] dark:text-[#667287]'}>
                    {companyTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      {tab === 'topics' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#9a8b72] dark:text-[#7f8aa0]">事项分类</span>
          <nav aria-label="事项调研分类" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {TOPIC_TYPE_DEFS.map((t) => {
              const active = topicType === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectTopicType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#eef6f1] font-medium text-[#386b54] dark:bg-[#13201a] dark:text-[#9dcab1]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6f927f] dark:text-[#78a98e]' : 'text-[#a99d8a] dark:text-[#667287]'}>
                    {topicTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      {tab === 'special' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#9a8b72] dark:text-[#7f8aa0]">专题分类</span>
          <nav aria-label="专题分类" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {SPECIAL_TYPE_DEFS.map((t) => {
              const active = specialType === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectSpecialType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#f2eefc] font-medium text-[#5b4b8a] dark:bg-[#191424] dark:text-[#b8a6e8]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#8d7eb8] dark:text-[#9e90c8]' : 'text-[#a99d8a] dark:text-[#667287]'}>
                    {specialTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      <div className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-sm text-[#666] dark:text-gray-400">
            {query ? '没有匹配的内容，试试更短关键词或切换分类。' : '该分类下暂无内容。'}
          </p>
        ) : (
          visible.map((item) => {
            const parts = String(item.href || '').split('/')
            const pvKey = parts[3] && parts[4] ? `${parts[3]}/${parts[4]}` : ''
            const livePv = pvKey && typeof pvCounts[pvKey] === 'number' ? pvCounts[pvKey] : item.pv
            const nextItem = 'pv' in item ? { ...item, pv: livePv } : item
            return <ArticleRow key={item.kind + ':' + item.href} item={nextItem} />
          })
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
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_160px]">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="shrink-0 text-sm text-[#999]">▪</span>
            {item.date ? <span className="shrink-0 text-xs text-[#999] dark:text-gray-400">{item.date}</span> : null}
            <span aria-hidden="true" className="shrink-0 text-xs text-[#ddd]">·</span>
            <span
              className={[
                'inline-flex shrink-0 items-center rounded-full border px-2 py-[1px] text-[11px]',
                KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
              ].join(' ')}
            >
              {item.tagLabel}
            </span>
            {item.encrypted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e9d5b8] bg-[#fbf3e3] px-2 py-[1px] text-[11px] text-[#8a5a14] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]">
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className="h-2.5 w-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" />
                </svg>
                加密
              </span>
            ) : null}
            {item.version ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#ddd8cb] bg-white/70 px-2 py-[1px] text-[11px] text-[#5f5a4d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                {item.version}
              </span>
            ) : null}
          </div>
          <h2
            title={item.title}
            className="ml-5 truncate text-lg font-semibold text-[#333] transition-colors group-hover:text-[#111] dark:text-gray-100 dark:group-hover:text-white"
          >
            {item.title}
          </h2>
          {item.summary ? (
            <p className="ml-5 mt-2 line-clamp-2 text-sm leading-relaxed text-[#666] transition-colors group-hover:text-[#333] dark:text-gray-300 dark:group-hover:text-gray-200">
              {item.summary}
            </p>
          ) : null}
          <div className="ml-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#999] dark:text-gray-400">
            <span>{external ? '阅读原文 →' : '阅读全文 →'}</span>
            {item.readingMinutes ? (
              <span className="font-mono text-[11px] text-[#bbb] dark:text-gray-500">
                · {item.readingMinutes} min
              </span>
            ) : null}
            {'pv' in item ? (
              <span className="font-mono text-[11px] text-[#bbb] dark:text-gray-500">
                · 阅读量 {formatPv(item.pv)}
              </span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="relative h-32 overflow-hidden rounded-md border border-[#e8dfd0] bg-[#f7f2ea] dark:border-gray-800 dark:bg-gray-950 sm:h-28 sm:w-40">
            <Image
              src={item.image.src}
              alt={item.image.alt || `${item.title} 配图`}
              fill
              sizes="(min-width: 640px) 160px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        ) : null}
      </div>
    </Link>
  )
}
