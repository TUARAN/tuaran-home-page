'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { pick } from '../../../lib/site/i18n'
import { useLocale } from './LocaleProvider'

function formatCount(value, locale) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '—'
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    notation: n >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: n >= 10_000 ? 1 : 0,
  }).format(n)
}

function StatPair({ value, label, hint, prominent = false }) {
  return (
    <span className="inline-flex items-baseline gap-1.5" title={hint || undefined}>
      <span
        className={[
          'tabular-nums text-[var(--site-ink)]',
          prominent ? 'text-[17px] font-semibold leading-none tracking-tight sm:text-[18px]' : 'text-[13px] font-medium',
        ].join(' ')}
      >
        {value}
      </span>
      <span className={prominent ? 'text-[12px] text-[var(--site-muted)]' : 'text-[12px] text-[var(--site-faint)]'}>
        {label}
      </span>
    </span>
  )
}

export default function SiteFooterTrafficStats({ className = '' }) {
  const { locale } = useLocale()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/api/site-traffic-stats', { cache: 'default' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active && payload?.status === 'ok') setStats(payload)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const totalValue = formatCount(stats?.totalPv, locale)
  const weekPvValue = formatCount(stats?.weekPv, locale)
  const weekUvValue = formatCount(stats?.weekUv, locale)
  const totalLabel = pick(locale, '总浏览', 'Total views')
  const weekPvLabel = pick(locale, '7 日 PV', '7d PV')
  const weekUvLabel = pick(locale, '7 日 UV', '7d UV')

  return (
    <div
      className={[
        'site-footer-traffic-stats mt-5 max-w-xs text-[13px] leading-snug',
        !stats ? 'opacity-80' : '',
        className,
      ].join(' ')}
      aria-label={pick(locale, '本站访问数据', 'Site visit stats')}
      aria-busy={!stats}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Link
          href="/traffic"
          className="shrink-0 text-[13px] font-semibold text-[var(--site-ink)] underline decoration-[var(--site-line)] underline-offset-[3px] transition-colors hover:decoration-[var(--site-muted)]"
          title={pick(locale, '查看完整访问统计', 'Open traffic dashboard')}
        >
          {pick(locale, '访问统计', 'Traffic')}
        </Link>
        <StatPair
          value={totalValue}
          label={totalLabel}
          hint={pick(locale, 'Umami · 历史累计 PV', 'Umami · all-time pageviews')}
          prominent
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[var(--site-muted)]">
        <StatPair
          value={weekPvValue}
          label={weekPvLabel}
          hint={pick(locale, '近 7 天页面浏览', 'Pageviews in the last 7 days')}
        />
        <StatPair
          value={weekUvValue}
          label={weekUvLabel}
          hint={pick(locale, '近 7 天访客', 'Visitors in the last 7 days')}
        />
      </div>
    </div>
  )
}