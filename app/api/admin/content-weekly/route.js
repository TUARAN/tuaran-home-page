import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { resolveArticleKey, resolveContentKey } from '../../../../lib/articleLinks'
import { getD1 } from '../../../../lib/d1'
import { CONTENT_TYPE_GROUP } from '../../../../lib/contentRegistry'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000
const SHANGHAI_TZ_OFFSET_MS = 8 * 60 * 60 * 1000
const ALLOWED_DAYS = new Set([1, 7, 30, 90])
const LIMIT = 12

function shanghaiDayStart(now) {
  const local = new Date(now + SHANGHAI_TZ_OFFSET_MS)
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - SHANGHAI_TZ_OFFSET_MS
}

function formatShanghaiDay(dayStart) {
  const local = new Date(dayStart + SHANGHAI_TZ_OFFSET_MS)
  const year = local.getUTCFullYear()
  const month = String(local.getUTCMonth() + 1).padStart(2, '0')
  const date = String(local.getUTCDate()).padStart(2, '0')
  return { date: `${year}-${month}-${date}`, label: `${month}/${date}` }
}

function buildSeries(rows, start, days) {
  const values = new Map(rows.map((row) => [Number(row.day_key), Number(row.pv) || 0]))
  return Array.from({ length: days }, (_, index) => {
    const dayStart = start + index * DAY_MS
    const dayKey = Math.floor((dayStart + SHANGHAI_TZ_OFFSET_MS) / DAY_MS)
    return { ...formatShanghaiDay(dayStart), dayStart, pv: values.get(dayKey) || 0 }
  })
}

function visitorKeySql() {
  return `CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END`
}

function typeRows(rows) {
  const grouped = new Map()
  for (const row of rows) {
    const type = CONTENT_TYPE_GROUP[row.category] || '其它'
    const current = grouped.get(type) || { type, pv: 0, previousPv: 0 }
    current.pv += Number(row.pv) || 0
    current.previousPv += Number(row.previous_pv) || 0
    grouped.set(type, current)
  }
  return [...grouped.values()]
    .map((row) => ({ ...row, delta: row.pv - row.previousPv }))
    .sort((a, b) => b.pv - a.pv)
}

function resolveReadRows(rows) {
  return rows.map((row) => {
    const resolved = resolveContentKey(row.category, row.slug)
    const pv = Number(row.pv) || 0
    const previousPv = Number(row.previous_pv) || 0
    return {
      key: `${row.category}/${row.slug}`,
      title: resolved.title,
      href: resolved.href,
      type: resolved.type,
      pv,
      previousPv,
      uv: Number(row.uv) || 0,
      delta: pv - previousPv,
    }
  })
}

