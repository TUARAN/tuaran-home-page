'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function DirectoryLink({ item, className, children }) {
  const analyticsProps = item.analyticsEvent ? {
    'data-analytics-event': item.analyticsEvent,
    'data-analytics-surface': item.analyticsSurface || 'grouped_directory',
    'data-analytics-destination-kind': item.analyticsDestinationKind || 'page',
    'data-analytics-destination-id': item.id || item.href,
    'data-analytics-action': item.analyticsAction || 'open',
    'data-analytics-delivery': item.analyticsDelivery || '',
  } : {}
  if (item.external || isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`} {...analyticsProps}>
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className} {...analyticsProps}>
      {children}
    </Link>
  )
}

export function DirectoryBadge({ badge }) {
  return (
    <span
      className={[
        'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        badge.mono === false ? '' : 'font-mono uppercase tracking-[0.08em]',
        badge.className ||
          'border-[#ded8ca] bg-white/55 text-[#68645a] dark:border-[#303947] dark:bg-[#101721] dark:text-[#aab4c2]',
      ].join(' ')}
    >
      {badge.label}
    </span>
  )
}

function formatPv(pv) {
  if (pv === null || typeof pv === 'undefined') return '-'
  const n = Number(pv)
  if (!Number.isFinite(n) || n < 0) return '-'
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

function DirectoryRow({ item, actionLabel, pv }) {
  const badges = item.badges || []

  return (
    <DirectoryLink
      item={item}
      className="group grid gap-1 px-3 py-2.5 no-underline transition hover:bg-[#fffdf7] dark:hover:bg-[#121b26] md:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-3 md:px-3.5 md:py-3"
    >
      <div className="min-w-0 md:pr-4">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="mb-0 text-[15px] font-semibold leading-snug text-[#1d1a16] transition group-hover:text-[#2f6f73] dark:text-white dark:group-hover:text-[#77c6c2] md:text-[15px] md:font-bold">
            {item.title}
          </h3>
          {item.mobileBadge ? <span className="md:hidden"><DirectoryBadge badge={item.mobileBadge} /></span> : null}
          {item.pvKey ? (
            <span className="font-mono text-[10px] text-[#8a877d] dark:text-[#7e8a9b] md:hidden">
              阅读量 {formatPv(pv)}
            </span>
          ) : null}
        </div>
        <p className="mb-0 line-clamp-1 overflow-hidden text-[13px] leading-5 text-[#68665e] dark:text-[#a4adba] md:line-clamp-none md:overflow-visible md:leading-6">
          {item.summary}
        </p>
      </div>

      <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex md:justify-end">
        {badges.map((badge) => <DirectoryBadge key={`${item.id}-${badge.label}`} badge={badge} />)}
        {item.pvKey ? <DirectoryBadge badge={{ label: `阅读量 ${formatPv(pv)}`, mono: false }} /> : null}
        <span className="ml-1 text-[13px] font-semibold text-[#8a6422] transition group-hover:text-[#3a2c14] dark:text-[#d4ae66] dark:group-hover:text-[#f2d8a5]">
          {item.actionLabel || actionLabel} →
        </span>
      </div>
    </DirectoryLink>
  )
}

export default function GroupedDirectoryPage({
  eyebrow,
  title,
  description,
  headerActions,
  sections,
  actionLabel = '打开',
}) {
  const total = sections.reduce((count, section) => count + section.items.length, 0)
  const pvKeys = useMemo(
    () => Array.from(new Set(
      sections.flatMap((section) => section.items.map((item) => item.pvKey).filter(Boolean)),
    )),
    [sections],
  )
  const pvKeySignature = pvKeys.join(',')
  const [pvCounts, setPvCounts] = useState({})

  useEffect(() => {
    if (!pvKeySignature) return undefined

    let cancelled = false
    fetch(`/api/research-pv?keys=${encodeURIComponent(pvKeySignature)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.counts) setPvCounts(data.counts)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [pvKeySignature])

  return (
    <main className="h5-directory-page min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <header className="mx-auto max-w-[1100px] px-4 pb-2 pt-3 md:pb-4 md:pt-9 sm:px-6 lg:px-8">
        <p className="mb-3 hidden font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66] md:block">
          {eyebrow}
        </p>
        <div className="flex flex-col gap-1 md:gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-0 text-[18px] font-bold leading-tight text-[#15130e] dark:text-white md:mb-3 md:font-serif md:text-[38px] lg:text-[48px]">
              {title}
            </h1>
            <div className="hidden max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be] md:block">{description}</div>
          </div>
          <div className="hidden shrink-0 flex-wrap items-center gap-3 text-sm md:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a877d] dark:text-[#7e8a9b]">
              {sections.length} 类 · {total} 项
            </span>
            {headerActions}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 py-2 md:py-5 sm:px-6 lg:px-8">
        <div className="space-y-4 md:space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.anchor || section.id}
              className="scroll-mt-[calc(var(--site-header-height)+16px)] grid gap-2 border-t border-[#d8d1c4] pt-4 dark:border-[#27313d] md:gap-3 md:pt-6 lg:grid-cols-[220px_minmax(0,1fr)]"
            >
              <div>
                <div className="sticky top-[calc(var(--site-header-height)+16px)]">
                  <p className="mb-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a6422] dark:text-[#d4ae66] lg:block">
                    {section.titleEn}
                  </p>
                  <div className="flex items-baseline gap-2 lg:block">
                    <h2 className="mb-0 text-[13px] font-semibold md:text-[20px] md:font-bold">{section.title}</h2>
                    <span className="text-[12px] text-[#8a877d] dark:text-[#7e8a9b] lg:mt-1 lg:block">
                      {section.items.length} 个
                    </span>
                  </div>
                  <p className="mb-0 mt-2 hidden text-[13px] leading-6 text-[#69665c] dark:text-[#9ca7b6] lg:block">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#e8e1d5] overflow-hidden rounded-lg border border-[#ded8ca] bg-white/60 dark:divide-[#252e38] dark:border-[#252e38] dark:bg-[#101720]/[0.72]">
                {section.items.map((item) => (
                  <DirectoryRow
                    key={item.id}
                    item={item}
                    actionLabel={actionLabel}
                    pv={item.pvKey ? pvCounts[item.pvKey] : null}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
