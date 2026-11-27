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

  const row = items || [
    { key: 'placeholder-1', value: '—', label: pick(locale, '总浏览', 'Total views'), hint: '' },
    { key: 'placeholder-2', value: '—', label: pick(locale, '7 日 PV', '7d PV'), hint: '' },
    { key: 'placeholder-3', value: '—', label: pick(locale, '7 日 UV', '7d UV'), hint: '' },
  ]

  return (
    <Link
      href="/traffic"
      className={[
        'group mt-6 block w-full max-w-sm no-underline hover:no-underline',
        className,
      ].join(' ')}
      title={pick(locale, '查看完整访问统计', 'Open traffic dashboard')}
    >
      <div
        className={[
          'site-footer-traffic-stats rounded-2xl border border-[color-mix(in_srgb,var(--site-line)_85%,var(--site-ink))]',
          'bg-[color-mix(in_srgb,var(--site-panel)_94%,#fff)]',
          'p-3.5 shadow-[0_8px_24px_color-mix(in_srgb,var(--site-ink)_6%,transparent)]',
          'transition-[box-shadow,transform,border-color] duration-200',
          'group-hover:border-[color-mix(in_srgb,var(--site-ink)_18%,var(--site-line))]',
          'group-hover:shadow-[0_10px_28px_color-mix(in_srgb,var(--site-ink)_9%,transparent)]',
          !items ? 'opacity-75' : '',
        ].join(' ')}
        aria-label={pick(locale, '本站访问数据', 'Site visit stats')}
        aria-busy={!items}
      >
        <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--site-line)_70%,transparent)] pb-2.5">
          <span className="text-[13px] font-semibold tracking-wide text-[var(--site-ink)]">
            {pick(locale, '访问统计', 'Traffic')}
          </span>
          <span className="text-[11px] font-medium text-[var(--site-faint)] transition-colors group-hover:text-[var(--site-muted)]">
            {pick(locale, '打开面板', 'Open dashboard')}
            <span aria-hidden="true"> →</span>
          </span>
        </div>
        <ul className="m-0 grid list-none grid-cols-3 gap-0 p-0">
          {row.map((item, index) => (
            <li
              key={item.key}
              className={[
                'flex min-w-0 flex-col items-center gap-1 px-2 py-0.5 text-center',
                index > 0 ? 'border-l border-[color-mix(in_srgb,var(--site-line)_75%,transparent)]' : '',
              ].join(' ')}
              title={item.hint || undefined}
            >
              <strong className="text-[17px] font-semibold tabular-nums leading-tight tracking-tight text-[var(--site-ink)]">
                {item.value}
              </strong>
              <small className="text-[11px] font-medium leading-snug text-[var(--site-muted)]">{item.label}</small>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  )
}