import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { resolveArticleKey, resolveContentKey } from '../../../../lib/articleLinks'
import { getD1 } from '../../../../lib/d1'
import { CONTENT_TYPE_GROUP } from '../../../../lib/contentRegistry'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 自建数据中心(看板按需计算,无定时、无存储)。
 * 口径:最近 7 天 + 当前自然月被读(research_pv_hits，含调研/资料/灵感)/被赞(article_likes)的 top,
 *      分别与前 7 天 / 上一自然月同口径对比出趋势。两张表 created_at 均为毫秒。
 */

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const SHANGHAI_TZ_OFFSET_MS = 8 * 60 * 60 * 1000
const LIMIT = 12

function getShanghaiMonthWindow(now) {
  const local = new Date(now + SHANGHAI_TZ_OFFSET_MS)
  const year = local.getUTCFullYear()
  const month = local.getUTCMonth()
  const thisMonthStart = Date.UTC(year, month, 1) - SHANGHAI_TZ_OFFSET_MS
  const prevMonthStart = Date.UTC(year, month - 1, 1) - SHANGHAI_TZ_OFFSET_MS
  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`
  return { thisMonthStart, prevMonthStart, monthLabel, timezone: 'Asia/Shanghai' }
}

function getShanghaiDayWindow(now) {
  const local = new Date(now + SHANGHAI_TZ_OFFSET_MS)
  const year = local.getUTCFullYear()
  const month = local.getUTCMonth()
  const date = local.getUTCDate()
  const todayStart = Date.UTC(year, month, date) - SHANGHAI_TZ_OFFSET_MS
  const sevenDayStart = todayStart - 6 * DAY_MS
  return { todayStart, sevenDayStart, timezone: 'Asia/Shanghai' }
}

function formatShanghaiDay(dayStart) {
  const local = new Date(dayStart + SHANGHAI_TZ_OFFSET_MS)
  const year = local.getUTCFullYear()
  const month = String(local.getUTCMonth() + 1).padStart(2, '0')
  const date = String(local.getUTCDate()).padStart(2, '0')
  return {
    date: `${year}-${month}-${date}`,
    label: `${month}/${date}`,
  }
}

function buildDailyReads(rows, sevenDayStart) {
  const byDay = new Map(rows.map((row) => [Number(row.day_key), Number(row.pv) || 0]))
  return Array.from({ length: 7 }, (_, index) => {
    const dayStart = sevenDayStart + index * DAY_MS
    const dayKey = Math.floor((dayStart + SHANGHAI_TZ_OFFSET_MS) / DAY_MS)
    const labels = formatShanghaiDay(dayStart)
    return {
      ...labels,
      dayStart,
      pv: byDay.get(dayKey) || 0,
    }
  })
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db = null
  try {
    db = getD1()
  } catch {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      window: null,
      reads: { top: [], daily: [], total: { thisWeek: 0, prevWeek: 0, today: 0, yesterday: 0 } },
      likes: { top: [], total: { thisWeek: 0, prevWeek: 0 } },
      comments: { recent: [], total: { all: 0, thisWeek: 0, thisMonth: 0, articles: 0 } },
      month: {
        reads: { top: [], byType: [], total: { thisMonth: 0, prevMonth: 0 } },
        likes: { top: [], total: { thisMonth: 0, prevMonth: 0 } },
      },
    })
  }

  const now = Date.now()
  const wk1 = now - WEEK_MS // 最近 7 天的起点
  const wk2 = now - 2 * WEEK_MS // 前 7 天的起点
  const monthWindow = getShanghaiMonthWindow(now)
  const dayWindow = getShanghaiDayWindow(now)

  try {
    const [
      readRows,
      readByCategory,
      readTotal,
      dailyReadRows,
      likeRows,
      likeTotal,
      monthReadRows,
      monthReadByCategory,
      monthReadTotal,
      monthLikeRows,
      monthLikeTotal,
      commentRows,
      commentTotal,
    ] = await Promise.all([
      db
        .prepare(
          `SELECT category, slug,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_week,
             SUM(CASE WHEN created_at < ?1 THEN 1 ELSE 0 END) AS prev_week
           FROM research_pv_hits
           WHERE created_at >= ?2
           GROUP BY category, slug
           HAVING this_week > 0
           ORDER BY this_week DESC, prev_week DESC
           LIMIT ?3`,
        )
        .bind(wk1, wk2, LIMIT)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT category,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_week,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_week
           FROM research_pv_hits
           WHERE created_at >= ?2
           GROUP BY category`,
        )
        .bind(wk1, wk2)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_week,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_week
           FROM research_pv_hits
           WHERE created_at >= ?2`,
        )
        .bind(wk1, wk2)
        .first(),
      db
        .prepare(
          `SELECT CAST((created_at + ?1) / ?2 AS INTEGER) AS day_key, COUNT(*) AS pv
           FROM research_pv_hits
           WHERE created_at >= ?3 AND created_at <= ?4
           GROUP BY day_key
           ORDER BY day_key ASC`,
        )
        .bind(SHANGHAI_TZ_OFFSET_MS, DAY_MS, dayWindow.sevenDayStart, now)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT article_key,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_week,
             SUM(CASE WHEN created_at < ?1 THEN 1 ELSE 0 END) AS prev_week
           FROM article_likes
           WHERE created_at >= ?2
           GROUP BY article_key
           HAVING this_week > 0
           ORDER BY this_week DESC, prev_week DESC
           LIMIT ?3`,
        )
        .bind(wk1, wk2, LIMIT)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_week,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_week
           FROM article_likes
           WHERE created_at >= ?2`,
        )
        .bind(wk1, wk2)
        .first(),
      db
        .prepare(
          `SELECT category, slug,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_month,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_month
           FROM research_pv_hits
           WHERE created_at >= ?2
           GROUP BY category, slug
           HAVING this_month > 0
           ORDER BY this_month DESC, prev_month DESC
           LIMIT ?3`,
        )
        .bind(monthWindow.thisMonthStart, monthWindow.prevMonthStart, LIMIT)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT category,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_month,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_month
           FROM research_pv_hits
           WHERE created_at >= ?2
           GROUP BY category`,
        )
        .bind(monthWindow.thisMonthStart, monthWindow.prevMonthStart)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_month,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_month
           FROM research_pv_hits
           WHERE created_at >= ?2`,
        )
        .bind(monthWindow.thisMonthStart, monthWindow.prevMonthStart)
        .first(),
      db
        .prepare(
          `SELECT article_key,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_month,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_month
           FROM article_likes
           WHERE created_at >= ?2
           GROUP BY article_key
           HAVING this_month > 0
           ORDER BY this_month DESC, prev_month DESC
           LIMIT ?3`,
        )
        .bind(monthWindow.thisMonthStart, monthWindow.prevMonthStart, LIMIT)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_month,
             SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS prev_month
           FROM article_likes
           WHERE created_at >= ?2`,
        )
        .bind(monthWindow.thisMonthStart, monthWindow.prevMonthStart)
        .first(),
      db
        .prepare(
          `SELECT id, article_key, user_id, user_provider, user_name, user_image, message, created_at
           FROM article_comments
           ORDER BY created_at DESC
           LIMIT 20`,
        )
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT
             COUNT(*) AS total_comments,
             COUNT(DISTINCT article_key) AS article_count,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS this_week,
             SUM(CASE WHEN created_at >= ?2 THEN 1 ELSE 0 END) AS this_month
           FROM article_comments`,
        )
        .bind(wk1, monthWindow.thisMonthStart)
        .first(),
    ])

    const reads = readRows.map((r) => {
      const thisWeek = Number(r.this_week) || 0
      const prevWeek = Number(r.prev_week) || 0
      const resolved = resolveContentKey(r.category, r.slug)
      return {
        key: `${r.category}/${r.slug}`,
        title: resolved.title,
        href: resolved.href,
        type: resolved.type,
        thisWeek,
        prevWeek,
        delta: thisWeek - prevWeek,
      }
    })

    // 按大类（调研 / 资料·资源 / 灵感）汇总本周与上周阅读
    const byTypeMap = new Map()
    for (const r of readByCategory) {
      const group = CONTENT_TYPE_GROUP[r.category] || '其它'
      const cur = byTypeMap.get(group) || { type: group, thisWeek: 0, prevWeek: 0 }
      cur.thisWeek += Number(r.this_week) || 0
      cur.prevWeek += Number(r.prev_week) || 0
      byTypeMap.set(group, cur)
    }
    const byType = [...byTypeMap.values()]
      .map((t) => ({ ...t, delta: t.thisWeek - t.prevWeek }))
      .sort((a, b) => b.thisWeek - a.thisWeek)

    const likes = likeRows.map((r) => {
      const thisWeek = Number(r.this_week) || 0
      const prevWeek = Number(r.prev_week) || 0
      const { title, href } = resolveArticleKey(r.article_key)
      return { key: r.article_key, title, href, thisWeek, prevWeek, delta: thisWeek - prevWeek }
    })

    const monthReads = monthReadRows.map((r) => {
      const thisMonth = Number(r.this_month) || 0
      const prevMonth = Number(r.prev_month) || 0
      const resolved = resolveContentKey(r.category, r.slug)
      return {
        key: `${r.category}/${r.slug}`,
        title: resolved.title,
        href: resolved.href,
        type: resolved.type,
        thisMonth,
        prevMonth,
        delta: thisMonth - prevMonth,
      }
    })

    const monthByTypeMap = new Map()
    for (const r of monthReadByCategory) {
      const group = CONTENT_TYPE_GROUP[r.category] || '其它'
      const cur = monthByTypeMap.get(group) || { type: group, thisMonth: 0, prevMonth: 0 }
      cur.thisMonth += Number(r.this_month) || 0
      cur.prevMonth += Number(r.prev_month) || 0
      monthByTypeMap.set(group, cur)
    }
    const monthByType = [...monthByTypeMap.values()]
      .map((t) => ({ ...t, delta: t.thisMonth - t.prevMonth }))
      .sort((a, b) => b.thisMonth - a.thisMonth)

    const monthLikes = monthLikeRows.map((r) => {
      const thisMonth = Number(r.this_month) || 0
      const prevMonth = Number(r.prev_month) || 0
      const { title, href } = resolveArticleKey(r.article_key)
      return { key: r.article_key, title, href, thisMonth, prevMonth, delta: thisMonth - prevMonth }
    })

    const comments = commentRows.map((r) => {
      const resolved = resolveArticleKey(r.article_key)
      return {
        id: Number(r.id),
        articleKey: r.article_key || '',
        articleTitle: resolved.title,
        href: resolved.href ? `${resolved.href}#comments` : null,
        userId: r.user_id || '',
        userProvider: r.user_provider || '',
        userName: r.user_name || '',
        userImage: r.user_image || '',
        message: r.message || '',
        createdAt: Number(r.created_at) || 0,
      }
    })

    const dailyReads = buildDailyReads(dailyReadRows, dayWindow.sevenDayStart)
    const todayReads = dailyReads[dailyReads.length - 1]?.pv || 0
    const yesterdayReads = dailyReads[dailyReads.length - 2]?.pv || 0

    return Response.json({
      status: 'ok',
      generatedAt: now,
      window: {
        thisWeekStart: wk1,
        prevWeekStart: wk2,
        days: 7,
        thisMonthStart: monthWindow.thisMonthStart,
        prevMonthStart: monthWindow.prevMonthStart,
        todayStart: dayWindow.todayStart,
        sevenDayStart: dayWindow.sevenDayStart,
        monthLabel: monthWindow.monthLabel,
        timezone: monthWindow.timezone,
      },
      reads: {
        top: reads,
        byType,
        daily: dailyReads,
        total: {
          thisWeek: Number(readTotal?.this_week) || 0,
          prevWeek: Number(readTotal?.prev_week) || 0,
          today: todayReads,
          yesterday: yesterdayReads,
        },
      },
      likes: {
        top: likes,
        total: {
          thisWeek: Number(likeTotal?.this_week) || 0,
          prevWeek: Number(likeTotal?.prev_week) || 0,
        },
      },
      comments: {
        recent: comments,
        total: {
          all: Number(commentTotal?.total_comments) || 0,
          articles: Number(commentTotal?.article_count) || 0,
          thisWeek: Number(commentTotal?.this_week) || 0,
          thisMonth: Number(commentTotal?.this_month) || 0,
        },
      },
      month: {
        reads: {
          top: monthReads,
          byType: monthByType,
          total: {
            thisMonth: Number(monthReadTotal?.this_month) || 0,
            prevMonth: Number(monthReadTotal?.prev_month) || 0,
          },
        },
        likes: {
          top: monthLikes,
          total: {
            thisMonth: Number(monthLikeTotal?.this_month) || 0,
            prevMonth: Number(monthLikeTotal?.prev_month) || 0,
          },
        },
      },
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: now,
        error: 'CONTENT_WEEKLY_FAILED',
        detail: String(error?.message || error),
      },
      { status: 500 },
    )
  }
}
