'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import ArticleListItem from './ArticleListItem'
import {
  CONTENT_GROUP_KEYS,
  CONTENT_GROUP_META,
  COMPANY_INDUSTRY_META,
  COMPANY_ROLE_META,
  DELIVERY_META,
  ENTITY_TYPE_META,
  SERIES_META,
  SUBJECT_KEYS,
  SUBJECT_META,
  getContentGroup,
  taxonomyForManualEntry,
} from '../../../lib/contentTaxonomy'
import { compareSortKeyDesc, researchSortKey } from '../../../lib/research/datetime'
import { trackSiteEvent } from '../../../lib/siteAnalytics'

const PAGE_SIZE = 24

const SEARCH_SUGGESTIONS = ['AI Agent', '资源', '公司调研', '工程实践']

const SUBJECT_DISPLAY_GROUPS = [
  { label: '技术与开发', keys: ['ai_dev', 'web_cloud'] },
  { label: '产品与商业', keys: ['product_experience', 'business_market', 'company_research'] },
  { label: '创作与工作', keys: ['content_creation', 'workplace_org'] },
  { label: '人文与生活', keys: ['humanities_history', 'life_family'] },
]

const LEGACY_TAB_TO_GROUP = {
  column: 'article',
  posts: 'article',
  research: 'analysis',
  companies: 'analysis',
  people: 'analysis',
  topics: 'analysis',
  tech: 'analysis',
  business: 'analysis',
  other: 'analysis',
  'engineering-cases': 'practice',
  'build-logs': 'practice',
  works: 'interactive',
  resources: 'resource',
}

const LEGACY_RESOURCE_TO_FACETS = {
  'ai-dev': { subject: 'ai_dev' },
  'ai-music': { subject: 'content_creation' },
  'humanities-politics': { subject: 'humanities_history' },
  workplace: { subject: 'workplace_org' },
}

function normalizeEnum(value, keys, fallback = 'all') {
  return keys.includes(value) ? value : fallback
}

function filtersFromParams(params) {
  const legacyTab = params?.get('tab') || ''
  const legacyResource = LEGACY_RESOURCE_TO_FACETS[params?.get('resource_type')] || {}
  const groupFromLegacy = LEGACY_TAB_TO_GROUP[legacyTab] || ''
  const kind = params?.get('kind')
  const entity = params?.get('entity') || params?.get('company_type') || params?.get('people_type')
  const delivery = params?.get('delivery')
  const inferredGroup =
    kind
      ? getContentGroup(kind)
      : entity || params?.get('company_industry') || params?.get('company_role')
        ? 'analysis'
        : ['subscribe', 'download', 'watch_listen', 'external'].includes(delivery)
          ? 'resource'
          : delivery === 'interact'
            ? 'interactive'
            : params?.get('resource_type')
              ? 'resource'
              : ''
  const group = normalizeEnum(
    params?.get('group') || groupFromLegacy || inferredGroup,
    CONTENT_GROUP_KEYS,
  )
  const subjectParam = params?.get('subject')
  const subjectFromLegacy = subjectParam === 'product_business' ? 'business_market' : subjectParam

  return {
    group,
    subject: normalizeEnum(subjectFromLegacy || legacyResource.subject, ['all', ...SUBJECT_KEYS]),
    query: params?.get('q') || '',
  }
}

function buildDirectoryUrl(filters) {
  const params = new URLSearchParams()
  if (filters.group !== 'all') params.set('group', filters.group)
  if (filters.subject !== 'all') params.set('subject', filters.subject)
  const query = String(filters.query || '').trim()
  if (query) params.set('q', query)
  const suffix = params.toString()
  return suffix ? `/articles?${suffix}` : '/articles'
}

function manualEntriesToItems(entries, existingItems) {
  if (!Array.isArray(entries) || !entries.length) return []
  const seenHrefs = new Set(existingItems.map((item) => item.href))
  const items = []

  for (const entry of entries) {
    if (!entry?.href || !entry?.title || seenHrefs.has(entry.href)) continue
    if (!['article', 'research', 'resource'].includes(entry.type)) continue
    const kind =
      entry.type === 'article'
        ? 'posts'
        : entry.type === 'resource'
          ? 'resources'
          : ['companies', 'people', 'topics'].includes(entry.category)
            ? entry.category
            : 'topics'
    const pvKey =
      entry.type === 'research' && entry.slug
        ? `${entry.category || 'topics'}/${entry.slug}`
        : entry.type === 'article' && entry.slug
          ? `article/${entry.slug}`
          : entry.type === 'resource' && entry.slug
            ? `resource/${entry.slug}`
            : ''
    const taxonomy = taxonomyForManualEntry(entry)
    items.push({
      id: `content-db:${entry.contentKey}`,
      kind,
      tagLabel: CONTENT_GROUP_META[getContentGroup(taxonomy.contentKind)]?.label || '内容',
      title: entry.title,
      summary: entry.summary || '',
      date: entry.date || '',
      sortKey: researchSortKey(entry.date),
      href: entry.href,
      ...taxonomy,
      ...(pvKey ? { pvKey, pv: null } : {}),
    })
  }

  return items
}

