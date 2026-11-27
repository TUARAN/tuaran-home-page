'use client'

import { useEffect, useState } from 'react'

import { pick } from '../../../lib/site/i18n'
import { useLocale } from '../components/LocaleProvider'

export default function TrafficSourceNotice() {
  const { locale } = useLocale()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/api/site-traffic-stats', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active) setStats(payload)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!stats?.fallback) return null

  return (
    <div
      className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
      role="status"
    >
      <p className="font-medium">
        {pick(locale, '当前未使用 Umami 全站 PV', 'Umami site-wide pageviews are unavailable')}
      </p>
      <p className="mt-1 text-[13px] opacity-90">
        {pick(
          locale,
          'Umami Cloud 额度用尽、分享 API 失败或面板停写时，页脚与下文「站内有效阅读」改示 D1 自建口径。',
          'When Umami Cloud hits its quota, the share API fails, or ingestion pauses, the footer and the qualified-read section below use on-site D1 counts.',
        )}
      </p>
    </div>
  )
}