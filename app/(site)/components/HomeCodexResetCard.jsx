'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { T } from './LocaleProvider'
import {
  CODEX_RESET_PATH,
  FALLBACK_SNAPSHOT,
  homeCardModel,
  homeStripHeadline,
  homeStripSubline,
  todayBeijing,
} from '../../../lib/codexResets'

export default function HomeCodexResetCard() {
  const [model, setModel] = useState(() => homeCardModel(FALLBACK_SNAPSHOT, todayBeijing()))

  useEffect(() => {
    let active = true
    let controller
    async function refresh() {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch('/api/codex-resets', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json()
        if (!payload?.snapshot?.events) throw new Error('invalid snapshot')
        if (active) setModel(homeCardModel(payload.snapshot))
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          /* keep fallback model */
        }
      }
    }
    refresh()
    const timer = setInterval(refresh, 5 * 60 * 1000)
    return () => {
      active = false
      controller?.abort()
      clearInterval(timer)
    }
  }, [])

  const headline = homeStripHeadline(model)
  const subline = homeStripSubline(model)
  const summary = subline ? `${headline} · ${subline}` : headline

  return (
    <section className="home-section home-codex-reset-panel" aria-label="Codex reset">
      <div className="home-codex-reset-panel-head">
        <div>
          <p className="home-kicker">Codex Reset</p>
          <h2 className="home-section-title">
            <T zh="重置日历" en="Reset calendar" />
          </h2>
        </div>
        <Link href={CODEX_RESET_PATH} className="home-section-more no-underline">
          <T zh="详情" en="Details" /> <span aria-hidden="true">→</span>
        </Link>
      </div>

      <Link
        href={CODEX_RESET_PATH}
        className="home-codex-reset-strip group no-underline"
        aria-label={`Codex 重置：${model.kicker} ${summary}`}
        data-analytics-event="entry_click"
        data-analytics-surface="home_codex_reset"
        data-analytics-destination-kind="tool"
        data-analytics-destination-id="codex-reset"
      >
        <span className="home-codex-reset-strip-main">
          <span className="home-codex-reset-strip-date">{headline}</span>
          {subline ? <span className="home-codex-reset-strip-window">{subline}</span> : null}
        </span>
        <span className={`home-codex-reset-strip-badge is-${model.kind}`}>{model.kicker}</span>
      </Link>
    </section>
  )
}
