import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const README_PATH = join(process.cwd(), 'tools/x-reply-clipboard-extension/README.md')
const ENTRY_RE = /^v(\d+(?:\.\d+)*)(?:（(\d{4}-\d{2}-\d{2})，([^）]+)）)?\s*(.+)$/u
const DAY_MS = 24 * 60 * 60 * 1000

export function parseXExtensionReleaseEntries(markdown) {
  const entries = []
  for (const line of String(markdown || '').split(/\n/u)) {
    const match = line.match(ENTRY_RE)
    if (!match) continue
    const [, version, date = '', status = '', body = ''] = match
    entries.push({
      version: `v${version}`,
      date: date || null,
      status: status || null,
      body: String(body || '').trim(),
    })
  }
  return entries
}

function shanghaiWeekdayMondayBased(dateKey) {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    weekday: 'short',
  }).format(new Date(`${dateKey}T12:00:00+08:00`))
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[label] ?? 0
}

export function mondayOfShanghaiDate(dateKey) {
  const weekday = shanghaiWeekdayMondayBased(dateKey)
  const base = Date.parse(`${dateKey}T12:00:00+08:00`)
  const monday = new Date(base - weekday * DAY_MS)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(monday)
}

function addShanghaiDays(dateKey, days) {
  const next = new Date(Date.parse(`${dateKey}T12:00:00+08:00`) + days * DAY_MS)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(next)
}

function formatMd(dateKey) {
  const [, month, day] = String(dateKey).split('-')
  return `${Number(month)}/${Number(day)}`
}

function compareSemverDesc(left, right) {
  const toParts = (value) => String(value || '').replace(/^v/u, '').split('.').map((part) => Number(part) || 0)
  const a = toParts(left)
  const b = toParts(right)
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const diff = (b[index] || 0) - (a[index] || 0)
    if (diff) return diff
  }
  return 0
}

function shortHighlight(body) {
  const text = String(body || '')
    .replace(/打包文件[`（].*$/u, '')
    .replace(/SHA-256：.*$/u, '')
    .replace(/公开下载仍是.*$/u, '')
    .replace(/未打包。?$/u, '')
    .replace(/源码标记：.*$/u, '')
    .trim()
  const sentence = text.split(/[。；]/u)[0] || text
  const clipped = Array.from(sentence).slice(0, 72).join('').trim()
  return clipped.endsWith('。') ? clipped : `${clipped}${clipped ? '。' : ''}`
}

function pickHighlights(entries, limit = 5) {
  const ranked = [...entries].sort((left, right) => {
    const score = (item) => {
      let value = 0
      if (/已打包|已发布/.test(item.status || '') || /打包文件/.test(item.body || '')) value += 8
      const parts = String(item.version || '').replace(/^v/u, '').split('.').map((part) => Number(part) || 0)
      if ((parts[2] || 0) === 0) value += 5
      if ((parts[1] || 0) === 0 && (parts[2] || 0) === 0) value += 4
      value += Math.min(3, Array.from(item.body || '').length / 40)
      return value
    }
    return score(right) - score(left) || compareSemverDesc(left.version, right.version)
  })
  const selected = []
  const seen = new Set()
  for (const entry of ranked) {
    const highlight = shortHighlight(entry.body)
    if (!highlight || seen.has(highlight)) continue
    seen.add(highlight)
    selected.push({ version: entry.version, text: highlight })
    if (selected.length >= limit) break
  }
  return selected
}

function weekIndexFromAnchor(weekStart, anchorStart) {
  const delta = Date.parse(`${weekStart}T12:00:00+08:00`) - Date.parse(`${anchorStart}T12:00:00+08:00`)
  return Math.floor(delta / (7 * DAY_MS)) + 1
}

export function buildXExtensionReleaseWeeks(entries) {
  const list = Array.isArray(entries) ? entries : []
  const dated = list.filter((item) => item.date)
  const undated = list.filter((item) => !item.date)
  if (!dated.length && !undated.length) return []

  const oldestDated = [...dated].sort((left, right) => String(left.date).localeCompare(String(right.date)))[0]
  const anchorStart = oldestDated ? mondayOfShanghaiDate(oldestDated.date) : null

  const buckets = new Map()
  for (const entry of dated) {
    const weekStart = mondayOfShanghaiDate(entry.date)
    const weekEnd = addShanghaiDays(weekStart, 6)
    const week = weekIndexFromAnchor(weekStart, anchorStart)
    const key = weekStart
    if (!buckets.has(key)) {
      buckets.set(key, {
        week,
        weekStart,
        weekEnd,
        label: `第 ${week} 周`,
        rangeLabel: `${formatMd(weekStart)}–${formatMd(weekEnd)}`,
        entries: [],
      })
    }
    buckets.get(key).entries.push(entry)
  }

  const weeks = [...buckets.values()]
    .sort((left, right) => right.weekStart.localeCompare(left.weekStart))
    .map((bucket) => {
      const versions = [...bucket.entries].map((item) => item.version).sort(compareSemverDesc)
      const newest = versions[0]
      const oldest = versions[versions.length - 1]
      return {
        id: `week-${bucket.week}`,
        week: bucket.week,
        weekStart: bucket.weekStart,
        weekEnd: bucket.weekEnd,
        label: bucket.label,
        rangeLabel: bucket.rangeLabel,
        title: `${bucket.label} · ${bucket.rangeLabel}`,
        versionRange: newest === oldest ? newest : `${oldest} → ${newest}`,
        count: bucket.entries.length,
        highlights: pickHighlights(bucket.entries),
        entries: bucket.entries,
      }
    })

  if (undated.length) {
    const versions = undated.map((item) => item.version).sort(compareSemverDesc)
    weeks.push({
      id: 'week-early',
      week: 0,
      weekStart: null,
      weekEnd: null,
      label: '起步阶段',
      rangeLabel: '首个有日期版本之前',
      title: '起步阶段 · 首个有日期版本之前',
      versionRange: versions.length > 1 ? `${versions[versions.length - 1]} → ${versions[0]}` : versions[0] || '',
      count: undated.length,
      highlights: pickHighlights(undated, 6),
      entries: undated,
    })
  }

  return weeks
}

export function loadXExtensionReleaseWeeks({ readFile = readFileSync, cwd = process.cwd() } = {}) {
  const markdown = readFile(join(cwd, 'tools/x-reply-clipboard-extension/README.md'), 'utf8')
  return buildXExtensionReleaseWeeks(parseXExtensionReleaseEntries(markdown))
}

export function summarizeXExtensionReleaseWeeks(weeks) {
  return (Array.isArray(weeks) ? weeks : []).map((week) => ({
    id: week.id,
    week: week.week,
    title: week.title,
    versionRange: week.versionRange,
    count: week.count,
    highlights: (week.highlights || []).map((item) => `${item.version} ${item.text}`),
  }))
}

export { README_PATH }