function unavailable(days) {
  return Response.json({
    status: 'unavailable',
    generatedAt: Date.now(),
    window: { days, timezone: 'Asia/Shanghai' },
    overview: { pv: 0, previousPv: 0, uv: 0, previousUv: 0, returning: 0, returnRate: 0 },
    series: [], topContent: [], byType: [], sources: [], audience: { breakdown: [], visitors: [] },
    today: { pv: 0, uv: 0, topContent: [], sources: [], visitors: [] },
    likes: { total: 0, previousTotal: 0, top: [] },
    comments: { recent: [], total: { all: 0, period: 0, articles: 0 } },
    newsletter: { active: 0, period: 0 },
  })
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const requestedDays = Number(new URL(req.url).searchParams.get('days'))
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 7

  let db
  try {
    db = getD1()
  } catch {
    return unavailable(days)
  }

  const now = Date.now()
  const todayStart = shanghaiDayStart(now)
  const periodStart = todayStart - (days - 1) * DAY_MS
  const previousStart = periodStart - days * DAY_MS
  const visitorKey = visitorKeySql()

  try {
    const [
      overviewRow,
      returningRow,
      seriesRows,
      contentRows,
      categoryRows,
      sourceRows,
      audienceRows,
      visitorRows,
      todayOverview,
      todayContentRows,
      todaySourceRows,
      todayVisitorRows,
      likeTotal,
      likeRows,
      commentRows,
      commentTotal,
      newsletterTotal,
      coverageRow,
    ] = await Promise.all([
      db.prepare(
        `SELECT
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS pv,
           SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS previous_pv,
           COUNT(DISTINCT CASE WHEN created_at >= ?1 THEN ${visitorKey} END) AS uv,
           COUNT(DISTINCT CASE WHEN created_at >= ?2 AND created_at < ?1 THEN ${visitorKey} END) AS previous_uv
         FROM research_pv_hits WHERE created_at >= ?2 AND created_at <= ?3`,
      ).bind(periodStart, previousStart, now).first(),
      db.prepare(
        `SELECT COUNT(*) AS returning FROM (
           SELECT ${visitorKey} AS visitor_key
           FROM research_pv_hits
           WHERE created_at >= ?1 AND created_at <= ?2
           GROUP BY visitor_key
           HAVING COUNT(DISTINCT CAST((created_at + ?3) / ?4 AS INTEGER)) >= 2
         )`,
      ).bind(periodStart, now, SHANGHAI_TZ_OFFSET_MS, DAY_MS).first(),
      db.prepare(
        `SELECT CAST((created_at + ?1) / ?2 AS INTEGER) AS day_key, COUNT(*) AS pv
         FROM research_pv_hits WHERE created_at >= ?3 AND created_at <= ?4
         GROUP BY day_key ORDER BY day_key ASC`,
      ).bind(SHANGHAI_TZ_OFFSET_MS, DAY_MS, periodStart, now).all().then((r) => r.results || []),
      db.prepare(
        `SELECT category, slug,
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS pv,
           SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS previous_pv,
           COUNT(DISTINCT CASE WHEN created_at >= ?1 THEN ${visitorKey} END) AS uv
         FROM research_pv_hits WHERE created_at >= ?2 AND created_at <= ?3
         GROUP BY category, slug
         HAVING SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) > 0
         ORDER BY pv DESC, uv DESC LIMIT ?4`,
      ).bind(periodStart, previousStart, now, LIMIT).all().then((r) => r.results || []),
      db.prepare(
        `SELECT category,
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS pv,
           SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS previous_pv
         FROM research_pv_hits WHERE created_at >= ?2 AND created_at <= ?3 GROUP BY category`,
      ).bind(periodStart, previousStart, now).all().then((r) => r.results || []),
      db.prepare(
        `SELECT source, medium, campaign, referrer_host, COUNT(*) AS pv,
           COUNT(DISTINCT ${visitorKey}) AS uv
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2
         GROUP BY source, medium, campaign, referrer_host
         ORDER BY pv DESC, uv DESC LIMIT ?3`,
      ).bind(periodStart, now, LIMIT).all().then((r) => r.results || []),
      db.prepare(
        `SELECT visitor_type, COUNT(*) AS pv, COUNT(DISTINCT ${visitorKey}) AS uv
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2
         GROUP BY visitor_type ORDER BY pv DESC`,
      ).bind(periodStart, now).all().then((r) => r.results || []),
      db.prepare(
        `SELECT ${visitorKey} AS visitor_key,
           MAX(visitor_type) AS visitor_type, MAX(user_provider) AS user_provider,
           MAX(user_name) AS user_name, COUNT(*) AS pv,
           COUNT(DISTINCT category || '/' || slug) AS content_count, MAX(created_at) AS last_seen
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2
         GROUP BY visitor_key ORDER BY pv DESC, last_seen DESC LIMIT ?3`,
      ).bind(periodStart, now, LIMIT).all().then((r) => r.results || []),
      db.prepare(
        `SELECT COUNT(*) AS pv, COUNT(DISTINCT ${visitorKey}) AS uv
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2`,
      ).bind(todayStart, now).first(),
      db.prepare(
        `SELECT category, slug, COUNT(*) AS pv, COUNT(DISTINCT ${visitorKey}) AS uv, 0 AS previous_pv
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2
         GROUP BY category, slug ORDER BY pv DESC, uv DESC LIMIT ?3`,
      ).bind(todayStart, now, LIMIT).all().then((r) => r.results || []),
      db.prepare(
        `SELECT source, medium, campaign, referrer_host, COUNT(*) AS pv,
           COUNT(DISTINCT ${visitorKey}) AS uv
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2
         GROUP BY source, medium, campaign, referrer_host ORDER BY pv DESC LIMIT 8`,
      ).bind(todayStart, now).all().then((r) => r.results || []),
      db.prepare(
        `SELECT ${visitorKey} AS visitor_key,
           MAX(visitor_type) AS visitor_type, MAX(user_provider) AS user_provider,
           MAX(user_name) AS user_name, COUNT(*) AS pv,
           COUNT(DISTINCT category || '/' || slug) AS content_count, MAX(created_at) AS last_seen
         FROM research_pv_hits WHERE created_at >= ?1 AND created_at <= ?2
         GROUP BY visitor_key ORDER BY last_seen DESC LIMIT ?3`,
      ).bind(todayStart, now, LIMIT).all().then((r) => r.results || []),
      db.prepare(
        `SELECT
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS total,
           SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS previous_total
         FROM article_likes WHERE created_at >= ?2 AND created_at <= ?3`,
      ).bind(periodStart, previousStart, now).first(),
      db.prepare(
        `SELECT article_key,
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS total,
           SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS previous_total
         FROM article_likes WHERE created_at >= ?2 AND created_at <= ?3
         GROUP BY article_key HAVING SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) > 0
         ORDER BY total DESC LIMIT ?4`,
      ).bind(periodStart, previousStart, now, LIMIT).all().then((r) => r.results || []),
      db.prepare(
        `SELECT id, article_key, user_id, user_provider, user_name, user_image, message, created_at
         FROM article_comments ORDER BY created_at DESC LIMIT 20`,
      ).all().then((r) => r.results || []),
      db.prepare(
        `SELECT COUNT(*) AS total_comments, COUNT(DISTINCT article_key) AS article_count,
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS period_comments
         FROM article_comments`,
      ).bind(periodStart).first(),
      db.prepare(
        `SELECT COUNT(*) AS active,
           SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS period_total
         FROM newsletter_subscribers WHERE status = 'active'`,
      ).bind(periodStart).first().catch(() => null),
      db.prepare('SELECT MIN(created_at) AS available_from, MAX(created_at) AS available_to FROM research_pv_hits').first(),
    ])

    const pv = Number(overviewRow?.pv) || 0
    const uv = Number(overviewRow?.uv) || 0
    const returning = Number(returningRow?.returning) || 0
    const mapSource = (row) => ({
      source: row.source || 'direct',
      medium: row.medium || 'none',
      campaign: row.campaign || '',
      referrerHost: row.referrer_host || '',
      pv: Number(row.pv) || 0,
      uv: Number(row.uv) || 0,
    })
    const mapVisitor = (row) => ({
      key: row.visitor_key || '',
      type: row.visitor_type || 'anonymous',
      provider: row.user_provider || '',
      name: row.user_name || (row.visitor_type === 'guest' ? '游客' : '匿名访客'),
      pv: Number(row.pv) || 0,
      contentCount: Number(row.content_count) || 0,
      lastSeen: Number(row.last_seen) || 0,
    })
    const likes = likeRows.map((row) => {
      const resolved = resolveArticleKey(row.article_key)
      const total = Number(row.total) || 0
      const previousTotal = Number(row.previous_total) || 0
      return { key: row.article_key, title: resolved.title, href: resolved.href, total, previousTotal, delta: total - previousTotal }
    })
    const comments = commentRows.map((row) => {
      const resolved = resolveArticleKey(row.article_key)
      return {
        id: Number(row.id), articleKey: row.article_key || '', articleTitle: resolved.title,
        href: resolved.href ? `${resolved.href}#comments` : null,
        userId: row.user_id || '', userProvider: row.user_provider || '',
        userName: row.user_name || '', userImage: row.user_image || '',
        message: row.message || '', createdAt: Number(row.created_at) || 0,
      }
    })
    const availableFrom = Number(coverageRow?.available_from) || 0

    return Response.json({
      status: 'ok',
      generatedAt: now,
      window: {
        days, periodStart, previousStart, todayStart, timezone: 'Asia/Shanghai',
        availableFrom, availableTo: Number(coverageRow?.available_to) || 0,
        complete: Boolean(availableFrom && availableFrom <= periodStart),
      },
      overview: {
        pv, previousPv: Number(overviewRow?.previous_pv) || 0,
        uv, previousUv: Number(overviewRow?.previous_uv) || 0,
        returning, returnRate: uv ? returning / uv : 0,
        viewsPerVisitor: uv ? pv / uv : 0,
      },
      series: buildSeries(seriesRows, periodStart, days),
      topContent: resolveReadRows(contentRows),
      byType: typeRows(categoryRows),
      sources: sourceRows.map(mapSource),
      audience: {
        breakdown: audienceRows.map((row) => ({ type: row.visitor_type || 'anonymous', pv: Number(row.pv) || 0, uv: Number(row.uv) || 0 })),
        visitors: visitorRows.map(mapVisitor),
      },
      today: {
        pv: Number(todayOverview?.pv) || 0,
        uv: Number(todayOverview?.uv) || 0,
        topContent: resolveReadRows(todayContentRows),
        sources: todaySourceRows.map(mapSource),
        visitors: todayVisitorRows.map(mapVisitor),
      },
      likes: { total: Number(likeTotal?.total) || 0, previousTotal: Number(likeTotal?.previous_total) || 0, top: likes },
      comments: {
        recent: comments,
        total: { all: Number(commentTotal?.total_comments) || 0, period: Number(commentTotal?.period_comments) || 0, articles: Number(commentTotal?.article_count) || 0 },
      },
      newsletter: { active: Number(newsletterTotal?.active) || 0, period: Number(newsletterTotal?.period_total) || 0 },
    })
  } catch (error) {
    return Response.json({ status: 'error', generatedAt: now, error: 'CONTENT_ANALYTICS_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}
