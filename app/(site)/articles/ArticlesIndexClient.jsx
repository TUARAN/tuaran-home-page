'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

import CanvasOriginBadge from '../components/CanvasOriginBadge'
import { getCompanyTypeFilters, getTopicTypeFilters } from '../../../lib/research/categories'

const TAB_DEFS = [
  { key: 'all', label: '全部' },
  { key: 'posts', label: '精选文章', tier: 'works' },
  { key: 'research', label: '调研', tier: 'research' },
  { key: 'works', label: '工程作品', tier: 'works' },
  { key: 'resources', label: '资料', tier: 'resources' },
]

// 各分类标签的配色（浅色 + 暗色）
const KIND_TAG_CLASS = {
  posts: 'border-[#dadada] text-[#666] dark:border-gray-700 dark:text-gray-300',
  works: 'border-[#c8cbb5] bg-[#e9ecdf] text-[#8b6a2c] dark:border-[#2b2e22] dark:bg-[#15170f] dark:text-[#a8b187]',
  companies: 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  topics: 'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
  people: 'border-[#ddd5d6] bg-[#f4f0f1] text-[#674f55] dark:border-[#392a30] dark:bg-[#1e171a] dark:text-[#bfa6ad]',
  resources: 'border-[#d1d3cb] bg-[#f1f2ee] text-[#5b5d53] dark:border-[#303845] dark:bg-[#171d25] dark:text-[#c6ceda]',
}

const RESEARCH_KIND_KEYS = ['companies', 'topics', 'people']
const RESEARCH_KINDS = new Set(RESEARCH_KIND_KEYS)
const TAB_KEYS = [...TAB_DEFS.map((t) => t.key), ...RESEARCH_KIND_KEYS]

const QUICK_LINKS = [
  { label: '站内创作日历', href: '/articles/creation-calendar' },
  { label: '掘金专栏', href: 'https://tuaran.github.io/auto-sync-blog/', external: true },
]

const RESEARCH_TYPE_DEFS = [
  { key: 'research', label: '全部调研' },
  { key: 'companies', label: '公司调研' },
  { key: 'topics', label: '事项调研' },
  { key: 'people', label: '人物调研' },
]

// 公司 / 事项分类的 filter defs 由 lib/research/loader.js 派生，避免双源维护。
// 新增 / 删除分类只改 loader 一处即可。
const COMPANY_TYPE_DEFS = getCompanyTypeFilters()
const COMPANY_TYPE_KEYS = COMPANY_TYPE_DEFS.map((t) => t.key)

const TOPIC_TYPE_DEFS = getTopicTypeFilters()
const TOPIC_TYPE_KEYS = TOPIC_TYPE_DEFS.map((t) => t.key)

const RESOURCE_TYPE_DEFS = [
  { key: 'all', label: '全部资料' },
  { key: 'classics', label: '古典名篇' },
  { key: 'humanities', label: '人文思想' },
  { key: 'politics', label: '政经资料' },
  { key: 'books', label: '书目索引' },
  { key: 'bookmarks', label: '资源收藏' },
]

const RESOURCE_TYPE_KEYS = RESOURCE_TYPE_DEFS.map((t) => t.key)

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n <= 0) return '-'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

