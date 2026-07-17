'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconRefresh, IconSearch, IconX } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  chooseHomeRecommendationBatch,
  DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS,
  getHomeRecommendationBatchNumber,
  mergeHomeRecommendationSettings,
  searchHomeRecommendationCatalog,
} from '../../../lib/homeRecommendationEngine'
import { T } from './LocaleProvider'

const DAILY_BATCH_STORAGE_KEY = 'tuaran:home-recommendation-batch'

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
  feed: 'home-badge home-badge-feed',
}

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readStoredBatchState() {
  try {
    const value = JSON.parse(window.localStorage.getItem(DAILY_BATCH_STORAGE_KEY) || 'null')
    if (!value || typeof value.day !== 'string' || !Number.isSafeInteger(value.offset) || value.offset < 0) return null
    return value
  } catch {
    return null
  }
}

function storeBatchState(day, offset) {
  try {
    window.localStorage.setItem(DAILY_BATCH_STORAGE_KEY, JSON.stringify({ day, offset }))
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }
}

function FeaturedLink({ item }) {
  const content = (
    <>
      <div className="home-reading-meta">
        {item.isLatest ? <span className="home-badge home-badge-latest"><T zh="最新" en="Latest" /></span> : null}
        <span className={SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column}>{item.sectionLabel}</span>
        {item.tagLabel ? <span className="home-badge home-badge-muted">{item.tagLabel}</span> : null}
        {item.date ? <time className="home-item-date">{item.date}</time> : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[18px] font-semibold leading-7 text-[#191813] transition-colors group-hover:text-[#6c4c1f] dark:text-[#f2f3ed] dark:group-hover:text-[#d5d8c4] md:text-[20px] md:leading-8">{item.title}</p>
      {item.summary ? <p className="mb-0 mt-2 line-clamp-2 text-[14px] leading-7 text-[#686a5f] dark:text-[#9ca6b4] md:text-[15px]">{item.summary}</p> : null}
    </>
  )
  const className = 'home-reading-item group no-underline'
  return item.external || item.href?.startsWith('http')
    ? <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>{content}</a>
    : <Link href={item.href} className={className}>{content}</Link>
}

export default function HomeFeaturedReadingClient({ catalog }) {
  const router = useRouter()
  const searchInputRef = useRef(null)
  const [settings, setSettings] = useState(DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS)
  const [automaticBatchNumber, setAutomaticBatchNumber] = useState(0)
  const [batchOffset, setBatchOffset] = useState(0)
  const [batchStateReady, setBatchStateReady] = useState(false)
  const [changing, setChanging] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const batchNumber = automaticBatchNumber + batchOffset
  const previousIds = useMemo(
    () => batchNumber > 0
      ? chooseHomeRecommendationBatch(catalog, settings, batchNumber - 1, []).map((item) => item.id)
      : [],
    [batchNumber, catalog, settings],
  )
  const items = useMemo(
    () => chooseHomeRecommendationBatch(catalog, settings, batchNumber, previousIds),
    [batchNumber, catalog, previousIds, settings],
  )
  const normalizedQuery = query.trim()
  const searchResults = useMemo(
    () => searchHomeRecommendationCatalog(catalog, normalizedQuery, 10),
    [catalog, normalizedQuery],
  )
  const displayedItems = normalizedQuery ? searchResults : items

  useEffect(() => {
    let alive = true
    fetch('/api/recommendations/home', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (alive && data?.settings) setSettings(mergeHomeRecommendationSettings(data.settings)) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let timer
    const intervalMs = settings.autoRotateHours * 60 * 60 * 1000
    const syncAutomaticBatch = () => {
      setAutomaticBatchNumber(getHomeRecommendationBatchNumber(settings.autoRotateHours))
      const remaining = intervalMs - (Date.now() % intervalMs)
      timer = window.setTimeout(syncAutomaticBatch, remaining + 100)
    }
    syncAutomaticBatch()
    return () => window.clearTimeout(timer)
  }, [settings.autoRotateHours])

  useEffect(() => {
    const today = getLocalDayKey()
    const stored = readStoredBatchState()
    const nextOffset = stored
      ? stored.offset + (stored.day === today ? 0 : 1)
      : 0
    setBatchOffset(nextOffset)
    storeBatchState(today, nextOffset)
    setBatchStateReady(true)
  }, [])

  useEffect(() => {
    if (!batchStateReady) return
    storeBatchState(getLocalDayKey(), batchOffset)
  }, [batchOffset, batchStateReady])

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
    router.push(`/articles?q=${encodeURIComponent(normalizedQuery)}`)
  }, [normalizedQuery, router])

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      clearSearch()
    } else if (event.key === 'Enter' && normalizedQuery) {
      event.preventDefault()
      viewAllResults()
    }
  }, [clearSearch, normalizedQuery, viewAllResults])

  if (!settings.enabled || !items.length) return null
  const eligibleCount = catalog.filter((item) => settings.sources[item.section]?.enabled !== false).length

  return (
    <section className="home-featured-reading home-section">
      <div className="home-section-heading">
        <div>
          <p className="home-kicker">Start here</p>
          <h2 className="home-section-title"><T zh="先读这几篇" en="Start with these" /></h2>
        </div>
        <div className={`flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto ${searchOpen ? 'sm:min-w-[22rem]' : ''}`}>
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
            <button type="button" onClick={openSearch} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white" aria-label="展开推荐搜索">
              <IconSearch size={15} aria-hidden="true" />
              <T zh="搜索" en="Search" />
            </button>
          )}
          <button
            type="button"
            onClick={changeBatch}
            disabled={Boolean(normalizedQuery) || eligibleCount <= items.length || changing}
            className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white"
            aria-label={normalizedQuery ? '搜索时暂停换一批' : '换一批推荐内容'}
          >
            <IconRefresh size={15} className={`transition-transform duration-300 ${changing ? 'rotate-180' : 'group-hover:rotate-45'}`} aria-hidden="true" />
            <T zh="换一批" en="Refresh" />
          </button>
        </div>
      </div>
      <div className={`home-reading-list transition-opacity duration-200 ${changing ? 'opacity-55' : 'opacity-100'}`} aria-live="polite">
        {displayedItems.map((item) => <FeaturedLink key={item.id} item={item} />)}
        {normalizedQuery && !displayedItems.length ? (
          <div className="py-10 text-center text-[14px] text-[#77746a] dark:text-[#98a3b1]">
            没有找到与“{normalizedQuery}”匹配的内容
          </div>
        ) : null}
      </div>
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
