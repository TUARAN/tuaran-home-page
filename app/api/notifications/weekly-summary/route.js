import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { safeEqual } from '../../../../lib/ownerAuth'
import { createWeeklySummaryNotification } from '../../../../lib/siteNotifications'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-weekly-summary-secret'
const DAY_MS = 24 * 60 * 60 * 1000
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

function shanghaiMondayStart(now) {
  const local = new Date(now + SHANGHAI_OFFSET_MS)
  const day = local.getUTCDay()
  const daysSinceMonday = (day + 6) % 7
  const localDayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  return localDayStart - daysSinceMonday * DAY_MS - SHANGHAI_OFFSET_MS
}

function formatShanghaiDate(timestamp) {
  const local = new Date(timestamp + SHANGHAI_OFFSET_MS)
  const year = local.getUTCFullYear()
  const month = String(local.getUTCMonth() + 1).padStart(2, '0')
  const day = String(local.getUTCDate()).padStart(2, '0')
  return {
    key: `${year}-${month}-${day}`,
    short: `${month}/${day}`,
  }
}

async function buildWeeklySummary(db, now) {
  const periodEnd = shanghaiMondayStart(now)
  const periodStart = periodEnd - 7 * DAY_MS
  const [traffic, likes, comments, subscribers] = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) AS pv,
              COUNT(DISTINCT CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END) AS uv
       FROM research_pv_hits
       WHERE created_at >= ?1 AND created_at < ?2`
    ).bind(periodStart, periodEnd).first().catch(() => null),
    db.prepare(
      `SELECT COUNT(*) AS total
       FROM article_likes
       WHERE created_at >= ?1 AND created_at < ?2`
    ).bind(periodStart, periodEnd).first().catch(() => null),
    db.prepare(
      `SELECT COUNT(*) AS total
       FROM article_comments
       WHERE created_at >= ?1 AND created_at < ?2`
    ).bind(periodStart, periodEnd).first().catch(() => null),
    db.prepare(
      `SELECT COUNT(*) AS total
       FROM newsletter_subscribers
       WHERE created_at >= ?1 AND created_at < ?2`
    ).bind(periodStart, periodEnd).first().catch(() => null),
  ])

  const start = formatShanghaiDate(periodStart)
  const end = formatShanghaiDate(periodEnd - 1)
  const metrics = {
    pv: Number(traffic?.pv) || 0,
    uv: Number(traffic?.uv) || 0,
    likes: Number(likes?.total) || 0,
    comments: Number(comments?.total) || 0,
    subscribers: Number(subscribers?.total) || 0,
  }
  return {
    weekKey: start.key,
    periodStart,
    periodEnd,
    metrics,
    messageExcerpt: `${start.short}—${end.short}：${metrics.pv} 次阅读、${metrics.uv} 位访客、${metrics.likes} 个点赞、${metrics.comments} 条评论、${metrics.subscribers} 位新订阅者。`,
  }
}

async function handle(request) {
  const env = getOptionalRequestContext()?.env || {}
  const requiredSecret = String(env.WEEKLY_SUMMARY_SECRET || env.PUBLIC_OPINION_COLLECT_SECRET || '')
  const suppliedSecret = request.headers.get(HEADER_SECRET) || ''
  if (!safeEqual(suppliedSecret, requiredSecret)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ error: 'D1 binding DB is missing' }, { status: 500 })
  }

  try {
    const now = Date.now()
    const summary = await buildWeeklySummary(env.DB, now)
    const notification = await createWeeklySummaryNotification(env.DB, {
      weekKey: summary.weekKey,
      messageExcerpt: summary.messageExcerpt,
      createdAt: now,
    })
    return Response.json({
      ok: true,
      generatedAt: now,
      timezone: 'Asia/Shanghai',
      ...summary,
      notification,
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: 'WEEKLY_SUMMARY_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export const GET = handle
export const POST = handle