export default function ArticlesIndexClient({ items }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pvCounts, setPvCounts] = useState({})
  const [pvLoaded, setPvLoaded] = useState(false)
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
  const initialResourceType = (() => {
    const fromUrl = searchParams?.get('resource_type')
    return RESOURCE_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialQuery = searchParams?.get('q') || ''
  const [tab, setTab] = useState(initialTab)
  const [companyType, setCompanyType] = useState(initialCompanyType)
  const [topicType, setTopicType] = useState(initialTopicType)
  const [resourceType, setResourceType] = useState(initialResourceType)
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
    const resourceTypeFromUrl = searchParams?.get('resource_type')
    const nextResourceType = RESOURCE_TYPE_KEYS.includes(resourceTypeFromUrl) ? resourceTypeFromUrl : 'all'
    if (nextResourceType !== resourceType) {
      setResourceType(nextResourceType)
    }
    const queryFromUrl = searchParams?.get('q') || ''
    if (queryFromUrl !== query) {
      setQuery(queryFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function buildArticlesUrl(nextTab, nextCompanyType, nextTopicType, nextResourceType, nextQuery) {
    const params = new URLSearchParams()
    if (nextTab !== 'all') params.set('tab', nextTab)
    if (nextTab === 'companies' && nextCompanyType !== 'all') params.set('company_type', nextCompanyType)
    if (nextTab === 'topics' && nextTopicType !== 'all') params.set('topic_type', nextTopicType)
    if (nextTab === 'resources' && nextResourceType !== 'all') params.set('resource_type', nextResourceType)
    const normalizedQuery = String(nextQuery || '').trim()
    if (normalizedQuery) params.set('q', normalizedQuery)
    const queryString = params.toString()
    return queryString ? `/articles?${queryString}` : '/articles'
  }

  function selectTab(next) {
    setTab(next)
    const nextCompanyType = next === 'companies' ? companyType : 'all'
    const nextTopicType = next === 'topics' ? topicType : 'all'
    const nextResourceType = next === 'resources' ? resourceType : 'all'
    if (next !== 'companies') {
      setCompanyType('all')
    }
    if (next !== 'topics') {
      setTopicType('all')
    }
    if (next !== 'resources') {
      setResourceType('all')
    }
    const url = buildArticlesUrl(next, nextCompanyType, nextTopicType, nextResourceType, query)
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

  function selectResourceType(next) {
    setTab('resources')
    setResourceType(next)
    const url = buildArticlesUrl('resources', 'all', 'all', next, query)
    router.replace(url, { scroll: false })
  }

  function submitSearch(event) {
    event.preventDefault()
    const url = buildArticlesUrl(tab, companyType, topicType, resourceType, query)
    router.replace(url, { scroll: false })
  }

  function clearSearch() {
    setQuery('')
    const url = buildArticlesUrl(tab, companyType, topicType, resourceType, '')
    router.replace(url, { scroll: false })
  }

  const counts = useMemo(() => {
    const base = Object.fromEntries(TAB_KEYS.map((k) => [k, 0]))
    base.all = items.length
    for (const item of items) {
      if (typeof base[item.kind] === 'number') base[item.kind] += 1
      if (RESEARCH_KINDS.has(item.kind)) base.research += 1
    }
    return base
  }, [items])

  const visible = useMemo(() => {
    const tabItems =
      tab === 'all'
        ? items
        : tab === 'research'
        ? items.filter((item) => RESEARCH_KINDS.has(item.kind))
        : items.filter((item) => item.kind === tab)
    let typeFiltered = tabItems
    if (tab === 'companies' && companyType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.companyType === companyType)
    }
    if (tab === 'topics' && topicType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.topicType === topicType)
    }
    if (tab === 'resources' && resourceType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.resourceType === resourceType)
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
  }, [items, tab, companyType, topicType, resourceType, query])


  useEffect(() => {
    const keys = Array.from(
      new Set(
        items
          .filter((item) => item.kind === 'companies' || item.kind === 'topics' || item.kind === 'people')
          .map((item) => {
            const parts = String(item.href || '').split('/')
            const category = parts[3]
            const slug = parts[4]
            return category && slug ? `${category}/${slug}` : ''
          })
          .filter(Boolean),
      ),
    )
    if (!keys.length) {
      setPvLoaded(true)
      return
    }

    let cancelled = false
    async function loadPv() {
      try {
        const res = await fetch(`/api/research-pv?keys=${encodeURIComponent(keys.join(','))}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.counts) setPvCounts(data.counts)
      } catch {
        // 统计接口不可用时保留静态 frontmatter 里的 pv。
      } finally {
        if (!cancelled) setPvLoaded(true)
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

  const resourceTypeCounts = useMemo(() => {
    const base = Object.fromEntries(RESOURCE_TYPE_KEYS.map((k) => [k, 0]))
    const resourceItems = items.filter((item) => item.kind === 'resources')
    base.all = resourceItems.length
    for (const item of resourceItems) {
      if (item.resourceType && typeof base[item.resourceType] === 'number') {
        base[item.resourceType] += 1
      }
    }
    return base
  }, [items])

  const readingHighlights = useMemo(() => {
    const publicItems = items.filter((item) => !item.encrypted)
    const latestItems = publicItems.slice(0, 3)
    const latestIds = new Set(latestItems.map((item) => item.id || item.href))
    return [
      {
        title: '最新内容',
        desc: '刚发布的文章、调研与工程记录。',
        items: latestItems,
      },
      {
        title: '推荐调研',
        desc: '技术、市场、公司画像的高密度输出。',
        items: publicItems
          .filter((item) => !latestIds.has(item.id || item.href) && RESEARCH_KINDS.has(item.kind))
          .slice(0, 3),
      },
      {
        title: '代表作品',
        desc: '个人判断、工程作品和长期项目。',
        items: publicItems
          .filter((item) => !latestIds.has(item.id || item.href) && (item.kind === 'posts' || item.kind === 'works'))
          .slice(0, 3),
      },
    ].filter((section) => section.items.length > 0)
  }, [items])

  const showReadingHighlights = tab === 'all' && !query.trim()

  return (
    <div className="space-y-5">
      {showReadingHighlights ? <ReadingHighlights sections={readingHighlights} /> : null}

      <nav
        aria-label="作品、调研与资料分类"
        className="flex flex-nowrap items-center gap-5 overflow-x-auto border-b border-[#dee0db] text-sm dark:border-gray-800"
      >
        {TAB_DEFS.map((t, idx) => {
          const active = tab === t.key || (t.key === 'research' && RESEARCH_KINDS.has(tab))
          const prevTier = idx > 0 ? TAB_DEFS[idx - 1].tier : null
          const showResearchDivider = t.tier === 'research' && prevTier !== 'research'
          const showResourceDivider = t.tier === 'resources' && prevTier !== 'resources'
          const isResearchTier = t.tier === 'research'
          const isResourceTier = t.tier === 'resources'
          return (
            <span key={t.key} className="flex shrink-0 items-center gap-5">
              {showResearchDivider ? (
                <span className="flex shrink-0 items-center" aria-hidden="true">
                  <span aria-hidden="true" className="h-4 w-px bg-[#c6c7bc] dark:bg-gray-700" />
                </span>
              ) : null}
              {showResourceDivider ? (
                <span className="flex shrink-0 items-center" aria-hidden="true">
                  <span aria-hidden="true" className="h-4 w-px bg-[#c6c7bc] dark:bg-gray-700" />
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => selectTab(t.key)}
                className={[
                  'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2 pt-1 transition-colors',
                  active
                    ? 'border-[#333] text-[#222] dark:border-gray-100 dark:text-gray-100'
                    : isResearchTier
                    ? 'border-transparent text-[#838676] hover:text-[#4e5046] dark:text-[#7f8a9c] dark:hover:text-gray-200'
                    : isResourceTier
                    ? 'border-transparent text-[#7d7e76] hover:text-[#42423c] dark:text-[#7f8a9c] dark:hover:text-gray-200'
                    : 'border-transparent text-[#616358] hover:text-[#222] dark:text-gray-400 dark:hover:text-gray-100',
                ].join(' ')}
              >
                <span className={active ? 'font-semibold' : ''}>{t.label}</span>
                <span className={active ? 'text-[#777] dark:text-gray-400' : 'text-[#999] dark:text-gray-500'}>
                  {counts[t.key] ?? 0}
                </span>
              </button>
            </span>
          )
        })}

        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[#c6c7bc] dark:bg-gray-700" />

        {QUICK_LINKS.map((t) =>
          t.external ? (
            <a
              key={t.href}
              href={t.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 pt-1 text-[#646658] no-underline hover:text-[#1a1814] dark:text-gray-400 dark:hover:text-gray-100"
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
              className="inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 pt-1 text-[#646658] no-underline hover:text-[#1a1814] dark:text-gray-400 dark:hover:text-gray-100"
            >
              <span>{t.label}</span>
            </Link>
          ),
        )}
      </nav>

      {tab === 'research' || RESEARCH_KINDS.has(tab) ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#808272] dark:text-[#7f8aa0]">调研类型</span>
          <nav aria-label="调研类型" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {RESEARCH_TYPE_DEFS.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectTab(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#eef6f1] font-medium text-[#386b54] dark:bg-[#13201a] dark:text-[#9dcab1]'
                      : 'text-[#636559] hover:text-[#1a1814] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6f927f] dark:text-[#78a98e]' : 'text-[#95968a] dark:text-[#667287]'}>
                    {counts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索知识库：标题 / 摘要 / 标签"
          className="min-w-[220px] flex-1 rounded-md border border-[#cbcdc2] bg-white px-3 py-2 text-sm text-[#1a1814] outline-none transition-colors focus:border-[#8a8c79] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
        />
        <button
          type="submit"
          className="rounded-md border border-[#c8c9bf] bg-[#f3f4ef] px-3 py-2 text-sm text-[#4a4b41] transition-colors hover:border-[#a2a593] hover:text-[#1a1814] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
        >
          搜索
        </button>
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-md border border-transparent px-2 py-2 text-sm text-[#787a6c] transition-colors hover:text-[#303029] dark:text-gray-400 dark:hover:text-gray-200"
          >
            清空
          </button>
        ) : null}
      </form>

      {tab === 'companies' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#808272] dark:text-[#7f8aa0]">公司分类</span>
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
                      : 'text-[#636559] hover:text-[#1a1814] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6d8db0] dark:text-[#7899bf]' : 'text-[#95968a] dark:text-[#667287]'}>
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
          <span className="shrink-0 text-xs text-[#808272] dark:text-[#7f8aa0]">事项分类</span>
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
                      : 'text-[#636559] hover:text-[#1a1814] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6f927f] dark:text-[#78a98e]' : 'text-[#95968a] dark:text-[#667287]'}>
                    {topicTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      {tab === 'resources' ? (
        <div className="-mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="shrink-0 text-xs text-[#808272] dark:text-[#7f8aa0]">资料分类</span>
          <nav aria-label="资料分类" className="flex min-w-0 flex-wrap items-center gap-2">
            {RESOURCE_TYPE_DEFS.map((t) => {
              const active = resourceType === t.key
              const scopeLabel = t.key === 'bookmarks' ? '资源收藏' : t.key === 'all' ? '' : '站内'
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectResourceType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#eaece7] font-medium text-[#53544b] dark:bg-[#202834] dark:text-[#c6ceda]'
                      : 'text-[#636559] hover:text-[#1a1814] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  {scopeLabel ? (
                    <span className="font-mono text-[9px] tracking-[0.1em] text-[#9b9d8f] dark:text-[#667287]">{scopeLabel}</span>
                  ) : null}
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#797b70] dark:text-[#9da7b8]' : 'text-[#95968a] dark:text-[#667287]'}>
                    {resourceTypeCounts[t.key] ?? 0}
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
            const pvLoading = pvKey !== '' && !pvLoaded
            const nextItem = 'pv' in item ? { ...item, pv: livePv, pvLoading } : item
            return <ArticleRow key={item.id || `${item.kind}:${item.href}:${item.title}`} item={nextItem} />
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
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0 text-sm text-[#999]">▪</span>
            {item.dateLabel || item.date ? (
              <span className="shrink-0 whitespace-nowrap text-xs text-[#999] dark:text-gray-400">{item.dateLabel || item.date}</span>
            ) : null}
            <span aria-hidden="true" className="shrink-0 text-xs text-[#ddd]">
              ·
            </span>
            <span
              className={[
                'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-2 py-[1px] text-[11px]',
                KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
              ].join(' ')}
            >
              {item.tagLabel}
            </span>
            {item.encrypted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#c9cbb8] bg-[#ebede3] px-2 py-[1px] text-[11px] text-[#8a5a14] dark:border-[#26281c] dark:bg-[#1c1d15] dark:text-[#9ba475]">
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
            <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" />
            {item.version ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#d1d3cb] bg-white/70 px-2 py-[1px] text-[11px] text-[#53554d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                {item.version}
              </span>
            ) : null}
          </div>
          <h2
            title={item.title}
            className="ml-5 line-clamp-2 text-lg font-semibold leading-7 text-[#333] transition-colors group-hover:text-[#111] dark:text-gray-100 dark:group-hover:text-white"
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
                · 阅读量 {item.pvLoading ? '-' : formatPv(item.pv)}
              </span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="relative h-32 overflow-hidden rounded-md border border-[#dee0db] bg-[#efefea] dark:border-gray-800 dark:bg-gray-950 sm:h-28 sm:w-40">
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

function ReadingHighlights({ sections }) {
  return (
    <section className="rounded-2xl border border-[#dee0db] bg-[#f9faf7] p-4 shadow-[0_12px_36px_rgba(82,69,45,0.05)] dark:border-gray-800 dark:bg-[#0f141b]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
            Start Here
          </p>
          <h2 className="mt-1 border-b-0 pb-0 text-[18px] font-semibold text-[#15140f] dark:text-gray-100">
            阅读起点
          </h2>
        </div>
        <Link
          href="/services"
          className="rounded-full border border-[#c8c9bf] bg-white px-3 py-1 text-[12px] text-[#4a4b41] no-underline transition hover:border-[#a2a593] hover:text-[#1a1814] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500"
        >
          合作 / 咨询 →
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-[#e1e2da] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2">
              <h3 className="text-[14px] font-semibold text-[#1a1814] dark:text-gray-100">{section.title}</h3>
              <p className="mt-0.5 text-[11px] leading-5 text-[#77796c] dark:text-gray-400">{section.desc}</p>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <HighlightLink key={item.id || item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HighlightLink({ item }) {
  const external = isExternalHref(item.href)
  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group block rounded-lg px-2 py-1.5 no-underline transition hover:bg-[#f0f1ec] dark:hover:bg-[#151d27]"
    >
      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={[
            'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-1.5 py-px text-[10px]',
            KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
          ].join(' ')}
        >
          {item.tagLabel}
        </span>
        <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" />
        {item.dateLabel || item.date ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-[#9b9b93] dark:text-gray-500">
            {item.dateLabel || item.date}
          </span>
        ) : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[13px] font-medium leading-5 text-[#1a1814] group-hover:text-[#111] dark:text-gray-100 dark:group-hover:text-white">
        {item.title}
      </p>
    </Link>
  )
}
