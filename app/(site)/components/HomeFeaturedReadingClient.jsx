'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconRefresh, IconSearch, IconX } from '@tabler/icons-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  chooseHomeRecommendationBatch,
  DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS,
  getHomeRecommendationBatchNumber,
  getHomeRecommendationNavigationType,
  getHomeRecommendationRotateDelayMs,
  HOME_ARTICLE_SCOPE_KEYS,
  HOME_ARTICLE_SCOPE_META,
  HOME_ARTICLE_SCOPE_PAGE_SIZE,
  HOME_RECOMMENDATION_MAX_BATCH_SIZE,
  HOME_RECOMMENDATION_RELOAD_GUARD,
  homeArticleScopeSurface,
  listHomeArticleScopeCatalog,
  mergeHomeRecommendationCatalog,
  mergeHomeRecommendationSettings,
  nextHomeRecommendationBatchOffset,
  readHomeRecommendationBatchOffset,
  reconcilePaintedHomeRecommendationLatest,
  searchHomeRecommendationCatalog,
  selectHomeRecommendationItems,
  sameHomeRecommendationSettings,
  sliceHomeArticleScopeItems,
  writeHomeRecommendationBatchOffset,
} from '../../../lib/homeRecommendationEngine'
import { trackSiteEvent } from '../../../lib/siteAnalytics'
import H5PullToRefresh from './H5PullToRefresh'
import { T } from './LocaleProvider'

const CHANGE_BATCH_MS = 260

function clearHomeBatchReloadHint() {
  if (typeof document === 'undefined') return
  delete document.documentElement.dataset.homeBatchReload
}

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
}

