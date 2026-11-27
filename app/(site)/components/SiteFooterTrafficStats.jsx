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

  const items = stats
    ? [
        {
          key: 'total',
          value: formatCount(stats.totalPv, locale),
          label: pick(locale, '总浏览', 'Total views'),
          hint: pick(locale, 'Umami · 历史累计 PV', 'Umami · all-time pageviews'),
        },
        {
          key: 'week-pv',
          value: formatCount(stats.weekPv, locale),
          label: pick(locale, '7 日 PV', '7d PV'),
          hint: pick(locale, '近 7 天页面浏览', 'Pageviews in the last 7 days'),
        },
        {
          key: 'week-uv',
          value: formatCount(stats.weekUv, locale),
          label: pick(locale, '7 日 UV', '7d UV'),
          hint: pick(locale, '近 7 天访客', 'Visitors in the last 7 days'),
        },
      ]
    : [
        { key: 'placeholder-1', value: '—', label: pick(locale, '总浏览', 'Total views'), hint: '' },
        { key: 'placeholder-2', value: '—', label: pick(locale, '7 日 PV', '7d PV'), hint: '' },
        { key: 'placeholder-3', value: '—', label: pick(locale, '7 日 UV', '7d UV'), hint: '' },
      ]

  return (
    <p
      className={[
        'site-footer-traffic-stats mt-5 max-w-md text-[13px] leading-relaxed text-[var(--site-muted)]',
        !stats ? 'opacity-80' : '',
        className,
      ].join(' ')}
      aria-label={pick(locale, '本站访问数据', 'Site visit stats')}
      aria-busy={!stats}
    >
      <Link
        href="/traffic"
        className="font-semibold text-[var(--site-ink)] underline decoration-[var(--site-line)] underline-offset-[3px] transition-colors hover:text-[var(--site-ink)] hover:decoration-[var(--site-muted)]"
        title={pick(locale, '查看完整访问统计', 'Open traffic dashboard')}
      >
        {pick(locale, '访问统计', 'Traffic')}
      </Link>
      <span className="text-[var(--site-faint)]" aria-hidden="true">
        {' · '}
      </span>
      {items.map((item, index) => (
        <span key={item.key}>
          {index > 0 ? (
            <span className="text-[var(--site-faint)]" aria-hidden="true">
              {' · '}
            </span>
          ) : null}
          <span title={item.hint || undefined}>
            <span className="font-medium tabular-nums text-[var(--site-ink)]">{item.value}</span>
            <span className="ml-1 text-[var(--site-faint)]">{item.label}</span>
          </span>
        </span>
      ))}
    </p>
  )
}