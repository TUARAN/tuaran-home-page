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

function labelsForSource(source, locale) {
  if (source === 'internal') {
    return {
      total: pick(locale, '有效阅读', 'Qualified reads'),
      weekPv: pick(locale, '7 日有效阅读', '7d qualified reads'),
      weekUv: pick(locale, '7 日读者', '7d readers'),
      totalHint: pick(locale, '站内 D1 · 白名单内容页可见 ≥8 秒后累计', 'Site D1 · content pages visible ≥8s'),
      weekPvHint: pick(locale, '近 7 天有效阅读次数', 'Qualified reads in the last 7 days'),
      weekUvHint: pick(locale, '近 7 天去重读者（账号或访客指纹）', 'Distinct readers in the last 7 days'),
    }
  }
  return {
    total: pick(locale, '总浏览', 'Total views'),
    weekPv: pick(locale, '7 日 PV', '7d PV'),
    weekUv: pick(locale, '7 日 UV', '7d UV'),
    totalHint: pick(locale, 'Umami · 历史累计 PV', 'Umami · all-time pageviews'),
    weekPvHint: pick(locale, '近 7 天页面浏览', 'Pageviews in the last 7 days'),
    weekUvHint: pick(locale, '近 7 天访客', 'Visitors in the last 7 days'),
  }
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

  const source = stats?.source === 'internal' ? 'internal' : 'umami'
  const labels = labelsForSource(source, locale)
  const detailPath = stats?.detailPath || '/traffic'
  const totalValue = formatCount(stats?.totalPv, locale)
  const weekPvValue = formatCount(stats?.weekPv, locale)
  const weekUvValue = formatCount(stats?.weekUv, locale)
  const usingFallback = Boolean(stats?.fallback)

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
          href={detailPath}
          className="shrink-0 text-[13px] font-semibold text-[var(--site-ink)] underline decoration-[var(--site-line)] underline-offset-[3px] transition-colors hover:decoration-[var(--site-muted)]"
          title={pick(locale, '查看完整访问统计', 'Open traffic dashboard')}
        >
          {pick(locale, '访问统计', 'Traffic')}
        </Link>
        <StatPair value={totalValue} label={labels.total} hint={labels.totalHint} prominent />
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[var(--site-muted)]">
        <StatPair value={weekPvValue} label={labels.weekPv} hint={labels.weekPvHint} />
        <StatPair value={weekUvValue} label={labels.weekUv} hint={labels.weekUvHint} />
      </div>
      {usingFallback ? (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--site-faint)]">
          <Link
            href="/traffic#qualified-reads"
            className="text-[var(--site-muted)] underline decoration-[var(--site-line)] underline-offset-2 hover:text-[var(--site-ink)]"
          >
            {pick(
              locale,
              'Umami 外部统计暂不可用，当前为站内有效阅读口径',
              'Umami is unavailable; showing on-site qualified reads',
            )}
          </Link>
        </p>
      ) : null}
    </div>
  )
}