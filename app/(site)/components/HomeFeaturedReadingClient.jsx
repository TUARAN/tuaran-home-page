'use client'

import Link from 'next/link'
import { IconRefresh } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  chooseHomeRecommendationBatch,
  DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS,
  mergeHomeRecommendationSettings,
} from '../../../lib/homeRecommendationEngine'
import { T } from './LocaleProvider'

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
  feed: 'home-badge home-badge-feed',
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
  const [settings, setSettings] = useState(DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS)
  const [batchNumber, setBatchNumber] = useState(0)
  const [previousIds, setPreviousIds] = useState([])
  const [changing, setChanging] = useState(false)
  const items = useMemo(
    () => chooseHomeRecommendationBatch(catalog, settings, batchNumber, previousIds),
    [catalog, settings, batchNumber, previousIds],
  )

  useEffect(() => {
    let alive = true
    fetch('/api/recommendations/home', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (alive && data?.settings) setSettings(mergeHomeRecommendationSettings(data.settings)) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const changeBatch = useCallback(() => {
    setChanging(true)
    setPreviousIds(items.map((item) => item.id))
    setBatchNumber((value) => value + 1)
    window.setTimeout(() => setChanging(false), 260)
  }, [items])

  if (!settings.enabled || !items.length) return null
  const eligibleCount = catalog.filter((item) => settings.sources[item.section]?.enabled !== false).length

  return (
    <section className="home-featured-reading home-section">
      <div className="home-section-heading">
        <div>
          <p className="home-kicker">Start here</p>
          <h2 className="home-section-title"><T zh="先读这几篇" en="Start with these" /></h2>
        </div>
        <button
          type="button"
          onClick={changeBatch}
          disabled={eligibleCount <= items.length || changing}
          className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7d2c4] bg-white/70 px-3 text-[13px] font-medium text-[#69675e] transition hover:border-[#8e846f] hover:text-[#2c2a23] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#313a45] dark:bg-[#121923] dark:text-[#aeb8c5] dark:hover:border-[#69788a] dark:hover:text-white"
          aria-label="换一批推荐内容"
        >
          <IconRefresh size={15} className={`transition-transform duration-300 ${changing ? 'rotate-180' : 'group-hover:rotate-45'}`} aria-hidden="true" />
          <T zh="换一批" en="Refresh" />
        </button>
      </div>
      <div className={`home-reading-list transition-opacity duration-200 ${changing ? 'opacity-55' : 'opacity-100'}`} aria-live="polite">
        {items.map((item) => <FeaturedLink key={item.id} item={item} />)}
      </div>
    </section>
  )
}
