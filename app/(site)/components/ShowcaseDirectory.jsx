'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  IconActivity,
  IconArrowUpRight,
  IconBooks,
  IconBrain,
  IconBrandX,
  IconChartDots3,
  IconClock,
  IconCode,
  IconCpu,
  IconDownload,
  IconGridDots,
  IconLayoutList,
  IconListSearch,
  IconSearch,
  IconSparkles,
  IconTools,
  IconWorld,
} from '@tabler/icons-react'

import SharePageButton from './SharePageButton'

const ICONS = {
  activity: IconActivity,
  books: IconBooks,
  brain: IconBrain,
  chart: IconChartDots3,
  clock: IconClock,
  code: IconCode,
  cpu: IconCpu,
  download: IconDownload,
  list: IconListSearch,
  sparkles: IconSparkles,
  tools: IconTools,
  world: IconWorld,
  x: IconBrandX,
}

function isExternal(href) {
  return /^https?:\/\//.test(href || '')
}

function formatPv(pv) {
  const count = Number(pv)
  if (!Number.isFinite(count) || count < 0) return '—'
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(count)
}

function ItemLink({ item, className, children, config }) {
  const analytics = {
    'data-analytics-event': config.analyticsEvent || 'entry_click',
    'data-analytics-surface': config.analyticsSurface,
    'data-analytics-destination-kind': config.destinationKind,
    'data-analytics-destination-id': item.id,
  }

  if (item.external || isExternal(item.href)) {
    return <a href={item.href} target="_blank" rel="noreferrer" className={`${className} no-external-arrow`} {...analytics}>{children}</a>
  }
  return <Link href={item.href} className={className} {...analytics}>{children}</Link>
}

