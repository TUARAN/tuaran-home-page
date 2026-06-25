'use client'

import { useEffect, useMemo, useState } from 'react'
import { JUEJIN_ACTIVITY_SNAPSHOT } from '../../../lib/juejin/activitySnapshot'

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function isValidDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function mondayIndex(date) {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function buildYearWeeks(year, countsByDate) {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  const firstWeekStart = addDays(yearStart, -mondayIndex(yearStart))
  const weeks = []
  let cursor = firstWeekStart

  while (cursor <= yearEnd || mondayIndex(cursor) !== 0) {
    const week = []
    for (let i = 0; i < 7; i += 1) {
      const inYear = cursor.getFullYear() === year
      const date = toIsoDate(cursor)
      week.push({
        key: date,
        inYear,
        count: inYear ? countsByDate[date] || 0 : 0,
        month: cursor.getMonth(),
      })
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }

  return weeks
}

function buildWeekMonthLabels(weeks) {
  const labels = []
  let prevMonth = -1
  for (const week of weeks) {
    const firstInYearCell = week.find((cell) => cell.inYear)
    if (!firstInYearCell) {
      labels.push('')
      continue
    }
    if (firstInYearCell.month !== prevMonth) {
      labels.push(MONTH_LABELS[firstInYearCell.month])
      prevMonth = firstInYearCell.month
    } else {
      labels.push('')
    }
  }
  return labels
}

// 绝对计数分桶（与 GitHub 类似），跨年视觉一致。
// 色阶用站点鼠尾草绿 token（--kb-heat-*），随主题切换，浅/深一致。
function heatColorClass(value) {
  if (!value) return 'bg-[var(--kb-heat-empty)]'
  if (value >= 8) return 'bg-[var(--kb-heat-4)]'
  if (value >= 4) return 'bg-[var(--kb-heat-3)]'
  if (value >= 2) return 'bg-[var(--kb-heat-2)]'
  return 'bg-[var(--kb-heat-1)]'
}

export default function KnowledgeHeatmapClient({
  items,
  expanded: controlledExpanded,
  onToggle,
  hideOwnToggle = false,
}) {
  const [internalExpanded, setInternalExpanded] = useState(true)
  const isControlled = typeof controlledExpanded === 'boolean'
  const expanded = isControlled ? controlledExpanded : internalExpanded
  const setExpanded = (next) => {
    if (isControlled) {
      const resolved = typeof next === 'function' ? next(expanded) : next
      onToggle?.(resolved)
    } else {
      setInternalExpanded(next)
    }
  }
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState('')
  const juejinCountsByDate = JUEJIN_ACTIVITY_SNAPSHOT.countsByDate

  const heatmapData = useMemo(() => {
    const localCountsByDate = {}
    for (const item of items) {
      if (!isValidDate(item.date)) continue
      localCountsByDate[item.date] = (localCountsByDate[item.date] || 0) + 1
    }

    const mergedCountsByDate = { ...juejinCountsByDate }
    for (const [date, count] of Object.entries(localCountsByDate)) {
      mergedCountsByDate[date] = (mergedCountsByDate[date] || 0) + count
    }

    const years = Array.from(new Set(Object.keys(mergedCountsByDate).map((date) => date.slice(0, 4)))).sort(
      (a, b) => Number(b) - Number(a),
    )
    if (!years.length) return null

    const year = years.includes(selectedHeatmapYear) ? selectedHeatmapYear : years[0]
    const yearCountsByDate = {}
    let total = 0
    let localTotal = 0
    let juejinTotal = 0

    for (const [date, count] of Object.entries(mergedCountsByDate)) {
      if (!date.startsWith(year)) continue
      yearCountsByDate[date] = count
      total += count
    }
    for (const [date, count] of Object.entries(localCountsByDate)) {
      if (date.startsWith(year)) localTotal += count
    }
    for (const [date, count] of Object.entries(juejinCountsByDate)) {
      if (date.startsWith(year)) juejinTotal += count
    }

    const yearWeeks = buildYearWeeks(Number(year), yearCountsByDate)
    const weekMonthLabels = buildWeekMonthLabels(yearWeeks)

    return {
      selectedYear: year,
      years,
      total,
      localTotal,
      juejinTotal,
      yearWeeks,
      weekMonthLabels,
    }
  }, [items, juejinCountsByDate, selectedHeatmapYear])

  useEffect(() => {
    if (!heatmapData?.years?.length) return
    if (!selectedHeatmapYear || !heatmapData.years.includes(selectedHeatmapYear)) {
      setSelectedHeatmapYear(heatmapData.years[0])
    }
  }, [heatmapData, selectedHeatmapYear])

  return (
    <section className="space-y-3">
      {hideOwnToggle ? null : (
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1 text-sm text-[var(--site-muted)] transition-colors hover:text-[var(--site-ink)]"
          >
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
              className={['h-3 w-3 shrink-0 transition-transform', expanded ? 'rotate-180' : ''].join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 4.5 6 7.5 9 4.5" />
            </svg>
            {expanded ? '收起热力图' : '展开热力图'}
          </button>
        </div>
      )}

      {expanded ? (
        heatmapData ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--site-faint)]">年份</span>
              {heatmapData.years.map((year) => (
                <button
                  key={`kb-heat-year-${year}`}
                  type="button"
                  onClick={() => setSelectedHeatmapYear(year)}
                  className={[
                    'rounded px-2 py-1 text-xs transition-colors',
                    selectedHeatmapYear === year
                      ? 'bg-[color-mix(in_srgb,var(--site-accent)_14%,transparent)] text-[var(--site-accent-strong)]'
                      : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]',
                  ].join(' ')}
                >
                  {year}
                </button>
              ))}
            </div>
            <div className="rounded-md border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_72%,transparent)] p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--site-muted)]">
                  {heatmapData.total} 篇内容发布（站内 {heatmapData.localTotal} + 掘金 {heatmapData.juejinTotal}）
                </p>
                <p className="text-[11px] text-[var(--site-faint)]">
                  少
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--kb-heat-empty)] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--kb-heat-1)] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--kb-heat-2)] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--kb-heat-3)] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--kb-heat-4)] align-middle" />
                  多
                </p>
              </div>
              <div className="overflow-x-auto">
                <div className="inline-flex min-w-max flex-col gap-1.5">
                  <div className="ml-6 flex gap-[3px]">
                    {heatmapData.weekMonthLabels.map((label, idx) => (
                      <span key={`kb-month-label-${idx}`} className="w-3 text-[9px] leading-none text-[var(--site-faint)]">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="grid grid-rows-7 gap-[3px] pt-[1px]">
                      {WEEKDAY_LABELS.map((d, index) => (
                        <span key={`kb-weekday-${d}`} className="h-3 text-[9px] leading-3 text-[var(--site-faint)]">
                          {index % 2 === 0 ? d : ''}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-[3px]">
                      {heatmapData.yearWeeks.map((week, weekIndex) => (
                        <div key={`kb-week-${weekIndex}`} className="grid grid-rows-7 gap-[3px]">
                          {week.map((cell) =>
                            cell.inYear ? (
                              <span
                                key={cell.key}
                                title={`${cell.key} · ${cell.count} 篇`}
                                className={['h-3 w-3 rounded-[2px]', heatColorClass(cell.count)].join(' ')}
                              />
                            ) : (
                              <span key={cell.key} className="h-3 w-3 rounded-[2px] bg-transparent" />
                            ),
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <section className="rounded-md border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_72%,transparent)] p-3 text-xs text-[var(--site-muted)]">
            热力图加载中…
          </section>
        )
      ) : null}
    </section>
  )
}
