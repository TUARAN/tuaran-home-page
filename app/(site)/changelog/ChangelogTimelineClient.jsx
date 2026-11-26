'use client'

import { useMemo, useState } from 'react'

import { buildChangelogPeriods, CHANGELOG_PERIOD_VIEWS } from '../../../lib/automation/changelogPeriods'
import { getChangelogPeriodSummary } from '../../../lib/automation/changelogPeriodSummaries'
import {
  averageChangelogRatings,
  CHANGELOG_RATING_DIMENSIONS,
  CHANGELOG_RATING_META,
  getChangelogRating,
} from '../../../lib/automation/changelogRatings'

const RADAR_SIZE = 240
const RADAR_CENTER = RADAR_SIZE / 2
const RADAR_RADIUS = 78

function radarPoint(index, value, scale) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / CHANGELOG_RATING_DIMENSIONS.length
  const r = (value / scale) * RADAR_RADIUS
  return { x: RADAR_CENTER + r * Math.cos(angle), y: RADAR_CENTER + r * Math.sin(angle), angle }
}

function formatScore(value) {
  if (value == null) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function ChangelogRadar({ scores, scale, title }) {
  const [active, setActive] = useState(null)
  const dims = CHANGELOG_RATING_DIMENSIONS
  const rings = [0.25, 0.5, 0.75, 1]
  const vertices = dims
    .map((dim, index) => (scores[dim.id] == null ? null : { ...dim, index, value: scores[dim.id], ...radarPoint(index, scores[dim.id], scale) }))
    .filter(Boolean)
  const activeVertex = vertices.find((vertex) => vertex.id === active)

  return (
    <svg
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      role="img"
      aria-label={`${title}：${dims.map((dim) => `${dim.label} ${formatScore(scores[dim.id])}`).join('，')}`}
      className="mx-auto w-full max-w-[260px] overflow-visible"
      onMouseLeave={() => setActive(null)}
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={dims.map((_, index) => {
            const point = radarPoint(index, ring * scale, scale)
            return `${point.x},${point.y}`
          }).join(' ')}
          fill="none"
          stroke="var(--site-line)"
          strokeWidth="1"
        />
      ))}
      {dims.map((dim, index) => {
        const edge = radarPoint(index, scale, scale)
        const label = radarPoint(index, scale * 1.24, scale)
        const cos = Math.cos(edge.angle)
        const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end'
        const missing = scores[dim.id] == null
        return (
          <g key={dim.id}>
            <line
              x1={RADAR_CENTER}
              y1={RADAR_CENTER}
              x2={edge.x}
              y2={edge.y}
              stroke="var(--site-line)"
              strokeWidth="1"
              strokeDasharray={missing ? '3 3' : undefined}
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fill={missing ? 'var(--site-faint)' : 'var(--site-muted)'}
            >
              {dim.label}
              {missing ? ' · 无数据' : ''}
            </text>
          </g>
        )
      })}
      {vertices.length > 2 ? (
        <polygon
          points={vertices.map((vertex) => `${vertex.x},${vertex.y}`).join(' ')}
          fill="color-mix(in srgb, var(--site-accent) 16%, transparent)"
          stroke="var(--site-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : null}
      {vertices.map((vertex) => (
        <g key={vertex.id}>
          <circle
            cx={vertex.x}
            cy={vertex.y}
            r={active === vertex.id ? 5 : 4}
            fill="var(--site-accent)"
            stroke="var(--site-panel)"
            strokeWidth="2"
          />
          <circle
            cx={vertex.x}
            cy={vertex.y}
            r="14"
            fill="transparent"
            onMouseEnter={() => setActive(vertex.id)}
            onFocus={() => setActive(vertex.id)}
            onBlur={() => setActive(null)}
            tabIndex={0}
            aria-label={`${vertex.label} ${formatScore(vertex.value)} / ${scale}`}
            style={{ cursor: 'default', outline: 'none' }}
          />
        </g>
      ))}
      {activeVertex ? (
        <g pointerEvents="none">
          <rect
            x={Math.min(Math.max(activeVertex.x - 34, 2), RADAR_SIZE - 70)}
            y={activeVertex.y - 34}
            width="68"
            height="22"
            rx="6"
            fill="var(--site-ink)"
          />
          <text
            x={Math.min(Math.max(activeVertex.x - 34, 2), RADAR_SIZE - 70) + 34}
            y={activeVertex.y - 23}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="var(--site-panel)"
          >
            {activeVertex.label} {formatScore(activeVertex.value)}
          </text>
        </g>
      ) : null}
    </svg>
  )
}

