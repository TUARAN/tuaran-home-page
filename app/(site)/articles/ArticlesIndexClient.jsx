'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import {
  CONTENT_GROUP_KEYS,
  CONTENT_GROUP_META,
  COMPANY_INDUSTRY_KEYS,
  COMPANY_INDUSTRY_META,
  COMPANY_ROLE_KEYS,
  COMPANY_ROLE_META,
  CONTENT_KIND_KEYS,
  CONTENT_KIND_META,
  DELIVERY_KEYS,
  DELIVERY_META,
  ENTITY_TYPE_KEYS,
  ENTITY_TYPE_META,
  SERIES_KEYS,
  SERIES_META,
  SUBJECT_KEYS,
  SUBJECT_META,
  companyFacetsForLegacyType,
  getContentGroup,
  taxonomyForManualEntry,
} from '../../../lib/contentTaxonomy'
import { compareSortKeyDesc, researchSortKey } from '../../../lib/research/datetime'
import { trackSiteEvent } from '../../../lib/siteAnalytics'
import CanvasOriginBadge from '../components/CanvasOriginBadge'

const PAGE_SIZE = 24

const GROUP_DEFS = ['all', 'article', 'analysis', 'practice', 'resource'].map((key) => ({
  key,
  label: CONTENT_GROUP_META[key].label,
}))

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
  works: 'practice',
  resources: 'resource',
}

const LEGACY_RESOURCE_TO_FACETS = {
  'ai-dev': { subject: 'ai_dev' },
  'ai-music': { subject: 'content_creation', delivery: 'watch_listen' },
  'humanities-politics': { subject: 'humanities_history' },
  rss: { delivery: 'subscribe' },
  twitter: { delivery: 'external' },
  youtube: { delivery: 'watch_listen' },
  workplace: { subject: 'workplace_org' },
  'visual-assets': { delivery: 'download' },
}

