'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconRefresh, IconSearch, IconX } from '@tabler/icons-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  chooseHomeRecommendationBatch,
  DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS,
  getHomeRecommendationBatchNumber,
  HOME_RECOMMENDATION_MAX_BATCH_SIZE,
  mergeHomeRecommendationSettings,
  searchHomeRecommendationCatalog,
} from '../../../lib/homeRecommendationEngine'
import { trackSiteEvent } from '../../../lib/siteAnalytics'
import { T } from './LocaleProvider'

const SKELETON_ITEMS = Array.from({ length: 14 }, (_, index) => ({
  id: `recommendation-skeleton-${index}`,
  titleWidth: `${72 + ((index * 11) % 24)}%`,
  summaryWidth: `${58 + ((index * 17) % 34)}%`,
  summaryTailWidth: `${36 + ((index * 13) % 28)}%`,
}))

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
}

function FeaturedLink({ item, isPinned, desktopOnly = false, fromSearch = false, position = 0 }) {
  const content = (
    <>
      <div className="home-reading-meta">
        {isPinned ? <span className="home-badge home-badge-pinned"><T zh="置顶" en="Pinned" /></span> : null}
        {item.isLatest ? <span className="home-badge home-badge-latest"><T zh="最新" en="Latest" /></span> : null}
        <span className={SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column}>{item.sectionLabel}</span>
        {item.tagLabel ? <span className="home-badge home-badge-muted">{item.tagLabel}</span> : null}
        {item.date ? <time className="home-item-date">{item.date}</time> : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[18px] font-semibold leading-7 text-[#191813] transition-colors group-hover:text-[#6c4c1f] dark:text-[#f2f3ed] dark:group-hover:text-[#d5d8c4] md:text-[20px] md:leading-7">{item.title}</p>
      {item.summary ? <p className="mb-0 mt-1.5 line-clamp-2 text-[14px] leading-6 text-[#686a5f] dark:text-[#9ca6b4] md:text-[15px]">{item.summary}</p> : null}
    </>
  )
  const className = `home-reading-item group no-underline ${desktopOnly ? 'hidden md:block' : ''}`
  const analyticsProps = {
    'data-analytics-event': fromSearch ? 'search_result_click' : 'entry_click',
    'data-analytics-surface': fromSearch ? 'home_search' : 'home_recommendation',
    'data-analytics-destination-kind': item.section || 'content',
    'data-analytics-destination-id': item.id,
    'data-analytics-position': position,
  }
  return item.external || item.href?.startsWith('http')
    ? <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`} {...analyticsProps}>{content}</a>
    : <Link href={item.href} className={className} {...analyticsProps}>{content}</Link>
}

export default function HomeFeaturedReadingClient({ catalog, onReadyChange }) {
  const router = useRouter()
  const searchInputRef = useRef(null)
  const [settings, setSettings] = useState(DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS)
  const [settingsReady, setSettingsReady] = useState(false)
  const [automaticBatchNumber, setAutomaticBatchNumber] = useState(0)
  const [automaticBatchReady, setAutomaticBatchReady] = useState(false)
  const [batchOffset, setBatchOffset] = useState(0)
  const [changing, setChanging] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const batchNumber = automaticBatchNumber + batchOffset
  const previousIds = useMemo(
    () => batchNumber > 0
      ? chooseHomeRecommendationBatch(
        catalog,
        settings,
        batchNumber - 1,
        [],
        { includeHighlights: batchOffset === 1 },
      ).map((item) => item.id)
      : [],
    [batchNumber, batchOffset, catalog, settings],
  )
  const items = useMemo(
    () => chooseHomeRecommendationBatch(
      catalog,
      settings,
      batchNumber,
      previousIds,
      { includeHighlights: batchOffset === 0 },
    ),
    [batchNumber, batchOffset, catalog, previousIds, settings],
  )
  const normalizedQuery = query.trim()
  const searchResults = useMemo(
    () => searchHomeRecommendationCatalog(catalog, normalizedQuery, HOME_RECOMMENDATION_MAX_BATCH_SIZE),
    [catalog, normalizedQuery],
  )
  const displayedItems = normalizedQuery ? searchResults : items
  const pinnedIds = useMemo(() => new Set(settings.pinnedIds), [settings.pinnedIds])
  const recommendationsReady = settingsReady && automaticBatchReady

  // 在浏览器绘制前同步推荐列表，避免配置读取完成前发生内容切换。
  useLayoutEffect(() => {
    onReadyChange?.(recommendationsReady)
  }, [onReadyChange, recommendationsReady])

  useEffect(() => {
    let alive = true
    fetch('/api/recommendations/home', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!alive) return
        if (data?.settings) setSettings(mergeHomeRecommendationSettings(data.settings))
        setSettingsReady(true)
      })
      .catch(() => { if (alive) setSettingsReady(true) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!settingsReady) return undefined
    let timer
    const intervalMs = settings.autoRotateHours * 60 * 60 * 1000
    const syncAutomaticBatch = () => {
      setAutomaticBatchNumber(getHomeRecommendationBatchNumber(settings.autoRotateHours))
      setAutomaticBatchReady(true)
      const remaining = intervalMs - (Date.now() % intervalMs)
      timer = window.setTimeout(syncAutomaticBatch, remaining + 100)
    }
    syncAutomaticBatch()
    return () => window.clearTimeout(timer)
  }, [settings.autoRotateHours, settingsReady])

  const changeBatch = useCallback(() => {
    setChanging(true)
    setBatchOffset((value) => value + 1)
    window.setTimeout(() => setChanging(false), 260)
  }, [])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [])

  const clearSearch = useCallback(() => {
    setQuery('')
    setSearchOpen(false)
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
        || normalizedQuery
        || changing
        || eligibleCount <= items.length
      ) return

      const target = event.target
      if (target instanceof Element && target.closest('a, button, input, textarea, select, [contenteditable="true"], [role="button"]')) return

      event.preventDefault()
      changeBatch()
    }

    window.addEventListener('keydown', handlePageKeyDown)
    return () => window.removeEventListener('keydown', handlePageKeyDown)
  }, [changeBatch, changing, eligibleCount, items.length, normalizedQuery])

  if (!settings.enabled || !items.length) return null

  return (
    <section id="articles" className="home-featured-reading home-section scroll-mt-24">
      <div className="home-section-heading home-featured-heading">
        <div>
          <p className="home-kicker">01 · Writing</p>
          <h2 className="home-section-title"><T zh="文章" en="Articles" /></h2>
          <p className="home-section-description"><T zh="完整的研究、实践记录与长期写作" en="Research, field notes, and long-form writing" /></p>
        </div>
        <div className={`flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:translate-y-2 ${searchOpen ? 'sm:min-w-[22rem]' : ''}`}>
          {searchOpen ? (
            <div className="relative order-3 w-full sm:order-none sm:flex-1">
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
            <button type="button" onClick={openSearch} disabled={!recommendationsReady} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] disabled:cursor-wait disabled:opacity-45 dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white" aria-label="展开推荐搜索">
              <IconSearch size={15} aria-hidden="true" />
              <T zh="搜索" en="Search" />
            </button>
          )}
          {!normalizedQuery && eligibleCount > items.length ? (
            <button
              type="button"
              onClick={changeBatch}
              disabled={!recommendationsReady || changing}
              className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] disabled:cursor-wait disabled:opacity-45 dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white"
              aria-label="换一批首页推荐内容"
            >
              <IconRefresh size={15} className={`transition-transform duration-300 ${changing ? 'rotate-180' : 'group-hover:rotate-45'}`} aria-hidden="true" />
              <T zh="换一批" en="Show me more" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative" aria-busy={!recommendationsReady}>
        <div
          className={`home-reading-list transition-opacity duration-200 ${recommendationsReady ? (changing ? 'opacity-55' : 'opacity-100') : 'invisible opacity-0'}`}
          aria-hidden={!recommendationsReady}
          aria-live="polite"
        >
          {displayedItems.map((item, index) => (
            <FeaturedLink
              key={item.id}
              item={item}
              isPinned={batchOffset === 0 && pinnedIds.has(item.id)}
              desktopOnly={!normalizedQuery && index >= 10}
              fromSearch={Boolean(normalizedQuery)}
              position={index + 1}
            />
          ))}
          {normalizedQuery && !displayedItems.length ? (
            <div className="py-10 text-center text-[14px] text-[#77746a] dark:text-[#98a3b1]">
              没有找到与“{normalizedQuery}”匹配的内容
            </div>
          ) : null}
        </div>
        {!recommendationsReady ? (
          <div className="home-reading-skeleton" role="status" aria-label="正在加载推荐内容">
            {SKELETON_ITEMS.map((item, index) => (
              <div
                key={item.id}
                className={`home-reading-skeleton-item ${index >= 10 ? 'hidden md:block' : ''}`}
                style={{ '--skeleton-index': index }}
                aria-hidden="true"
              >
                <div className="home-reading-skeleton-meta">
                  <span className="home-skeleton-block w-12" />
                  <span className="home-skeleton-block w-16" />
                  <span className="home-skeleton-block w-20" />
                </div>
                <span className="home-skeleton-block home-skeleton-title" style={{ width: item.titleWidth }} />
                <span className="home-skeleton-block home-skeleton-summary" style={{ width: item.summaryWidth }} />
                <span className="home-skeleton-block home-skeleton-summary-tail" style={{ width: item.summaryTailWidth }} />
              </div>
            ))}
            <span className="sr-only">正在加载推荐内容</span>
          </div>
        ) : null}
      </div>
      {!normalizedQuery && eligibleCount > items.length ? (
        <div className="mt-6 flex flex-col items-center gap-3 border-t border-[#ded9cc] pt-6 dark:border-[#2c3540]">
          <p className="mb-0 text-[12px] font-medium tracking-[0.08em] text-[#77746a] dark:text-[#98a3b1]">
            <T zh="已经看到这里了，再发现一些内容" en="You made it here. Discover something else" />
          </p>
          <button
            type="button"
            onClick={changeBatch}
            disabled={!recommendationsReady || changing}
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#cfc7b6] bg-[#fffaf0] px-5 text-[13px] font-semibold text-[#5f563f] shadow-[0_5px_18px_rgba(56,49,38,0.08)] transition hover:-translate-y-0.5 hover:border-[#9e8c68] hover:text-[#2c2a23] disabled:cursor-wait disabled:opacity-45 dark:border-[#3a4654] dark:bg-[#18212c] dark:text-[#c2ccd8] dark:shadow-[0_5px_18px_rgba(0,0,0,0.2)] dark:hover:border-[#69788a] dark:hover:text-white"
            aria-label="换一批首页推荐内容"
          >
            <IconRefresh size={16} className={`transition-transform duration-300 ${changing ? 'rotate-180' : 'group-hover:rotate-45'}`} aria-hidden="true" />
            <T zh="换一批" en="Show me more" />
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
  )
}
