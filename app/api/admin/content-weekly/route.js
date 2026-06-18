import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { RESEARCH_ENTRY_META } from '../../../../lib/research/catalog'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 内容数据周报(看板按需计算,无定时、无存储)。
 * 口径:最近 7 天被读(research_pv_hits)/被赞(article_likes)的 top,
 *      并与前 7 天同口径对比出趋势。两张表 created_at 均为毫秒。
 */

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const LIMIT = 10

function titleForResearch(category, slug) {
  const meta = RESEARCH_ENTRY_META[`${category}/${slug}`]
  return meta?.title || `${category}/${slug}`
}

/** article_key 形如 research:<cat>:<slug> 或 article:<slug>,解析成标题 + 链接 */
function resolveArticleKey(articleKey) {
  const key = String(articleKey || '')
  if (key.startsWith('research:')) {
    const [, category, slug] = key.split(':')
    if (category && slug) {
      return { title: titleForResearch(category, slug), href: `/articles/research/${category}/${slug}` }
    }
  }
  if (key.startsWith('article:')) {
    const slug = key.slice('article:'.length)
    return { title: slug || key, href: slug ? `/articles/${slug}` : null }
  }
  return { title: key, href: null }
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
      reads: { top: [], total: { thisWeek: 0, prevWeek: 0 } },
      likes: { top: [], total: { thisWeek: 0, prevWeek: 0 } },
    })
  }

  const now = Date.now()
  const wk1 = now - WEEK_MS // 最近 7 天的起点
  const wk2 = now - 2 * WEEK_MS // 前 7 天的起点

  try {
    const [readRows, readTotal, likeRows, likeTotal] = await Promise.all([
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
    ])

    const reads = readRows.map((r) => {
      const thisWeek = Number(r.this_week) || 0
      const prevWeek = Number(r.prev_week) || 0
      return {
        key: `${r.category}/${r.slug}`,
        title: titleForResearch(r.category, r.slug),
        href: `/articles/research/${r.category}/${r.slug}`,
        thisWeek,
        prevWeek,
        delta: thisWeek - prevWeek,
      }
    })

    const likes = likeRows.map((r) => {
      const thisWeek = Number(r.this_week) || 0
      const prevWeek = Number(r.prev_week) || 0
      const { title, href } = resolveArticleKey(r.article_key)
      return { key: r.article_key, title, href, thisWeek, prevWeek, delta: thisWeek - prevWeek }
    })

    return Response.json({
      status: 'ok',
      generatedAt: now,
      window: { thisWeekStart: wk1, prevWeekStart: wk2, days: 7 },
      reads: {
        top: reads,
        total: {
          thisWeek: Number(readTotal?.this_week) || 0,
          prevWeek: Number(readTotal?.prev_week) || 0,
        },
      },
      likes: {
        top: likes,
        total: {
          thisWeek: Number(likeTotal?.this_week) || 0,
          prevWeek: Number(likeTotal?.prev_week) || 0,
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
