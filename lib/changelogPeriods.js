export const CHANGELOG_PERIOD_VIEWS = [
  { id: 'week', label: '周更新', unit: '周' },
  { id: 'month', label: '月度', unit: '个月' },
  { id: 'quarter', label: '季度', unit: '个季度' },
  { id: 'year', label: '年度', unit: '年' },
]

function entryDates(entry) {
  return [...String(entry?.range || '').matchAll(/\d{4}-\d{2}-\d{2}/g)].map((match) => match[0])
}

function entryAnchorDate(entry) {
  return entryDates(entry)[0] || `${String(entry?.week || '').slice(0, 4)}-01-01`
}

function periodIdentity(entry, view) {
  const date = entryAnchorDate(entry)
  const year = date.slice(0, 4)
  const month = Number.parseInt(date.slice(5, 7), 10) || 1

  if (view === 'year') return { key: year, label: `${year} 年` }
  if (view === 'quarter') {
    const quarter = Math.ceil(month / 3)
    return { key: `${year}-Q${quarter}`, label: `${year} 年第 ${quarter} 季度` }
  }
  if (view === 'month') {
    return { key: `${year}-${String(month).padStart(2, '0')}`, label: `${year} 年 ${month} 月` }
  }

  const weekMatch = String(entry?.week || '').match(/^(\d{4})-W(\d{1,2})$/)
  const weekYear = weekMatch?.[1] || year
  const weekNumber = Number.parseInt(weekMatch?.[2], 10) || 1
  return { key: `${weekYear}-W${String(weekNumber).padStart(2, '0')}`, label: `${weekYear} 年第 ${weekNumber} 周` }
}

function periodRange(entries) {
  const dates = entries.flatMap(entryDates).sort()
  if (!dates.length) return ''
  if (dates[0] === dates.at(-1)) return dates[0]
  return `${dates[0]} 至 ${dates.at(-1)}`
}

export function buildChangelogPeriods(entries, view = 'week') {
  const groups = new Map()

  for (const entry of entries || []) {
    const identity = periodIdentity(entry, view)
    const current = groups.get(identity.key) || {
      ...identity,
      entries: [],
      commits: 0,
    }
    current.entries.push(entry)
    current.commits += Number(entry.commits) || 0
    groups.set(identity.key, current)
  }

  return [...groups.values()].map((period) => ({
    ...period,
    range: periodRange(period.entries),
  }))
}
