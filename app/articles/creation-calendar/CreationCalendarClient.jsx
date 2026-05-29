'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const KIND_LABELS = {
  posts: '文章',
  companies: '公司调研',
  topics: '事项调研',
  special: '专题',
}

function isValidDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

function buildMonthCells(year, month, countsByDate) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const firstIndex = firstWeekday === 0 ? 6 : firstWeekday - 1
  const cells = []

  for (let i = 0; i < firstIndex; i += 1) {
    cells.push({ empty: true, key: `e-${month}-${i}` })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      empty: false,
      key: date,
      date,
      count: countsByDate[date] || 0,
      day,
    })
  }
  return cells
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
        <StatCard label="总内容数" value={String(datedItems.length)} note="含文章 / 调研 / 专题" />
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MONTH_LABELS.map((label, monthIndex) => {
              const monthKey = String(monthIndex + 1).padStart(2, '0')
              const cells = buildMonthCells(Number(selectedYear), monthIndex, countsByDate)
              const monthActive = selectedMonth === 'all' || selectedMonth === monthKey
              return (
                <article
                  key={`${selectedYear}-${monthKey}`}
                  className={[
                    'rounded-md border p-3',
                    monthActive
                      ? 'border-[#ded5c7] bg-[#fffdf8] dark:border-gray-700 dark:bg-[#0f141b]'
                      : 'border-[#f0e8db] bg-[#fffefb] opacity-70 dark:border-gray-800 dark:bg-[#0d1117]',
                  ].join(' ')}
                >
                  <header className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm text-[#5a4e3d] dark:text-gray-200">{label}</h3>
                    <span className="text-[11px] text-[#9f927d] dark:text-gray-500">
                      {yearItems.filter((item) => item.date.startsWith(`${selectedYear}-${monthKey}`)).length} 篇
                    </span>
                  </header>
                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {WEEKDAY_LABELS.map((d) => (
                      <span key={`${label}-${d}`} className="text-center text-[10px] text-[#b3a693] dark:text-gray-600">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((cell) =>
                      cell.empty ? (
                        <span key={cell.key} className="h-5 rounded-sm bg-transparent" />
                      ) : (
                        <button
                          key={cell.key}
                          type="button"
                          title={`${cell.date} · ${cell.count} 篇`}
                          onClick={() => setSelectedDate((prev) => (prev === cell.date ? '' : cell.date))}
                          className={[
                            'h-5 rounded-sm text-[10px] transition-opacity',
                            heatColorClass(cell.count, maxPerDay),
                            selectedDate === cell.date ? 'ring-2 ring-[#2d261d] dark:ring-gray-200' : '',
                            cell.count ? 'opacity-100' : 'opacity-80',
                          ].join(' ')}
                        >
                          <span className="sr-only">{cell.day}</span>
                        </button>
                      ),
                    )}
                  </div>
                </article>
              )
            })}
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
