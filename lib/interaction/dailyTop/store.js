import { validateDailyTopDay } from './model.js'
import { gitDailyTopDays } from './gitCatalog.js'

export const DAILY_TOP_R2_PREFIX = 'interaction/daily-top/'
export const DAILY_TOP_CALENDAR_URL = 'https://2aran.com/resources/big-interaction-whitepaper/calendar'
export const DAILY_TOP_INGEST_SECRET_ENV = 'DAILY_TOP_INGEST_SECRET'
export const DAILY_TOP_INGEST_HEADER = 'x-daily-top-secret'

export function dailyTopObjectKey(date) {
  return `${DAILY_TOP_R2_PREFIX}${date}.json`
}

export function thankYouTextFor(day) {
  const mentions = (Array.isArray(day?.top) ? day.top : []).map((row) => `@${row.handle}`).join(' ')
  return `感谢过去一天的互动，谢谢 ${mentions} 愿意一起聊天。往期可以来大互动日历翻翻：${DAILY_TOP_CALENDAR_URL}`
}

export function toPublicDailyTopDay(day) {
  return {
    schemaVersion: day.schemaVersion,
    date: day.date,
    timezone: day.timezone,
    window: { start: day.window.start, end: day.window.end },
    metric: day.metric,
    metricLabel: day.metricLabel,
    subject: day.subject,
    excludedHandles: [...day.excludedHandles],
    opponents: day.opponents,
    events: day.events,
    top: day.top.map((row) => ({ ...row })),
    thankYouText: thankYouTextFor(day),
    calendarUrl: DAILY_TOP_CALENDAR_URL,
  }
}

export function mergeDailyTopDays(gitDays, liveDays) {
  const byDate = new Map()
  for (const day of gitDays || []) byDate.set(day.date, day)
  for (const day of liveDays || []) byDate.set(day.date, day)
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
}

async function listDailyTopKeys(bucket) {
  const keys = []
  let cursor
  for (let page = 0; page < 20; page += 1) {
    const listed = await bucket.list(cursor
      ? { prefix: DAILY_TOP_R2_PREFIX, cursor }
      : { prefix: DAILY_TOP_R2_PREFIX })
    for (const object of listed?.objects || []) {
      if (typeof object?.key === 'string' && object.key.endsWith('.json')) keys.push(object.key)
    }
    if (!listed?.truncated || !listed.cursor) break
    cursor = listed.cursor
  }
  return keys
}

async function readStoredDay(bucket, key) {
  const object = await bucket.get(key)
  if (!object) return null
  let parsed
  try {
    parsed = JSON.parse(await object.text())
  } catch {
    return null
  }
  const fileName = key.slice(DAILY_TOP_R2_PREFIX.length)
  try {
    return validateDailyTopDay(parsed, fileName)
  } catch {
    return null
  }
}

export async function readLiveDailyTopDays(bucket) {
  if (!bucket) return []
  const keys = await listDailyTopKeys(bucket)
  const days = []
  for (const key of keys) {
    const day = await readStoredDay(bucket, key)
    if (day) days.push(day)
  }
  return days
}

export async function loadCombinedDailyTopDays(bucket) {
  const gitDays = gitDailyTopDays()
  try {
    return mergeDailyTopDays(gitDays, await readLiveDailyTopDays(bucket))
  } catch {
    return gitDays
  }
}

export async function writeDailyTopDay(bucket, day) {
  const validated = validateDailyTopDay(day, `${day?.date || 'unknown'}.json`)
  try {
    await bucket.put(dailyTopObjectKey(validated.date), JSON.stringify(validated), {
      httpMetadata: {
        contentType: 'application/json; charset=utf-8',
        cacheControl: 'no-store',
      },
    })
  } catch {
    const error = new Error('CONTENT_FEED_WRITE_FAILED')
    error.code = 'CONTENT_FEED_WRITE_FAILED'
    throw error
  }
  return validated
}
