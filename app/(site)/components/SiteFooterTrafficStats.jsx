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
    : null

  return (
    <Link
      href="/traffic"
      className={[
        'group mt-5 inline-flex max-w-full flex-col gap-2 no-underline hover:no-underline sm:max-w-md',
        className,
      ].join(' ')}
      title={pick(locale, '查看完整访问统计', 'Open traffic dashboard')}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--site-faint)] transition-colors group-hover:text-[var(--site-muted)]">
        {pick(locale, '访问统计', 'Traffic')}
      </span>
      <span
        className={[
          'site-footer-traffic-stats grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[var(--site-line)]',
          'bg-[var(--site-line)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--site-ink)_4%,transparent)]',
          !items ? 'opacity-70' : '',
        ].join(' ')}
        aria-label={pick(locale, '本站访问数据', 'Site visit stats')}
        aria-busy={!items}
      >
        {(items || [
          { key: 'placeholder-1', value: '—', label: pick(locale, '总浏览', 'Total views'), hint: '' },
          { key: 'placeholder-2', value: '—', label: pick(locale, '7 日 PV', '7d PV'), hint: '' },
          { key: 'placeholder-3', value: '—', label: pick(locale, '7 日 UV', '7d UV'), hint: '' },
        ]).map((item) => (
          <span
            key={item.key}
            className="flex min-w-0 flex-col items-center gap-0.5 bg-[color-mix(in_srgb,var(--site-panel)_92%,transparent)] px-2 py-2.5 text-center transition-colors group-hover:bg-[color-mix(in_srgb,var(--site-panel)_98%,transparent)]"
            title={item.hint || undefined}
          >
            <strong className="font-serif text-base font-semibold tabular-nums leading-none text-[var(--site-ink)]">
              {item.value}
            </strong>
            <small className="text-[10px] leading-tight text-[var(--site-muted)]">{item.label}</small>
          </span>
        ))}
      </span>
    </Link>
  )
}