const KIND_TAG_CLASS = {
  article: 'border-[#d9d4e2] bg-white/60 text-[#625a6f] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
  analysis: 'border-[#c7dce4] bg-[#edf6f8] text-[#3f6878] dark:border-[#30454b] dark:bg-[#172329] dark:text-[#b8dce5]',
  practice: 'border-[#cfc3e2] bg-[#f3eff9] text-[#72539b] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#d8c5f3]',
  resource: 'border-[#d6d0df] bg-[#f4f2f8] text-[#625d70] dark:border-[#3a372f] dark:bg-[#24231f] dark:text-[#d7d4ca]',
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function formatPv(pv) {
  if (pv === null || typeof pv === 'undefined') return '-'
  const number = Number(pv)
  if (!Number.isFinite(number) || number < 0) return '-'
  if (number === 0) return '0'
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(number)
}

function normalizeEnum(value, keys, fallback = 'all') {
  return keys.includes(value) ? value : fallback
}

function filtersFromParams(params) {
  const legacyTab = params?.get('tab') || ''
  const legacyResource = LEGACY_RESOURCE_TO_FACETS[params?.get('resource_type')] || {}
  const groupFromLegacy = LEGACY_TAB_TO_GROUP[legacyTab] || ''
  const kindFromLegacy =
    legacyTab === 'works'
      ? 'interactive'
      : legacyTab === 'engineering-cases' || legacyTab === 'build-logs'
        ? 'practice'
        : legacyTab === 'posts'
          ? 'article'
          : ''
  const entityFromLegacy =
    legacyTab === 'companies' || params?.get('company_type')
      ? 'company'
      : legacyTab === 'people' || params?.get('people_type')
        ? 'person'
        : ''
  const legacyCompanyFacets = companyFacetsForLegacyType(params?.get('company_type'))
  const kind = normalizeEnum(params?.get('kind') || kindFromLegacy, ['all', ...CONTENT_KIND_KEYS])
  const entity = normalizeEnum(params?.get('entity') || entityFromLegacy, ['all', ...ENTITY_TYPE_KEYS])
  const delivery = normalizeEnum(
    params?.get('delivery') || legacyResource.delivery,
    ['all', ...DELIVERY_KEYS],
  )
  const inferredGroup =
    kind !== 'all'
      ? getContentGroup(kind)
      : entity !== 'all'
        ? 'analysis'
        : ['subscribe', 'download', 'watch_listen', 'external'].includes(delivery)
          ? 'resource'
          : delivery === 'interact'
            ? 'practice'
            : ''
  const group = normalizeEnum(
    params?.get('group') || groupFromLegacy || inferredGroup,
    CONTENT_GROUP_KEYS,
  )

  return {
    group,
    kind,
    subject: normalizeEnum(params?.get('subject') || legacyResource.subject, ['all', ...SUBJECT_KEYS]),
    entity,
    companyIndustry: normalizeEnum(
      params?.get('company_industry') || legacyCompanyFacets.companyIndustry,
      ['all', ...COMPANY_INDUSTRY_KEYS],
    ),
    companyRole: normalizeEnum(
      params?.get('company_role') || legacyCompanyFacets.companyRole,
      ['all', ...COMPANY_ROLE_KEYS],
    ),
    delivery,
    series: normalizeEnum(params?.get('series'), ['all', ...SERIES_KEYS]),
    query: params?.get('q') || '',
  }
}

function buildDirectoryUrl(filters) {
  const params = new URLSearchParams()
  if (filters.group !== 'all') params.set('group', filters.group)
  if (filters.kind !== 'all') params.set('kind', filters.kind)
  if (filters.subject !== 'all') params.set('subject', filters.subject)
  if (filters.entity !== 'all') params.set('entity', filters.entity)
  if (filters.companyIndustry !== 'all') params.set('company_industry', filters.companyIndustry)
  if (filters.companyRole !== 'all') params.set('company_role', filters.companyRole)
  if (filters.delivery !== 'all') params.set('delivery', filters.delivery)
  if (filters.series !== 'all') params.set('series', filters.series)
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
      tagLabel: CONTENT_KIND_META[taxonomy.contentKind]?.label || '内容',
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

function countBy(items, getter, keys) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]))
  counts.all = items.length
  for (const item of items) {
    const values = getter(item)
    for (const value of Array.isArray(values) ? values : [values]) {
      if (value && typeof counts[value] === 'number') counts[value] += 1
    }
  }
  return counts
}

