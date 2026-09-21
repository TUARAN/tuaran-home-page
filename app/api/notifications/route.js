import { loadContentKeyMeta, resolveContentKeyLite } from '../../../lib/contentKeyLite'
import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { presentNotification } from '../../../lib/siteNotificationsDisplay'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function resolveNotificationContent(row, metaMap) {
  const type = row.type || 'comment_reply'
  if (type === 'weekly_summary' || type === 'automation_monitor' || type === 'rss_update') {
    return { title: '', href: '' }
  }
  return resolveContentKeyLite(row.article_key, metaMap)
}

function mapNotification(row, metaMap) {
  const presented = presentNotification(row, resolveNotificationContent(row, metaMap))
  return {
    id: Number(row.id),
    type: presented.type,
    category: presented.category,
    typeLabel: presented.typeLabel,
    title: presented.title,
    actorUserId: row.actor_user_id || '',
    actorUserProvider: row.actor_user_provider || '',
    actorUserName: row.actor_user_name || '',
    actorUserImage: row.actor_user_image || '',
    articleKey: row.article_key || '',
    articleTitle: presented.articleTitle,
    href: presented.href,
    destinationLabel: presented.destinationLabel,
    commentId: Number(row.comment_id) || null,
    replyToCommentId: Number(row.reply_to_comment_id) || null,
    messageExcerpt: presented.messageExcerpt,
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
  } else if (type === 'rss') {
    where += " AND type = 'rss_update'"
  } else if (type === 'interaction') {
    where += " AND type != 'automation_monitor' AND type != 'rss_update'"
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
