'use client'

import { useEffect, useMemo, useState } from 'react'
import { JUEJIN_ACTIVITY_SNAPSHOT } from '../../lib/juejin/activitySnapshot'

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

function heatColorClass(value, max) {
  if (!value) return 'bg-[#f6f1e8] dark:bg-[#151922]'
  const ratio = max > 0 ? value / max : 0
  if (ratio >= 0.75) return 'bg-[#2f855a]'
  if (ratio >= 0.5) return 'bg-[#57a06f]'
  if (ratio >= 0.25) return 'bg-[#8bc79f]'
  return 'bg-[#c6e7d0]'
}

export default function KnowledgeHeatmapClient({ items }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState('')
  const juejinCountsByDate = JUEJIN_ACTIVITY_SNAPSHOT.countsByDate
  const juejinTopTags = JUEJIN_ACTIVITY_SNAPSHOT.topTags
  const juejinSnapshotAt = JUEJIN_ACTIVITY_SNAPSHOT.snapshotAt

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

    const maxPerDay = Object.values(yearCountsByDate).reduce((acc, v) => Math.max(acc, v), 0)
    const yearWeeks = buildYearWeeks(Number(year), yearCountsByDate)
    const weekMonthLabels = buildWeekMonthLabels(yearWeeks)

    return {
      selectedYear: year,
      years,
      total,
      localTotal,
      juejinTotal,
      maxPerDay,
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
    <section className="space-y-2">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="group flex w-full items-center justify-between gap-3 rounded-md border border-[#e9dcc7] bg-[#fff9ef] px-3 py-2 text-left transition-colors hover:border-[#d8c7ab] hover:bg-[#fff4e3] dark:border-[#36465d] dark:bg-[#121a26] dark:hover:border-[#51627a] dark:hover:bg-[#182335]"
      >
        <span className="min-w-0 truncate whitespace-nowrap text-sm font-medium text-[#4d3d25] dark:text-[#d7c5a3]">
          我读到、研究过、想反复回看的东西，都沉淀在这里——长文观察、公司画像、事项专题，按主题持续累积。
        </span>
        <span className="shrink-0 text-xs font-medium text-[#8a6a35] dark:text-[#9fb8dd]">
          {expanded ? '收起热力图' : '展开热力图'}
        </span>
      </button>

      {expanded ? (
        heatmapData ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#8b7f69] dark:text-[#8e9ab0]">年份</span>
              {heatmapData.years.map((year) => (
                <button
                  key={`kb-heat-year-${year}`}
                  type="button"
                  onClick={() => setSelectedHeatmapYear(year)}
                  className={[
                    'rounded px-2 py-1 text-xs transition-colors',
                    selectedHeatmapYear === year
                      ? 'bg-[#eef4fb] text-[#285a8d] dark:bg-[#152034] dark:text-[#9bb6df]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  {year}
                </button>
              ))}
            </div>
            <div className="rounded-md border border-[#ded5c7] bg-[#fffdf8] p-3 dark:border-gray-700 dark:bg-[#0f141b]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs text-[#776a57] dark:text-gray-300">
                  {heatmapData.total} 篇内容发布（站内 {heatmapData.localTotal} + 掘金 {heatmapData.juejinTotal}）
                </p>
                <p className="text-[11px] text-[#9f927d] dark:text-gray-500">
                  少
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[#f6f1e8] align-middle dark:bg-[#151922]" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[#c6e7d0] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[#8bc79f] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[#57a06f] align-middle" />
                  <span className="mx-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-[#2f855a] align-middle" />
                  多
                </p>
              </div>
              {juejinTopTags.length ? (
                <p className="mb-2 text-[11px] text-[#9f927d] dark:text-gray-500">
                  掘金高频标签：
                  {juejinTopTags
                    .slice(0, 6)
                    .map((item) => `${item.tag}(${item.count})`)
                    .join(' · ')}
                </p>
              ) : null}
              {juejinSnapshotAt ? (
                <p className="mb-2 text-[10px] text-[#b0a38f] dark:text-gray-600">
                  掘金静态快照：{juejinSnapshotAt.slice(0, 10)}
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <div className="inline-flex min-w-max flex-col gap-1.5">
                  <div className="ml-6 flex gap-[3px]">
                    {heatmapData.weekMonthLabels.map((label, idx) => (
                      <span key={`kb-month-label-${idx}`} className="w-3 text-[9px] leading-none text-[#ad9f8b] dark:text-gray-600">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="grid grid-rows-7 gap-[3px] pt-[1px]">
                      {WEEKDAY_LABELS.map((d, index) => (
                        <span key={`kb-weekday-${d}`} className="h-3 text-[9px] leading-3 text-[#b3a693] dark:text-gray-600">
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
                                className={['h-3 w-3 rounded-[2px]', heatColorClass(cell.count, heatmapData.maxPerDay)].join(' ')}
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
          <section className="rounded-md border border-[#ded5c7] bg-[#fffdf8] p-3 text-xs text-[#776a57] dark:border-gray-700 dark:bg-[#0f141b] dark:text-gray-300">
            热力图加载中…
          </section>
        )
      ) : null}
    </section>
  )
}
