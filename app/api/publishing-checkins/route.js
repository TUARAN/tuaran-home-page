import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import {
  PUBLISHING_PLATFORMS,
  calculatePublishingStreak,
  isPublishingDayKey,
  isPublishingMonthKey,
  publishingMonthRange,
  publishingToday,
} from '../../../lib/publishingCheckins'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PLATFORM_KEYS = new Set(PUBLISHING_PLATFORMS.map((platform) => platform.key))

function cleanRecord(row) {
  return {
    checkinDate: String(row.checkin_date),
    platform: String(row.platform),
    postUrl: String(row.post_url || ''),
  }
}

function validPostUrl(value) {
  if (!value) return true
  if (value.length > 500) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    const today = publishingToday()
    const requestedMonth = new URL(request.url).searchParams.get('month') || today.slice(0, 7)
    if (!isPublishingMonthKey(requestedMonth)) {
      return Response.json({ error: 'INVALID_MONTH' }, { status: 400 })
    }
    if (!user) return Response.json({ authed: false, month: requestedMonth, today, records: [], streak: 0 })

    const range = publishingMonthRange(requestedMonth)
    const db = getD1()
    const [monthResult, recentResult] = await Promise.all([
      db.prepare(
        `SELECT checkin_date, platform, post_url FROM publishing_checkins
         WHERE user_id = ?1 AND checkin_date BETWEEN ?2 AND ?3
         ORDER BY checkin_date, platform`
      ).bind(String(user.id), range.start, range.end).all(),
      db.prepare(
        `SELECT checkin_date, platform, post_url FROM publishing_checkins
         WHERE user_id = ?1 AND checkin_date <= ?2
         ORDER BY checkin_date DESC LIMIT 1500`
      ).bind(String(user.id), today).all(),
    ])
    const records = (monthResult?.results || []).map(cleanRecord)
    const recentRecords = (recentResult?.results || []).map(cleanRecord)
    return Response.json({ authed: true, month: requestedMonth, today, records, streak: calculatePublishingStreak(recentRecords, today) })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    const body = await request.json().catch(() => null)
    const date = String(body?.date || '')
    const platform = String(body?.platform || '')
    const completed = body?.completed === true
    const postUrl = String(body?.postUrl || '').trim()
    const today = publishingToday()
    if (!isPublishingDayKey(date) || date > today) return Response.json({ error: 'INVALID_DATE' }, { status: 400 })
    if (!PLATFORM_KEYS.has(platform)) return Response.json({ error: 'INVALID_PLATFORM' }, { status: 400 })
    if (!validPostUrl(postUrl)) return Response.json({ error: 'INVALID_URL' }, { status: 400 })

    const db = getD1()
    const userId = String(user.id)
    if (!completed) {
      await db.prepare(
        'DELETE FROM publishing_checkins WHERE user_id = ?1 AND checkin_date = ?2 AND platform = ?3'
      ).bind(userId, date, platform).run()
      return Response.json({ ok: true, completed: false, date, platform })
    }

    const now = Date.now()
    await db.prepare(
      `INSERT INTO publishing_checkins (user_id, checkin_date, platform, post_url, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT(user_id, checkin_date, platform) DO UPDATE SET post_url = excluded.post_url, updated_at = excluded.updated_at`
    ).bind(userId, date, platform, postUrl, now).run()
    return Response.json({ ok: true, completed: true, record: { checkinDate: date, platform, postUrl } })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
