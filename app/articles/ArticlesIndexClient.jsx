'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

import { getCompanyTypeFilters, getTopicTypeFilters } from '../../lib/research/categories'

const TAB_DEFS = [
  { key: 'all', label: '全部' },
  { key: 'posts', label: '精选文章' },
  { key: 'companies', label: '公司调研' },
  { key: 'topics', label: '事项调研' },
  { key: 'special', label: '专题' },
]

// 各分类标签的配色（浅色 + 暗色）
const KIND_TAG_CLASS = {
  posts: 'border-[#dadada] text-[#666] dark:border-gray-700 dark:text-gray-300',
  companies: 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
  topics: 'border-[#d6e6dd] bg-[#eef6f1] text-[#386b54] dark:border-[#243d33] dark:bg-[#13201a] dark:text-[#9dcab1]',
  special: 'border-[#d9d3f0] bg-[#f2eefc] text-[#5b4b8a] dark:border-[#312745] dark:bg-[#191424] dark:text-[#b8a6e8]',
}

const TAB_KEYS = TAB_DEFS.map((t) => t.key)

const QUICK_LINKS = [
  { label: '创作日历', href: '/articles/creation-calendar' },
  { label: '掘金专栏', href: 'https://tuaran.github.io/auto-sync-blog/', external: true },
]

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

// 公司 / 事项分类的 filter defs 由 lib/research/loader.js 派生，避免双源维护。
// 新增 / 删除分类只改 loader 一处即可。
const COMPANY_TYPE_DEFS = getCompanyTypeFilters()
const COMPANY_TYPE_KEYS = COMPANY_TYPE_DEFS.map((t) => t.key)

const TOPIC_TYPE_DEFS = getTopicTypeFilters()
const TOPIC_TYPE_KEYS = TOPIC_TYPE_DEFS.map((t) => t.key)

const SPECIAL_TYPE_DEFS = [
  { key: 'all', label: '全部专题' },
  { key: 'ai', label: 'AI 调研' },
  { key: 'writing', label: '写作创作' },
  { key: 'culture', label: '文化专题' },
  { key: 'politics', label: '政治专题' },
  { key: 'people', label: '人物调研' },
  { key: 'history', label: '历史调研' },
  { key: 'poetry', label: '诗歌调研' },
]

const SPECIAL_TYPE_KEYS = SPECIAL_TYPE_DEFS.map((t) => t.key)

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

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

function formatPv(pv) {
  const n = Number(pv) || 0
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')} 万`
  return String(n)
}

