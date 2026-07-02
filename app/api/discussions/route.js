import { loadContentKeyMeta, resolveContentKeyLite } from '../../../lib/contentKeyLite'
import { getD1 } from '../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function toNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function commentHref(articleKey, commentId, metaMap) {
  const resolved = resolveContentKeyLite(articleKey, metaMap)
  if (!resolved.href) return null
  return `${resolved.href}#comment-${commentId || 'comments'}`
}

function mapComment(row, metaMap) {
  const article = resolveContentKeyLite(row.article_key, metaMap)
  return {
    id: toNumber(row.id),
    articleKey: row.article_key || '',
    articleTitle: article.title || row.article_key || '未知内容',
    articleHref: article.href || null,
    href: commentHref(row.article_key, row.id, metaMap),
    userId: row.user_id || '',
    userProvider: row.user_provider || '',
    userName: row.user_name || '用户',
    userImage: row.user_image || '',
    message: row.message || '',
    replyToId: toNumber(row.reply_to_id, null),
    replyToUserName: row.reply_to_user_name || '',
    createdAt: toNumber(row.created_at),
  }
}

function mapThread(row, metaMap) {
  const article = resolveContentKeyLite(row.article_key, metaMap)
  return {
    articleKey: row.article_key || '',
    title: article.title || row.article_key || '未知内容',
    href: article.href ? `${article.href}#comments` : null,
    comments: toNumber(row.comments),
    participants: toNumber(row.participants),
    latestAt: toNumber(row.latest_at),
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const limit = Math.max(1, Math.min(80, Number(searchParams.get('limit')) || 40))
  const sinceWeek = Date.now() - 7 * 24 * 60 * 60 * 1000

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ status: 'unavailable', items: [], threads: [], stats: null })
  }

  try {
    const [itemsResult, threadsResult, totalRow, weekRow] = await Promise.all([
      db
        .prepare(
          `SELECT c.id, c.article_key, c.user_id, c.user_provider, c.user_name, c.user_image,
                  c.message, c.reply_to_id, c.created_at,
                  r.user_name AS reply_to_user_name
           FROM article_comments c
           LEFT JOIN article_comments r ON c.reply_to_id = r.id
           ORDER BY c.created_at DESC
           LIMIT ?1`
        )
        .bind(limit)
        .all(),
      db
        .prepare(
          `SELECT article_key,
                  COUNT(*) AS comments,
                  COUNT(DISTINCT user_id) AS participants,
                  MAX(created_at) AS latest_at
           FROM article_comments
           GROUP BY article_key
           ORDER BY latest_at DESC
           LIMIT 8`
        )
        .all(),
      db
        .prepare(
          `SELECT COUNT(*) AS comments,
                  COUNT(DISTINCT article_key) AS articles,
                  COUNT(DISTINCT user_id) AS participants
           FROM article_comments`
        )
        .first(),
      db
        .prepare(
          `SELECT COUNT(*) AS comments,
                  COUNT(DISTINCT article_key) AS articles,
                  COUNT(DISTINCT user_id) AS participants
           FROM article_comments
           WHERE created_at >= ?1`
        )
        .bind(sinceWeek)
        .first(),
    ])
    const metaMap = await loadContentKeyMeta(db, [
      ...(itemsResult?.results || []).map((row) => row.article_key),
      ...(threadsResult?.results || []).map((row) => row.article_key),
    ])

    return Response.json({
      status: 'ok',
      items: (itemsResult?.results || []).map((row) => mapComment(row, metaMap)),
      threads: (threadsResult?.results || []).map((row) => mapThread(row, metaMap)),
      stats: {
        comments: toNumber(totalRow?.comments),
        articles: toNumber(totalRow?.articles),
        participants: toNumber(totalRow?.participants),
        weekComments: toNumber(weekRow?.comments),
        weekArticles: toNumber(weekRow?.articles),
        weekParticipants: toNumber(weekRow?.participants),
      },
    })
  } catch {
    return Response.json({ status: 'error', items: [], threads: [], stats: null }, { status: 500 })
  }
}