function itemMatches(item, filters) {
  if (filters.group !== 'all' && getContentGroup(item.contentKind) !== filters.group) return false
  if (filters.kind !== 'all' && item.contentKind !== filters.kind) return false
  if (filters.subject !== 'all' && !item.subjects?.includes(filters.subject)) return false
  if (filters.entity !== 'all' && item.entityType !== filters.entity) return false
  if (filters.companyIndustry !== 'all' && item.companyIndustry !== filters.companyIndustry) return false
  if (filters.companyRole !== 'all' && item.companyRole !== filters.companyRole) return false
  if (filters.delivery !== 'all' && item.delivery !== filters.delivery) return false
  if (filters.series !== 'all' && item.series !== filters.series) return false
  const query = String(filters.query || '').trim().toLowerCase()
  if (!query) return true
  const searchable = [
    item.title,
    item.summary,
    item.tagLabel,
    item.date,
    CONTENT_KIND_META[item.contentKind]?.label,
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
  const [filters, setFilters] = useState(initialFilters)
  const [queryInput, setQueryInput] = useState(initialFilters.query)
  const [filtersOpen, setFiltersOpen] = useState(false)
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
    ]).then(([articlesData, contentData]) => {
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
    return () => {
      alive = false
    }
  }, [staticItems])

  useEffect(() => {
    const next = filtersFromParams(searchParams)
    setFilters(next)
    setQueryInput(next.query)
  }, [searchParams])

  const groupCounts = useMemo(
    () => countBy(catalogItems, (item) => getContentGroup(item.contentKind), CONTENT_GROUP_KEYS),
    [catalogItems],
  )
  const kindCounts = useMemo(
    () => countBy(catalogItems, (item) => item.contentKind, CONTENT_KIND_KEYS),
    [catalogItems],
  )
  const subjectCounts = useMemo(
    () => countBy(catalogItems, (item) => item.subjects || [], SUBJECT_KEYS),
    [catalogItems],
  )
  const entityCounts = useMemo(
    () => countBy(catalogItems, (item) => item.entityType, ENTITY_TYPE_KEYS),
    [catalogItems],
  )
  const companyIndustryCounts = useMemo(
    () => countBy(
      catalogItems.filter((item) => item.entityType === 'company'),
      (item) => item.companyIndustry,
      COMPANY_INDUSTRY_KEYS,
    ),
    [catalogItems],
  )
  const companyRoleCounts = useMemo(
    () => countBy(
      catalogItems.filter((item) => item.entityType === 'company'),
      (item) => item.companyRole,
      COMPANY_ROLE_KEYS,
    ),
    [catalogItems],
  )
  const deliveryCounts = useMemo(
    () => countBy(catalogItems, (item) => item.delivery, DELIVERY_KEYS),
    [catalogItems],
  )
  const seriesCounts = useMemo(
    () => countBy(catalogItems, (item) => item.series, SERIES_KEYS),
    [catalogItems],
  )

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
    if (patch.group && patch.group !== 'all') {
      if (next.kind !== 'all' && getContentGroup(next.kind) !== patch.group) next.kind = 'all'
    }
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

  function submitSearch(event) {
    event.preventDefault()
    const next = { ...filters, query: queryInput.trim() }
    const resultCount = catalogItems.filter((item) => itemMatches(item, next)).length
    setFilters(next)
    setVisibleCount(PAGE_SIZE)
    trackSiteEvent('search_submit', {
      query_length: next.query.length,
      results_count: resultCount,
      zero_results: resultCount === 0,
      scope_group: next.group,
    })
    startTransition(() => {
      router.replace(buildDirectoryUrl(next), { scroll: false })
    })
  }

  function clearSearch() {
    setQueryInput('')
    applyFilters({ query: '' }, 'search', 'clear')
  }

  const availableKinds = CONTENT_KIND_KEYS.filter((key) => {
    if (!kindCounts[key]) return false
    return filters.group === 'all' || getContentGroup(key) === filters.group
  })
  const availableEntities = ENTITY_TYPE_KEYS.filter((key) => entityCounts[key] > 0)
  const availableCompanyIndustries = COMPANY_INDUSTRY_KEYS.filter(
    (key) => companyIndustryCounts[key] >= 3,
  )
  const availableCompanyRoles = COMPANY_ROLE_KEYS.filter((key) => companyRoleCounts[key] >= 2)
  const availableDeliveries = DELIVERY_KEYS.filter((key) => deliveryCounts[key] > 0)
  const availableSeries = SERIES_KEYS.filter((key) => seriesCounts[key] > 0)

  const activeLabels = [
    filters.group !== 'all' ? CONTENT_GROUP_META[filters.group]?.label : '',
    filters.kind !== 'all' ? CONTENT_KIND_META[filters.kind]?.label : '',
    filters.subject !== 'all' ? SUBJECT_META[filters.subject]?.label : '',
    filters.entity !== 'all' ? ENTITY_TYPE_META[filters.entity]?.label : '',
    filters.companyIndustry !== 'all' ? COMPANY_INDUSTRY_META[filters.companyIndustry]?.label : '',
    filters.companyRole !== 'all' ? COMPANY_ROLE_META[filters.companyRole]?.label : '',
    filters.delivery !== 'all' ? DELIVERY_META[filters.delivery]?.label : '',
    filters.series !== 'all' ? SERIES_META[filters.series]?.label : '',
  ].filter(Boolean)
  const currentFilterLabel = activeLabels.join(' / ') || '全部内容'

  const visiblePvKeys = useMemo(
    () => Array.from(new Set(paginatedItems.map((item) => item.pvKey).filter(Boolean))),
    [paginatedItems],
  )
  const visiblePvKeySignature = visiblePvKeys.join(',')

  useEffect(() => {
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
  }, [visiblePvKeySignature])

  function Filters({ orientation = 'inline' }) {
    return (
      <div className="space-y-3">
        <FilterRow label="内容形态" ariaLabel="按内容形态筛选" orientation={orientation}>
          <FilterChip
            label="全部形态"
            count={filters.group === 'all' ? catalogItems.length : groupCounts[filters.group]}
            active={filters.kind === 'all'}
            onClick={() => applyFilters({ kind: 'all' }, 'kind', 'all')}
          />
          {availableKinds.map((key) => (
            <FilterChip
              key={key}
              label={CONTENT_KIND_META[key].label}
              count={kindCounts[key]}
              active={filters.kind === key}
              onClick={() => applyFilters({ kind: key, group: getContentGroup(key) }, 'kind', key)}
            />
          ))}
        </FilterRow>

        <FilterRow label="主题" ariaLabel="按主题筛选" orientation={orientation}>
          <FilterChip
            label="全部主题"
            count={catalogItems.length}
            active={filters.subject === 'all'}
            onClick={() => applyFilters({ subject: 'all' }, 'subject', 'all')}
          />
          {SUBJECT_KEYS.filter((key) => subjectCounts[key] > 0).map((key) => (
            <FilterChip
              key={key}
              label={SUBJECT_META[key].label}
              count={subjectCounts[key]}
              active={filters.subject === key}
              onClick={() => applyFilters({ subject: key }, 'subject', key)}
            />
          ))}
        </FilterRow>

        {availableEntities.length ? (
          <FilterRow label="研究对象" ariaLabel="按研究对象筛选" orientation={orientation}>
            <FilterChip
              label="全部对象"
              count={entityCounts.all}
                active={filters.entity === 'all'}
                onClick={() => applyFilters({
                  entity: 'all',
                  companyIndustry: 'all',
                  companyRole: 'all',
                }, 'entity', 'all')}
            />
            {availableEntities.map((key) => (
              <FilterChip
                key={key}
                label={ENTITY_TYPE_META[key].label}
                count={entityCounts[key]}
                active={filters.entity === key}
                onClick={() => applyFilters({
                  entity: key,
                  ...(key === 'all' ? {} : { group: 'analysis', kind: 'all' }),
                  ...(key === 'company'
                    ? {}
                    : { companyIndustry: 'all', companyRole: 'all' }),
                }, 'entity', key)}
              />
            ))}
          </FilterRow>
        ) : null}

        {filters.entity === 'company' && availableCompanyIndustries.length ? (
          <FilterRow label="公司行业" ariaLabel="按公司行业筛选" orientation={orientation}>
            <FilterChip
              label="全部行业"
              count={companyIndustryCounts.all}
              active={filters.companyIndustry === 'all'}
              onClick={() => applyFilters({ companyIndustry: 'all' }, 'company_industry', 'all')}
            />
            {availableCompanyIndustries.map((key) => (
              <FilterChip
                key={key}
                label={COMPANY_INDUSTRY_META[key].label}
                count={companyIndustryCounts[key]}
                active={filters.companyIndustry === key}
                onClick={() => applyFilters({ companyIndustry: key }, 'company_industry', key)}
              />
            ))}
          </FilterRow>
        ) : null}

        {filters.entity === 'company' && availableCompanyRoles.length ? (
          <FilterRow label="公司角色" ariaLabel="按公司生态角色筛选" orientation={orientation}>
            <FilterChip
              label="全部角色"
              count={companyRoleCounts.all}
              active={filters.companyRole === 'all'}
              onClick={() => applyFilters({ companyRole: 'all' }, 'company_role', 'all')}
            />
            {availableCompanyRoles.map((key) => (
              <FilterChip
                key={key}
                label={COMPANY_ROLE_META[key].label}
                count={companyRoleCounts[key]}
                active={filters.companyRole === key}
                onClick={() => applyFilters({ companyRole: key }, 'company_role', key)}
              />
            ))}
          </FilterRow>
        ) : null}

        <FilterRow label="使用方式" ariaLabel="按使用方式筛选" orientation={orientation}>
          <FilterChip
            label="全部方式"
            count={deliveryCounts.all}
            active={filters.delivery === 'all'}
            onClick={() => applyFilters({ delivery: 'all' }, 'delivery', 'all')}
          />
          {availableDeliveries.map((key) => (
            <FilterChip
              key={key}
              label={DELIVERY_META[key].label}
              count={deliveryCounts[key]}
              active={filters.delivery === key}
              onClick={() => applyFilters({
                delivery: key,
                ...(['subscribe', 'download', 'watch_listen', 'external'].includes(key)
                  ? { group: 'resource', kind: 'all' }
                  : key === 'interact'
                    ? { group: 'practice', kind: 'all' }
                    : {}),
              }, 'delivery', key)}
            />
          ))}
        </FilterRow>

        {availableSeries.length ? (
          <FilterRow label="系列" ariaLabel="按固定系列筛选" orientation={orientation}>
            <FilterChip
              label="全部系列"
              count={seriesCounts.all}
              active={filters.series === 'all'}
              onClick={() => applyFilters({ series: 'all' }, 'series', 'all')}
            />
            {availableSeries.map((key) => (
              <FilterChip
                key={key}
                label={SERIES_META[key].label}
                count={seriesCounts[key]}
                active={filters.series === key}
                onClick={() => applyFilters({ series: key, group: 'all', kind: 'all' }, 'series', key)}
              />
            ))}
          </FilterRow>
        ) : null}
      </div>
    )
  }

  return (
    <div className="articles-index-stone space-y-5">
      <section className="-mx-1 space-y-3 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel-strong)]/95 p-3 shadow-[0_8px_24px_rgba(76,58,96,0.08)] backdrop-blur-sm dark:border-gray-800 dark:bg-[#0f141b]/95 dark:shadow-none">
        <nav
          aria-label="内容用途"
          role="tablist"
          className="flex gap-1.5 overflow-x-auto rounded-lg border border-[#ddd6e7] bg-[#eee9f3] p-1 sm:grid sm:grid-cols-5 sm:overflow-visible dark:border-gray-800 dark:bg-[#151a22]"
        >
          {GROUP_DEFS.map((group) => {
            const active = filters.group === group.key
            return (
              <button
                key={group.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => applyFilters({ group: group.key, kind: 'all' }, 'group', group.key)}
                className={[
                  'inline-flex min-h-9 min-w-[5.5rem] shrink-0 items-center justify-center rounded-md px-2.5 py-2 text-sm transition-all duration-150 sm:min-w-0',
                  active
                    ? 'bg-white font-semibold text-[#20172f] shadow-sm ring-1 ring-[#d9cfe8] dark:bg-[#1e2630] dark:text-gray-100 dark:ring-transparent'
                    : 'text-[#696071] hover:bg-white/70 hover:text-[#20172f] dark:text-gray-400 dark:hover:bg-[#1e2630]/70 dark:hover:text-gray-100',
                ].join(' ')}
              >
                {group.label}
                <span className="ml-1 font-mono text-[11px] text-[#8d8495] dark:text-gray-500">
                  ({groupCounts[group.key] ?? 0})
                </span>
              </button>
            )
          })}
        </nav>

        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="搜索标题、摘要、主题或对象"
            aria-label="搜索统一内容目录"
            className="min-w-[220px] flex-1 rounded-md border border-[#cfc6dc] bg-white px-3 py-2 text-sm text-[#20172f] outline-none transition-colors placeholder:text-[#9a93a3] focus:border-[var(--site-accent)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
          />
          <button
            type="submit"
            className="rounded-md border border-[#cfc6dc] bg-[#f4f0f8] px-3 py-2 text-sm text-[#49345f] transition-colors hover:border-[var(--site-accent)] hover:text-[#20172f] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
          >
            搜索
          </button>
          {queryInput || filters.query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-md border border-transparent px-2 py-2 text-sm text-[#817789] transition-colors hover:text-[#20172f] dark:text-gray-400 dark:hover:text-gray-200"
            >
              清空
            </button>
          ) : null}
        </form>
      </section>

      <div className="lg:grid lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="hidden self-start rounded-lg border border-[#e8e2ef] bg-white/80 p-3 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto dark:border-gray-800 dark:bg-[#121821]">
          <div className="mb-3 border-b border-[#eee6f1] pb-2 dark:border-gray-800">
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#958aa1] dark:text-gray-500">
              多维筛选
            </span>
            <span className="mt-1 block truncate text-xs font-medium text-[#20172f] dark:text-gray-100">
              {currentFilterLabel}
            </span>
          </div>
          <Filters orientation="stack" />
        </aside>

        <div className="mt-3 min-w-0 space-y-4 lg:mt-0">
          <details
            open={filtersOpen}
            onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
            className="group rounded-lg border border-[#e8e2ef] bg-white/80 text-xs lg:hidden dark:border-gray-800 dark:bg-[#121821]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 truncate font-medium text-[#20172f] dark:text-gray-100">
                {currentFilterLabel}
              </span>
              <span className="shrink-0 text-[#675d72] dark:text-gray-300">
                <span className="group-open:hidden">展开筛选</span>
                <span className="hidden group-open:inline">收起筛选</span>
              </span>
            </summary>
            <div className="border-t border-[#e8e2ef] px-3 py-3 dark:border-gray-800">
              <Filters />
            </div>
          </details>

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
              <div className="overflow-hidden border-y border-[#d9d2df] bg-white/45 dark:border-gray-800 dark:bg-[#101721]/65">
                {paginatedItems.map((item, index) => {
                  const pvKey = item.pvKey || ''
                  const livePv = pvKey && Object.prototype.hasOwnProperty.call(pvCounts, pvKey)
                    ? pvCounts[pvKey]
                    : item.pv
                  const nextItem = 'pv' in item
                    ? { ...item, pv: livePv, pvLoading: pvKey !== '' && !pvLoaded }
                    : item
                  return (
                    <ArticleRow
                      key={item.id || `${item.kind}:${item.href}:${item.title}`}
                      item={nextItem}
                      position={index + 1}
                      fromSearch={Boolean(filters.query)}
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

function FilterRow({ label, ariaLabel, orientation = 'inline', children }) {
  if (orientation === 'stack') {
    return (
      <div className="min-w-0">
        <span className="mb-1.5 block text-[11px] font-medium tracking-[0.04em] text-[#82788e] dark:text-[#7f8aa0]">
          {label}
        </span>
        <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1.5">
          {children}
        </nav>
      </div>
    )
  }
  return (
    <div className="grid min-w-0 grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[4.75rem_minmax(0,1fr)]">
      <span className="pt-1.5 text-xs leading-5 text-[#82788e] dark:text-[#7f8aa0]">{label}</span>
      <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1.5">
        {children}
      </nav>
    </div>
  )
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'border-[#cfc3e2] bg-[#f3eff9] font-medium text-[#49345f] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#d8c5f3]'
          : 'border-transparent text-[#696071] hover:bg-[#f4f0f8] hover:text-[#20172f] dark:text-[#9aa6b8] dark:hover:bg-[#151d27] dark:hover:text-gray-100',
      ].join(' ')}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className="font-mono text-[10px] tabular-nums text-[#958aa1] dark:text-[#667287]">
        ({count})
      </span>
    </button>
  )
}

function ArticleRow({ item, position, fromSearch }) {
  const external = isExternalHref(item.href)
  const group = getContentGroup(item.contentKind)
  const analyticsEvent = fromSearch
    ? 'search_result_click'
    : group === 'resource'
      ? 'resource_action'
      : 'entry_click'

  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      data-analytics-event={analyticsEvent}
      data-analytics-surface={fromSearch ? 'directory_search' : 'directory'}
      data-analytics-destination-kind={item.contentKind}
      data-analytics-destination-id={item.id}
      data-analytics-subject={item.subjects?.[0] || ''}
      data-analytics-delivery={item.delivery || ''}
      data-analytics-action={group === 'resource' ? 'open' : ''}
      data-analytics-position={position}
      className="article-row group block border-b border-[#e8e2ef] bg-transparent no-underline transition-colors last:border-b-0 hover:bg-white/80 hover:no-underline dark:border-gray-800 dark:hover:bg-[#151d27]"
    >
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_136px] sm:px-5">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0 text-sm text-[#a39aac]">▪</span>
            {item.dateLabel || item.date ? (
              <span className="shrink-0 whitespace-nowrap text-xs text-[#958aa1] dark:text-gray-400">
                {item.dateLabel || item.date}
              </span>
            ) : null}
            <span
              className={[
                'inline-flex max-w-full min-w-0 shrink items-center truncate rounded-full border px-2 py-[1px] text-[11px]',
                KIND_TAG_CLASS[group] || KIND_TAG_CLASS.article,
              ].join(' ')}
            >
              {CONTENT_KIND_META[item.contentKind]?.label || item.tagLabel || '内容'}
            </span>
            {item.subjects?.[0] ? (
              <span className="inline-flex rounded-full border border-transparent px-1.5 py-[1px] text-[11px] text-[#817789] dark:text-gray-400">
                {SUBJECT_META[item.subjects[0]]?.label}
              </span>
            ) : null}
            {item.entityType ? (
              <span className="inline-flex rounded-full border border-transparent px-1.5 py-[1px] text-[11px] text-[#817789] dark:text-gray-400">
                {ENTITY_TYPE_META[item.entityType]?.label}
              </span>
            ) : null}
            <CanvasOriginBadge canvasId={item.canvasId} href={item.href} size="sm" />
          </div>
          <h2 className="ml-5 line-clamp-2 text-[17px] font-semibold leading-7 text-[#20172f] transition-colors group-hover:text-[#120b1f] dark:text-gray-100 dark:group-hover:text-white">
            {item.title}
          </h2>
          {item.summary ? (
            <p className="ml-5 mt-2 line-clamp-2 text-sm leading-relaxed text-[#6b6472] transition-colors group-hover:text-[#3c3149] dark:text-gray-300 dark:group-hover:text-gray-200">
              {item.summary}
            </p>
          ) : null}
          <div className="ml-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#958aa1] dark:text-gray-400">
            <span>{external ? '打开来源 →' : item.delivery === 'interact' ? '开始探索 →' : '打开内容 →'}</span>
            {item.readingMinutes ? <span className="font-mono text-[11px]">· {item.readingMinutes} min</span> : null}
            {'pv' in item ? (
              <span className="font-mono text-[11px]">· 阅读量 {item.pvLoading ? '-' : formatPv(item.pv)}</span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="relative h-28 overflow-hidden rounded-md border border-[#ded8e4] bg-[#f3eff7] dark:border-gray-800 dark:bg-gray-950 sm:h-24 sm:w-[136px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image.src}
              alt={item.image.alt || `${item.title} 配图`}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                const box = event.currentTarget.parentElement
                if (box) box.style.display = 'none'
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        ) : null}
      </div>
    </Link>
  )
}