function FeaturedLink({ item, isPinned, desktopOnly = false, fromSearch = false, position = 0, surface = 'home_recommendation' }) {
  const content = (
    <>
      <div className={`home-reading-meta ${isPinned ? '' : 'hidden md:flex'}`}>
        {isPinned ? <span className="home-badge home-badge-pinned"><T zh="置顶" en="Pinned" /></span> : null}
        <span className={`hidden md:inline-flex ${SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column}`}>{item.sectionLabel}</span>
        {item.tagLabel ? <span className="home-badge home-badge-muted hidden md:inline-flex">{item.tagLabel}</span> : null}
        {item.date ? <time className="home-item-date hidden md:inline">{item.date}</time> : null}
      </div>
      <p className="h5-feed-title mb-0 line-clamp-2 text-[16px] font-semibold leading-snug text-[var(--site-ink)] transition-colors group-hover:text-[var(--site-accent-strong)] md:text-[20px] md:leading-7">{item.title}</p>
      {item.summary ? <p className="h5-feed-summary mb-0 mt-1 line-clamp-1 text-[13px] leading-5 text-[var(--site-muted)] md:mt-1.5 md:line-clamp-2 md:text-[15px] md:leading-6">{item.summary}</p> : null}
      {item.date ? <time className="h5-feed-meta mt-1 block text-[11px] text-[var(--site-faint)] md:hidden">{item.date}</time> : null}
    </>
  )
  const className = `h5-feed-row home-reading-item group no-underline ${desktopOnly ? 'hidden md:block' : ''}`
  const analyticsProps = {
    'data-analytics-event': fromSearch ? 'search_result_click' : 'entry_click',
    'data-analytics-surface': fromSearch ? 'home_search' : surface,
    'data-analytics-destination-kind': item.section || 'content',
    'data-analytics-destination-id': item.id,
    'data-analytics-position': position,
  }
  return item.external || item.href?.startsWith('http')
    ? <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`} {...analyticsProps}>{content}</a>
    : <Link href={item.href} className={className} {...analyticsProps}>{content}</Link>
}

export default function HomeFeaturedReadingClient({ catalog: initialCatalog = [] }) {
  const [catalog, setCatalog] = useState(initialCatalog)
  const router = useRouter()
  const searchInputRef = useRef(null)
  const firstBatchLockedRef = useRef(true)
  const firstBatchItemsRef = useRef(null)
  const [settings, setSettings] = useState(DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS)
  const [runtimeCatalogReady, setRuntimeCatalogReady] = useState(false)
  const [automaticBatchNumber, setAutomaticBatchNumber] = useState(0)
  const [batchOffset, setBatchOffset] = useState(0)
  const [changing, setChanging] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('recommended')
  const [scopeVisibleCount, setScopeVisibleCount] = useState(HOME_ARTICLE_SCOPE_PAGE_SIZE)
  const batchNumber = automaticBatchNumber + batchOffset
  const previousIds = useMemo(
    () => {
      if (batchNumber <= 0) return []
      if (batchOffset === 1 && firstBatchItemsRef.current) {
        return firstBatchItemsRef.current.map((item) => item.id)
      }
      return chooseHomeRecommendationBatch(
        catalog,
        settings,
        batchNumber - 1,
        [],
        { includeHighlights: batchOffset === 1 },
      ).map((item) => item.id)
    },
    [batchNumber, batchOffset, catalog, settings],
  )
  const computedItems = useMemo(
    () => chooseHomeRecommendationBatch(
      catalog,
      settings,
      batchNumber,
      previousIds,
      { includeHighlights: batchOffset === 0 },
    ),
    [batchNumber, batchOffset, catalog, previousIds, settings],
  )
  if (!firstBatchItemsRef.current && computedItems.length) {
    firstBatchItemsRef.current = computedItems
  }
  if (firstBatchLockedRef.current && firstBatchItemsRef.current && runtimeCatalogReady) {
    firstBatchItemsRef.current = reconcilePaintedHomeRecommendationLatest(
      firstBatchItemsRef.current,
      catalog,
      settings,
      runtimeCatalogReady,
    )
  }
  const items = selectHomeRecommendationItems(
    computedItems,
    firstBatchItemsRef.current,
    firstBatchLockedRef.current,
  )
  const normalizedQuery = query.trim()
  const searchResults = useMemo(
    () => searchHomeRecommendationCatalog(catalog, normalizedQuery, HOME_RECOMMENDATION_MAX_BATCH_SIZE),
    [catalog, normalizedQuery],
  )
  const scopeCatalog = useMemo(
    () => listHomeArticleScopeCatalog(catalog, settings, scope),
    [catalog, settings, scope],
  )
  const scopedItems = useMemo(
    () => (scope === 'recommended' ? items : sliceHomeArticleScopeItems(scopeCatalog, scopeVisibleCount)),
    [items, scope, scopeCatalog, scopeVisibleCount],
  )
  const displayedItems = normalizedQuery ? searchResults : scopedItems
  const analyticsSurface = homeArticleScopeSurface(scope)
  const pinnedIds = useMemo(() => new Set(settings.pinnedIds), [settings.pinnedIds])
  useEffect(() => {
    let alive = true
    fetch('/api/recommendations/home', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!alive || !data) return
        if (Array.isArray(data.catalog)) {
          setCatalog((current) => mergeHomeRecommendationCatalog(current, data.catalog))
          setRuntimeCatalogReady(true)
        }
        if (data.settings) {
          const next = mergeHomeRecommendationSettings(data.settings)
          setSettings((current) => (sameHomeRecommendationSettings(current, next) ? current : next))
        }
      })
      .catch(() => { /* Keep the prerendered catalog when refresh fails. */ })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let timer
    const scheduleRotate = () => {
      timer = window.setTimeout(() => {
        firstBatchLockedRef.current = false
        setAutomaticBatchNumber(getHomeRecommendationBatchNumber(settings.autoRotateHours))
        scheduleRotate()
      }, getHomeRecommendationRotateDelayMs(settings.autoRotateHours))
    }
    scheduleRotate()
    return () => window.clearTimeout(timer)
  }, [settings.autoRotateHours])

  useLayoutEffect(() => {
    const stored = readHomeRecommendationBatchOffset(window.sessionStorage)
    const navigationType = getHomeRecommendationNavigationType()
    let next = stored
    if (navigationType === 'reload') {
      if (!window[HOME_RECOMMENDATION_RELOAD_GUARD]) {
        window[HOME_RECOMMENDATION_RELOAD_GUARD] = true
        next = nextHomeRecommendationBatchOffset(stored, navigationType)
        writeHomeRecommendationBatchOffset(window.sessionStorage, next)
      } else {
        next = readHomeRecommendationBatchOffset(window.sessionStorage)
      }
    }

    if (next <= 0) {
      clearHomeBatchReloadHint()
      return undefined
    }

    firstBatchLockedRef.current = false
    setBatchOffset(next)
    if (navigationType !== 'reload') {
      clearHomeBatchReloadHint()
      return undefined
    }

    setChanging(true)
    const timer = window.setTimeout(() => {
      setChanging(false)
      clearHomeBatchReloadHint()
    }, CHANGE_BATCH_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const changeBatch = useCallback(() => {
    firstBatchLockedRef.current = false
    setChanging(true)
    setBatchOffset((value) => {
      const next = value + 1
      writeHomeRecommendationBatchOffset(window.sessionStorage, next)
      return next
    })
    return new Promise((resolve) => {
      window.setTimeout(() => {
        setChanging(false)
        resolve()
      }, CHANGE_BATCH_MS)
    })
  }, [])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setSearchOpen(false)
  }, [])

  const selectScope = useCallback((next) => {
    if (next === scope) return
    setScope(next)
    setScopeVisibleCount(HOME_ARTICLE_SCOPE_PAGE_SIZE)
    trackSiteEvent('filter_apply', {
      facet: 'home_scope',
      value: next,
      result_count: next === 'recommended'
        ? items.length
        : listHomeArticleScopeCatalog(catalog, settings, next).length,
    })
  }, [catalog, items.length, scope, settings])

  const loadMoreScope = useCallback(() => {
    setScopeVisibleCount((count) => count + HOME_ARTICLE_SCOPE_PAGE_SIZE)
  }, [])

  const viewAllResults = useCallback(() => {
    if (!normalizedQuery) return
    trackSiteEvent('search_submit', {
      query_length: normalizedQuery.length,
      results_count: searchResults.length,
      zero_results: searchResults.length === 0,
      scope_group: 'home',
    })
    router.push(`/articles?q=${encodeURIComponent(normalizedQuery)}`)
  }, [normalizedQuery, router, searchResults.length])

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      clearSearch()
    } else if (event.key === 'Enter' && normalizedQuery) {
      event.preventDefault()
      viewAllResults()
    }
  }, [clearSearch, normalizedQuery, viewAllResults])

  const eligibleCount = catalog.filter((item) => settings.sources[item.section]?.enabled === true).length
  const canRotateRecommended = scope === 'recommended' && !normalizedQuery && eligibleCount > items.length
  const canLoadMoreScope = scope !== 'recommended' && !normalizedQuery && scopeVisibleCount < scopeCatalog.length

  useEffect(() => {
    const handlePageKeyDown = (event) => {
      if (
        event.key !== 'Enter'
        || event.repeat
        || event.defaultPrevented
        || event.metaKey
        || event.ctrlKey
        || event.altKey
        || event.shiftKey
        || !canRotateRecommended
        || changing
      ) return

      const target = event.target
      if (target instanceof Element && target.closest('a, button, input, textarea, select, [contenteditable="true"], [role="button"]')) return

      event.preventDefault()
      changeBatch()
    }

    window.addEventListener('keydown', handlePageKeyDown)
    return () => window.removeEventListener('keydown', handlePageKeyDown)
  }, [canRotateRecommended, changeBatch, changing])

  if (!settings.enabled || (!catalog.length && !items.length)) return null

  return (
    <H5PullToRefresh onRefresh={changeBatch} disabled={changing || Boolean(normalizedQuery) || scope !== 'recommended'}>
    <section id="articles" className="home-featured-reading home-section scroll-mt-24">
      <div className="home-primary-heading hidden md:grid">
        <p className="home-kicker">01 · Writing</p>
        <h2 className="home-section-title"><T zh="文章" en="Articles" /></h2>
        <div className={`home-primary-heading-actions ${searchOpen ? 'is-search-open' : ''}`}>
          {searchOpen ? (
            <div className="relative w-full min-w-0 sm:flex-1">
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#858277] dark:text-[#8793a2]" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索标题、摘要、标签、栏目或日期"
                aria-label="搜索首页推荐内容"
                className="h-9 w-full rounded-full border border-[#d7d2c4] bg-white/80 py-1 pl-9 pr-9 text-[13px] text-[#2c2a23] outline-none transition placeholder:text-[#969287] focus:border-[#8e846f] focus:ring-2 focus:ring-[#8e846f]/15 dark:border-[#313a45] dark:bg-[#121923] dark:text-white dark:placeholder:text-[#748090] dark:focus:border-[#69788a]"
              />
              <button type="button" onClick={clearSearch} className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#77746a] transition hover:bg-black/5 dark:text-[#9aa5b3] dark:hover:bg-white/10" aria-label="清空并关闭搜索">
                <IconX size={15} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={openSearch} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] disabled:cursor-wait disabled:opacity-45 dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white" aria-label="展开推荐搜索">
              <IconSearch size={15} aria-hidden="true" />
              <T zh="搜索" en="Search" />
            </button>
          )}
          {canRotateRecommended ? (
            <button
              type="button"
              onClick={changeBatch}
              disabled={changing}
              className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] disabled:cursor-wait disabled:opacity-45 dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white"
              aria-label="换一批首页推荐内容"
            >
              <IconRefresh size={15} className={`transition-transform duration-300 ${changing ? 'rotate-180' : 'group-hover:rotate-45'}`} aria-hidden="true" />
              <T zh="换一批" en="Show me more" />
            </button>
          ) : null}
        </div>
        <p className="home-section-description"><T zh="完整的研究、实践记录与长期写作" en="Research, field notes, and long-form writing" /></p>
      </div>
      <div className="home-article-scopes">
        <p className="h5-feed-label md:hidden">文章</p>
        <nav className="home-section-tabs" role="tablist" aria-label="首页文章范围">
          {HOME_ARTICLE_SCOPE_KEYS.map((key) => {
            const active = scope === key
            const meta = HOME_ARTICLE_SCOPE_META[key]
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`home-article-scope-${key}`}
                aria-selected={active}
                aria-controls="home-article-list"
                className={`home-tab-link ${active ? 'is-active' : ''}`}
                onClick={() => selectScope(key)}
              >
                <T zh={meta.label} en={meta.labelEn} />
              </button>
            )
          })}
        </nav>
      </div>
      <div className="relative">
        <div
          id="home-article-list"
          role="tabpanel"
          aria-labelledby={`home-article-scope-${scope}`}
          className={`home-reading-list transition-opacity duration-200 ${changing && scope === 'recommended' ? 'opacity-55' : 'opacity-100'}`}
          aria-live="polite"
        >
          {displayedItems.map((item, index) => (
            <FeaturedLink
              key={item.id}
              item={item}
              isPinned={scope === 'recommended' && pinnedIds.has(item.id)}
              desktopOnly={scope === 'recommended' && !normalizedQuery && index >= 10}
              fromSearch={Boolean(normalizedQuery)}
              position={index + 1}
              surface={analyticsSurface}
            />
          ))}
          {normalizedQuery && !displayedItems.length ? (
            <div className="py-10 text-center text-[14px] text-[#77746a] dark:text-[#98a3b1]">
              没有找到与“{normalizedQuery}”匹配的内容
            </div>
          ) : null}
          {!normalizedQuery && !displayedItems.length ? (
            <div className="py-10 text-center text-[14px] text-[#77746a] dark:text-[#98a3b1]">
              {scope === 'resources' ? '暂时没有可展示的资源' : '暂时没有可展示的内容'}
            </div>
          ) : null}
        </div>

      </div>
      {canRotateRecommended ? (
        <div className="h5-batch-more mt-6 hidden flex-col items-center gap-3 border-t border-[#ded9cc] pt-6 dark:border-[#2c3540] md:flex">
          <p className="mb-0 text-[12px] font-medium tracking-[0.08em] text-[#77746a] dark:text-[#98a3b1]">
            <T zh="已经看到这里了，再发现一些内容" en="You made it here. Discover something else" />
          </p>
          <button
            type="button"
            onClick={changeBatch}
            disabled={changing}
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#cfc7b6] bg-[#fffaf0] px-5 text-[13px] font-semibold text-[#5f563f] shadow-[0_5px_18px_rgba(56,49,38,0.08)] transition hover:-translate-y-0.5 hover:border-[#9e8c68] hover:text-[#2c2a23] disabled:cursor-wait disabled:opacity-45 dark:border-[#3a4654] dark:bg-[#18212c] dark:text-[#c2ccd8] dark:shadow-[0_5px_18px_rgba(0,0,0,0.2)] dark:hover:border-[#69788a] dark:hover:text-white"
            aria-label="换一批首页推荐内容"
          >
            <IconRefresh size={16} className={`transition-transform duration-300 ${changing ? 'rotate-180' : 'group-hover:rotate-45'}`} aria-hidden="true" />
            <T zh="换一批" en="Show me more" />
          </button>
        </div>
      ) : null}
      {canLoadMoreScope ? (
        <div className="mt-6 flex flex-col items-center gap-3 border-t border-[#ded9cc] pt-6 dark:border-[#2c3540]">
          <button
            type="button"
            onClick={loadMoreScope}
            className="inline-flex h-10 items-center rounded-full border border-[#cfc7b6] bg-[#fffaf0] px-5 text-[13px] font-semibold text-[#5f563f] shadow-[0_5px_18px_rgba(56,49,38,0.08)] transition hover:-translate-y-0.5 hover:border-[#9e8c68] hover:text-[#2c2a23] dark:border-[#3a4654] dark:bg-[#18212c] dark:text-[#c2ccd8] dark:shadow-[0_5px_18px_rgba(0,0,0,0.2)] dark:hover:border-[#69788a] dark:hover:text-white"
          >
            <T zh="加载更多" en="Load more" />
          </button>
        </div>
      ) : null}
      {normalizedQuery && displayedItems.length ? (
        <div className="mt-5 flex justify-center border-t border-[#ded9cc] pt-5 dark:border-[#2c3540]">
          <button type="button" onClick={viewAllResults} className="inline-flex h-9 items-center rounded-full border border-[#d7d2c4] bg-white/70 px-4 text-[13px] font-medium text-[#5d594f] transition hover:border-[#8e846f] hover:text-[#211f1a] dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white">
            查看全部结果
          </button>
        </div>
      ) : null}
    </section>
    </H5PullToRefresh>
  )
}