function itemMatches(item, filters) {
  if (filters.group !== 'all' && getContentGroup(item.contentKind) !== filters.group) return false
  if (filters.subject !== 'all' && !item.subjects?.includes(filters.subject)) return false
  const query = String(filters.query || '').trim().toLowerCase()
  if (!query) return true
  const searchable = [
    item.title,
    item.summary,
    item.tagLabel,
    item.date,
    CONTENT_GROUP_META[getContentGroup(item.contentKind)]?.label,
    ...(item.subjects || []).map((subject) => SUBJECT_META[subject]?.label),
    ENTITY_TYPE_META[item.entityType]?.label,
    COMPANY_INDUSTRY_META[item.companyIndustry]?.label,
    COMPANY_ROLE_META[item.companyRole]?.label,
    DELIVERY_META[item.delivery]?.label,
    SERIES_META[item.series]?.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return searchable.includes(query)
}

export default function ArticlesIndexClient({ items: staticItems }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilters = filtersFromParams(searchParams)
  const [items, setItems] = useState(staticItems)
  const [catalogReady, setCatalogReady] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [queryInput, setQueryInput] = useState(initialFilters.query)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [pvCounts, setPvCounts] = useState({})
  const [pvLoaded, setPvLoaded] = useState(false)
  const requestedPvKeys = useRef(new Set())
  const [isPending, startTransition] = useTransition()
  const catalogItems = items

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch('/api/articles', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
      fetch('/api/content?source=manual', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
    ])
      .then(([articlesData, contentData]) => {
        if (!alive) return
        const dbArticles = Array.isArray(articlesData?.articles) ? articlesData.articles : []
        const base = [...staticItems, ...dbArticles]
        const manualItems = manualEntriesToItems(contentData?.entries, base)
        if (!dbArticles.length && !manualItems.length) return
        setItems(
          [...base, ...manualItems].sort((a, b) =>
            compareSortKeyDesc(a.sortKey, b.sortKey, a.id, b.id),
          ),
        )
      })
      .finally(() => {
        if (alive) setCatalogReady(true)
      })
    return () => {
      alive = false
    }
  }, [staticItems])

  useEffect(() => {
    const next = filtersFromParams(searchParams)
    setFilters(next)
    setQueryInput(next.query)
  }, [searchParams])

  const visible = useMemo(
    () => catalogItems.filter((item) => itemMatches(item, filters)),
    [catalogItems, filters],
  )
  const paginatedItems = useMemo(
    () => visible.slice(0, visibleCount),
    [visible, visibleCount],
  )

  function applyFilters(patch, facet, value) {
    const next = { ...filters, ...patch }
    setFilters(next)
    setQueryInput(next.query)
    setVisibleCount(PAGE_SIZE)
    trackSiteEvent('filter_apply', {
      facet,
      value,
      result_count: catalogItems.filter((item) => itemMatches(item, next)).length,
    })
    startTransition(() => {
      router.replace(buildDirectoryUrl(next), { scroll: false })
    })
  }

  function runSearch(rawQuery, source) {
    const query = String(rawQuery || '').trim()
    const next = { ...filters, query }
    const resultCount = catalogItems.filter((item) => itemMatches(item, next)).length
    setQueryInput(query)
    setFilters(next)
    setVisibleCount(PAGE_SIZE)
    trackSiteEvent('search_submit', {
      query_length: query.length,
      results_count: resultCount,
      zero_results: resultCount === 0,
      scope_group: next.group,
      source,
    })
    startTransition(() => {
      router.replace(buildDirectoryUrl(next), { scroll: false })
    })
  }

  function submitSearch(event) {
    event.preventDefault()
    runSearch(queryInput, 'typed')
  }

  function clearSearch() {
    setQueryInput('')
    applyFilters({ query: '' }, 'search', 'clear')
  }

  function clearAllFilters() {
    applyFilters({
      group: 'all',
      subject: 'all',
    }, 'all', 'clear')
  }

  const availableGroups = CONTENT_GROUP_KEYS.filter((key) => key !== 'all')

  const activeFilters = [
    filters.subject !== 'all'
      ? {
          key: 'subject',
          label: SUBJECT_META[filters.subject]?.label,
          patch: { subject: 'all' },
        }
      : null,
    filters.group !== 'all'
      ? {
          key: 'group',
          label: CONTENT_GROUP_META[filters.group]?.label,
          patch: { group: 'all' },
        }
      : null,
  ].filter(Boolean)
  const searchSuggestions = SEARCH_SUGGESTIONS.filter((query) =>
    catalogItems.some((item) => itemMatches(item, { ...filters, query })),
  )

  const visiblePvKeys = useMemo(
    () => Array.from(new Set(paginatedItems.map((item) => item.pvKey).filter(Boolean))),
    [paginatedItems],
  )
  const visiblePvKeySignature = visiblePvKeys.join(',')

  useEffect(() => {
    if (!catalogReady) return undefined
    const keys = (visiblePvKeySignature ? visiblePvKeySignature.split(',') : [])
      .filter((key) => !requestedPvKeys.current.has(key))
    if (!keys.length) {
      setPvLoaded(true)
      return undefined
    }
    keys.forEach((key) => requestedPvKeys.current.add(key))
    setPvLoaded(false)
    let cancelled = false
    fetch(`/api/research-pv?keys=${encodeURIComponent(keys.join(','))}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.counts) setPvCounts((current) => ({ ...current, ...data.counts }))
      })
      .catch(() => {
        keys.forEach((key) => requestedPvKeys.current.delete(key))
      })
      .finally(() => {
        if (!cancelled) setPvLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [catalogReady, visiblePvKeySignature])

  function Filters({ orientation = 'inline' }) {
    return (
      <div className="space-y-4">
        <FilterRow
          label="内容主题"
          index="01"
          tone="subject"
          ariaLabel="按内容主题筛选"
          orientation={orientation}
          active={filters.subject === 'all'}
          onReset={() => applyFilters({ subject: 'all' }, 'subject', 'all')}
        >
          <div className="w-full space-y-2.5">
            {SUBJECT_DISPLAY_GROUPS.map((group) => (
              <div key={group.label}>
                <span className="mb-1 block px-1 text-[10px] font-medium tracking-[0.08em] text-[#aaa1ae] dark:text-[#69758a]">
                  {group.label}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {group.keys.map((key) => (
                    <FilterChip
                      key={key}
                      label={SUBJECT_META[key].label}
                      tone="subject"
                      active={filters.subject === key}
                      onClick={() => applyFilters({ subject: key }, 'subject', key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FilterRow>

        <FilterRow
          label="内容类型"
          index="02"
          tone="kind"
          ariaLabel="按内容类型筛选"
          orientation={orientation}
          active={filters.group === 'all'}
          onReset={() => applyFilters({ group: 'all' }, 'group', 'all')}
        >
          {availableGroups.map((key) => (
            <FilterChip
              key={key}
              label={CONTENT_GROUP_META[key].label}
              tone="kind"
              active={filters.group === key}
              onClick={() => applyFilters({ group: key }, 'group', key)}
            />
          ))}
        </FilterRow>

      </div>
    )
  }

  function MobileFilterStrip() {
    return (
      <div className="h5-article-chips md:hidden">
        <div className="h5-chip-row" aria-label="按内容类型筛选">
          <FilterChip
            label="全部"
            tone="kind"
            active={filters.group === 'all'}
            onClick={() => applyFilters({ group: 'all' }, 'group', 'all')}
          />
          {availableGroups.map((key) => (
            <FilterChip
              key={key}
              label={CONTENT_GROUP_META[key].label}
              tone="kind"
              active={filters.group === key}
              onClick={() => applyFilters({ group: key }, 'group', key)}
            />
          ))}
        </div>
        <div className="h5-chip-row" aria-label="按主题筛选">
          <FilterChip
            label="全部"
            tone="subject"
            active={filters.subject === 'all'}
            onClick={() => applyFilters({ subject: 'all' }, 'subject', 'all')}
          />
          {SUBJECT_DISPLAY_GROUPS.flatMap((group) => group.keys).map((key) => (
            <FilterChip
              key={key}
              label={SUBJECT_META[key].label}
              tone="subject"
              active={filters.subject === key}
              onClick={() => applyFilters({ subject: key }, 'subject', key)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="articles-index-stone space-y-5">
      <section className="hidden space-y-2.5 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)]/95 p-3 shadow-[0_8px_24px_rgba(76,58,96,0.08)] backdrop-blur-sm dark:border-gray-800 dark:bg-[#0f141b]/95 dark:shadow-none md:block">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="搜索标题、主题或对象"
            aria-label="搜索统一内容目录"
            className="min-w-0 flex-1 rounded-lg border border-[#cfc6dc] bg-white px-3.5 py-2.5 text-sm text-[#20172f] outline-none transition-colors placeholder:text-[#9a93a3] focus:border-[var(--site-accent)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-[#cfc6dc] bg-[#f4f0f8] px-4 py-2.5 text-sm font-medium text-[#49345f] transition-colors hover:border-[var(--site-accent)] hover:text-[#20172f] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
          >
            搜索
          </button>
          {queryInput || filters.query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="hidden shrink-0 rounded-md border border-transparent px-2 py-2 text-sm text-[#817789] transition-colors hover:text-[#20172f] sm:block dark:text-gray-400 dark:hover:text-gray-200"
            >
              清空
            </button>
          ) : null}
        </form>
        {searchSuggestions.length ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-0.5 text-xs">
            <span className="text-[#958aa1] dark:text-gray-500">推荐搜索</span>
            {searchSuggestions.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => runSearch(query, 'suggested')}
                className="rounded-full border border-transparent bg-[#f1edf5] px-2.5 py-1 text-[#675d72] transition-colors hover:border-[#cfc3e2] hover:bg-white hover:text-[#20172f] dark:bg-[#171d26] dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-100"
              >
                {query}
              </button>
            ))}
            {queryInput || filters.query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-[#817789] underline-offset-4 hover:text-[#20172f] hover:underline sm:hidden dark:text-gray-400 dark:hover:text-gray-200"
              >
                清空搜索
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="hidden self-start rounded-lg border border-[#e8e2ef] bg-white/80 p-3 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto dark:border-gray-800 dark:bg-[#121821]">
          <div className="mb-3 border-b border-[#eee6f1] pb-2 dark:border-gray-800">
            <span className="block text-sm font-semibold text-[#20172f] dark:text-gray-100">
              筛选内容
            </span>
          </div>
          <Filters orientation="stack" />
        </aside>

        <div className="min-w-0 space-y-4 md:mt-3 lg:mt-0">
          <MobileFilterStrip />
          <section className="mt-3 hidden rounded-lg border border-[#e8e2ef] bg-white/80 text-xs md:block lg:hidden dark:border-gray-800 dark:bg-[#121821]">
            <div className="border-b border-[#eee6f1] px-3 py-2 dark:border-gray-800">
              <span className="font-medium text-[#20172f] dark:text-gray-100">筛选内容</span>
            </div>
            <div className="px-3 py-3">
              <Filters />
            </div>
          </section>

          {activeFilters.length ? (
            <div
              aria-label="已选筛选条件"
              className="hidden flex-wrap items-center gap-2 rounded-lg border border-[#e8e2ef] bg-white/65 px-3 py-2 text-xs md:flex dark:border-gray-800 dark:bg-[#121821]/80"
            >
              <span className="text-[#958aa1] dark:text-gray-500">已选</span>
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => applyFilters(filter.patch, filter.key, 'clear')}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f1edf5] px-2.5 py-1 text-[#49345f] transition-colors hover:bg-white dark:bg-[#1f1830] dark:text-[#d8c5f3] dark:hover:bg-[#292036]"
                  aria-label={`移除筛选：${filter.label}`}
                >
                  <span>{filter.label}</span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[#817789] underline-offset-4 hover:text-[#20172f] hover:underline dark:text-gray-400 dark:hover:text-gray-200"
              >
                清除筛选
              </button>
            </div>
          ) : null}

          <section
            className={`space-y-4 transition-opacity duration-150 ${isPending ? 'opacity-60' : 'opacity-100'}`}
            aria-busy={isPending}
          >
            {visible.length === 0 ? (
              <div className="rounded-lg border border-[#e8e2ef] bg-white/70 p-6 text-sm text-[#666] dark:border-gray-800 dark:bg-[#121821] dark:text-gray-400">
                {filters.query
                  ? '没有匹配内容。可以缩短关键词，或清除部分筛选条件。'
                  : '这个组合暂时没有内容，可以清除部分筛选条件。'}
              </div>
            ) : (
              <div className="h5-feed-list overflow-hidden border-y border-[var(--site-line)] bg-transparent md:bg-white/45 md:dark:bg-[#101721]/65">
                {paginatedItems.map((item, index) => {
                  const pvKey = item.pvKey || ''
                  const livePv = pvKey && Object.prototype.hasOwnProperty.call(pvCounts, pvKey)
                    ? pvCounts[pvKey]
                    : item.pv
                  const nextItem = 'pv' in item
                    ? { ...item, pv: livePv, pvLoading: pvKey !== '' && !pvLoaded }
                    : item
                  return (
                    <ArticleListItem
                      key={item.id || `${item.kind}:${item.href}:${item.title}`}
                      item={nextItem}
                      position={index + 1}
                      fromSearch={Boolean(filters.query)}
                      selectedSubject={filters.subject}
                    />
                  )
                })}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-[#d9d2df] px-4 py-4 text-center dark:border-gray-800 sm:flex-row sm:text-left">
                  <p className="mb-0 text-xs text-[#777184] dark:text-gray-400" aria-live="polite">
                    已显示 {paginatedItems.length} / {visible.length} 条
                  </p>
                  {paginatedItems.length < visible.length ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, visible.length))}
                      className="min-h-10 rounded-full border border-[#cfc6dc] bg-[#f4f0f8] px-5 text-sm font-medium text-[#49345f] transition hover:border-[var(--site-accent)] hover:bg-white hover:text-[#20172f] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      加载更多
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function FilterRow({ label, index, tone, ariaLabel, orientation = 'inline', active, onReset, children }) {
  const toneClass = tone === 'subject'
    ? 'border-[#d8c7e8] bg-[#faf6ff] dark:border-[#47365c] dark:bg-[#1b1425]'
    : 'border-[#bcdde0] bg-[#f2fbfb] dark:border-[#285158] dark:bg-[#102428]'
  const indexClass = tone === 'subject'
    ? 'bg-[#6f4d8f] text-white dark:bg-[#9a78bd] dark:text-[#160f20]'
    : 'bg-[#26777d] text-white dark:bg-[#54aeb4] dark:text-[#071a1c]'
  const labelButton = (
    <button
      type="button"
      onClick={onReset}
      aria-label={`查看全部${label.replace('内容', '')}`}
      data-filter-reset
      data-active={active ? 'true' : 'false'}
      title={`查看全部${label.replace('内容', '')}`}
      className={[
        'border-0 bg-transparent p-0 text-left text-sm font-semibold transition-colors hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c78a3] dark:hover:text-gray-100',
        active
          ? tone === 'subject' ? 'text-[#55346f] dark:text-[#d8c5f3]' : 'text-[#17636a] dark:text-[#9edfe3]'
          : 'text-[#82788e] dark:text-[#7f8aa0]',
      ].join(' ')}
    >
      {label}
    </button>
  )

  if (orientation === 'stack') {
    return (
      <section className={`min-w-0 rounded-xl border p-3 ${toneClass}`}>
        <div className="mb-2.5 flex items-start gap-2">
          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md font-mono text-[10px] font-bold ${indexClass}`}>{index}</span>
          <div>
            <div>{labelButton}</div>
          </div>
        </div>
        <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1.5">
          {children}
        </nav>
      </section>
    )
  }
  return (
    <section className={`grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-3 rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-start gap-2">
        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md font-mono text-[10px] font-bold ${indexClass}`}>{index}</span>
        <div>
          <div>{labelButton}</div>
        </div>
      </div>
      <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1.5">
        {children}
      </nav>
    </section>
  )
}

function FilterChip({ label, tone, active, onClick }) {
  const stateClass = tone === 'subject'
    ? active
      ? 'border-[#8a64a9] bg-[#6f4d8f] font-medium text-white dark:border-[#b89bd2] dark:bg-[#8a64a9]'
      : 'border-[#dfd1ea] bg-white/70 text-[#664f77] hover:border-[#ad8fc5] hover:bg-white dark:border-[#3d304c] dark:bg-[#21192b] dark:text-[#cdbbdd]'
    : active
      ? 'border-[#31858b] bg-[#26777d] font-medium text-white dark:border-[#70c2c7] dark:bg-[#31858b]'
      : 'border-[#c9e3e5] bg-white/70 text-[#356b70] hover:border-[#74b4b9] hover:bg-white dark:border-[#27484d] dark:bg-[#142d31] dark:text-[#a9d8db]'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
        stateClass,
      ].join(' ')}
    >
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