export default function ArticlesIndexClient({ items }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pvCounts, setPvCounts] = useState({})
  const [juejinCountsByDate, setJuejinCountsByDate] = useState({})
  const [juejinTopTags, setJuejinTopTags] = useState([])
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState('')
  const initialTab = (() => {
    const fromUrl = searchParams?.get('tab')
    return TAB_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialCompanyType = (() => {
    const fromUrl = searchParams?.get('company_type')
    return COMPANY_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialTopicType = (() => {
    const fromUrl = searchParams?.get('topic_type')
    return TOPIC_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialSpecialType = (() => {
    const fromUrl = searchParams?.get('special_type')
    return SPECIAL_TYPE_KEYS.includes(fromUrl) ? fromUrl : 'all'
  })()
  const initialQuery = searchParams?.get('q') || ''
  const [tab, setTab] = useState(initialTab)
  const [companyType, setCompanyType] = useState(initialCompanyType)
  const [topicType, setTopicType] = useState(initialTopicType)
  const [specialType, setSpecialType] = useState(initialSpecialType)
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    const fromUrl = searchParams?.get('tab')
    if (fromUrl && TAB_KEYS.includes(fromUrl) && fromUrl !== tab) {
      setTab(fromUrl)
    }
    const companyTypeFromUrl = searchParams?.get('company_type')
    const nextCompanyType = COMPANY_TYPE_KEYS.includes(companyTypeFromUrl) ? companyTypeFromUrl : 'all'
    if (nextCompanyType !== companyType) {
      setCompanyType(nextCompanyType)
    }
    const topicTypeFromUrl = searchParams?.get('topic_type')
    const nextTopicType = TOPIC_TYPE_KEYS.includes(topicTypeFromUrl) ? topicTypeFromUrl : 'all'
    if (nextTopicType !== topicType) {
      setTopicType(nextTopicType)
    }
    const specialTypeFromUrl = searchParams?.get('special_type')
    const nextSpecialType = SPECIAL_TYPE_KEYS.includes(specialTypeFromUrl) ? specialTypeFromUrl : 'all'
    if (nextSpecialType !== specialType) {
      setSpecialType(nextSpecialType)
    }
    const queryFromUrl = searchParams?.get('q') || ''
    if (queryFromUrl !== query) {
      setQuery(queryFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function buildArticlesUrl(nextTab, nextCompanyType, nextTopicType, nextSpecialType, nextQuery) {
    const params = new URLSearchParams()
    if (nextTab !== 'all') params.set('tab', nextTab)
    if (nextTab === 'companies' && nextCompanyType !== 'all') params.set('company_type', nextCompanyType)
    if (nextTab === 'topics' && nextTopicType !== 'all') params.set('topic_type', nextTopicType)
    if (nextTab === 'special' && nextSpecialType !== 'all') params.set('special_type', nextSpecialType)
    const normalizedQuery = String(nextQuery || '').trim()
    if (normalizedQuery) params.set('q', normalizedQuery)
    const queryString = params.toString()
    return queryString ? `/articles?${queryString}` : '/articles'
  }

  function selectTab(next) {
    setTab(next)
    const nextCompanyType = next === 'companies' ? companyType : 'all'
    const nextTopicType = next === 'topics' ? topicType : 'all'
    const nextSpecialType = next === 'special' ? specialType : 'all'
    if (next !== 'companies') {
      setCompanyType('all')
    }
    if (next !== 'topics') {
      setTopicType('all')
    }
    if (next !== 'special') {
      setSpecialType('all')
    }
    const url = buildArticlesUrl(next, nextCompanyType, nextTopicType, nextSpecialType, query)
    router.replace(url, { scroll: false })
  }

  function selectCompanyType(next) {
    setTab('companies')
    setCompanyType(next)
    const url = buildArticlesUrl('companies', next, 'all', 'all', query)
    router.replace(url, { scroll: false })
  }

  function selectTopicType(next) {
    setTab('topics')
    setTopicType(next)
    const url = buildArticlesUrl('topics', 'all', next, 'all', query)
    router.replace(url, { scroll: false })
  }

  function selectSpecialType(next) {
    setTab('special')
    setSpecialType(next)
    const url = buildArticlesUrl('special', 'all', 'all', next, query)
    router.replace(url, { scroll: false })
  }

  function submitSearch(event) {
    event.preventDefault()
    const url = buildArticlesUrl(tab, companyType, topicType, specialType, query)
    router.replace(url, { scroll: false })
  }

  function clearSearch() {
    setQuery('')
    const url = buildArticlesUrl(tab, companyType, topicType, specialType, '')
    router.replace(url, { scroll: false })
  }

  const counts = useMemo(() => {
    const base = Object.fromEntries(TAB_KEYS.map((k) => [k, 0]))
    base.all = items.length
    for (const item of items) {
      if (typeof base[item.kind] === 'number') base[item.kind] += 1
    }
    return base
  }, [items])

  const visible = useMemo(() => {
    const tabItems = tab === 'all' ? items : items.filter((item) => item.kind === tab)
    let typeFiltered = tabItems
    if (tab === 'companies' && companyType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.companyType === companyType)
    }
    if (tab === 'topics' && topicType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.topicType === topicType)
    }
    if (tab === 'special' && specialType !== 'all') {
      typeFiltered = typeFiltered.filter((item) => item.specialType === specialType)
    }
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return typeFiltered

    return typeFiltered.filter((item) => {
      const combined = [item.title, item.summary, item.tagLabel, item.date, item.kind]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return combined.includes(normalizedQuery)
    })
  }, [items, tab, companyType, topicType, specialType, query])

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
    let cancelled = false
    async function loadJuejinActivity() {
      try {
        const res = await fetch('/api/juejin-activity')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.countsByDate) {
          setJuejinCountsByDate(data.countsByDate)
          setJuejinTopTags(Array.isArray(data.topTags) ? data.topTags : [])
        }
      } catch {
        // 掘金抓取不可用时，保留站内热力图统计。
      }
    }
    loadJuejinActivity()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!heatmapData?.years?.length) return
    if (!selectedHeatmapYear || !heatmapData.years.includes(selectedHeatmapYear)) {
      setSelectedHeatmapYear(heatmapData.years[0])
    }
  }, [heatmapData, selectedHeatmapYear])

  useEffect(() => {
    const keys = Array.from(
      new Set(
        items
          .filter((item) => item.kind === 'companies' || item.kind === 'topics')
          .map((item) => {
            const parts = String(item.href || '').split('/')
            const category = parts[3]
            const slug = parts[4]
            return category && slug ? `${category}/${slug}` : ''
          })
          .filter(Boolean),
      ),
    )
    if (!keys.length) return

    let cancelled = false
    async function loadPv() {
      try {
        const res = await fetch(`/api/research-pv?keys=${encodeURIComponent(keys.join(','))}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.counts) setPvCounts(data.counts)
      } catch {
        // 统计接口不可用时保留静态 frontmatter 里的 pv。
      }
    }

    loadPv()
    return () => {
      cancelled = true
    }
  }, [items])

  const companyTypeCounts = useMemo(() => {
    const base = Object.fromEntries(COMPANY_TYPE_KEYS.map((k) => [k, 0]))
    const companyItems = items.filter((item) => item.kind === 'companies')
    base.all = companyItems.length
    for (const item of companyItems) {
      if (item.companyType && typeof base[item.companyType] === 'number') {
        base[item.companyType] += 1
      }
    }
    return base
  }, [items])

  const topicTypeCounts = useMemo(() => {
    const base = Object.fromEntries(TOPIC_TYPE_KEYS.map((k) => [k, 0]))
    const topicItems = items.filter((item) => item.kind === 'topics')
    base.all = topicItems.length
    for (const item of topicItems) {
      if (item.topicType && typeof base[item.topicType] === 'number') {
        base[item.topicType] += 1
      }
    }
    return base
  }, [items])

  const specialTypeCounts = useMemo(() => {
    const base = Object.fromEntries(SPECIAL_TYPE_KEYS.map((k) => [k, 0]))
    const specialItems = items.filter((item) => item.kind === 'special')
    base.all = specialItems.length
    for (const item of specialItems) {
      if (item.specialType && typeof base[item.specialType] === 'number') {
        base[item.specialType] += 1
      }
    }
    return base
  }, [items])

  return (
    <div className="space-y-4">
      <nav
        aria-label="知识库分类"
        className="flex flex-nowrap items-center gap-5 overflow-x-auto border-b border-[#e8dfd0] text-sm dark:border-gray-800"
      >
        {TAB_DEFS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={[
                'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2 pt-1 transition-colors',
                active
                  ? 'border-[#333] text-[#222] dark:border-gray-100 dark:text-gray-100'
                  : 'border-transparent text-[#716958] hover:text-[#222] dark:text-gray-400 dark:hover:text-gray-100',
              ].join(' ')}
            >
              <span className={active ? 'font-semibold' : ''}>{t.label}</span>
              <span className={active ? 'text-[#777] dark:text-gray-400' : 'text-[#999] dark:text-gray-500'}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          )
        })}

        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[#d8cdbc] dark:bg-gray-700" />

        {QUICK_LINKS.map((t) =>
          t.external ? (
            <a
              key={t.href}
              href={t.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 pt-1 text-[#7a6d58] no-underline hover:text-[#2d261d] dark:text-gray-400 dark:hover:text-gray-100"
            >
              <span>{t.label}</span>
              <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="h-3 w-3 opacity-70"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 2h6v6" />
                <path d="M10 2L4 8" />
                <path d="M9 8v2H2V3h2" />
              </svg>
            </a>
          ) : (
            <Link
              key={t.href}
              href={t.href}
              className="inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 pt-1 text-[#7a6d58] no-underline hover:text-[#2d261d] dark:text-gray-400 dark:hover:text-gray-100"
            >
              <span>{t.label}</span>
            </Link>
          ),
        )}
      </nav>

      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索知识库：标题 / 摘要 / 标签"
          className="min-w-[220px] flex-1 rounded-md border border-[#ddd3c2] bg-white px-3 py-2 text-sm text-[#2d261d] outline-none transition-colors focus:border-[#a99779] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
        />
        <button
          type="submit"
          className="rounded-md border border-[#d8cfbf] bg-[#faf6ef] px-3 py-2 text-sm text-[#5b5141] transition-colors hover:border-[#bdae93] hover:text-[#2d261d] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:text-white"
        >
          搜索
        </button>
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-md border border-transparent px-2 py-2 text-sm text-[#8f826c] transition-colors hover:text-[#3d3429] dark:text-gray-400 dark:hover:text-gray-200"
          >
            清空
          </button>
        ) : null}
      </form>

      {heatmapData ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[#2f2a21] dark:text-gray-100">热力图（{heatmapData.selectedYear}）</h2>
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
        </section>
      ) : null}

      {tab === 'companies' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#9a8b72] dark:text-[#7f8aa0]">公司分类</span>
          <nav aria-label="公司调研分类" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {COMPANY_TYPE_DEFS.map((t) => {
              const active = companyType === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectCompanyType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#eef4fb] font-medium text-[#285a8d] dark:bg-[#152034] dark:text-[#9bb6df]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6d8db0] dark:text-[#7899bf]' : 'text-[#a99d8a] dark:text-[#667287]'}>
                    {companyTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      {tab === 'topics' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#9a8b72] dark:text-[#7f8aa0]">事项分类</span>
          <nav aria-label="事项调研分类" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {TOPIC_TYPE_DEFS.map((t) => {
              const active = topicType === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectTopicType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#eef6f1] font-medium text-[#386b54] dark:bg-[#13201a] dark:text-[#9dcab1]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#6f927f] dark:text-[#78a98e]' : 'text-[#a99d8a] dark:text-[#667287]'}>
                    {topicTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      {tab === 'special' ? (
        <div className="-mt-2 flex min-w-0 items-center gap-3 text-sm">
          <span className="shrink-0 text-xs text-[#9a8b72] dark:text-[#7f8aa0]">专题分类</span>
          <nav aria-label="专题分类" className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto">
            {SPECIAL_TYPE_DEFS.map((t) => {
              const active = specialType === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectSpecialType(t.key)}
                  className={[
                    'inline-flex shrink-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-colors',
                    active
                      ? 'bg-[#f2eefc] font-medium text-[#5b4b8a] dark:bg-[#191424] dark:text-[#b8a6e8]'
                      : 'text-[#756b59] hover:text-[#2d261d] dark:text-[#9aa6b8] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  <span>{t.label}</span>
                  <span className={active ? 'text-[#8d7eb8] dark:text-[#9e90c8]' : 'text-[#a99d8a] dark:text-[#667287]'}>
                    {specialTypeCounts[t.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      ) : null}

      <div className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-sm text-[#666] dark:text-gray-400">
            {query ? '没有匹配的内容，试试更短关键词或切换分类。' : '该分类下暂无内容。'}
          </p>
        ) : (
          visible.map((item) => {
            const parts = String(item.href || '').split('/')
            const pvKey = parts[3] && parts[4] ? `${parts[3]}/${parts[4]}` : ''
            const livePv = pvKey && typeof pvCounts[pvKey] === 'number' ? pvCounts[pvKey] : item.pv
            const nextItem = 'pv' in item ? { ...item, pv: livePv } : item
            return <ArticleRow key={item.kind + ':' + item.href} item={nextItem} />
          })
        )}
      </div>
    </div>
  )
}

function ArticleRow({ item }) {
  const external = isExternalHref(item.href)
  return (
    <Link
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group block border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all"
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_160px]">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="shrink-0 text-sm text-[#999]">▪</span>
            {item.date ? <span className="shrink-0 text-xs text-[#999] dark:text-gray-400">{item.date}</span> : null}
            <span aria-hidden="true" className="shrink-0 text-xs text-[#ddd]">·</span>
            <span
              className={[
                'inline-flex shrink-0 items-center rounded-full border px-2 py-[1px] text-[11px]',
                KIND_TAG_CLASS[item.kind] || KIND_TAG_CLASS.people,
              ].join(' ')}
            >
              {item.tagLabel}
            </span>
            {item.encrypted ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e9d5b8] bg-[#fbf3e3] px-2 py-[1px] text-[11px] text-[#8a5a14] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]">
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className="h-2.5 w-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" />
                </svg>
                加密
              </span>
            ) : null}
            {item.version ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#ddd8cb] bg-white/70 px-2 py-[1px] text-[11px] text-[#5f5a4d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                {item.version}
              </span>
            ) : null}
          </div>
          <h2
            title={item.title}
            className="ml-5 truncate text-lg font-semibold text-[#333] transition-colors group-hover:text-[#111] dark:text-gray-100 dark:group-hover:text-white"
          >
            {item.title}
          </h2>
          {item.summary ? (
            <p className="ml-5 mt-2 line-clamp-2 text-sm leading-relaxed text-[#666] transition-colors group-hover:text-[#333] dark:text-gray-300 dark:group-hover:text-gray-200">
              {item.summary}
            </p>
          ) : null}
          <div className="ml-5 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#999] dark:text-gray-400">
            <span>{external ? '阅读原文 →' : '阅读全文 →'}</span>
            {item.readingMinutes ? (
              <span className="font-mono text-[11px] text-[#bbb] dark:text-gray-500">
                · {item.readingMinutes} min
              </span>
            ) : null}
            {'pv' in item ? (
              <span className="font-mono text-[11px] text-[#bbb] dark:text-gray-500">
                · 阅读量 {formatPv(item.pv)}
              </span>
            ) : null}
          </div>
        </div>
        {item.image ? (
          <div className="relative h-32 overflow-hidden rounded-md border border-[#e8dfd0] bg-[#f7f2ea] dark:border-gray-800 dark:bg-gray-950 sm:h-28 sm:w-40">
            <Image
              src={item.image.src}
              alt={item.image.alt || `${item.title} 配图`}
              fill
              sizes="(min-width: 640px) 160px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        ) : null}
      </div>
    </Link>
  )
}