function Cover({ item, visuals, compact = false }) {
  const visual = visuals[item.category] || visuals.default
  const Icon = ICONS[visual?.icon] || IconTools

  return (
    <div className={`showcase-cover relative overflow-hidden bg-gradient-to-br ${visual?.cover || 'from-[#e8e4dc] to-[#f5f3ee] text-[#655e52] dark:from-[#24282c] dark:to-[#15191d] dark:text-[#c4c8cc]'} ${compact ? 'h-full min-h-[132px]' : 'aspect-[16/9]'}`}>
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-current opacity-10" />
      <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-current opacity-[0.06] blur-2xl" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="showcase-cover-inner relative flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-black tracking-[0.2em] opacity-70">{visual?.eyebrow || 'OPEN'}</span>
          <Icon size={compact ? 22 : 26} stroke={1.6} aria-hidden="true" />
        </div>
        <div>
          <p className={`mb-0 max-w-[88%] font-bold leading-tight ${compact ? 'line-clamp-2 text-[20px]' : 'line-clamp-2 text-[23px] md:text-[26px]'}`}>{item.title}</p>
          <span className="mt-3 inline-block rounded-full border border-current px-2.5 py-1 text-[10px] font-semibold opacity-70">
            {item.coverLabel || item.categoryLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

function ItemMeta({ item }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--site-faint)]">
      {(item.meta || []).map((value, index) => (
        <span key={`${value}-${index}`} className="contents">
          {index ? <span>·</span> : null}
          <span>{value}</span>
        </span>
      ))}
      {item.badgeLabel ? (
        <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${item.badgeTone || 'bg-[#17181c] text-white dark:bg-[#d9deca] dark:text-[#151713]'}`}>
          {item.badgeLabel}
        </span>
      ) : null}
    </div>
  )
}

function Metric({ item, pv }) {
  if (item.pvKey) return <span>阅读量 {formatPv(pv)}</span>
  return item.metricLabel ? <span>{item.metricLabel}</span> : null
}

function Card({ item, pv, visuals, config }) {
  return (
    <ItemLink item={item} config={config} className="showcase-card group overflow-hidden rounded-2xl border border-[#d8d9d5] bg-white/70 text-[var(--site-ink)] no-underline shadow-[0_1px_0_rgba(20,20,20,0.03)] transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_14px_34px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/80 dark:hover:border-[#4d5967]">
      <Cover item={item} visuals={visuals} />
      <div className="showcase-card-body p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <ItemMeta item={item} />
            <h2 className="mb-0 line-clamp-2 text-[18px] font-bold leading-snug transition group-hover:text-[var(--site-accent-strong)]">{item.title}</h2>
          </div>
          <IconArrowUpRight className="mt-1 shrink-0 opacity-45 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" size={18} />
        </div>
        <p className="mb-0 mt-3 line-clamp-2 text-[13px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e7e5df] pt-3 text-[11px] text-[var(--site-faint)] dark:border-[#2a333d]">
          <span className="line-clamp-1">{item.footerLabel}</span>
          <Metric item={item} pv={pv} />
        </div>
      </div>
    </ItemLink>
  )
}

function ListCard({ item, pv, visuals, config }) {
  return (
    <ItemLink item={item} config={config} className="group grid overflow-hidden rounded-2xl border border-[#d8d9d5] bg-white/70 text-[var(--site-ink)] no-underline transition hover:border-[#aeb1aa] hover:shadow-[0_10px_28px_rgba(34,31,25,0.08)] dark:border-[#2b333e] dark:bg-[#111821]/80 dark:hover:border-[#4d5967] md:grid-cols-[280px_minmax(0,1fr)]">
      <Cover item={item} visuals={visuals} compact />
      <div className="flex min-w-0 flex-col justify-between p-5 md:p-6">
        <div>
          <ItemMeta item={item} />
          <h2 className="mb-0 text-[20px] font-bold leading-snug transition group-hover:text-[var(--site-accent-strong)]">{item.title}</h2>
          <p className="mb-0 mt-2 line-clamp-2 text-[13px] leading-6 text-[var(--site-muted)]">{item.summary}</p>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--site-faint)]">
          <Metric item={item} pv={pv} />
          <span className="flex items-center gap-1 font-semibold text-[var(--site-ink)]">{config.actionLabel} <IconArrowUpRight size={15} /></span>
        </div>
      </div>
    </ItemLink>
  )
}

export default function ShowcaseDirectory({ items, categories, visuals, config, secondaryFilter }) {
  const [category, setCategory] = useState('all')
  const [secondary, setSecondary] = useState('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grid')
  const [pvCounts, setPvCounts] = useState({})

  const pvKeySignature = useMemo(() => items.map((item) => item.pvKey).filter(Boolean).join(','), [items])
  useEffect(() => {
    if (!pvKeySignature) return undefined
    let cancelled = false
    fetch(`/api/research-pv?keys=${encodeURIComponent(pvKeySignature)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!cancelled && data?.counts) setPvCounts(data.counts) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pvKeySignature])

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (secondaryFilter && secondary !== 'all' && item[secondaryFilter.field] !== secondary) return false
      if (!keyword) return true
      return [item.title, item.summary, item.coverLabel, item.categoryLabel, ...(item.tags || [])].join(' ').toLowerCase().includes(keyword)
    })
  }, [category, items, query, secondary, secondaryFilter])

  const hasFilters = query || category !== 'all' || secondary !== 'all'
  function clearFilters() {
    setCategory('all')
    setSecondary('all')
    setQuery('')
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--site-ink)]">
      <div className="mx-auto max-w-[1240px] px-3 pb-16 pt-5 sm:px-6 md:pt-12 lg:px-8">
        <header className="flex flex-col gap-7 border-b border-[#d9d9d4] pb-8 dark:border-[#2b333e] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">{config.eyebrow}</p>
            <h1 className="mb-2 text-[38px] font-black tracking-[-0.04em] text-[#17181c] dark:text-white md:text-[52px]">{config.title}</h1>
            <p className="mb-0 max-w-2xl text-[15px] leading-7 text-[var(--site-muted)] md:text-[16px]">{config.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#d7d8d3] px-3 py-1.5 font-mono text-[11px] text-[var(--site-faint)] dark:border-[#343d48]">{items.length} {config.countLabel}</span>
            {config.share ? <SharePageButton {...config.share} size="md" /> : null}
          </div>
        </header>

        <section aria-label={config.filterAriaLabel} className="sticky top-[var(--site-header-height)] z-20 -mx-4 mb-8 border-b border-[#dedfd9] bg-[color-mix(in_srgb,var(--page-bg)_92%,transparent)] px-4 py-4 backdrop-blur-xl dark:border-[#27303a] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1176px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-[#e7e8e5] p-1 dark:bg-[#1d2630]" aria-label="视图方式">
                <button type="button" onClick={() => setView('grid')} aria-label="卡片视图" aria-pressed={view === 'grid'} className={`rounded-lg p-2 transition ${view === 'grid' ? 'bg-[#17181c] text-white shadow-sm dark:bg-[#d9deca] dark:text-[#151713]' : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`}><IconGridDots size={17} /></button>
                <button type="button" onClick={() => setView('list')} aria-label="列表视图" aria-pressed={view === 'list'} className={`rounded-lg p-2 transition ${view === 'list' ? 'bg-[#17181c] text-white shadow-sm dark:bg-[#d9deca] dark:text-[#151713]' : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`}><IconLayoutList size={17} /></button>
              </div>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border-0 bg-[#e7e8e5] px-3 text-[13px] font-medium text-[#56595f] outline-none ring-[var(--site-accent)] focus:ring-2 dark:bg-[#1d2630] dark:text-[#c7ced7]" aria-label="按类别筛选">
                <option value="all">类别 · 全部</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              {secondaryFilter ? (
                <select value={secondary} onChange={(event) => setSecondary(event.target.value)} className="h-10 rounded-xl border-0 bg-[#e7e8e5] px-3 text-[13px] font-medium text-[#56595f] outline-none ring-[var(--site-accent)] focus:ring-2 dark:bg-[#1d2630] dark:text-[#c7ced7]" aria-label={secondaryFilter.ariaLabel}>
                  <option value="all">{secondaryFilter.label} · 全部</option>
                  {secondaryFilter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : null}
            </div>
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl bg-[#e7e8e5] px-3 text-[var(--site-muted)] dark:bg-[#1d2630] lg:w-[300px]">
              <IconSearch size={18} className="shrink-0" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={config.searchPlaceholder} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-[var(--site-ink)] outline-none placeholder:text-[var(--site-faint)]" />
            </label>
          </div>
        </section>

        <div className="mb-5 flex items-center gap-4">
          <h2 className="mb-0 text-[17px] font-bold">{hasFilters ? '筛选结果' : config.resultTitle}</h2>
          <span className="text-[12px] text-[var(--site-faint)]">{filteredItems.length} 个</span>
          <div className="h-px flex-1 bg-[#dedfd9] dark:bg-[#27303a]" />
        </div>

        {filteredItems.length ? (
          <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredItems.map((item) => view === 'grid'
              ? <Card key={item.id} item={item} pv={pvCounts[item.pvKey]} visuals={visuals} config={config} />
              : <ListCard key={item.id} item={item} pv={pvCounts[item.pvKey]} visuals={visuals} config={config} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfd1cb] px-6 py-20 text-center dark:border-[#37414c]">
            <p className="mb-1 text-[16px] font-bold">没有找到匹配的内容</p>
            <p className="mb-4 text-[13px] text-[var(--site-muted)]">换一个关键词或清除筛选条件。</p>
            <button type="button" onClick={clearFilters} className="rounded-full bg-[#17181c] px-4 py-2 text-[12px] font-semibold text-white dark:bg-[#d9deca] dark:text-[#151713]">清除筛选</button>
          </div>
        )}
      </div>
    </main>
  )
}
