export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]
const BASE_URL = 'https://tuaran.github.io/auto-sync-blog/years'

const DATE_TAG_RE = /📅\s*(\d{4}-\d{2}-\d{2})\s*🏷([^\n]*)/g
const YEAR_TOTAL_RE = /##\s*本年发布\s*(\d+)/
const TAG_RE = /`([^`]+)`/g

const CACHE_TTL_MS = 12 * 60 * 60 * 1000
let cachedPayload = null
let cachedAt = 0

function parseYearPage(text) {
  const countsByDate = {}
  const tagsCount = {}
  let parsedCount = 0

  for (const match of text.matchAll(DATE_TAG_RE)) {
    const date = match[1]
    const tagsRaw = match[2] || ''
    countsByDate[date] = (countsByDate[date] || 0) + 1
    parsedCount += 1

    for (const tagMatch of tagsRaw.matchAll(TAG_RE)) {
      const tag = String(tagMatch[1] || '').trim()
      if (!tag) continue
      tagsCount[tag] = (tagsCount[tag] || 0) + 1
    }
  }

  const reportedTotal = Number(YEAR_TOTAL_RE.exec(text)?.[1] || 0)
  return { countsByDate, tagsCount, parsedCount, reportedTotal }
}

async function fetchYear(year) {
  const url = `${BASE_URL}/${year}.html`
  const res = await fetch(url, {
    headers: {
      'user-agent': 'tuaran-home-page-juejin-heatmap',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const text = await res.text()
  const parsed = parseYearPage(text)
  return { year, ...parsed }
}

function mergeTagCount(target, source) {
  for (const [tag, value] of Object.entries(source)) {
    target[tag] = (target[tag] || 0) + value
  }
}

function topTags(tagsCount, limit = 12) {
  return Object.entries(tagsCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}

async function buildPayload() {
  const yearly = await Promise.all(YEARS.map(fetchYear))
  const countsByDate = {}
  const tagsCount = {}
  const yearSummary = []

  for (const entry of yearly) {
    for (const [date, count] of Object.entries(entry.countsByDate)) {
      countsByDate[date] = (countsByDate[date] || 0) + count
    }
    mergeTagCount(tagsCount, entry.tagsCount)
    yearSummary.push({
      year: entry.year,
      parsedCount: entry.parsedCount,
      reportedTotal: entry.reportedTotal,
    })
  }

  return {
    source: 'juejin-auto-sync-blog',
    years: YEARS,
    countsByDate,
    yearSummary: yearSummary.sort((a, b) => b.year - a.year),
    topTags: topTags(tagsCount),
    totalPosts: Object.values(countsByDate).reduce((acc, value) => acc + value, 0),
    generatedAt: new Date().toISOString(),
  }
}

export async function GET() {
  const now = Date.now()
  if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
    return Response.json(cachedPayload)
  }

  try {
    const payload = await buildPayload()
    cachedPayload = payload
    cachedAt = now
    return Response.json(payload)
  } catch {
    return Response.json(
      { error: 'FETCH_FAILED', message: '掘金年度归档抓取失败，请稍后重试。' },
      { status: 502 },
    )
  }
}