function ChangelogRating({ rating, caption }) {
  if (!rating) return null
  const { scale, rater, ratedAt } = CHANGELOG_RATING_META
  return (
    <section
      aria-label={`${rater} 评分`}
      className="mt-4 rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_55%,transparent)] p-3 md:p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-accent)]">
          {caption}
        </p>
        <p className="text-[11px] text-[var(--site-faint)]">
          满分 {scale}{rating.weeks ? ` · ${rating.weeks} 周均值` : ''}
        </p>
      </div>
      <div className="mt-2 grid items-center gap-4 sm:grid-cols-[minmax(0,260px)_1fr]">
        <ChangelogRadar scores={rating.scores} scale={scale} title={caption} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 self-center">
          {CHANGELOG_RATING_DIMENSIONS.map(({ id, label, hint }) => (
            <div key={id} title={hint} className="flex items-baseline justify-between border-b border-dashed border-[var(--site-line)] pb-1 text-[12px]">
              <dt className="text-[var(--site-muted)]">{label}</dt>
              <dd className={`font-mono ${rating.scores[id] == null ? 'text-[var(--site-faint)]' : 'text-[var(--site-ink)]'}`}>
                {formatScore(rating.scores[id])}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {rating.note ? (
        <p className="mt-3 text-[12.5px] leading-6 text-[var(--site-muted)]">{rating.note}</p>
      ) : null}
      <p className="mt-2 text-right text-[11px] text-[var(--site-faint)]">
        评分：{rater} · {ratedAt}
      </p>
    </section>
  )
}

function ChangelogItemList({ items, markerClass }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[13px] leading-6 text-[var(--site-muted)]">
          <span className={`mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full ${markerClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChangelogSections({ entry }) {
  const usesSplitFormat = 'planned' in entry || 'done' in entry
  const doneItems = entry.done ?? entry.items ?? []
  const plannedItems = entry.planned ?? []

  if (!usesSplitFormat) {
    return <ChangelogItemList items={doneItems} markerClass="bg-[#aaae9c] dark:bg-[#536071]" />
  }

  return (
    <div className={`mt-3 grid gap-4 ${plannedItems.length > 0 ? 'xl:grid-cols-2' : ''}`}>
      <section>
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-accent)]">
          已做
        </h4>
        {doneItems.length > 0 ? (
          <ChangelogItemList items={doneItems} markerClass="bg-emerald-500/80 dark:bg-emerald-400/80" />
        ) : (
          <p className="text-[13px] leading-6 text-[var(--site-faint)]">（本周期尚未交付）</p>
        )}
      </section>
      {plannedItems.length > 0 ? (
        <section>
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-faint)]">
            计划
          </h4>
          <ChangelogItemList items={plannedItems} markerClass="bg-[#c8cabb] dark:bg-[#4a5568]" />
        </section>
      ) : null}
    </div>
  )
}

function ChangelogEntry({ entry }) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <h3 className="font-serif text-[18px] font-semibold text-[var(--site-ink)]">
        {entry.title}
      </h3>
      <p className="mt-1 text-[13.5px] leading-6 text-[var(--site-muted)]">{entry.summary}</p>
      <ChangelogSections entry={entry} />
    </article>
  )
}

function PeriodSummary({ period, view }) {
  const summary = getChangelogPeriodSummary(period, view)
  const activeWeeks = new Set(period.entries.map((entry) => entry.week)).size

  return (
    <div>
      <article className="rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_65%,transparent)] p-4 md:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-accent)]">
          Period Synthesis · 周期总结
        </p>
        <h3 className="mt-2 font-serif text-[20px] font-semibold leading-snug text-[var(--site-ink)]">
          {summary.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-7 text-[var(--site-muted)]">{summary.summary}</p>
        {summary.highlights?.length ? (
          <ul className="mt-4 grid gap-2 md:grid-cols-3">
            {summary.highlights.map((highlight, index) => (
              <li key={highlight} className="rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] p-3 text-[12.5px] leading-6 text-[var(--site-muted)]">
                <span className="mr-2 font-mono text-[10px] text-[var(--site-accent)]">{String(index + 1).padStart(2, '0')}</span>
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 border-l-2 border-[var(--site-accent)] pl-3 text-[12.5px] leading-6 text-[var(--site-muted)]">
          <span className="font-semibold text-[var(--site-ink)]">阶段判断：</span>{summary.signal}
        </p>
      </article>

      <details className="mt-3 rounded-xl border border-[var(--site-line)] px-4 py-3">
        <summary className="cursor-pointer text-[12px] font-medium text-[var(--site-muted)]">
          展开查看 {activeWeeks} 周、{period.entries.length} 次原始更新
        </summary>
        <div className="mt-4 divide-y divide-[var(--site-line)] border-t border-[var(--site-line)] pt-4">
          {period.entries.map((entry) => <ChangelogEntry key={entry.version} entry={entry} />)}
        </div>
      </details>
    </div>
  )
}

export default function ChangelogTimelineClient({ entries }) {
  const [view, setView] = useState('week')
  const periods = useMemo(() => buildChangelogPeriods(entries, view), [entries, view])
  const activeView = CHANGELOG_PERIOD_VIEWS.find((option) => option.id === view) || CHANGELOG_PERIOD_VIEWS[0]

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 border-b border-[var(--site-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--site-faint)]">
            Timeline View · 时间维度
          </p>
          <p className="mt-1 text-[13px] text-[var(--site-muted)]">
            共 {periods.length} {activeView.unit}，同一周期内的多次更新已经合并。
          </p>
        </div>
        <div
          role="tablist"
          aria-label="更新记录时间维度"
          className="inline-flex w-fit rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] p-1"
        >
          {CHANGELOG_PERIOD_VIEWS.map((option) => {
            const selected = option.id === view
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setView(option.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  selected
                    ? 'bg-[var(--site-ink)] text-[var(--site-panel)] shadow-sm'
                    : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {periods.map((period) => (
          <li
            key={period.key}
            className="grid gap-4 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 md:grid-cols-[168px_1fr] md:p-5"
          >
            <div>
              <h2 className="font-serif text-[17px] font-semibold text-[var(--site-ink)]">
                {period.label}
              </h2>
              <p className="mt-1 text-[12px] text-[var(--site-muted)]">{period.range}</p>
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--site-faint)]">
                {period.commits > 0 ? `${period.commits} commits` : '提交待归纳'}
              </p>
              {period.entries.length > 1 ? (
                <p className="mt-1 text-[11px] text-[var(--site-faint)]">{period.entries.length} 次更新</p>
              ) : null}
            </div>

            {view === 'week' ? (
              <div>
                <div className="divide-y divide-[var(--site-line)]">
                  {period.entries.map((entry) => <ChangelogEntry key={entry.version} entry={entry} />)}
                </div>
                <ChangelogRating
                  rating={getChangelogRating(period.entries[0]?.week)}
                  caption="Weekly Score · 本周评分"
                />
              </div>
            ) : (
              <div>
                <PeriodSummary period={period} view={view} />
                <ChangelogRating
                  rating={averageChangelogRatings(period.entries.map((entry) => entry.week))}
                  caption="Average Score · 周评分均值"
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
