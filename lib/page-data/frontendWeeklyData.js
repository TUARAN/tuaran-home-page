export const FRONTEND_WEEKLY_KEYS = Object.freeze({
  live: 'frontend-weekly/live/current.json',
  dailyIndex: 'frontend-weekly/daily/index.json',
  weeklyIndex: 'frontend-weekly/weekly/index.json',
})

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_JSON_BYTES = 1024 * 1024
const READER_ORIGINS = new Set([
  'https://2aran.com',
  'https://weekly.2aran.com',
  'https://frontendnext.com',
  'https://frontendweekly.cn',
  'https://qdzk.site',
  'https://fwdc.pages.dev',
])

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function string(value, max = 4000) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function httpUrl(value) {
  const text = string(value, 3000)
  if (!text) return ''
  try {
    const url = new URL(text)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function sanitizeLiveItem(item) {
  if (!plainObject(item)) return null
  const title = string(item.title, 500)
  const href = httpUrl(item.href)
  if (!title || !href) return null
  return {
    topic: string(item.topic, 80) || '资讯',
    title,
    summary: string(item.summary, 4000),
    source: string(item.source, 160) || 'AI HOT',
    href,
    publishedAt: string(item.publishedAt, 80) || null,
  }
}

export function sanitizeLivePayload(payload) {
  if (!plainObject(payload)) throw new Error('live payload must be an object')
  const items = (Array.isArray(payload.items) ? payload.items : [])
    .map(sanitizeLiveItem)
    .filter(Boolean)
    .slice(0, 60)
  if (!items.length) throw new Error('live payload has no valid items')
  return {
    updatedAt: string(payload.updatedAt, 80) || new Date().toISOString(),
    items,
  }
}

function sanitizeDailyItem(item, index) {
  if (!plainObject(item)) return null
  const title = string(item.title, 500)
  if (!title) return null
  const href = httpUrl(item.href)
  return {
    num: string(item.num, 8) || String(index + 1).padStart(2, '0'),
    topic: string(item.topic, 80) || 'AI Coding',
    title,
    summary: string(item.summary, 4000),
    reason: string(item.reason, 1000),
    ...(href ? { href } : {}),
    ...(string(item.source, 160) ? { source: string(item.source, 160) } : {}),
  }
}

export function sanitizeDailyPayload(payload) {
  if (!plainObject(payload) || !DATE_RE.test(payload.date || '')) {
    throw new Error('daily payload requires a YYYY-MM-DD date')
  }
  const date = payload.date
  const items = (Array.isArray(payload.items) ? payload.items : [])
    .map(sanitizeDailyItem)
    .filter(Boolean)
    .slice(0, 10)
  if (!items.length) throw new Error('daily payload has no valid items')
  return {
    date,
    displayDate: string(payload.displayDate, 80) || date,
    ...(string(payload.dateNum, 20) ? { dateNum: string(payload.dateNum, 20) } : {}),
    ...(Number.isFinite(payload.year) ? { year: payload.year } : {}),
    ...(string(payload.dayOfWeek, 20) ? { dayOfWeek: string(payload.dayOfWeek, 20) } : {}),
    ...(Array.isArray(payload.topics) ? { topics: payload.topics.map((item) => string(item, 80)).filter(Boolean).slice(0, 10) } : {}),
    ...(string(payload.sources, 500) ? { sources: string(payload.sources, 500) } : {}),
    count: items.length,
    highlights: Array.isArray(payload.highlights)
      ? payload.highlights.map((item) => string(item, 160)).filter(Boolean).slice(0, 10)
      : items.map((item) => item.title.slice(0, 26)),
    items,
  }
}

export function sanitizeWeeklyPayload(payload) {
  if (!plainObject(payload)) throw new Error('weekly payload must be an object')
  const issues = Array.isArray(payload.issues) ? payload.issues : []
  if (!issues.length || issues.length > 520) throw new Error('weekly payload has an invalid issue count')
  return {
    updatedAt: string(payload.updatedAt, 80) || new Date().toISOString(),
    source: string(payload.source, 200) || 'TUARAN/frontend-weekly-digest-cn',
    issues,
  }
}

export function dailyObjectKey(date) {
  if (!DATE_RE.test(date || '')) throw new Error('invalid daily date')
  return `frontend-weekly/daily/${date}.json`
}

export function isValidDailyDate(date) {
  return DATE_RE.test(date || '')
}

export function jsonByteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

export function assertJsonSize(value) {
  if (jsonByteLength(value) > MAX_JSON_BYTES) throw new Error('payload is too large')
}

export function frontendWeeklyCorsHeaders(request) {
  const origin = request?.headers?.get('origin') || ''
  return READER_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {}
}

export async function readR2Json(bucket, key, fallback = null) {
  if (!bucket) return fallback
  const object = await bucket.get(key)
  if (!object) return fallback
  try {
    return JSON.parse(await object.text())
  } catch {
    return fallback
  }
}

export async function writeR2Json(bucket, key, value, cacheControl) {
  if (!bucket) throw new Error('R2 binding CONTENT_FEED is missing')
  assertJsonSize(value)
  await bucket.put(key, JSON.stringify(value), {
    httpMetadata: {
      contentType: 'application/json; charset=utf-8',
      cacheControl,
    },
  })
}

export function mergeDailyManifest(current, daily) {
  const previous = plainObject(current) && Array.isArray(current.list) ? current.list : []
  const entry = {
    date: daily.date,
    displayDate: daily.displayDate,
    count: daily.count,
    highlights: daily.highlights,
  }
  return {
    latest: daily.date,
    list: [entry, ...previous.filter((item) => item?.date !== daily.date)]
      .filter((item) => DATE_RE.test(item?.date || ''))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 400),
  }
}
