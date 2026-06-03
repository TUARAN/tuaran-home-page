'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const KIND_LABELS = {
  posts: '文章',
  companies: '公司调研',
  topics: '事项调研',
  special: '专题调研',
  resources: '资料',
}

function isValidDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
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
        date,
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

export default function CreationCalendarClient({ items }) {
  const datedItems = useMemo(
    () =>
      items
        .filter((item) => isValidDate(item.date))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [items],
  )

  const years = useMemo(() => {
    const set = new Set(datedItems.map((item) => item.date.slice(0, 4)))
    return Array.from(set).sort((a, b) => Number(b) - Number(a))
  }, [datedItems])

  const [selectedYear, setSelectedYear] = useState(years[0] || '')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')

  const yearItems = useMemo(
    () => datedItems.filter((item) => (selectedYear ? item.date.startsWith(selectedYear) : true)),
    [datedItems, selectedYear],
  )

  const monthItems = useMemo(() => {
    if (selectedMonth === 'all') return yearItems
    const monthPrefix = `${selectedYear}-${selectedMonth}`
    return yearItems.filter((item) => item.date.startsWith(monthPrefix))
  }, [yearItems, selectedMonth, selectedYear])

  const countsByDate = useMemo(() => {
    const map = {}
    for (const item of yearItems) {
      map[item.date] = (map[item.date] || 0) + 1
    }
    return map
  }, [yearItems])

  const activeDays = Object.keys(countsByDate).length
  const maxPerDay = Object.values(countsByDate).reduce((acc, value) => Math.max(acc, value), 0)
  const yearWeeks = useMemo(() => (selectedYear ? buildYearWeeks(Number(selectedYear), countsByDate) : []), [selectedYear, countsByDate])
  const weekMonthLabels = useMemo(() => buildWeekMonthLabels(yearWeeks), [yearWeeks])

  const visibleItems = useMemo(() => {
    if (selectedDate) return monthItems.filter((item) => item.date === selectedDate)
    return monthItems
  }, [monthItems, selectedDate])

  return (
    <main className="w-full max-w-5xl mx-auto px-4 py-10 space-y-6">
      <header className="border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              创作日历
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              这里按时间观察知识库的更新节奏，可像 GitHub 热力图一样查看每天的发布密度。
            </p>
          </div>
          <Link
            href="/articles"
            className="rounded-md border border-[#d8cfbf] bg-[#faf6ef] px-3 py-1.5 text-sm text-[#5b5141] no-underline transition-colors hover:border-[#bdae93] hover:text-[#2d261d] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
          >
            返回知识库
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="总内容数" value={String(datedItems.length)} note="含原创 / 调研 / 资料" />
        <StatCard label="当前年份" value={selectedYear || '-'} note={`${yearItems.length} 篇`} />
        <StatCard label="活跃天数" value={String(activeDays)} note="该年有内容的日期" />
        <StatCard label="单日最高" value={String(maxPerDay)} note="当天发布条数" />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#8b7f69] dark:text-[#8e9ab0]">年份</span>
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => {
              setSelectedYear(year)
              setSelectedMonth('all')
              setSelectedDate('')
            }}
            className={[
              'rounded px-2 py-1 text-xs transition-colors',
              selectedYear === year
                ? 'bg-[#eef4fb] text-[#285a8d] dark:bg-[#152034] dark:text-[#9bb6df]'
                : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
            ].join(' ')}
          >
            {year}
          </button>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#8b7f69] dark:text-[#8e9ab0]">月份</span>
        <button
          type="button"
          onClick={() => {
            setSelectedMonth('all')
            setSelectedDate('')
          }}
          className={[
            'rounded px-2 py-1 text-xs transition-colors',
            selectedMonth === 'all'
              ? 'bg-[#eef6f1] text-[#386b54] dark:bg-[#13201a] dark:text-[#9dcab1]'
              : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
          ].join(' ')}
        >
          全部月份
        </button>
        {MONTH_LABELS.map((label, idx) => {
          const monthKey = String(idx + 1).padStart(2, '0')
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                setSelectedMonth(monthKey)
                setSelectedDate('')
              }}
              className={[
                'rounded px-2 py-1 text-xs transition-colors',
                selectedMonth === monthKey
                  ? 'bg-[#eef6f1] text-[#386b54] dark:bg-[#13201a] dark:text-[#9dcab1]'
                  : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </section>

      {selectedYear ? (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-[#2f2a21] dark:text-gray-100">热力图（{selectedYear}）</h2>
          <div className="rounded-md border border-[#ded5c7] bg-[#fffdf8] p-3 dark:border-gray-700 dark:bg-[#0f141b]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs text-[#776a57] dark:text-gray-300">{yearItems.length} 篇内容发布</p>
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

            <div className="overflow-x-auto">
              <div className="inline-flex min-w-max flex-col gap-1.5">
                <div className="ml-6 flex gap-[3px]">
                  {weekMonthLabels.map((label, idx) => (
                    <span key={`${selectedYear}-month-label-${idx}`} className="w-3 text-[9px] leading-none text-[#ad9f8b] dark:text-gray-600">
                      {label}
                    </span>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <div className="grid grid-rows-7 gap-[3px] pt-[1px]">
                    {WEEKDAY_LABELS.map((d, index) => (
                      <span key={`weekday-${d}`} className="h-3 text-[9px] leading-3 text-[#b3a693] dark:text-gray-600">
                        {index % 2 === 0 ? d : ''}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-[3px]">
                    {yearWeeks.map((week, weekIndex) => (
                      <div key={`${selectedYear}-week-${weekIndex}`} className="grid grid-rows-7 gap-[3px]">
                        {week.map((cell) => {
                          const monthKey = String(cell.month + 1).padStart(2, '0')
                          const monthActive = selectedMonth === 'all' || selectedMonth === monthKey
                          if (!cell.inYear) {
                            return <span key={cell.key} className="h-3 w-3 rounded-[2px] bg-transparent" />
                          }
                          return (
                            <button
                              key={cell.key}
                              type="button"
                              title={`${cell.date} · ${cell.count} 篇`}
                              onClick={() => setSelectedDate((prev) => (prev === cell.date ? '' : cell.date))}
                              className={[
                                'h-3 w-3 rounded-[2px] text-[0px] transition-opacity',
                                heatColorClass(cell.count, maxPerDay),
                                selectedDate === cell.date ? 'ring-2 ring-[#2d261d] dark:ring-gray-200' : '',
                                cell.count ? 'opacity-100' : 'opacity-80',
                                monthActive ? '' : 'opacity-30',
                              ].join(' ')}
                            >
                              <span className="sr-only">{cell.date}</span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[#2f2a21] dark:text-gray-100">
            {selectedDate ? `${formatDate(selectedDate)} 发布内容` : '时间列表'}
          </h2>
          {selectedDate ? (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-xs text-[#8f826c] transition-colors hover:text-[#3d3429] dark:text-gray-400 dark:hover:text-gray-200"
            >
              清除日期筛选
            </button>
          ) : null}
        </div>
        {visibleItems.length === 0 ? (
          <p className="text-sm text-[#666] dark:text-gray-400">该时间范围暂无内容。</p>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className="block rounded-md border border-[#eee] bg-white p-3 no-underline transition-colors hover:border-[#d7cab4] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#8f826c] dark:text-gray-400">
                  <time dateTime={item.date}>{item.date}</time>
                  <span>·</span>
                  <span>{KIND_LABELS[item.kind] || item.kind}</span>
                  {item.tagLabel ? <span>· {item.tagLabel}</span> : null}
                </div>
                <h3 className="mt-1 text-sm font-medium text-[#2f2a21] dark:text-gray-100">{item.title}</h3>
                {item.summary ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[#666] dark:text-gray-300">{item.summary}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function StatCard({ label, value, note }) {
  return (
    <article className="rounded-md border border-[#eadfcd] bg-[#fffaf2] p-3 dark:border-gray-800 dark:bg-[#0f141b]">
      <p className="text-xs text-[#9b8f79] dark:text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#2f2a21] dark:text-gray-100">{value}</p>
      <p className="mt-1 text-xs text-[#8f826c] dark:text-gray-400">{note}</p>
    </article>
  )
}
