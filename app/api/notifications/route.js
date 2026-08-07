import { loadContentKeyMeta, resolveContentKeyLite } from '../../../lib/contentKeyLite'
import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function notificationHref(type, articleKey, commentId, metaMap) {
  if (type === 'weekly_summary') return '/admin/content-weekly?days=7'
  if (type === 'automation_monitor') return '/admin/ops'
  const resolved = resolveContentKeyLite(articleKey, metaMap)
  if (!resolved.href) return null
  if (type === 'content_like') return resolved.href
  return commentId ? `${resolved.href}#comment-${commentId}` : `${resolved.href}#comments`
}

function notificationTitle(type, actorName) {
  if (type === 'content_like') return `${actorName || '有人'} 点赞了你的内容`
  if (type === 'content_comment') return `${actorName || '有人'} 评论了你的内容`
  if (type === 'weekly_summary') return '上周站点总结已生成'
  if (type === 'automation_monitor') return `${actorName || '自动化任务'} 运行失败`
  return `${actorName || '有人'} 回复了你`
}

function mapNotification(row, metaMap) {
  const type = row.type || 'comment_reply'
  const article = resolveContentKeyLite(row.article_key, metaMap)
  return {
    id: Number(row.id),
    type,
    title: notificationTitle(type, row.actor_user_name),
    actorUserId: row.actor_user_id || '',
    actorUserProvider: row.actor_user_provider || '',
    actorUserName: row.actor_user_name || '',
    actorUserImage: row.actor_user_image || '',
    articleKey: row.article_key || '',
    articleTitle: type === 'weekly_summary' ? '内容数据与反馈' : type === 'automation_monitor' ? '' : article.title,
    href: notificationHref(type, row.article_key, row.comment_id, metaMap),
    commentId: Number(row.comment_id) || null,
    replyToCommentId: Number(row.reply_to_comment_id) || null,
    messageExcerpt: row.message_excerpt || '',
    readAt: Number(row.read_at) || null,
    createdAt: Number(row.created_at) || 0,
  }
}

export async function GET(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ items: [], unread: 0, status: 'anonymous' })

  const url = new URL(req.url)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20))
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
  const type = String(url.searchParams.get('type') || '')
  let where = 'recipient_user_id = ?1'
  const whereParams = [String(user.id)]
  if (type === 'automation') {
    where += " AND type = 'automation_monitor'"
  } else if (type === 'interaction') {
    where += " AND type != 'automation_monitor'"
  }

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ items: [], unread: 0, status: 'unavailable' })
  }

  try {
    const [itemsResult, countRow, unreadRow] = await Promise.all([
      db
        .prepare(
          `SELECT id, type, actor_user_id, actor_user_provider, actor_user_name, actor_user_image,
                  article_key, comment_id, reply_to_comment_id, message_excerpt, read_at, created_at
           FROM comment_notifications
           WHERE ${where}
           ORDER BY created_at DESC
           LIMIT ?2 OFFSET ?3`
        )
        .bind(...whereParams, limit, offset)
        .all(),
      db
        .prepare(
          `SELECT COUNT(*) AS total
           FROM comment_notifications
           WHERE ${where}`
        )
        .bind(...whereParams)
        .first(),
      db
        .prepare(
          `SELECT COUNT(*) AS unread
           FROM comment_notifications
           WHERE ${where} AND read_at IS NULL`
        )
        .bind(...whereParams)
        .first(),
    ])
    const metaMap = await loadContentKeyMeta(
      db,
      (itemsResult?.results || []).map((row) => row.article_key)
    )

    return Response.json({
      status: 'ok',
      unread: Number(unreadRow?.unread) || 0,
      total: Number(countRow?.total) || 0,
      items: (itemsResult?.results || []).map((row) => mapNotification(row, metaMap)),
    })
  } catch {
    return Response.json({ items: [], unread: 0, total: 0, status: 'error' }, { status: 500 })
  }
}

export async function PATCH(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body = {}
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  const now = Date.now()
  try {
    if (body?.all) {
      const result = await db
        .prepare(
          `UPDATE comment_notifications
           SET read_at = ?1
           WHERE recipient_user_id = ?2 AND read_at IS NULL`
        )
        .bind(now, String(user.id))
        .run()
      return Response.json({ ok: true, changed: result?.meta?.changes || 0 })
    }

    const id = Number(body?.id)
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'INVALID_ID' }, { status: 400 })
    }
    const result = await db
      .prepare(
        `UPDATE comment_notifications
         SET read_at = ?1
         WHERE id = ?2 AND recipient_user_id = ?3`
      )
      .bind(now, id, String(user.id))
      .run()
    return Response.json({ ok: true, changed: result?.meta?.changes || 0 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
