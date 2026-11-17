import { shanghaiDateKey } from '../automation/dailyGreeting.js'

export const GITHUB_TRENDING_REPO = 'TUARAN/github-auto-follow'
export const GITHUB_TRENDING_MAIN_REF = 'main'
export const GITHUB_TRENDING_FALLBACK_REF = 'feat/daily-trending-digest'
export const GITHUB_TRENDING_REVALIDATE_SECONDS = 3_600
export const GITHUB_TRENDING_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const GITHUB_TRENDING_PATH = '/tools/github-trending'

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_TRENDING_REPO}`
const FETCH_HEADERS = Object.freeze({
  accept: 'application/json',
  'user-agent': '2aran-github-trending/1.0',
})

export { shanghaiDateKey }

export function isTrendingDateKey(value) {
  return GITHUB_TRENDING_DATE_RE.test(String(value || '').trim())
}

export function trendingJsonUrl(fileName, ref = GITHUB_TRENDING_MAIN_REF) {
  const safeName = String(fileName || '').replace(/^\/+/, '')
  if (safeName !== 'index.json' && !isTrendingDateKey(safeName.replace(/\.json$/, ''))) {
    throw new Error(`Invalid trending file name: ${fileName}`)
  }
  return `${RAW_BASE}/${ref}/data/trending/${safeName}`
}

export function formatStarCount(value) {
  if (value == null || value === '') return '—'
  const stars = Number(value)
  if (!Number.isFinite(stars) || stars < 0) return '—'
  return new Intl.NumberFormat('zh-CN').format(Math.round(stars))
}

export function formatShanghaiDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${pick('year')}-${pick('month')}-${pick('day')} ${pick('hour')}:${pick('minute')}`
}

export function normalizeTrendingIndex(payload) {
  const dates = [...new Set(
    (Array.isArray(payload?.dates) ? payload.dates : [])
      .map((value) => String(value || '').trim())
      .filter(isTrendingDateKey),
  )].sort((a, b) => b.localeCompare(a))
  const latest = isTrendingDateKey(payload?.latest) && dates.includes(payload.latest)
    ? payload.latest
    : dates[0] || ''
  return { latest, dates }
}

function safeGithubRepoUrl(value, fullName) {
  const url = String(value || '').trim()
  if (/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url)) {
    return url.replace(/\/$/, '')
  }
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(fullName || ''))) {
    return `https://github.com/${fullName}`
  }
  return ''
}

export function normalizeTrendingItem(item) {
  const fullName = String(item?.full_name || '').trim()
  const url = safeGithubRepoUrl(item?.url, fullName)
  if (!fullName || !url) return null
  const language = String(item?.language || '').trim()
  const stars = Number(item?.stars)
  return {
    fullName,
    url,
    description: String(item?.description || '').trim(),
    language: language || '',
    stars: Number.isFinite(stars) && stars >= 0 ? stars : null,
    reason: String(item?.reason || '').trim(),
  }
}

export function normalizeTrendingDaily(payload, fallbackDate = '') {
  const date = isTrendingDateKey(payload?.date) ? payload.date : fallbackDate
  const items = (Array.isArray(payload?.items) ? payload.items : [])
    .map(normalizeTrendingItem)
    .filter(Boolean)
  return {
    date,
    generatedAt: String(payload?.generated_at || '').trim(),
    timezone: String(payload?.timezone || 'Asia/Shanghai').trim() || 'Asia/Shanghai',
    sources: (Array.isArray(payload?.sources) ? payload.sources : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
    count: Number.isFinite(Number(payload?.count)) ? Number(payload.count) : items.length,
    items,
  }
}

export function resolveSelectedDate(index, requestedDate, now = new Date()) {
  const dates = index?.dates || []
  const requested = String(requestedDate || '').trim()
  if (requested) {
    return isTrendingDateKey(requested) ? requested : ''
  }
  const today = shanghaiDateKey(now)
  if (dates.includes(today)) return today
  return index?.latest || dates[0] || ''
}

async function readJsonResponse(response) {
  if (!response?.ok) return { ok: false, status: response?.status || 0 }
  try {
    return { ok: true, status: response.status, data: await response.json() }
  } catch {
    return { ok: false, status: response.status }
  }
}

export async function fetchTrendingJson(fileName, { fetchImpl = fetch } = {}) {
  const refs = [GITHUB_TRENDING_MAIN_REF, GITHUB_TRENDING_FALLBACK_REF]
  let lastStatus = 0
  for (const ref of refs) {
    const response = await fetchImpl(trendingJsonUrl(fileName, ref), {
      headers: FETCH_HEADERS,
      next: { revalidate: GITHUB_TRENDING_REVALIDATE_SECONDS },
    })
    const parsed = await readJsonResponse(response)
    lastStatus = parsed.status
    if (parsed.ok) return { ok: true, ref, status: parsed.status, data: parsed.data }
  }
  return { ok: false, ref: '', status: lastStatus, data: null }
}

export async function loadGithubTrending({ date, now = new Date(), fetchImpl = fetch } = {}) {
  const indexResult = await fetchTrendingJson('index.json', { fetchImpl })
  if (!indexResult.ok) {
    return {
      status: 'index-unavailable',
      selectedDate: isTrendingDateKey(date) ? String(date).trim() : '',
      today: shanghaiDateKey(now),
      dates: [],
      latest: '',
      sourceRef: '',
      daily: null,
    }
  }

  const index = normalizeTrendingIndex(indexResult.data)
  const selectedDate = resolveSelectedDate(index, date, now)
  const today = shanghaiDateKey(now)

  if (!selectedDate) {
    return {
      status: 'unavailable',
      selectedDate: '',
      today,
      dates: index.dates,
      latest: index.latest,
      sourceRef: indexResult.ref,
      daily: null,
    }
  }

  if (!index.dates.includes(selectedDate)) {
    return {
      status: 'unavailable',
      selectedDate,
      today,
      dates: index.dates,
      latest: index.latest,
      sourceRef: indexResult.ref,
      daily: null,
    }
  }

  const dailyResult = await fetchTrendingJson(`${selectedDate}.json`, { fetchImpl })
  if (!dailyResult.ok) {
    return {
      status: 'unavailable',
      selectedDate,
      today,
      dates: index.dates,
      latest: index.latest,
      sourceRef: indexResult.ref,
      daily: null,
    }
  }

  const daily = normalizeTrendingDaily(dailyResult.data, selectedDate)
  return {
    status: daily.items.length ? 'ok' : 'unavailable',
    selectedDate,
    today,
    dates: index.dates,
    latest: index.latest,
    sourceRef: dailyResult.ref,
    daily,
  }
}
